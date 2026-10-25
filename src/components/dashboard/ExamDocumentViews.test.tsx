import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AdmitCardView, DatesheetView, ReportCardView } from "./ExamDocumentViews";
import {
  AdmitCardData,
  DatesheetData,
  OutcomeSubject,
  PrintMeta,
  ReportCardData,
} from "@/lib/examDocuments";

const meta: PrintMeta = {
  documentType: "DATESHEET",
  generatedAt: "2026-10-24T10:00:00.000Z",
  institution: {
    id: "inst-1",
    name: "Greenfield School",
    logoUrl: "https://cdn.test/logo.png",
    branding: { primaryColorLight: "#123456" },
  },
  campus: { id: "campus-1", name: "North Campus" },
};

const exam = { id: "exam-1", name: "First Term", examType: "REGULAR", className: "Grade 5", termName: "Term 1", academicYearName: "2026-27" };

const paper = (id: string, name: string, examDate: string | null) => ({
  examSubjectId: id,
  subjectName: name,
  maxMarks: 100,
  passingMarks: 40,
  examDate,
  startTime: examDate ? "09:00" : null,
  endTime: examDate ? "11:00" : null,
  room: examDate ? "A-1" : null,
});

describe("DatesheetView", () => {
  it("shows the institution, campus, exam and each paper's time and room", () => {
    const data: DatesheetData = { exam, papers: [paper("p1", "Maths", "2026-12-02T00:00:00.000Z")], printMeta: meta };
    render(<DatesheetView data={data} />);

    expect(screen.getByText("Greenfield School")).toBeInTheDocument();
    expect(screen.getByText("North Campus")).toBeInTheDocument();
    expect(screen.getByAltText("Greenfield School logo")).toHaveAttribute("src", "https://cdn.test/logo.png");
    expect(screen.getByText("Datesheet")).toBeInTheDocument();
    expect(screen.getByText("Grade 5 · Term 1 · 2026-27")).toBeInTheDocument();
    const row = screen.getByText("Maths").closest("tr")!;
    expect(within(row).getByText("9:00 AM - 11:00 AM")).toBeInTheDocument();
    expect(within(row).getByText("A-1")).toBeInTheDocument();
  });

  it("marks an unscheduled paper to be announced", () => {
    render(<DatesheetView data={{ exam, papers: [paper("p1", "Art", null)], printMeta: meta }} />);

    expect(screen.getByText("To be announced")).toBeInTheDocument();
  });

  it("says so when there are no papers", () => {
    render(<DatesheetView data={{ exam, papers: [], printMeta: meta }} />);

    expect(screen.getByText(/No papers have been added/)).toBeInTheDocument();
  });

  it("omits the logo when the institution has none", () => {
    const noLogo = { ...meta, institution: { ...meta.institution, logoUrl: null } };
    render(<DatesheetView data={{ exam, papers: [], printMeta: noLogo }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("AdmitCardView", () => {
  const card: AdmitCardData = {
    student: { id: "s-1", name: "Ayesha", regNo: "R-1", picture: null, className: "Grade 5", sectionName: "A" },
    exam,
    papers: [paper("p1", "Maths", "2026-12-02T00:00:00.000Z")],
  };

  it("shows the student, their section and the schedule", () => {
    render(<AdmitCardView card={card} meta={meta} />);

    expect(screen.getByText("Admit card")).toBeInTheDocument();
    expect(screen.getByText("Ayesha")).toBeInTheDocument();
    expect(screen.getByText("Registration no. R-1")).toBeInTheDocument();
    expect(screen.getByText("Grade 5, Section A")).toBeInTheDocument();
    expect(screen.getByText("Maths")).toBeInTheDocument();
  });

  it("shows only the class when the student has no section", () => {
    render(<AdmitCardView card={{ ...card, student: { ...card.student, sectionName: null } }} meta={meta} />);

    expect(screen.getByText("Grade 5")).toBeInTheDocument();
  });
});

describe("ReportCardView", () => {
  const subject = (overrides: Partial<OutcomeSubject>): OutcomeSubject => ({
    examSubjectId: "p1",
    subjectId: "s1",
    subjectName: "Maths",
    maxMarks: 100,
    passingMarks: 40,
    marksObtained: 60,
    state: "MARKED",
    percentage: 60,
    grade: "B",
    passed: true,
    ...overrides,
  });

  const card = (overrides: Partial<ReportCardData> = {}): ReportCardData => ({
    student: { id: "s-1", name: "Bilal", regNo: "R-2", picture: null, className: "Grade 5", sectionName: "A" },
    academicYear: { name: "2026-27" },
    passPolicy: "PER_SUBJECT",
    terms: [
      {
        term: { id: "t1", name: "Term 1", weight: 1 },
        exam: { id: "e1", name: "First Term" },
        outcome: {
          subjects: [
            subject({ isRetake: true, retakeExamType: "RETAKE", originalMarksObtained: 30, originalGrade: "F" }),
            subject({ examSubjectId: "p2", subjectId: "s2", subjectName: "Science", state: "ABSENT", marksObtained: null, percentage: null, grade: null, passed: null }),
          ],
          totalMarks: 60,
          totalMaxMarks: 100,
          percentage: 60,
          grade: "B",
          subjectsAppeared: 1,
          subjectsTotal: 2,
          status: "PASS",
          isOverallPass: true,
        },
        positionInClass: 3,
        classSize: 30,
        positionInSection: 1,
        sectionSize: 12,
      },
    ],
    annual: {
      percentage: 66.67,
      grade: "B",
      isOverallPass: true,
      status: "PASS",
      subjects: [{ subjectId: "s1", subjectName: "Maths", percentage: 66.67, passingPercentage: 40 }],
    },
    ...overrides,
  });

  it("shows the student, each term's marks, totals and positions", () => {
    render(<ReportCardView card={card()} meta={meta} />);

    expect(screen.getByText("Report card")).toBeInTheDocument();
    expect(screen.getByText(/Reg\. no\. R-2 · Grade 5, Section A · 2026-27/)).toBeInTheDocument();
    expect(screen.getByText("Term 1 · First Term")).toBeInTheDocument();
    expect(
      screen.getByText("Result: Pass · Class position: 3rd of 30 · Section position: 1st of 12"),
    ).toBeInTheDocument();
  });

  it("keeps a retake's original mark visible and shows an absence as absent", () => {
    render(<ReportCardView card={card()} meta={meta} />);

    expect(screen.getByText("Counted from the retake; original 30 (F)")).toBeInTheDocument();
    expect(within(screen.getByText("Science").closest("tr")!).getByText("Absent")).toBeInTheDocument();
  });

  it("shows the annual result with each subject's yearly percentage", () => {
    render(<ReportCardView card={card()} meta={meta} />);

    expect(screen.getByText("Annual result")).toBeInTheDocument();
    expect(screen.getByText("Overall 66.67% · Grade B · Pass")).toBeInTheDocument();
    expect(screen.getByText("Maths 66.67%")).toBeInTheDocument();
  });

  it("says nothing is published yet, and omits the annual block, for a card with no terms", () => {
    render(<ReportCardView card={card({ terms: [], annual: null })} meta={meta} />);

    expect(screen.getByText(/No results have been published for this year yet/)).toBeInTheDocument();
    expect(screen.queryByText("Annual result")).not.toBeInTheDocument();
  });
});
