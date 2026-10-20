import { ImageResponse } from "next/og";
import { BRAND_DOMAIN, BRAND_NAME, BRAND_TAGLINE } from "@/lib/site-config";
import { BRAND_PALETTE, OG_COLORS } from "@/theme/tokens";

/** The size social networks and chat apps show a link preview at. */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const SHARE_IMAGE_TYPE = "image/png";

const TEXT = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.6)";
const FAINT = "rgba(255,255,255,0.25)";
const PADDING = 80;

interface ShareImageContent {
  /** Short label above the title, such as "Features". */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Optional row of small tags under the subtitle (home page lists modules). */
  pills?: readonly string[];
}

/** The Nexus node-graph mark, drawn inline so rendering never depends on a network fetch. */
function BrandMark({ size }: { size: number }) {
  const main = OG_COLORS.accent;
  const light = BRAND_PALETTE.dark.primary.light;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <line x1="10" y1="38" x2="24" y2="24" stroke={main} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="24" x2="38" y2="10" stroke={main} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="10" x2="38" y2="38" stroke={light} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <circle cx="10" cy="38" r="5" fill={main} />
      <circle cx="38" cy="10" r="5" fill={main} />
      <circle cx="24" cy="24" r="4" fill={light} />
      <circle cx="10" cy="10" r="3" fill={light} opacity="0.5" />
      <circle cx="38" cy="38" r="3" fill={light} opacity="0.5" />
    </svg>
  );
}

/** Picks a title size that keeps a long title on at most two lines. */
function titleSize(title: string): number {
  return title.length > 34 ? 60 : title.length > 22 ? 72 : 84;
}

/**
 * Renders the 1200x630 social preview: brand, what the page is, and the tagline,
 * on the brand gradient. Shared by the home page and every feature page so all
 * previews look like one family. Colors come from theme/tokens.ts.
 */
export function renderShareImage({ eyebrow, title, subtitle, pills }: ShareImageContent): ImageResponse {
  const [from, via, to] = OG_COLORS.gradient;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: PADDING,
          color: TEXT,
          background: `linear-gradient(135deg, ${from} 0%, ${via} 60%, ${to} 100%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <BrandMark size={72} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{BRAND_NAME}</div>
          <div
            style={{
              display: "flex",
              marginLeft: 12,
              padding: "6px 18px",
              borderRadius: 999,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 2,
              color: OG_COLORS.highlightText,
              background: OG_COLORS.glow,
              border: `1px solid ${OG_COLORS.glowBorder}`,
            }}
          >
            WISEMEN SOFT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: OG_COLORS.highlight }}>
            {eyebrow}
          </div>
          <div style={{ display: "flex", fontSize: titleSize(title), fontWeight: 800, lineHeight: 1.08 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.3, maxWidth: 960, color: MUTED }}>{subtitle}</div>
          {pills ? (
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              {pills.map((pill) => (
                <div
                  key={pill}
                  style={{
                    display: "flex",
                    padding: "6px 16px",
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: FAINT }}>
          <div style={{ display: "flex" }}>{BRAND_TAGLINE}</div>
          <div style={{ display: "flex" }}>{BRAND_DOMAIN}</div>
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE },
  );
}
