/**
 * Shared helper for reading an `InstitutionSetting` value out of
 * `runtimeConfig.settings` / the platform settings-update payload.
 *
 * A setting can arrive as a plain object, a JSON-encoded string (however it
 * was last written), or wrapped in `{ value: ... }` — this normalizes all
 * three into a plain object (or `null` when the setting is absent/not an
 * object). Extracted out of InstitutionSettingsTab so every reader (the
 * platform settings editor, dashboard feature gates like attendance mode)
 * shares one decoding rule instead of re-implementing it.
 */
export function parseSettingObject(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseSettingObject(parsed);
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return parseSettingObject(obj.value);
    return obj;
  }
  return null;
}
