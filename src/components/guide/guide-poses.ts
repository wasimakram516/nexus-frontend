/**
 * Geometry and poses for Nex, the Nexus guide.
 *
 * The skeleton is the Nexus logo. In the logo's 48 unit box the center node is (24,24) and every
 * limb ends at (+-14,+-14), so all four limbs leave the center at exactly 45 degrees. The
 * bottom-left to top-right diagonal is bold with big nodes, the other is faint with small nodes.
 * Scaled to the mascot's 120 unit box: center (60,60), limb ends at +-40.
 */
export type Limb = "lh" | "rh" | "lf" | "rf";
export type GuidePose = "logo" | "idle" | "wave" | "point" | "think" | "celebrate";
export type Point = readonly [number, number];
export type MouthShape = "smile" | "flat" | "open";

export const VIEWBOX = 120;
export const CENTER = 60;
export const REACH = 40;
export const LIMBS: readonly Limb[] = ["lh", "rh", "lf", "rf"];

/** The bold (main) diagonal of the logo: bottom-left foot and top-right hand. */
export const MAIN_LIMBS: ReadonlySet<Limb> = new Set<Limb>(["rh", "lf"]);

export const LOGO_ENDS: Readonly<Record<Limb, Point>> = {
  lh: [CENTER - REACH, CENTER - REACH],
  rh: [CENTER + REACH, CENTER - REACH],
  lf: [CENTER - REACH, CENTER + REACH],
  rf: [CENTER + REACH, CENTER + REACH],
};

export interface PoseDef {
  limbs: Readonly<Record<Limb, Point>>;
  mouth: MouthShape;
  /** Face scale around the center node. 1 is a full face; the logo pose folds it into the node. */
  face?: number;
  wave?: boolean;
  think?: boolean;
  jump?: boolean;
}

export const POSES: Readonly<Record<GuidePose, PoseDef>> = {
  idle: { limbs: LOGO_ENDS, mouth: "smile" },
  logo: { limbs: LOGO_ENDS, mouth: "flat", face: 0.42 },
  wave: { limbs: { ...LOGO_ENDS, rh: [106, 6] }, mouth: "smile", wave: true },
  point: { limbs: { ...LOGO_ENDS, rh: [118, 50] }, mouth: "smile" },
  think: { limbs: { ...LOGO_ENDS, lh: [46, 82] }, mouth: "flat", think: true },
  celebrate: { limbs: { lh: [20, 0], rh: [100, 0], lf: [12, 104], rf: [108, 104] }, mouth: "open", jump: true },
};

/** Limb length from the center, used to verify the rest pose matches the logo. */
export function limbLength([x, y]: Point): number {
  return Math.hypot(x - CENTER, y - CENTER);
}
