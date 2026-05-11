interface Props {
  size?: number;
  variant?: "icon" | "full";
  white?: boolean;
}

export default function NexusLogo({ size = 40, variant = "full", white = false }: Props) {
  const primary   = white ? "#ffffff" : "#059669";
  const accent    = white ? "#a7f3d0" : "#34D399";
  const crossLine = white ? "rgba(255,255,255,0.4)" : "#34D399";
  const ghost     = white ? "rgba(255,255,255,0.5)" : "#34D399";
  const textColor = white ? "#ffffff" : "#059669";
  const maskId    = `cni-${white ? "w" : "g"}-${variant}`;

  const mark = (
    <>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="white"/>
          <circle cx="10" cy="38" r="5" fill="black"/>
          <circle cx="38" cy="10" r="5" fill="black"/>
          <circle cx="24" cy="24" r="4" fill="black"/>
          <circle cx="10" cy="10" r="3" fill="black"/>
          <circle cx="38" cy="38" r="3" fill="black"/>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <line x1="10" y1="38" x2="24" y2="24" stroke={primary} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="24" y1="24" x2="38" y2="10" stroke={primary} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="10" x2="38" y2="38" stroke={crossLine} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      </g>
      <circle cx="10" cy="38" r="5" fill={primary}/>
      <circle cx="38" cy="10" r="5" fill={primary}/>
      <circle cx="24" cy="24" r="4" fill={accent}/>
      <circle cx="10" cy="10" r="3" fill={ghost} opacity="0.5"/>
      <circle cx="38" cy="38" r="3" fill={ghost} opacity="0.5"/>
    </>
  );

  if (variant === "icon") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" fill="none">
        {mark}
      </svg>
    );
  }

  const height = size;
  const width = Math.round(size * (160 / 48));

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 160 48" fill="none">
      {mark}
      <text x="52" y="31" fontFamily="DM Sans, sans-serif" fontSize="22" fontWeight="800" fill={textColor} letterSpacing="-0.5">nexus</text>
    </svg>
  );
}
