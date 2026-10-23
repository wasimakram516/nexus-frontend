import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExamDocumentDialog, { DocumentExamRef, ExamDocumentKind } from "./ExamDocumentDialog";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const printMeta = {
  documentType: "X",
  generatedAt: "2026-10-24T10:00:00.000Z",
  institution: { id: "i", name: "Greenfield School", logoUrl: null, branding: { primaryColorLight: null } },
  campus: null,
};
const exam: DocumentExamRef = { id: "exam-1", name: "First Term", classId: "class-1", academicYearId: "year-1" };
const sections = [
  { id: "sec-a", name: "A", classId: "class-1" },
  { id: "sec-x", name: "Elsewhere", classId: "class-9" },
];
const examInfo = { id: "exam-1", name: "First Term", examType: "REGULAR", className: "Grade 5", termName: "Term 1", academicYearName: "2026-27" };
const student = (name: string) => ({ id: name, name, regNo: `R-${name}`, picture: null, className: "Grade 5", sectionName: "A" });
const card = (name: string) => ({ student: student(name), exam: examInfo, papers: [] });

function renderDialog(kind: ExamDocumentKind, studentId?: string) {
  render(<ExamDocumentDialog kind={kind} exam={exam} studentId={studentId} sections={sections} onClose={vi.fn()} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockImplementation(async (url: string) => {
    if (url.endsWith("/datesheet")) return { data: { data: { exam: examInfo, papers: [], printMeta } } };
    if (url.endsWith("/admit-cards")) return { data: { data: { cards: [card("Ayesha"), card("Bilal")], printMeta } } };
    if (url.includes("/admit-card")) return { data: { data: { ...card("Ayesha"), printMeta } } };
    if (url.endsWith("/report-cards")) {
      return { data: { data: { cards: [{ student: student("Ayesha"), academicYear: { name: "2026-27" }, passPolicy: "PER_SUBJECT", terms: [], annual: null }], printMeta } } };
    }
    if (url.endsWith("/report-card")) {
      return { data: { data: { student: student("Sara"), academicYear: { name: "2026-27" }, passPolicy: "PER_SUBJECT", terms: [], annual: null, printMeta } } };
    }
    return { data: { data: null } };
  });
});

describe("ExamDocumentDialog", () => {
  it("loads and previews the datesheet", async () => {
    renderDialog("datesheet");

    expect(await screen.findByText("Datesheet: First Term")).toBeInTheDocument();
    expect(await screen.findByText("Greenfield School")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/datesheet");
  });

  it("loads admit cards for every section, one card per student", async () => {
    renderDialog("admit-cards");

    expect(await screen.findByText("Ayesha")).toBeInTheDocument();
    expect(screen.getByText("Bilal")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/admit-cards", { params: { sectionId: undefined } });
  });

  it("offers only sections of the exam's class and reloads for the one chosen", async () => {
    renderDialog("admit-cards");
    await screen.findByText("Ayesha");

    fireEvent.mouseDown(screen.getByLabelText("Section"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "A" }));

    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/admit-cards", { params: { sectionId: "sec-a" } }),
    );
  });

  it("loads report cards for the class and year", async () => {
    renderDialog("report-cards");

    expect(await screen.findByText("Report card")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/academic-years/year-1/report-cards", {
      params: { classId: "class-1", sectionId: undefined },
    });
  });

  it("loads one student's own admit card and report card without a section picker", async () => {
    renderDialog("admit-card", "s-ayesha");
    expect(await screen.findByText("Ayesha")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/students/s-ayesha/admit-card");
    expect(screen.queryByLabelText("Section")).not.toBeInTheDocument();
  });

  it("loads a student's report card for the exam's academic year", async () => {
    renderDialog("report-card", "s-sara");

    expect(await screen.findByText("Sara")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/students/s-sara/academic-years/year-1/report-card");
  });

  it("explains an empty selection", async () => {
    mocks.get.mockImplementation(async () => ({ data: { data: { cards: [], printMeta } } }));
    renderDialog("admit-cards");

    expect(await screen.findByText(/No students are enrolled for this selection/)).toBeInTheDocument();
  });

  it("shows an error and disables printing when the document cannot be loaded", async () => {
    mocks.get.mockRejectedValue({ response: { data: { message: "Nope" } }, message: "Nope" });
    renderDialog("datesheet");

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be loaded/i);
    expect(screen.getByRole("button", { name: /Print/ })).toBeDisabled();
  });

  it("shows an error instead of crashing when the server returns an unexpected shape", async () => {
    mocks.get.mockResolvedValue({ data: { data: [] } });
    renderDialog("datesheet");

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be loaded/i);
  });

  it("prints the sheet when Print is pressed", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderDialog("datesheet");
    await screen.findByText("Greenfield School");

    fireEvent.click(screen.getByRole("button", { name: /Print/ }));

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});
