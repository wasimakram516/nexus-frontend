"use client";

import { useId } from "react";

type NexusLogoVariant = "icon" | "full";
type NexusLogoTheme = "color" | "white";

interface NexusLogoProps {
  /** Pixel height of the logo; width is derived from the variant's aspect ratio. */
  size?: number;
  variant?: NexusLogoVariant;
  theme?: NexusLogoTheme;
  className?: string;
  title?: string;

  /**
   * Allows Nexus to be re-themed without changing the component.
   */
  primaryColor?: string;
  accentColor?: string;
  /** Defaults to primaryColor — letters are quiet, not tied to ambient link/text color (unreliable across the app's Link wrappers). */
  letterColor?: string;
}

const ICON_VIEWBOX = { width: 48, height: 48 };
const FULL_VIEWBOX = { width: 185, height: 64 };

export default function NexusLogo({
  size = 40,
  variant = "icon",
  theme = "color",
  className,
  title = "Nexus",
  primaryColor = "#059669",
  accentColor = "#34D399",
  letterColor,
}: NexusLogoProps) {
  const generatedId = useId().replace(/:/g, "");
  const maskId = `nexus-mark-mask-${generatedId}`;

  const isWhite = theme === "white";

  const primary = isWhite ? "#FFFFFF" : primaryColor;
  const accent = isWhite ? "#FFFFFF" : accentColor;
  const letters = isWhite ? "#FFFFFF" : (letterColor ?? primaryColor);

  if (variant === "icon") {
    const { width: vbW, height: vbH } = ICON_VIEWBOX;
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox={`0 0 ${vbW} ${vbH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <title>{title}</title>

        <NexusMark maskId={maskId} primary={primary} accent={accent} />
      </svg>
    );
  }

  const { width: vbW, height: vbH } = FULL_VIEWBOX;
  const width = Math.round(size * (vbW / vbH));

  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox={`0 0 ${vbW} ${vbH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      {/* Left side: "ne" */}
      <text
        x="4"
        y="47"
        fill={letters}
        fontFamily="var(--font-display), Montserrat, sans-serif"
        fontSize="48"
        fontWeight="400"
        letterSpacing="-2"
      >
        ne
      </text>

      {/*
       * Original 48×48 Nexus mark.
       *
       * It occupies the x position and is slightly larger than a normal
       * lowercase glyph so it remains the dominant element.
       */}
      <g transform="translate(62 3) scale(1.2)">
        <NexusMark maskId={maskId} primary={primary} accent={accent} />
      </g>

      {/* Right side: "us" */}
      <text
        x="118"
        y="47"
        fill={letters}
        fontFamily="var(--font-display), Montserrat, sans-serif"
        fontSize="48"
        fontWeight="400"
        letterSpacing="-2"
      >
        us
      </text>
    </svg>
  );
}

interface NexusMarkProps {
  maskId: string;
  primary: string;
  accent: string;
}

function NexusMark({ maskId, primary, accent }: NexusMarkProps) {
  return (
    <>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="white" />

          <circle cx="10" cy="38" r="5" fill="black" />
          <circle cx="38" cy="10" r="5" fill="black" />
          <circle cx="24" cy="24" r="4" fill="black" />
          <circle cx="10" cy="10" r="3" fill="black" />
          <circle cx="38" cy="38" r="3" fill="black" />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Bold ascending diagonal */}
        <line
          x1="10"
          y1="38"
          x2="24"
          y2="24"
          stroke={primary}
          strokeWidth="4.17"
          strokeLinecap="round"
        />

        <line
          x1="24"
          y1="24"
          x2="38"
          y2="10"
          stroke={primary}
          strokeWidth="4.17"
          strokeLinecap="round"
        />

        {/* Faint descending diagonal */}
        <line
          x1="10"
          y1="10"
          x2="38"
          y2="38"
          stroke={accent}
          strokeWidth="3.33"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>

      {/* Anchor nodes */}
      <circle cx="10" cy="38" r="5" fill={primary} />
      <circle cx="38" cy="10" r="5" fill={primary} />

      {/* Centre node */}
      <circle cx="24" cy="24" r="4" fill={accent} />

      {/* Ghost nodes */}
      <circle cx="10" cy="10" r="3" fill={accent} opacity="0.5" />
      <circle cx="38" cy="38" r="3" fill={accent} opacity="0.5" />
    </>
  );
}
