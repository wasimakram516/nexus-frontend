import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ExamPapersDialog, { ClassSubject, ExamPaper, ExamPaperExam } from "./ExamPapersDialog";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  showMessage: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({
  default: { get: mocks.get, post: mocks.post, patch: mocks.patch, delete: mocks.delete },
}));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const subjects: ClassSubject[] = [
  { id: "maths", name: "Maths", classId: "class-1" },
  { id: "science", name: "Science", classId: "class-1" },
  { id: "urdu", name: "Urdu", classId: "class-1" },
  { id: "elsewhere", name: "Elsewhere", classId: "class-2" },
];

const draft: ExamPaperExam = { id: "exam-1", name: "First Term", classId: "class-1", status: "DRAFT", unlockedForEditing: false };

let papers: ExamPaper[];

function renderDialog(overrides: Partial<{ exam: ExamPaperExam; canCreate: boolean; canUpdate: boolean; canDelete: boolean }> = {}) {
  const onClose = vi.fn();
  render(
    <ExamPapersDialog
      exam={overrides.exam ?? draft}
      subjects={subjects}
      canCreate={overrides.canCreate ?? true}
      canUpdate={overrides.canUpdate ?? true}
      canDelete={overrides.canDelete ?? true}
      onClose={onClose}
    />,
  );
  return onClose;
}

async function submitCreate() {
  const button = screen.getByRole("button", { name: "Create" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

beforeEach(() => {
  vi.clearAllMocks();
  papers = [
    {
      id: "paper-1",
      subjectId: "maths",
      maxMarks: "100.00",
      passingMarks: "40.00",
      examDate: "2026-12-01T00:00:00.000Z",
      startTime: "09:00",
      endTime: "11:00",
      room: "A-1",
      subject: { id: "maths", name: "Maths" },
    },
  ];
  mocks.get.mockImplementation(async (url: string) => ({
    data: { data: url === "/examinations/exam-subjects" ? papers : [] },
  }));
  mocks.post.mockResolvedValue({ data: { data: {}, message: "ok" } });
  mocks.patch.mockResolvedValue({ data: { data: {}, message: "ok" } });
  mocks.delete.mockResolvedValue({ data: { data: {}, message: "ok" } });
});

const rowOf = async (text: string) => (await screen.findByText(text)).closest("tr")!;

describe("ExamPapersDialog", () => {
  it("loads the papers of the opened exam and shows marks, date, time and room", async () => {
    renderDialog();

    const row = await rowOf("Maths");
    expect(within(row).getByText("100")).toBeInTheDocument();
    expect(within(row).getByText("40")).toBeInTheDocument();
    expect(within(row).getByText("09:00–11:00")).toBeInTheDocument();
    expect(within(row).getByText("A-1")).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith("/examinations/exam-subjects", { params: { examId: "exam-1" } });
  });

  it("shows an unscheduled paper as not scheduled", async () => {
    papers = [{ ...papers[0], examDate: null, startTime: null, endTime: null, room: null }];
    renderDialog();

    const row = await rowOf("Maths");
    expect(within(row).getByText("Not scheduled")).toBeInTheDocument();
  });

  it("offers only this class's subjects that are not already papers", async () => {
    renderDialog();

    fireEvent.click((await screen.findAllByRole("button", { name: /Add Paper/ }))[0]);
    fireEvent.mouseDown(screen.getByLabelText(/^Subject/));

    expect(screen.getByRole("option", { name: "Science" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Urdu" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Maths" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
  });

  it("adds a paper to the exam with the entered marks and schedule", async () => {
    renderDialog();

    fireEvent.click((await screen.findAllByRole("button", { name: /Add Paper/ }))[0]);
    fireEvent.mouseDown(screen.getByLabelText(/^Subject/));
    fireEvent.click(screen.getByRole("option", { name: "Science" }));
    fireEvent.change(screen.getByLabelText(/Maximum marks/), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText(/Passing marks/), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: "2026-12-05" } });
    fireEvent.change(screen.getByLabelText(/Room/), { target: { value: "B-2" } });
    await submitCreate();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/examinations/exam-subjects", {
        subjectId: "science",
        maxMarks: 50,
        passingMarks: 20,
        examDate: "2026-12-05",
        room: "B-2",
        customFields: {},
        examId: "exam-1",
      }),
    );
  });

  it("removes a paper after confirmation", async () => {
    renderDialog();

    fireEvent.click(within(await rowOf("Maths")).getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete", hidden: false }));

    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith("/examinations/exam-subjects/paper-1"));
  });

  it("hides adding and removing once the exam is published, and explains the marks lock", async () => {
    renderDialog({ exam: { ...draft, status: "PUBLISHED" } });

    const row = await rowOf("Maths");
    expect(screen.queryByRole("button", { name: /Add Paper/ })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(within(row).getByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByText(/marks are locked until an admin unlocks the exam/i)).toBeInTheDocument();
  });

  it("explains that marks can change once a published exam is unlocked", async () => {
    renderDialog({ exam: { ...draft, status: "PUBLISHED", unlockedForEditing: true } });

    await rowOf("Maths");
    expect(screen.getByText(/exam is unlocked: marks, dates and rooms can change/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Paper/ })).not.toBeInTheDocument();
  });

  it("edits a paper's room through the update route, without changing the subject", async () => {
    renderDialog();

    fireEvent.click(within(await rowOf("Maths")).getByRole("button", { name: /Edit/ }));
    fireEvent.change(screen.getByLabelText(/Room/), { target: { value: "C-3" } });
    const save = screen.getByRole("button", { name: "Save Changes" });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);

    await waitFor(() =>
      expect(mocks.patch).toHaveBeenCalledWith(
        "/examinations/exam-subjects/paper-1",
        expect.objectContaining({ room: "C-3", maxMarks: 100, passingMarks: 40 }),
      ),
    );
    expect(mocks.patch.mock.calls[0][1]).not.toHaveProperty("subjectId");
  });

  it("hides every action from a read-only user", async () => {
    renderDialog({ canCreate: false, canUpdate: false, canDelete: false });

    const row = await rowOf("Maths");
    expect(screen.queryByRole("button", { name: /Add Paper/ })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("explains an empty class with no subjects", async () => {
    papers = [];
    render(
      <ExamPapersDialog exam={draft} subjects={[]} canCreate canUpdate canDelete onClose={vi.fn()} />,
    );

    expect(await screen.findByText(/has no subjects to add/i)).toBeInTheDocument();
  });
});
