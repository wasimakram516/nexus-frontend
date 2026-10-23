import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MarksEntryDialog, { ClassSection, MarksExam, MarksPaper } from "./MarksEntryDialog";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const paper: MarksPaper = { id: "paper-1", subjectName: "Maths", maxMarks: 100, passingMarks: 40 };
const draft: MarksExam = { name: "First Term", classId: "class-1", status: "DRAFT", unlockedForEditing: false };
const sections: ClassSection[] = [
  { id: "sec-a", name: "A", classId: "class-1" },
  { id: "sec-b", name: "B", classId: "class-1" },
  { id: "sec-x", name: "Elsewhere", classId: "class-9" },
];

let locked: boolean;
let students: Array<Record<string, unknown>>;

function renderDialog(overrides: Partial<{ exam: MarksExam; canEdit: boolean; sections: ClassSection[] }> = {}) {
  render(
    <MarksEntryDialog
      paper={paper}
      exam={overrides.exam ?? draft}
      sections={overrides.sections ?? sections}
      canEdit={overrides.canEdit ?? true}
      onClose={vi.fn()}
    />,
  );
}

const student = (id: string, name: string, result: Record<string, unknown> | null = null) => ({
  studentId: id,
  name,
  regNo: `R-${id}`,
  result,
});

beforeEach(() => {
  vi.clearAllMocks();
  locked = false;
  students = [
    student("s-1", "Ayesha", { id: "r1", marksObtained: 80, isAbsent: false, remarks: "Great" }),
    student("s-2", "Bilal"),
    student("s-3", "Sara", { id: "r3", marksObtained: null, isAbsent: true, remarks: null }),
  ];
  mocks.get.mockImplementation(async () => ({
    data: { data: { maxMarks: 100, passingMarks: 40, locked, students } },
  }));
  mocks.post.mockResolvedValue({ data: { data: { saved: 1, unchanged: 2 }, message: "ok" } });
});

const marksInput = (name: string) => screen.getByLabelText(`Marks for ${name}`) as HTMLInputElement;

describe("MarksEntryDialog", () => {
  it("opens on the first section of the exam's class and lists its students with their saved marks", async () => {
    renderDialog();

    expect(await screen.findByText("Ayesha")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/exam-subjects/paper-1/results", { params: { sectionId: "sec-a" } });
    expect(marksInput("Ayesha").value).toBe("80");
    expect(marksInput("Bilal").value).toBe("");
    expect(screen.getByLabelText("Absent: Sara")).toBeChecked();
    expect(marksInput("Sara")).toBeDisabled();
    expect(screen.getByLabelText("Remarks for Ayesha")).toHaveValue("Great");
  });

  it("offers only sections of this class", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    fireEvent.mouseDown(screen.getByLabelText("Section"));

    expect(screen.getByRole("option", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "B" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
  });

  it("reloads the grid when another section is chosen", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    fireEvent.mouseDown(screen.getByLabelText("Section"));
    fireEvent.click(screen.getByRole("option", { name: "B" }));

    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith("/examinations/exam-subjects/paper-1/results", { params: { sectionId: "sec-b" } }),
    );
  });

  it("saves only the rows that changed", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    fireEvent.change(marksInput("Bilal"), { target: { value: "65.5" } });
    fireEvent.change(screen.getByLabelText("Remarks for Bilal"), { target: { value: "Improving" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Marks" }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/examinations/exam-subjects/paper-1/results/bulk", {
        sectionId: "sec-a",
        entries: [{ studentId: "s-2", isAbsent: false, marksObtained: 65.5, remarks: "Improving" }],
      }),
    );
  });

  it("clears the marks when a student is ticked absent, and sends the absence", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    fireEvent.click(screen.getByLabelText("Absent: Ayesha"));
    expect(marksInput("Ayesha").value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Save Marks" }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/examinations/exam-subjects/paper-1/results/bulk",
        { sectionId: "sec-a", entries: [{ studentId: "s-1", isAbsent: true, marksObtained: null, remarks: "Great" }] },
      ),
    );
  });

  it("shows an error and does not save marks above the maximum", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    fireEvent.change(marksInput("Bilal"), { target: { value: "150" } });

    expect(await screen.findByText("Cannot be more than 100.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Marks" }));
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("cannot save before anything changes", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    expect(screen.getByRole("button", { name: "Save Marks" })).toBeDisabled();
  });

  it("flags students below the passing marks and counts them", async () => {
    renderDialog();
    await screen.findByText("Ayesha");

    fireEvent.change(marksInput("Bilal"), { target: { value: "30" } });

    expect(await screen.findByText("Below passing")).toBeInTheDocument();
    expect(screen.getByText("1 below passing")).toBeInTheDocument();
    expect(screen.getByText("3 of 3 recorded")).toBeInTheDocument();
    expect(screen.getByText("1 unsaved")).toBeInTheDocument();
  });

  it("is read-only and explains why while the exam is published and locked", async () => {
    locked = true;
    renderDialog({ exam: { ...draft, status: "PUBLISHED" } });

    expect(await screen.findByText(/published and locked/i)).toBeInTheDocument();
    expect(marksInput("Ayesha")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save Marks" })).not.toBeInTheDocument();
  });

  it("is read-only for someone without permission to edit marks", async () => {
    renderDialog({ canEdit: false });

    expect(await screen.findByText(/view these marks but not change them/i)).toBeInTheDocument();
    expect(marksInput("Bilal")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save Marks" })).not.toBeInTheDocument();
  });

  it("tells the user when the class has no sections", async () => {
    renderDialog({ sections: [] });

    expect(await screen.findByText(/no sections yet/i)).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("explains an empty section", async () => {
    students = [];
    renderDialog();

    expect(await screen.findByText(/No students are enrolled in this section/)).toBeInTheDocument();
  });
});
