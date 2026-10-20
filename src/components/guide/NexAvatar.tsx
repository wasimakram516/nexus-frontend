"use client";

import { useId } from "react";
import { Box } from "@mui/material";
import { useNexColors } from "./nex-colors";
import NexSkin from "./NexSkin";

interface NexAvatarProps {
  /** Pixel size of the square avatar. */
  size?: number;
}

/**
 * Nex's head only (face, visor and cap), for small spots such as chat avatars where the full
 * character with limbs would be unreadable. It reuses NexSkin, so it always matches the mascot.
 */
export default function NexAvatar({ size = 28 }: NexAvatarProps) {
  const colors = useNexColors();
  const uid = useId().replace(/:/g, "");
  return (
    <Box
      sx={{
        width: size,
        height: size,
        lineHeight: 0,
        flexShrink: 0,
        // Limbs, hands and the orbiting spark belong to the full mascot, not the head shot.
        "& [data-limb], & [data-hand], & [data-spark]": { display: "none" },
      }}
    >
      <svg viewBox="27 17 66 68" width="100%" height="100%" aria-hidden style={{ display: "block", overflow: "visible" }}>
        <NexSkin colors={colors} uid={uid} />
      </svg>
    </Box>
  );
}
