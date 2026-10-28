/** The limits a plan sets, as the person types them: blank means no limit. */
export interface LimitFields {
  maxCampuses: string;
  maxStudents: string;
  maxStaff: string;
}

const KEYS: (keyof LimitFields)[] = ["maxCampuses", "maxStudents", "maxStaff"];

/** A starting point for a new plan: one campus, everything else unlimited. */
export const NEW_PLAN_LIMITS: LimitFields = { maxCampuses: "1", maxStudents: "", maxStaff: "" };

/**
 * Reads a plan's stored limits into the three fields, leaving blank any it
 * does not set (or sets to no limit).
 *
 * @param {Record<string, unknown> | null | undefined} limits - The stored limits.
 * @returns {LimitFields} What to show in the form.
 */
export function limitFieldsOf(limits: Record<string, unknown> | null | undefined): LimitFields {
  const read = (key: keyof LimitFields) => {
    const value = limits?.[key];
    return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  };
  return { maxCampuses: read("maxCampuses"), maxStudents: read("maxStudents"), maxStaff: read("maxStaff") };
}

/**
 * What is wrong with a limit someone typed, or null when it is fine. A limit
 * is a whole number of one or more, or blank for no limit.
 */
export function limitProblem(label: string, value: string): string | null {
  if (!value.trim()) return null;
  return /^[1-9]\d*$/.test(value.trim()) ? null : `${label} must be a whole number of 1 or more, or blank for no limit.`;
}

/**
 * The limits to save: the three fields as numbers (blank becomes `null`, no
 * limit), over whatever else the plan already stored, so a setting this form
 * does not know about is never lost.
 *
 * @param {LimitFields} fields - What was typed.
 * @param {Record<string, unknown> | null | undefined} existing - The plan's stored limits.
 * @returns {Record<string, unknown>} The limits to send.
 */
export function limitsFromFields(fields: LimitFields, existing: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const saved: Record<string, unknown> = { ...(existing ?? {}) };
  for (const key of KEYS) saved[key] = fields[key].trim() ? Number(fields[key].trim()) : null;
  return saved;
}

/** `Up to 3 campuses, 500 students, no limit on staff` for a plan card. */
export function describeLimits(limits: Record<string, unknown> | null | undefined): string {
  const part = (key: keyof LimitFields, noun: string) => {
    const value = limits?.[key];
    return typeof value === "number" ? `${value} ${noun}` : `unlimited ${noun}`;
  };
  return [part("maxCampuses", "campuses"), part("maxStudents", "students"), part("maxStaff", "staff")].join(" · ");
}
