import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MyExamsManager from "./MyExamsManager";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const exam = (overrides: Record<string, unknown>) => ({
  id: "exam-1",
  name: "First Term",
  academicYearId: "year-1",
  examTermName: "Term 1",
  examType: "REGULAR",
  originalExamId: null,
  resultsPublished: false,
  studentId: "s-ayesha",
  studentName: "Ayesha",
  datesheet: [
    { subjectName: "Maths", examDate: "2026-12-02T00:00:00.000Z", startTime: "09:00", endTime: "11:00", room: "A-1" },
    { subjectName: "Art", examDate: null, startTime: null, endTime: null, room: null },
  ],
  ...overrides,
});

let exams: Array<Record<string, unknown>>;

beforeEach(() => {
  vi.clearAllMocks();
  exams = [exam({})];
  mocks.get.mockImplementation(async (url: string) => {
    if (url === "/examinations/exams/for-me") return { data: { data: exams } };
    if (url.endsWith("/result-summary")) {
      return {
        data: {
          data: {
            exam: { name: "First Term" },
            result: {
              name: "Ayesha",
              outcome: {
                subjects: [
                  {
                    examSubjectId: "p1",
                    subjectId: "s1",
                    subjectName: "Maths",
                    maxMarks: 100,
                    passingMarks: 40,
                    marksObtained: 35,
                    state: "MARKED",
                    percentage: 35,
                    grade: "F",
                    passed: false,
                  },
                ],
                totalMarks: 35,
                totalMaxMarks: 100,
                percentage: 35,
                grade: "F",
                subjectsAppeared: 1,
                subjectsTotal: 1,
                status: "FAIL",
                isOverallPass: false,
              },
              positionInClass: 4,
              classSize: 20,
              positionInSection: 2,
              sectionSize: 8,
            },
          },
        },
      };
    }
    return { data: { data: null } };
  });
});

describe("MyExamsManager", () => {
  it("lists each exam with its datesheet, and papers without a date as to be announced", async () => {
    render(<MyExamsManager />);

    expect(await screen.findByText("First Term")).toBeInTheDocument();
    const maths = screen.getByText("Maths").closest("tr")!;
    expect(within(maths).getByText("09:00 – 11:00")).toBeInTheDocument();
    expect(within(screen.getByText("Art").closest("tr")!).getByText("To be announced")).toBeInTheDocument();
  });

  it("offers the admit card before results, and no result or report card yet", async () => {
    render(<MyExamsManager />);
    await screen.findByText("First Term");

    expect(screen.getByRole("button", { name: "Admit card" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View result" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Report card" })).not.toBeInTheDocument();
    expect(screen.queryByText("Results published")).not.toBeInTheDocument();
  });

  it("offers the result and report card once results are published", async () => {
    exams = [exam({ resultsPublished: true })];
    render(<MyExamsManager />);
    await screen.findByText("First Term");

    expect(screen.getByText("Results published")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View result" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Report card" })).toBeInTheDocument();
  });

  it("shows no report card for a published retake, but tags it", async () => {
    exams = [exam({ resultsPublished: true, examType: "RETAKE", originalExamId: "exam-0" })];
    render(<MyExamsManager />);
    await screen.findByText("First Term");

    expect(screen.getByText("Retake")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Report card" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View result" })).toBeInTheDocument();
  });

  it("shows the result of the exam with marks, status and positions", async () => {
    exams = [exam({ resultsPublished: true })];
    render(<MyExamsManager />);
    await screen.findByText("First Term");

    fireEvent.click(screen.getByRole("button", { name: "View result" }));

    expect(await screen.findByText("Result: First Term")).toBeInTheDocument();
    expect(screen.getByText("Fail")).toBeInTheDocument();
    expect(screen.getByText("Class position 4th of 20")).toBeInTheDocument();
    expect(screen.getByText("Section position 2nd of 8")).toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/students/s-ayesha/result-summary"),
    );
  });

  it("groups a guardian's children, each with their own exams", async () => {
    exams = [exam({}), exam({ studentId: "s-sara", studentName: "Sara", id: "exam-2", name: "Second Term" })];
    render(<MyExamsManager />);

    expect(await screen.findByText("Ayesha")).toBeInTheDocument();
    expect(screen.getByText("Sara")).toBeInTheDocument();
    expect(screen.getByText("Second Term")).toBeInTheDocument();
  });

  it("opens the admit card for the right child", async () => {
    render(<MyExamsManager />);
    await screen.findByText("First Term");

    fireEvent.click(screen.getByRole("button", { name: "Admit card" }));

    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/students/s-ayesha/admit-card"),
    );
  });

  it("says so when there are no exams", async () => {
    exams = [];
    render(<MyExamsManager />);

    expect(await screen.findByText("There are no exams to show yet.")).toBeInTheDocument();
  });

  it("says so, instead of crashing, when the server returns an unexpected shape", async () => {
    mocks.get.mockResolvedValue({ data: { data: { unexpected: true } } });
    render(<MyExamsManager />);

    expect(await screen.findByText("There are no exams to show yet.")).toBeInTheDocument();
  });
});
