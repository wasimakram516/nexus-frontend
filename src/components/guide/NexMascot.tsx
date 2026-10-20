"use client";

import { useEffect, useId, useRef } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NexEngine } from "./nex-engine";
import { VIEWBOX, type GuidePose } from "./guide-poses";
import { useNexColors } from "./nex-colors";
import NexSkin from "./NexSkin";

export interface NexMascotProps {
  /** What Nex is doing. Change it any time; the engine eases between poses. */
  pose?: GuidePose;
  /** Moves the mouth, so text typing out in a bubble feels spoken. */
  talking?: boolean;
  /** Any value that changes when Nex should react (for example a new tip): it hops once per change. */
  cue?: string | number;
  /** Starts as the Nexus logo, then wakes up. */
  intro?: boolean;
  /** CSS size of the square character. */
  size?: number | string;
  /** True when a button or label already names it, so screen readers skip the image. */
  decorative?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Nex, the Nexus guide. A thin React wrapper: the look lives in NexSkin, the motion in NexEngine,
 * the poses in guide-poses. Use NexGuide for the speech bubble and dismiss behavior.
 */
export default function NexMascot({ pose = "idle", talking = false, intro = false, cue, size = 96, decorative = false, sx }: NexMascotProps) {
  const colors = useNexColors();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<NexEngine | null>(null);
  const live = useRef({ pose, talking });

  // Keep the latest props available to the engine-creating effect without recreating the engine.
  // Declared first so it runs before that effect on every commit.
  useEffect(() => {
    live.current = { pose, talking };
  });

  // Rebuilt only when the theme colors or motion preference change; props flow in through live/ref below.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const engine = new NexEngine(svg, {
      reduceMotion,
      particleColors: [colors.hand, colors.accent, colors.glow],
      startPose: intro ? "logo" : live.current.pose,
    });
    engineRef.current = engine;
    engine.setTalking(live.current.talking);
    if (intro) engine.wakeUp();
    const onClick = (): void => engine.giggle();
    svg.addEventListener("click", onClick);
    return () => {
      svg.removeEventListener("click", onClick);
      engine.destroy();
      engineRef.current = null;
    };
  }, [reduceMotion, colors.hand, colors.accent, colors.glow, colors.body, colors.visor, colors.capShade, intro]);

  // With intro, the idle default must not cut the logo wake-up short; any other pose still applies.
  useEffect(() => { if (!(intro && pose === "idle")) engineRef.current?.setPose(pose); }, [pose, intro]);
  useEffect(() => { engineRef.current?.setTalking(talking); }, [talking]);
  // Hop when the cue changes (not on first mount).
  const firstCue = useRef(true);
  useEffect(() => {
    if (firstCue.current) { firstCue.current = false; return; }
    engineRef.current?.hop();
  }, [cue]);

  return (
    <Box sx={[{ width: size, height: size, flexShrink: 0, lineHeight: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width="100%"
        height="100%"
        style={{ overflow: "visible", display: "block" }}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : "Nex, the Nexus guide"}
        aria-hidden={decorative ? true : undefined}
      >
        <NexSkin colors={colors} uid={uid} />
      </svg>
    </Box>
  );
}
