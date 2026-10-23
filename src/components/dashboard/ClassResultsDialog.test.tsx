import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ClassResultsDialog, { ResultsExam } from "./ClassResultsDialog";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const published: ResultsExam = { id: "exam-1", name: "First Term", classId: "class-1", status: "PUBLISHED" };
const sections = [
  { id: "sec-a", name: "A", classId: "class-1" },
  { id: "sec-x", name: "Elsewhere", classId: "class-9" },
];

const subject = (marks: number | null, state: "MARKED" | "ABSENT" | "UNMARKED", passed: boolean | null) => ({
  examSubjectId: "p1",
  subjectId: "s1",
  subjectName: "Maths",
  maxMarks: 100,
  passingMarks: 40,
  marksObtained: marks,
  state,
  percentage: marks,
  grade: null,
  passed,
});

const row = (name: string, status: string, percentage: number | null, subj: ReturnType<typeof subject>, position: number | null) => ({
  studentId: name,
  name,
  regNo: `R-${name}`,
  sectionName: "A",
  outcome: {
    subjects: [subj],
    totalMarks: subj.marksObtained ?? 0,
    totalMaxMarks: 100,
    percentage,
    grade: percentage === null ? null : "B",
    subjectsAppeared: 1,
    subjectsTotal: 1,
    status,
    isOverallPass: null,
  },
  positionInClass: position,
  classSize: 3,
  positionInSection: position,
  sectionSize: 2,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({
    data: {
      data: {
        exam: { passPolicy: "AGGREGATE" },
        papers: [{ examSubjectId: "p1", subjectName: "Maths", maxMarks: 100 }],
        students: [
          row("Ayesha", "PASS", 90, subject(90, "MARKED", true), 1),
          row("Bilal", "FAIL", 30, subject(30, "MARKED", false), 2),
          row("Sara", "ABSENT", null, subject(null, "ABSENT", null), null),
        ],
        summary: { total: 3, pass: 1, fail: 1, incomplete: 0, absent: 1, averagePercentage: 60 },
      },
    },
  });
});

describe("ClassResultsDialog", () => {
  it("shows each student's marks, total, status and positions", async () => {
    render(<ClassResultsDialog exam={published} sections={sections} onClose={vi.fn()} />);

    const ayesha = (await screen.findByText("Ayesha")).closest("tr")!;
    expect(within(ayesha).getByText("90/100")).toBeInTheDocument();
    expect(within(ayesha).getByText("Pass")).toBeInTheDocument();
    expect(within(ayesha).getAllByText("1st of 3").length).toBeGreaterThan(0);
    const sara = screen.getByText("Sara").closest("tr")!;
    expect(within(sara).getByText("Absent", { selector: "td" })).toBeInTheDocument();
    expect(within(sara).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows the class tally, the average and the pass rule in plain words", async () => {
    render(<ClassResultsDialog exam={published} sections={sections} onClose={vi.fn()} />);

    expect(await screen.findByText("3 students")).toBeInTheDocument();
    expect(screen.getByText("1 pass")).toBeInTheDocument();
    expect(screen.getByText("1 fail")).toBeInTheDocument();
    expect(screen.getByText("1 absent")).toBeInTheDocument();
    expect(screen.getByText("Average 60%")).toBeInTheDocument();
    expect(screen.getByText("Pass rule: Pass on overall percentage.")).toBeInTheDocument();
  });

  it("warns that a draft exam is not visible to families", async () => {
    render(<ClassResultsDialog exam={{ ...published, status: "DRAFT" }} sections={sections} onClose={vi.fn()} />);

    expect(await screen.findByText(/cannot see these results until it is published/i)).toBeInTheDocument();
  });

  it("offers this class's sections and reloads for the chosen one", async () => {
    render(<ClassResultsDialog exam={published} sections={sections} onClose={vi.fn()} />);
    await screen.findByText("Ayesha");

    fireEvent.mouseDown(screen.getByLabelText("Section"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "A" }));

    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith("/examinations/exams/exam-1/class-result-summary", { params: { sectionId: "sec-a" } }),
    );
  });

  it("says so when there is nothing to show", async () => {
    mocks.get.mockResolvedValue({
      data: { data: { exam: { passPolicy: "PER_SUBJECT" }, papers: [], students: [], summary: { total: 0, pass: 0, fail: 0, incomplete: 0, absent: 0, averagePercentage: null } } },
    });
    render(<ClassResultsDialog exam={published} sections={sections} onClose={vi.fn()} />);

    expect(await screen.findByText("No results to show yet.")).toBeInTheDocument();
  });

  it("shows nothing to show, instead of crashing, when the server returns an unexpected shape", async () => {
    mocks.get.mockResolvedValue({ data: { data: [] } });
    render(<ClassResultsDialog exam={published} sections={sections} onClose={vi.fn()} />);

    expect(await screen.findByText("No results to show yet.")).toBeInTheDocument();
  });

  it("flags students still awaiting marks", async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: {
          exam: { passPolicy: "PER_SUBJECT" },
          papers: [{ examSubjectId: "p1", subjectName: "Maths", maxMarks: 100 }],
          students: [row("Omar", "INCOMPLETE", null, subject(null, "UNMARKED", null), null)],
          summary: { total: 1, pass: 0, fail: 0, incomplete: 1, absent: 0, averagePercentage: null },
        },
      },
    });
    render(<ClassResultsDialog exam={published} sections={sections} onClose={vi.fn()} />);

    expect(await screen.findByText("1 awaiting marks")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
