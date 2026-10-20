import { CENTER, LIMBS, MAIN_LIMBS } from "./guide-poses";
import type { NexColors } from "./nex-colors";

const STAR_PATH = "M0 -4 L1.3 -1.3 L4 0 L1.3 1.3 L0 4 L-1.3 1.3 L-4 0 L-1.3 -1.3Z";

interface NexSkinProps {
  colors: NexColors;
  /** Unique per instance, so SVG filter ids never collide when several guides are on screen. */
  uid: string;
}

/**
 * Nex's look: the "Scholar" skin (visor face, graduation cap, floating AI spark) on the logo's
 * limb skeleton. This is a pure markup component. The engine animates it through the `data-*`
 * hooks below, so to restyle Nex, edit this file only: keep the hooks and the geometry stays valid.
 *
 * Hooks used by the engine: data-body, data-face, data-face-detail, data-limb/data-hand (per limb),
 * data-eyes, data-pupil (l/r), data-mouth, data-mouth-open, data-spark, data-fx, data-orbit.
 */
export default function NexSkin({ colors, uid }: NexSkinProps) {
  const glowId = `nex-glow-${uid}`;
  return (
    <>
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g data-body>
        {/* Limbs and hands: bold on the logo's main diagonal, faint on the other, like the logo. */}
        {LIMBS.map((k) => (
          <line key={`l-${k}`} data-limb={k} x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER}
            stroke={colors.body} strokeWidth={MAIN_LIMBS.has(k) ? 10 : 7} strokeLinecap="round" opacity={MAIN_LIMBS.has(k) ? 1 : 0.55} />
        ))}
        {LIMBS.map((k) => (
          <circle key={`h-${k}`} data-hand={k} r={MAIN_LIMBS.has(k) ? 9.5 : 6.6} cx={CENTER} cy={CENTER}
            fill={colors.hand} opacity={MAIN_LIMBS.has(k) ? 1 : 0.6} />
        ))}
        <g data-face>
          <rect x="36" y="36" width="48" height="48" rx="20" fill={colors.body} />
          <g data-face-detail>
            <rect x="42" y="46" width="36" height="26" rx="13" fill={colors.visor} />
            <g data-eyes>
              <circle data-pupil="l" cx="51" cy="56" r="4.6" fill={colors.glow} />
              <circle data-pupil="r" cx="69" cy="56" r="4.6" fill={colors.glow} />
            </g>
            <path data-mouth d="M54 66 Q60 72 66 66" fill="none" stroke={colors.glow} strokeWidth="3" strokeLinecap="round" />
            <ellipse data-mouth-open cx="60" cy="67" rx="4" ry="3" fill={colors.glow} style={{ display: "none" }} />
            <path d="M46 38 Q60 48 74 38 L74 44 Q60 54 46 44 Z" fill={colors.capShade} />
            <polygon points="60,18 90,30 60,42 30,30" fill={colors.accent} />
            <path d="M60 30 L86 32 L87 46" fill="none" stroke={colors.glow} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="87" cy="48" r="3" fill={colors.glow} />
          </g>
        </g>
      </g>
      {/* The AI spark orbits Nex and glows brighter while it thinks. */}
      <g data-spark filter={`url(#${glowId})`}>
        <path d={STAR_PATH} fill={colors.accent} transform="scale(1.5)" />
        <circle r="9" fill={colors.accent} opacity="0.18" />
      </g>
      <g data-fx />
      <g data-orbit style={{ display: "none" }} />
    </>
  );
}
