import { getDefaultTokenColor, type BrandingColorToken, type ColorMode, type ColorOverrides } from "@/theme/branding-tokens";

/** Normal text needs this much contrast against its background to meet WCAG AA. */
export const AA_TEXT = 4.5;
/** Buttons, links and other interface parts need this much. */
export const AA_UI = 3;

/** A colour as red, green and blue from 0 to 255; null when it is not a six digit hex colour. */
function rgbOf(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : null;
}

/** How bright a colour looks to the eye, from 0 (black) to 1 (white), as WCAG defines it. */
function luminance(hex: string): number | null {
  const rgb = rgbOf(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The WCAG contrast ratio of two colours, from 1 (identical) to 21 (black on white).
 *
 * @param {string} first - A `#RRGGBB` colour.
 * @param {string} second - A `#RRGGBB` colour.
 * @returns {number | null} The ratio, or null when either is not a valid colour.
 */
export function contrastRatio(first: string, second: string): number | null {
  const a = luminance(first);
  const b = luminance(second);
  if (a === null || b === null) return null;
  const [light, dark] = a >= b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

export interface ContrastIssue {
  /** What is hard to read, in words a school can act on. */
  message: string;
  ratio: number;
  required: number;
}

interface Pair {
  foreground: BrandingColorToken;
  background: BrandingColorToken;
  required: number;
  what: string;
  /** Only checked when the foreground was chosen by hand; otherwise it is worked out to be readable. */
  onlyWhenChosen?: boolean;
}

const PAIRS: Pair[] = [
  { foreground: "primary.contrastText", background: "primary.main", required: AA_TEXT, what: "the text on primary buttons", onlyWhenChosen: true },
  { foreground: "secondary.contrastText", background: "secondary.main", required: AA_TEXT, what: "the text on secondary buttons", onlyWhenChosen: true },
  { foreground: "text.primary", background: "background.default", required: AA_TEXT, what: "the main text on the page background" },
  { foreground: "text.primary", background: "background.paper", required: AA_TEXT, what: "the main text on cards and panels" },
  { foreground: "text.secondary", background: "background.paper", required: AA_TEXT, what: "the muted text on cards and panels" },
  { foreground: "primary.main", background: "background.paper", required: AA_UI, what: "primary buttons and links on cards and panels" },
];

/**
 * The colour pairs in one mode that are too close to read comfortably, for
 * showing a warning while a school picks its colours. A colour the school did
 * not choose keeps the Nexus colour, and the text on a button the school did
 * not set is worked out to be readable, so only real choices are checked.
 *
 * @param {ColorMode} mode - Light or dark.
 * @param {ColorOverrides} overrides - The colours the school set.
 * @returns {ContrastIssue[]} The pairs that fall short of WCAG AA; empty when all are fine.
 */
export function findContrastIssues(mode: ColorMode, overrides: ColorOverrides): ContrastIssue[] {
  const chosen = overrides[mode] ?? {};
  const colour = (token: BrandingColorToken) => chosen[token] ?? getDefaultTokenColor(mode, token);
  const issues: ContrastIssue[] = [];
  for (const pair of PAIRS) {
    if (pair.onlyWhenChosen && !chosen[pair.foreground]) continue;
    // A pair none of whose colours the school touched is Nexus's own, already checked.
    if (!chosen[pair.foreground] && !chosen[pair.background]) continue;
    const ratio = contrastRatio(colour(pair.foreground), colour(pair.background));
    if (ratio !== null && ratio < pair.required) {
      issues.push({
        message: `${pair.what[0].toUpperCase()}${pair.what.slice(1)} would be hard to read (contrast ${ratio.toFixed(1)}:1; ${pair.required}:1 is needed).`,
        ratio,
        required: pair.required,
      });
    }
  }
  return issues;
}
