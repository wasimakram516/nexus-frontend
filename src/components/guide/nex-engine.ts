import { CENTER, LIMBS, POSES, type GuidePose, type Limb, type Point } from "./guide-poses";

export interface NexEngineOptions {
  /** True for people who prefer reduced motion: no bobbing, idle antics, trail or confetti; poses snap. */
  reduceMotion: boolean;
  /** Fill colors for confetti and the wave trail. */
  particleColors: readonly [string, string, string];
  startPose?: GuidePose;
}

interface Particle {
  el: SVGElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  duration: number;
  spin: number;
}

const STAR_PATH = "M0 -4 L1.3 -1.3 L4 0 L1.3 1.3 L0 4 L-1.3 1.3 L-4 0 L-1.3 -1.3Z";
const SVG_NS = "http://www.w3.org/2000/svg";
const EYES = [
  [51, 56],
  [69, 56],
] as const;
const MOUTH = { x: 60, y: 66, w: 6, h: 6 } as const;
const LOOK_LIMIT = 2.4;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Animates Nex's SVG imperatively (one requestAnimationFrame loop), driven by `data-*` hooks in
 * NexMascot's markup. Keeping the per-frame work out of React avoids re-rendering at 60fps.
 */
export class NexEngine {
  private readonly svg: SVGSVGElement;
  private readonly opts: NexEngineOptions;
  private readonly body: SVGElement;
  private readonly face: SVGElement;
  private readonly faceDetail: SVGElement;
  private readonly fx: SVGElement;
  private readonly eyes: SVGElement;
  private readonly pupils: [SVGElement, SVGElement];
  private readonly mouth: SVGElement;
  private readonly mouthOpen: SVGElement;
  private readonly spark: SVGElement | null;
  private readonly orbit: SVGElement;
  private readonly limbs: Record<Limb, SVGElement[]>;
  private readonly hands: Record<Limb, SVGElement[]>;

  private pose: GuidePose;
  private cur: Partial<Record<Limb, [number, number]>> = {};
  private faceScale = 1;
  private talking = false;
  private giggleUntil = 0;
  private hopUntil = 0;
  private lookUntil = 0;
  private look: [number, number] = [0, 0];
  private pointer: [number, number] | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private last = 0;
  private startedAt = 0;
  private nextBlink = 0;
  private nextIdle = 0;
  private nextTrail = 0;
  private introTimer: ReturnType<typeof setTimeout> | null = null;
  private blinkTimer: ReturnType<typeof setTimeout> | null = null;
  private alive = true;

