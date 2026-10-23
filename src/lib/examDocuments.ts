export interface PrintMeta {
  documentType: string;
  generatedAt: string;
  institution: {
    id: string;
    name: string;
    logoUrl: string | null;
    branding: { primaryColorLight: string | null };
  };
  campus: { id: string; name: string } | null;
}

export interface DatesheetPaper {
  examSubjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  examDate: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
}

export interface DocumentExam {
  id: string;
  name: string;
  examType: string;
  className: string;
  termName: string;
  academicYearName: string;
}

export interface DatesheetData {
  exam: DocumentExam;
  papers: DatesheetPaper[];
  printMeta: PrintMeta;
}

export interface DocumentStudent {
  id: string;
  name: string;
  regNo: string;
  picture: string | null;
  className: string;
  sectionName: string | null;
}

export interface AdmitCardData {
  student: DocumentStudent;
  exam: DocumentExam;
  papers: DatesheetPaper[];
}

export interface OutcomeSubject {
  examSubjectId: string;
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  state: "MARKED" | "ABSENT" | "UNMARKED";
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
  isRetake?: boolean;
  retakeExamType?: string | null;
  originalMarksObtained?: number | null;
  originalGrade?: string | null;
}

export type OutcomeStatus = "PASS" | "FAIL" | "ABSENT" | "INCOMPLETE";

export interface Outcome {
  subjects: OutcomeSubject[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number | null;
  grade: string | null;
  subjectsAppeared: number;
  subjectsTotal: number;
  status: OutcomeStatus;
  isOverallPass: boolean | null;
}

export interface ReportCardTerm {
  term: { id: string; name: string; weight: number };
  exam: { id: string; name: string };
  outcome: Outcome;
  positionInClass: number | null;
  classSize: number;
  positionInSection: number | null;
  sectionSize: number;
}

export interface ReportCardData {
  student: DocumentStudent;
  academicYear: { name: string };
  passPolicy: string;
  terms: ReportCardTerm[];
  annual: {
    percentage: number;
    grade: string | null;
    isOverallPass: boolean | null;
    status: OutcomeStatus;
    subjects: Array<{ subjectId: string; subjectName: string; percentage: number; passingPercentage: number }>;
  } | null;
}

/** 1 becomes "1st", 2 "2nd", 11 "11th", 22 "22nd". */
export function ordinal(value: number): string {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`;
  const suffix = ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th";
  return `${value}${suffix}`;
}

/** "86.67%", or a dash when there is no percentage. */
export function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${Number(value.toFixed(2))}%`;
}

/** "2nd of 30", or a dash when the student is not ranked. */
export function formatPosition(position: number | null, size: number): string {
  return position === null || size === 0 ? "—" : `${ordinal(position)} of ${size}`;
}

export const STATUS_LABELS: Record<OutcomeStatus, string> = {
  PASS: "Pass",
  FAIL: "Fail",
  ABSENT: "Absent",
  INCOMPLETE: "Incomplete",
};

/** What a subject's marks cell shows: the mark, an absence, or that marks are still pending. */
export function describeMarks(subject: OutcomeSubject): string {
  if (subject.state === "ABSENT") return "Absent";
  if (subject.state === "UNMARKED") return "Pending";
  return `${subject.marksObtained}`;
}

/** "Retake: original 30 (F)" for a subject whose mark came from a retake; empty otherwise. */
export function describeRetake(subject: OutcomeSubject): string {
  if (!subject.isRetake) return "";
  const kind = subject.retakeExamType ? subject.retakeExamType.toLowerCase() : "retake";
  const original =
    subject.originalMarksObtained === null || subject.originalMarksObtained === undefined
      ? "no original mark"
      : `original ${subject.originalMarksObtained}${subject.originalGrade ? ` (${subject.originalGrade})` : ""}`;
  return `Counted from the ${kind}; ${original}`;
}
