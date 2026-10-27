import { describe, expect, it } from "vitest";
import { credentialsCsv, parseCsv, parseStudentFile, templateCsv, type ImportResult } from "./studentImport";

describe("parseCsv", () => {
  it("reads rows and cells, dropping blank lines and either kind of line ending", () => {
    expect(parseCsv("a,b\r\n1,2\n\n3,4\r5,6")).toEqual([["a", "b"], ["1", "2"], ["3", "4"], ["5", "6"]]);
  });

  it("reads quoted cells that hold commas, doubled quotes and line breaks", () => {
    expect(parseCsv('name,note\n"Khan, A.","say ""hi""\nthere"')).toEqual([["name", "note"], ["Khan, A.", 'say "hi"\nthere']]);
  });

  it("ignores the byte order mark Excel adds, and a last line with no line ending", () => {
    expect(parseCsv("﻿a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps empty cells so columns stay in place", () => {
    expect(parseCsv("a,b,c\n1,,3")).toEqual([["a", "b", "c"], ["1", "", "3"]]);
  });

  it("returns nothing for an empty file", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\n\n")).toEqual([]);
  });
});

describe("parseStudentFile", () => {
  it("matches headings whatever their order, case or wording and builds a line per student", () => {
    const parsed = parseStudentFile("Class,DATE_OF_BIRTH,Student Name,Sex,Phone,Father Name\nGrade 5,12/06/2016,Ayesha Khan,F,0300 1234567,Imran Khan");

    expect(parsed.missingColumns).toEqual([]);
    expect(parsed.ignoredColumns).toEqual([]);
    expect(parsed.rows).toEqual([
      { className: "Grade 5", dob: "12/06/2016", name: "Ayesha Khan", gender: "F", guardianPhone: "0300 1234567", guardianName: "Imran Khan" },
    ]);
  });

  it("names the headings it could not use and the required ones the file lacks", () => {
    const parsed = parseStudentFile("Name,Shoe size\nAyesha,34");

    expect(parsed.ignoredColumns).toEqual(["Shoe size"]);
    expect(parsed.missingColumns).toEqual(["Date of Birth", "Gender", "Class"]);
  });

  it("leaves a blank cell out of the line, and trims spaces", () => {
    const parsed = parseStudentFile("Name,Gender,Class,Date of Birth,Email\n  Ayesha  , f ,Grade 5,12/06/2016,");

    expect(parsed.rows[0]).toEqual({ name: "Ayesha", gender: "f", className: "Grade 5", dob: "12/06/2016" });
  });

  it("uses a heading once, so two columns with the same meaning do not overwrite each other", () => {
    const parsed = parseStudentFile("Name,Full Name,Gender,Class,DOB\nA,B,f,Grade 5,1/1/2015");

    expect(parsed.rows[0].name).toBe("A");
    expect(parsed.ignoredColumns).toEqual(["Full Name"]);
  });

  it("copes with a line that has fewer cells than the heading", () => {
    const parsed = parseStudentFile("Name,Gender,Class,DOB,Email\nAyesha,f");

    expect(parsed.rows[0]).toEqual({ name: "Ayesha", gender: "f" });
  });

  it("asks for everything when the file is empty", () => {
    const parsed = parseStudentFile("");

    expect(parsed.rows).toEqual([]);
    expect(parsed.missingColumns).toEqual(["Name", "Date of Birth", "Gender", "Class"]);
  });
});

describe("templateCsv", () => {
  it("is a file the importer reads back, with an example line", () => {
    const parsed = parseStudentFile(templateCsv());

    expect(parsed.missingColumns).toEqual([]);
    expect(parsed.ignoredColumns).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({ name: "Ayesha Khan", gender: "Female", className: "Grade 5", guardianPhone: "0300 1234567" });
  });
});

describe("credentialsCsv", () => {
  const result = (overrides: Partial<ImportResult>): ImportResult => ({
    line: 2,
    name: "Ayesha Khan",
    status: "IMPORTED",
    regNo: "GUL-26-0001",
    studentPassword: "Abcd2345xY",
    guardianPhone: "03001234567",
    guardianPassword: "Wxyz9876Kk",
    error: null,
    ...overrides,
  });

  it("lists each imported student's sign-in and first password, and the guardian's", () => {
    const csv = credentialsCsv([result({}), result({ name: "Bilal", regNo: "GUL-26-0002", studentPassword: "P2", guardianPassword: null })]);

    expect(csv.replace(/^﻿/, "").split("\r\n")).toEqual([
      "Student,Sign in with (reg no),First password,Guardian phone (sign in with),Guardian first password",
      "Ayesha Khan,GUL-26-0001,Abcd2345xY,03001234567,Wxyz9876Kk",
      "Bilal,GUL-26-0002,P2,03001234567,",
      "",
    ]);
  });

  it("leaves out lines that failed, and keeps a student whose guardian failed", () => {
    const csv = credentialsCsv([result({ status: "FAILED", studentPassword: null, regNo: null }), result({ name: "Cyrus", status: "IMPORTED_GUARDIAN_FAILED", guardianPassword: null })]);

    expect(csv).toContain("Cyrus");
    expect(csv).not.toContain("Ayesha");
  });

  it("keeps a name from running as a formula in a spreadsheet, and quotes a comma", () => {
    const csv = credentialsCsv([result({ name: "=HYPERLINK(\"x\")" }), result({ name: "Khan, A." })]);

    expect(csv).toContain("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csv).toContain("\"Khan, A.\"");
  });
});
