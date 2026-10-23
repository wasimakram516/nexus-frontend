export interface MarksRow {
  studentId: string;
  name: string;
  regNo: string;
  /** Marks as typed; empty means no mark yet. */
  marks: string;
  isAbsent: boolean;
  remarks: string;
}

export interface SavedResult {
  id: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string | null;
}

export interface GridStudent {
  studentId: string;
  name: string;
  regNo: string;
  result: SavedResult | null;
}

/** Builds the editable rows from the server's grid, preserving its order. */
export function toRows(students: GridStudent[]): MarksRow[] {
  return students.map((student) => ({
    studentId: student.studentId,
    name: student.name,
    regNo: student.regNo,
    marks: student.result?.marksObtained == null ? "" : String(student.result.marksObtained),
    isAbsent: student.result?.isAbsent ?? false,
    remarks: student.result?.remarks ?? "",
  }));
}

/** True when a row differs from what is saved, so only real edits are sent. */
export function isDirty(row: MarksRow, original: MarksRow | undefined): boolean {
  if (!original) return true;
  return (
    row.marks !== original.marks ||
    row.isAbsent !== original.isAbsent ||
    row.remarks !== original.remarks
  );
}

/**
 * Checks one row against the paper: marks must be a number from 0 to the
 * maximum with at most two decimals, and an absent student has no marks.
 *
 * @param {MarksRow} row - The row as typed.
 * @param {number} maxMarks - The paper's maximum marks.
 * @returns {string | null} What is wrong with the row, or null when it is fine.
 */
export function validateRow(row: MarksRow, maxMarks: number): string | null {
  if (row.isAbsent) {
    return row.marks.trim() === "" ? null : "An absent student cannot have marks.";
  }
  if (row.marks.trim() === "") return null;
  const marks = Number(row.marks);
  if (!Number.isFinite(marks)) return "Enter a number.";
  if (marks < 0) return "Marks cannot be negative.";
  if (marks > maxMarks) return `Cannot be more than ${maxMarks}.`;
  if (Math.round(marks * 100) / 100 !== marks) return "Use at most two decimal places.";
  return null;
}

/** The API entries for the rows that changed. */
export function toEntries(
  rows: MarksRow[],
  originals: Map<string, MarksRow>,
): Array<Record<string, unknown>> {
  return rows
    .filter((row) => isDirty(row, originals.get(row.studentId)))
    .map((row) => ({
      studentId: row.studentId,
      isAbsent: row.isAbsent,
      marksObtained: row.isAbsent || row.marks.trim() === "" ? null : Number(row.marks),
      remarks: row.remarks.trim(),
    }));
}

/** Counts for the footer: students with a mark or absence recorded, and below passing marks. */
export function summarize(
  rows: MarksRow[],
  passingMarks: number,
): { total: number; recorded: number; belowPassing: number } {
  let recorded = 0;
  let belowPassing = 0;
  for (const row of rows) {
    if (row.isAbsent) {
      recorded += 1;
      continue;
    }
    if (row.marks.trim() === "") continue;
    recorded += 1;
    if (Number(row.marks) < passingMarks) belowPassing += 1;
  }
  return { total: rows.length, recorded, belowPassing };
}
