export interface GradeBandForm {
  grade: string;
  minPercentage: string;
  maxPercentage: string;
  remarks: string;
}

export interface GradeBandRecord {
  id?: string;
  grade: string;
  minPercentage: string | number;
  maxPercentage: string | number;
  remarks?: string | null;
}

export const emptyBand = (): GradeBandForm => ({
  grade: "",
  minPercentage: "",
  maxPercentage: "",
  remarks: "",
});

/** Seeds the editor form from a saved scale's bands, highest range first. */
export function bandsToForm(bands: GradeBandRecord[]): GradeBandForm[] {
  return [...bands]
    .sort((a, b) => Number(b.minPercentage) - Number(a.minPercentage))
    .map((band) => ({
      grade: band.grade,
      minPercentage: String(Number(band.minPercentage)),
      maxPercentage: String(Number(band.maxPercentage)),
      remarks: band.remarks ?? "",
    }));
}

/** Short label for a band, e.g. "A 80–100". */
export function describeBand(band: GradeBandRecord): string {
  return `${band.grade} ${Number(band.minPercentage)}–${Number(band.maxPercentage)}`;
}

/**
 * Mirrors the server's band rules so mistakes show before saving: each
 * range needs min ≤ max inside 0–100 with at most two decimals, grade labels
 * must be unique, and ranges may not overlap or touch. Gaps are allowed.
 *
 * @param {GradeBandForm[]} bands - The editor rows.
 * @returns {string | null} The first problem found, or null when valid.
 */
export function validateBands(bands: GradeBandForm[]): string | null {
  if (bands.length === 0) return "Add at least one grade band.";

  const seen = new Set<string>();
  const parsed: Array<{ grade: string; min: number; max: number }> = [];
  for (const [index, band] of bands.entries()) {
    const row = `Band ${index + 1}`;
    const grade = band.grade.trim();
    if (!grade) return `${row}: enter a grade label.`;
    const min = Number(band.minPercentage);
    const max = Number(band.maxPercentage);
    if (band.minPercentage === "" || band.maxPercentage === "" || !Number.isFinite(min) || !Number.isFinite(max)) {
      return `${row} (${grade}): enter both percentages.`;
    }
    if (min < 0 || max > 100) return `${row} (${grade}): percentages must be between 0 and 100.`;
    if (Math.round(min * 100) / 100 !== min || Math.round(max * 100) / 100 !== max) {
      return `${row} (${grade}): use at most two decimal places.`;
    }
    if (min > max) return `${row} (${grade}): the minimum cannot be greater than the maximum.`;
    const key = grade.toLowerCase();
    if (seen.has(key)) return `Grade "${grade}" appears more than once.`;
    seen.add(key);
    parsed.push({ grade, min, max });
  }

  const ordered = [...parsed].sort((a, b) => a.min - b.min);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].min <= ordered[index - 1].max) {
      return `Grades "${ordered[index - 1].grade}" and "${ordered[index].grade}" have overlapping ranges.`;
    }
  }
  return null;
}

/** Builds the API payload from editor rows, in the order shown. */
export function bandsToPayload(bands: GradeBandForm[]): Array<Record<string, unknown>> {
  return bands.map((band, index) => ({
    grade: band.grade.trim(),
    minPercentage: Number(band.minPercentage),
    maxPercentage: Number(band.maxPercentage),
    ...(band.remarks.trim() ? { remarks: band.remarks.trim() } : {}),
    sortOrder: index,
  }));
}
