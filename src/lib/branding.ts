import { mergeLegacyBranding, sanitizeTokenOverrides, type ColorMode, type ColorOverrides } from "@/theme/branding-tokens";

/** Flat per-mode color columns used before per-token overrides existed. */
const LEGACY_COLUMNS = [
  "primaryColorLight", "secondaryColorLight", "accentColorLight", "backgroundColorLight",
  "primaryColorDark", "secondaryColorDark", "accentColorDark", "backgroundColorDark",
] as const;

type SavedBranding = Partial<Record<(typeof LEGACY_COLUMNS)[number], string | null>> & { colorOverrides?: unknown };

const asHex = (v: string | null | undefined) => (v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);

/**
 * Reads a saved branding profile into editable overrides: explicit per-token overrides, plus any
 * legacy flat colors (primary, secondary, background) shown as customized so an admin can see and
 * reset them. Saving writes everything back as overrides (see buildBrandingColorPayload).
 */
export function loadColorOverrides(branding: SavedBranding | null | undefined): ColorOverrides {
  const stored = (branding?.colorOverrides ?? {}) as Partial<Record<ColorMode, unknown>>;
  const result: ColorOverrides = {};
  for (const [mode, suffix] of [["light", "Light"], ["dark", "Dark"]] as const) {
    const merged = mergeLegacyBranding(
      {
        primary: asHex(branding?.[`primaryColor${suffix}`]),
        secondary: asHex(branding?.[`secondaryColor${suffix}`]),
        background: asHex(branding?.[`backgroundColor${suffix}`]),
      },
      sanitizeTokenOverrides(stored[mode]),
    );
    if (Object.keys(merged).length > 0) result[mode] = merged;
  }
  return result;
}

/**
 * Color fields for the branding API. Only customized colors are sent (null when none, which clears
 * them), never the Nexus defaults, so institutions that did not customize a color keep following
 * the Nexus theme. The legacy flat columns are cleared because overrides now carry those colors.
 */
export function buildBrandingColorPayload(overrides: ColorOverrides) {
  const hasAny = Object.values(overrides).some((m) => m && Object.keys(m).length > 0);
  return {
    colorOverrides: hasAny ? overrides : null,
    ...Object.fromEntries(LEGACY_COLUMNS.map((column) => [column, null])),
  };
}