  constructor(svg: SVGSVGElement, opts: NexEngineOptions) {
    this.svg = svg;
    this.opts = opts;
    const q = <T extends SVGElement>(sel: string) => svg.querySelector<T>(sel) as T;
    this.body = q("[data-body]");
    this.face = q("[data-face]");
    this.faceDetail = q("[data-face-detail]");
    this.fx = q("[data-fx]");
    this.eyes = q("[data-eyes]");
    this.pupils = [q('[data-pupil="l"]'), q('[data-pupil="r"]')];
    this.mouth = q("[data-mouth]");
    this.mouthOpen = q("[data-mouth-open]");
    this.spark = svg.querySelector<SVGElement>("[data-spark]");
    this.orbit = q("[data-orbit]");
    this.limbs = {} as Record<Limb, SVGElement[]>;
    this.hands = {} as Record<Limb, SVGElement[]>;
    for (const k of LIMBS) {
      this.limbs[k] = Array.from(svg.querySelectorAll<SVGElement>(`[data-limb="${k}"]`));
      this.hands[k] = Array.from(svg.querySelectorAll<SVGElement>(`[data-hand="${k}"]`));
    }
    this.pose = opts.startPose ?? "idle";
    if (this.pose === "logo") this.faceScale = POSES.logo.face ?? 1;
    this.snapLimbsTo(this.pose);

    if (typeof window !== "undefined") window.addEventListener("pointermove", this.onPointer);
    if (typeof requestAnimationFrame === "function") {
      const now = performance.now();
      this.startedAt = this.last = now;
      this.nextBlink = now + 2500;
      this.nextIdle = now + 7000;
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  setPose(next: GuidePose): void {
    if (!POSES[next]) next = "idle";
    if (next === "celebrate" && this.pose !== "celebrate") this.burst(CENTER, 40, 18, 90, 40);
    this.pose = next;
  }

  setTalking(talking: boolean): void {
    this.talking = talking;
  }

  /** Starts as the logo, then wakes up with a hop and sparkles. */
  wakeUp(): void {
    this.setPose("logo");
    this.introTimer = setTimeout(() => {
      if (this.pose !== "logo") return;
      this.pose = "idle";
      this.hopUntil = performance.now() + 480;
      this.burst(CENTER, 44, 8, 60, 20);
    }, this.opts.reduceMotion ? 0 : 900 + Math.random() * 500);
  }

  giggle(): void {
    this.giggleUntil = performance.now() + 650;
    this.burst(CENTER, 40, 6, 60, 20);
  }

  destroy(): void {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    if (this.introTimer) clearTimeout(this.introTimer);
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    window.removeEventListener("pointermove", this.onPointer);
    this.particles.forEach((p) => p.el.remove());
    this.particles = [];
  }

  private onPointer = (e: PointerEvent): void => {
    this.pointer = [e.clientX, e.clientY];
  };

  private snapLimbsTo(pose: GuidePose): void {
    for (const k of LIMBS) {
      const p = POSES[pose].limbs[k];
      this.cur[k] = [p[0], p[1]];
      this.applyLimb(k, p[0], p[1]);
    }
  }

  private applyLimb(k: Limb, x: number, y: number): void {
    for (const l of this.limbs[k]) {
      l.setAttribute("x1", String(CENTER));
      l.setAttribute("y1", String(CENTER));
      l.setAttribute("x2", String(x));
      l.setAttribute("y2", String(y));
    }
    for (const h of this.hands[k]) {
      h.setAttribute("cx", String(x));
      h.setAttribute("cy", String(y));
    }
  }

  private burst(x: number, y: number, count: number, speed: number, up: number): void {
    if (this.opts.reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const isCircle = Math.random() < 0.5;
      const el = document.createElementNS(SVG_NS, isCircle ? "circle" : "path");
      el.setAttribute("fill", this.opts.particleColors[i % 3]);
      if (isCircle) el.setAttribute("r", String(1.8 + Math.random() * 1.6));
      else el.setAttribute("d", STAR_PATH);
      this.fx.appendChild(el);
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        el, x, y,
        vx: Math.cos(a) * speed * (0.4 + Math.random()),
        vy: Math.sin(a) * speed * (0.4 + Math.random()) - up,
        life: 1, duration: 0.8 + Math.random() * 0.6, spin: Math.random() * 6,
      });
    }
  }

