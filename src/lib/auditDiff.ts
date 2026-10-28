import { formatDateTime } from "@/lib/dateFormat";

export type Snapshot = Record<string, unknown> | null | undefined;

export interface DiffRow {
  key: string;
  label: string;
  before: unknown;
  after: unknown;
  changed: boolean;
}

/** Bookkeeping columns that say nothing a school administrator needs to read. */
const HIDDEN_KEYS = new Set([
  "id",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy",
  "institutionId",
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENUM = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$|^[A-Z]{2,}$/;

const isNested = (value: unknown): boolean =>
  typeof value === "object" && value !== null;

/**
 * @param {string} key - A field name such as "contactEmail".
 * @returns {string} A readable label such as "Contact email".
 */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/Id$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}

/**
 * Turns one stored value into text a person can read: dates in the display
 * time zone, Yes/No, enum names in sentence case, a short reference for ids,
 * and a count for lists.
 *
 * @param {unknown} value - The raw snapshot value.
 * @returns {{ text: string, title?: string }} The text, and the raw value when it was shortened.
 */
export function formatAuditValue(value: unknown): {
  text: string;
  title?: string;
} {
  if (value === undefined || value === null || value === "") {
    return { text: "—" };
  }
  if (typeof value === "boolean") return { text: value ? "Yes" : "No" };
  if (Array.isArray(value)) {
    return { text: value.length === 1 ? "1 item" : `${value.length} items` };
  }
  if (isNested(value)) {
    const pairs = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => !isNested(v))
      .map(([k, v]) => `${humanizeKey(k)}: ${formatAuditValue(v).text}`);
    return { text: pairs.join(", ") || "Details" };
  }
  const text = String(value);
  if (ISO_DATE.test(text)) return { text: formatDateTime(text) };
  if (UUID.test(text)) return { text: `Ref …${text.slice(-6)}`, title: text };
  if (ENUM.test(text)) {
    const words = text.toLowerCase().replace(/_/g, " ");
    return { text: words.charAt(0).toUpperCase() + words.slice(1) };
  }
  return { text };
}

/**
 * Builds the rows of a before/after comparison. A related record that only
 * one side carries (the "after" snapshot loads relations, the "before" one
 * does not) is skipped, because it is not a change to this record.
 *
 * @param {Snapshot} before - The record before the action.
 * @param {Snapshot} after - The record after the action.
 * @returns {DiffRow[]} One row per readable field, sorted by label.
 */
export function buildDiffRows(before: Snapshot, after: Snapshot): DiffRow[] {
  const comparable = !!before && !!after;
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  return Array.from(keys)
    .filter((key) => !HIDDEN_KEYS.has(key))
    .filter((key) => {
      if (!comparable) return true;
      const b = before?.[key];
      const a = after?.[key];
      const oneSided = b === undefined || a === undefined;
      return !(oneSided && (isNested(b) || isNested(a)));
    })
    .map((key) => {
      const b = before?.[key];
      const a = after?.[key];
      return {
        key,
        label: humanizeKey(key),
        before: b,
        after: a,
        changed: JSON.stringify(b) !== JSON.stringify(a),
      };
    })
    .sort((x, y) => x.label.localeCompare(y.label));
}
