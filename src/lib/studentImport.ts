/** The columns of the import file, as the server knows them. */
export type ImportField =
  | "name"
  | "regNo"
  | "email"
  | "dob"
  | "gender"
  | "className"
  | "sectionName"
  | "admissionDate"
  | "religion"
  | "cnic"
  | "prevSchool"
  | "guardianName"
  | "guardianPhone"
  | "guardianRelation";

export type ImportRow = Partial<Record<ImportField, string>>;

/** Columns a line cannot be imported without. */
export const REQUIRED_FIELDS: ImportField[] = ["name", "dob", "gender", "className"];

/** How many lines are sent to be saved at once. */
export const IMPORT_CHUNK = 15;

const HEADINGS: Record<ImportField, { label: string; names: string[]; example: string }> = {
  name: { label: "Name", names: ["name", "student name", "full name", "studentname"], example: "Ayesha Khan" },
  regNo: { label: "Reg No", names: ["reg no", "registration no", "registration number", "regno", "reg number", "gr no", "admission no"], example: "" },
  email: { label: "Email", names: ["email", "email address", "student email"], example: "" },
  dob: { label: "Date of Birth", names: ["date of birth", "dob", "birth date", "birthdate"], example: "12/06/2016" },
  gender: { label: "Gender", names: ["gender", "sex"], example: "Female" },
  className: { label: "Class", names: ["class", "class name", "grade"], example: "Grade 5" },
  sectionName: { label: "Section", names: ["section", "section name"], example: "A" },
  admissionDate: { label: "Admission Date", names: ["admission date", "date of admission", "admitted on"], example: "01/04/2026" },
  religion: { label: "Religion", names: ["religion"], example: "" },
  cnic: { label: "CNIC", names: ["cnic", "b form", "b-form", "bform", "cnic / b-form"], example: "" },
  prevSchool: { label: "Previous School", names: ["previous school", "prev school", "last school"], example: "" },
  guardianName: { label: "Guardian Name", names: ["guardian name", "guardian", "father name", "parent name", "parent"], example: "Imran Khan" },
  guardianPhone: { label: "Guardian Phone", names: ["guardian phone", "phone", "guardian mobile", "father phone", "mobile", "contact", "parent phone"], example: "0300 1234567" },
  guardianRelation: { label: "Guardian Relation", names: ["guardian relation", "relation", "relationship"], example: "Father" },
};

const FIELD_ORDER = Object.keys(HEADINGS) as ImportField[];

/** The same words with any spacing, case or punctuation, so "Date_of_Birth" and "date of birth" match. */
const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Reads CSV text: commas, quoted fields that may hold commas, quotes (`""`) and
 * line breaks, either kind of line ending, and a leading byte order mark that
 * Excel adds.
 *
 * @param {string} text - The file's text.
 * @returns {string[][]} Rows of cells; blank lines are dropped.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

export interface ParsedImport {
  rows: ImportRow[];
  /** Headings in the file that matched nothing, so the person can see they were ignored. */
  ignoredColumns: string[];
  /** Required columns the file does not have. */
  missingColumns: string[];
}

/**
 * Matches the file's headings to the columns the import knows, whatever the
 * order or exact wording, and builds one object per line.
 *
 * @param {string} text - The CSV file's text.
 * @returns {ParsedImport} The lines, the headings that were ignored and the required columns that are missing.
 */
export function parseStudentFile(text: string): ParsedImport {
  const [heading, ...body] = parseCsv(text);
  if (!heading) return { rows: [], ignoredColumns: [], missingColumns: REQUIRED_FIELDS.map((field) => HEADINGS[field].label) };

  const columnOf = new Map<number, ImportField>();
  const ignoredColumns: string[] = [];
  heading.forEach((title, index) => {
    const key = squash(title);
    const field = FIELD_ORDER.find((candidate) => HEADINGS[candidate].names.some((name) => squash(name) === key) && !Array.from(columnOf.values()).includes(candidate));
    if (field) columnOf.set(index, field);
    else if (title.trim()) ignoredColumns.push(title.trim());
  });

  const present = new Set(columnOf.values());
  const missingColumns = REQUIRED_FIELDS.filter((field) => !present.has(field)).map((field) => HEADINGS[field].label);
  const rows = body.map((cells) => {
    const row: ImportRow = {};
    columnOf.forEach((field, index) => {
      const value = (cells[index] ?? "").trim();
      if (value) row[field] = value;
    });
    return row;
  });
  return { rows, ignoredColumns, missingColumns };
}

/** The empty file a school fills in: one line of headings and one example. */
export function templateCsv(): string {
  const quote = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const headings = FIELD_ORDER.map((field) => quote(HEADINGS[field].label)).join(",");
  const example = FIELD_ORDER.map((field) => quote(HEADINGS[field].example)).join(",");
  return `﻿${headings}\r\n${example}\r\n`;
}

export interface ImportResult {
  line: number;
  name: string;
  status: "IMPORTED" | "IMPORTED_GUARDIAN_FAILED" | "FAILED";
  regNo: string | null;
  studentPassword: string | null;
  guardianPhone: string | null;
  guardianPassword: string | null;
  error: string | null;
}

/** A value for a spreadsheet cell that cannot run as a formula. */
function safeCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) && !/^-?\d+(\.\d+)?$/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/**
 * The sheet a school hands out: each imported student's sign-in details and
 * first password, and each new guardian's. Passwords are shown once, so this
 * is the only copy there will be.
 *
 * @param {ImportResult[]} results - What the server saved.
 * @returns {string} CSV text for download.
 */
export function credentialsCsv(results: ImportResult[]): string {
  const lines = [["Student", "Sign in with (reg no)", "First password", "Guardian phone (sign in with)", "Guardian first password"].join(",")];
  for (const result of results.filter((item) => item.status !== "FAILED")) {
    lines.push(
      [result.name, result.regNo ?? "", result.studentPassword ?? "", result.guardianPhone ?? "", result.guardianPassword ?? ""].map(safeCell).join(",")
    );
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}