  private frame = (now: number): void => {
    if (!this.alive) return;
    if (!this.svg.isConnected) { this.destroy(); return; }
    const reduce = this.opts.reduceMotion;
    const P = POSES[this.pose];
    const t = (now - this.startedAt) / 1000;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    LIMBS.forEach((k, idx) => {
      let [tx, ty] = P.limbs[k] as Point;
      if (!reduce) {
        if (P.wave && k === "rh") { tx += Math.sin(t * 9) * 7; ty += Math.cos(t * 9) * 3; }
        if (this.pose !== "logo" && (k === "lh" || k === "rh")) ty += Math.sin(t * 2 + idx) * 1.2;
      }
      const c = (this.cur[k] ??= [tx, ty]);
      const ease = reduce ? 1 : 0.16;
      c[0] += (tx - c[0]) * ease;
      c[1] += (ty - c[1]) * ease;
      this.applyLimb(k, c[0], c[1]);
      if (P.wave && k === "rh" && !reduce && now > this.nextTrail) {
        this.burst(c[0], c[1], 1, 12, 0); // star trail on the waving hand
        this.nextTrail = now + 80;
      }
    });

    // The face grows out of the center node; the logo pose folds it back into the node.
    this.faceScale += ((P.face ?? 1) - this.faceScale) * (reduce ? 1 : 0.14);
    this.face.setAttribute("transform", `translate(${CENTER} ${CENTER}) scale(${this.faceScale.toFixed(3)}) translate(${-CENTER} ${-CENTER})`);
    this.faceDetail.setAttribute("opacity", clamp01((this.faceScale - 0.55) / 0.35).toFixed(2));

    let bob = reduce || this.pose === "logo" ? 0 : Math.sin(t * 2) * 1.6;
    let sx = 1;
    let sy = 1;
    if (!reduce && this.pose !== "logo") {
      if (P.jump) {
        const ph = Math.abs(Math.sin(t * 6));
        bob = -ph * 11; sy = 1 + ph * 0.06; sx = 1 - ph * 0.03;
        if (ph < 0.18) { sy = 0.93; sx = 1.06; }
      }
      if (now < this.hopUntil) {
        const q = 1 - (this.hopUntil - now) / 480;
        bob -= Math.sin(q * Math.PI) * 13; sy = 1 + Math.sin(q * Math.PI) * 0.05;
      }
      if (now < this.giggleUntil) { sx = 1 + Math.sin(now / 38) * 0.05; sy = 1 - Math.sin(now / 38) * 0.05; }
    }
    this.body.setAttribute("transform", `translate(0 ${bob.toFixed(2)}) translate(60 112) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-60 -112)`);

    // Eyes follow the pointer, or glance around on their own.
    let ox = 0;
    let oy = 0;
    if (now < this.lookUntil) [ox, oy] = this.look;
    else if (this.pointer && !reduce) {
      const r = this.svg.getBoundingClientRect();
      const dx = this.pointer[0] - (r.left + r.width / 2);
      const dy = this.pointer[1] - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(LOOK_LIMIT, d / 80);
      ox = (dx / d) * k; oy = (dy / d) * k;
    }
    this.pupils.forEach((p, i) => { p.setAttribute("cx", String(EYES[i][0] + ox)); p.setAttribute("cy", String(EYES[i][1] + oy)); });
    if (!reduce && now > this.nextBlink) {
      this.eyes.setAttribute("transform", `translate(0 ${EYES[0][1]}) scale(1 0.1) translate(0 ${-EYES[0][1]})`);
      this.blinkTimer = setTimeout(() => this.eyes.removeAttribute("transform"), 120);
      this.nextBlink = now + 2200 + Math.random() * 2600;
    }
    if (!reduce && this.pose === "idle" && !this.talking && now > this.nextIdle) {
      if (Math.random() < 0.5) this.hopUntil = now + 480;
      else { this.lookUntil = now + 1300; this.look = [(Math.random() - 0.5) * 2 * LOOK_LIMIT, (Math.random() - 0.5) * LOOK_LIMIT]; }
      this.nextIdle = now + 6000 + Math.random() * 6000;
    }

    // Mouth: it moves while the guide is talking, so typed text feels spoken.
    const talk = this.talking || now < this.giggleUntil;
    const open = P.mouth === "open" || talk;
    this.mouth.style.display = open ? "none" : "";
    this.mouthOpen.style.display = open ? "" : "none";
    this.mouthOpen.setAttribute("ry", String(P.mouth === "open" && !talk ? MOUTH.h * 0.6 : 1.2 + Math.abs(Math.sin(t * 14)) * MOUTH.h * 0.55));
    this.mouth.setAttribute("d", P.mouth === "flat"
      ? `M${MOUTH.x - MOUTH.w * 0.8} ${MOUTH.y + 3} L${MOUTH.x + MOUTH.w * 0.8} ${MOUTH.y + 3}`
      : `M${MOUTH.x - MOUTH.w} ${MOUTH.y} Q${MOUTH.x} ${MOUTH.y + MOUTH.h} ${MOUTH.x + MOUTH.w} ${MOUTH.y}`);

    // The AI spark orbits, and brightens and tightens its orbit while Nex is thinking.
    if (this.spark) {
      const thinking = !!P.think;
      const ang = t * (thinking ? 2.4 : 0.9);
      const rad = thinking ? 18 : 30;
      const pulse = reduce ? 1 : 1 + Math.sin(t * 3) * 0.18 + (thinking ? 0.3 : 0);
      this.spark.setAttribute("transform", `translate(${(60 + Math.cos(ang) * rad * 1.3).toFixed(1)} ${(32 + Math.sin(ang) * rad * 0.55).toFixed(1)}) scale(${pulse.toFixed(2)})`);
      this.spark.style.display = this.pose === "logo" ? "none" : "";
    }
    this.orbit.style.display = "none";

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt / p.duration; p.vy += 140 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.spin += dt * 6;
      if (p.life <= 0) { p.el.remove(); this.particles.splice(i, 1); continue; }
      p.el.setAttribute("opacity", Math.max(0, p.life).toFixed(2));
      if (p.el.tagName === "circle") { p.el.setAttribute("cx", p.x.toFixed(1)); p.el.setAttribute("cy", p.y.toFixed(1)); }
      else p.el.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(p.spin * 40).toFixed(0)})`);
    }
    this.raf = requestAnimationFrame(this.frame);
  };
}
