import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ExaminationsManager from "./ExaminationsManager";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  showMessage: vi.fn(),
  runtime: null as null | { can: (feature: string, action: string) => boolean },
}));

vi.mock("@/lib/axios", () => ({
  default: { get: mocks.get, post: mocks.post, patch: mocks.patch, delete: mocks.delete },
}));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => mocks.runtime }));

const exam = (overrides: Record<string, unknown>) => ({
  id: "exam-1",
  name: "First Term Exam",
  classId: "class-1",
  campusId: "campus-1",
  examTermId: "term-1",
  gradingScaleId: "scale-1",
  status: "DRAFT",
  examType: "REGULAR",
  originalExamId: null,
  unlockedForEditing: false,
  createdAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

let exams: Array<Record<string, unknown>>;
let scalesData: Array<Record<string, unknown>>;
let termsData: Array<Record<string, unknown>>;

function serve(url: string): unknown {
  if (url.endsWith("/grading-scales")) return scalesData;
  if (url.endsWith("/exam-terms")) return termsData;
  if (url === "/examinations/exams") return exams;
  if (url.endsWith("/academic-years")) {
    return [{ id: "year-1", name: "2026-27" }, { id: "year-9", name: "2025-26" }];
  }
  if (url === "/campuses") {
    return {
      items: [
        { id: "campus-1", name: "Main", institutionId: "inst-1" },
        { id: "campus-2", name: "Other", institutionId: "inst-2" },
      ],
    };
  }
  if (url === "/academics/levels") {
    return [{ id: "level-1", name: "Primary", campusId: "campus-1" }, { id: "level-2", name: "Primary", campusId: "campus-2" }];
  }
  if (url === "/academics/classes") {
    return [{ id: "class-1", name: "Grade 1", levelId: "level-1" }, { id: "class-2", name: "Grade 9", levelId: "level-2" }];
  }
  return [];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.runtime = null;
  exams = [exam({})];
  scalesData = [{ id: "scale-1", name: "Standard", isCurrent: true, bands: [{ id: "b", grade: "P", minPercentage: "0", maxPercentage: "100" }] }];
  termsData = [
    { id: "term-1", name: "First Term", academicYearId: "year-1", weight: "1.00", sortOrder: 0, startDate: null, endDate: null },
    { id: "term-2", name: "Final Term", academicYearId: "year-1", weight: "1.00", sortOrder: 1, startDate: null, endDate: null },
    { id: "term-9", name: "Other Year Term", academicYearId: "year-9", weight: "1.00", sortOrder: 0, startDate: null, endDate: null },
  ];
  mocks.get.mockImplementation(async (url: string) => ({ data: { data: serve(url) } }));
  mocks.post.mockResolvedValue({ data: { data: {}, message: "ok" } });
  mocks.patch.mockResolvedValue({ data: { data: {}, message: "ok" } });
  mocks.delete.mockResolvedValue({ data: { data: {}, message: "ok" } });
});

/** Waits for the dialog's custom field definitions to finish loading, then submits. */
async function submitCreate() {
  const button = screen.getByRole("button", { name: "Create" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

/** Waits for the dialog to be ready, then saves an edit. */
async function submitSave() {
  const button = screen.getByRole("button", { name: "Save Changes" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

const rowOf = async (name: string) => (await screen.findByText(name)).closest("tr")!;

describe("ExaminationsManager tabs", () => {
  it("lists the tabs in setup order", async () => {
    render(<ExaminationsManager />);

    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Grading Scales", "Terms", "Exams"]);
  });

  it("opens on Exams once grading scales and terms exist", async () => {
    render(<ExaminationsManager />);

    expect(await screen.findByRole("tab", { name: "Exams", selected: true })).toBeInTheDocument();
  });

  it("opens on Grading Scales when none exist yet", async () => {
    scalesData = [];
    termsData = [];
    render(<ExaminationsManager />);

    expect(await screen.findByRole("tab", { name: "Grading Scales", selected: true })).toBeInTheDocument();
  });

  it("opens on Terms when there is a grading scale but no term", async () => {
    termsData = [];
    render(<ExaminationsManager />);

    expect(await screen.findByRole("tab", { name: "Terms", selected: true })).toBeInTheDocument();
  });

  it("points to Enter marks on the Exams tab", async () => {
    render(<ExaminationsManager />);

    expect(await screen.findByText(/use Enter marks to record scores/i)).toBeInTheDocument();
  });

  it("keeps the tab the user chose when the data reloads", async () => {
    render(<ExaminationsManager />);

    fireEvent.click(await screen.findByRole("tab", { name: "Terms" }));
    fireEvent.click(within(await rowOf("First Term")).getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText(/Term Name/), { target: { value: "First Term v2" } });
    await submitSave();

    await waitFor(() => expect(mocks.patch).toHaveBeenCalled());
    expect(await screen.findByRole("tab", { name: "Terms", selected: true })).toBeInTheDocument();
  });
});

describe("ExaminationsManager exams", () => {
  it("lists exams with class, term, type, status and grading scale names", async () => {
    render(<ExaminationsManager />);

    const row = await rowOf("First Term Exam");
    expect(within(row).getByText("Grade 1")).toBeInTheDocument();
    expect(within(row).getByText("First Term")).toBeInTheDocument();
    expect(within(row).getByText("Regular")).toBeInTheDocument();
    expect(within(row).getByText("Draft")).toBeInTheDocument();
    expect(within(row).getByText("Standard")).toBeInTheDocument();
  });

  it("publishes a draft exam only after confirmation", async () => {
    render(<ExaminationsManager />);

    fireEvent.click(within(await rowOf("First Term Exam")).getByRole("button", { name: "Publish" }));
    expect(mocks.post).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Publish", hidden: false }));

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/examinations/exams/exam-1/publish"));
  });

  it("offers unlock on a published exam and lock again once it is unlocked", async () => {
    exams = [exam({ status: "PUBLISHED" })];
    const { unmount } = render(<ExaminationsManager />);

    const published = await rowOf("First Term Exam");
    expect(within(published).queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    fireEvent.click(within(published).getByRole("button", { name: "Unlock" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/examinations/exams/exam-1/unlock"));
    unmount();

    exams = [exam({ status: "PUBLISHED", unlockedForEditing: true })];
    render(<ExaminationsManager />);
    const unlocked = await rowOf("First Term Exam");
    expect(within(unlocked).getByText("Unlocked")).toBeInTheDocument();
    fireEvent.click(within(unlocked).getByRole("button", { name: "Relock" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/examinations/exams/exam-1/relock"));
  });

  it("creates a retake from a published exam, listing only terms of the same academic year", async () => {
    exams = [exam({ status: "PUBLISHED" })];
    render(<ExaminationsManager />);

    fireEvent.click(within(await rowOf("First Term Exam")).getByRole("button", { name: "Create retake" }));
    fireEvent.mouseDown(await screen.findByLabelText(/^Type/));
    fireEvent.click(screen.getByRole("option", { name: "Improvement" }));
    fireEvent.mouseDown(screen.getByLabelText(/^Term/));
    expect(screen.queryByRole("option", { name: /Other Year Term/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Final Term/ }));
    fireEvent.change(screen.getByLabelText(/Exam Name/), { target: { value: "Spring improvement" } });
    await submitCreate();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/examinations/exams/exam-1/retakes", {
        examType: "IMPROVEMENT",
        name: "Spring improvement",
        examTermId: "term-2",
      }),
    );
  });

  it("opens the papers of an exam from its row", async () => {
    render(<ExaminationsManager />);

    fireEvent.click(within(await rowOf("First Term Exam")).getByRole("button", { name: "Papers" }));

    expect(await screen.findByText("Papers for First Term Exam")).toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith("/examinations/exam-subjects", { params: { examId: "exam-1" } }),
    );
  });

  it("describes a retake by the exam it retakes", async () => {
    exams = [exam({}), exam({ id: "exam-2", name: "Retake", examType: "RETAKE", originalExamId: "exam-1", status: "PUBLISHED" })];
    render(<ExaminationsManager />);

    expect(within(await rowOf("Retake")).getByText("Retake of First Term Exam")).toBeInTheDocument();
  });

  it("creates an exam without a grading scale so the server uses the current one", async () => {
    render(<ExaminationsManager />);

    fireEvent.click((await screen.findAllByRole("button", { name: /Add Exam/ }))[0]);
    fireEvent.mouseDown(screen.getByLabelText(/^Class/));
    fireEvent.click(screen.getByRole("option", { name: "Grade 1" }));
    fireEvent.mouseDown(screen.getByLabelText(/^Term/));
    fireEvent.click(screen.getByRole("option", { name: /First Term/ }));
    fireEvent.change(screen.getByLabelText(/Exam Name/), { target: { value: "Mid Term" } });
    await submitCreate();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/examinations/exams", {
        classId: "class-1",
        examTermId: "term-1",
        name: "Mid Term",
        customFields: {},
      }),
    );
  });

  it("hides publish, unlock, retake and edit actions from a read-only user", async () => {
    mocks.runtime = { can: (_feature, action) => action === "read" };
    exams = [exam({ status: "PUBLISHED" })];
    render(<ExaminationsManager />);

    const row = await rowOf("First Term Exam");
    expect(within(row).queryByRole("button", { name: "Unlock" })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Create retake" })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Exam/ })).not.toBeInTheDocument();
  });
});

describe("ExaminationsManager terms and scales", () => {
  it("creates an exam term with the entered weight and academic year", async () => {
    render(<ExaminationsManager />);

    fireEvent.click(await screen.findByRole("tab", { name: "Terms" }));
    fireEvent.click((await screen.findAllByRole("button", { name: /Add Exam Term/ }))[0]);
    fireEvent.mouseDown(screen.getByLabelText(/Academic year/));
    fireEvent.click(screen.getByRole("option", { name: "2026-27" }));
    fireEvent.change(screen.getByLabelText(/Term Name/), { target: { value: "Quarter 1" } });
    fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "2" } });
    await submitCreate();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/examinations/exam-terms", {
        academicYearId: "year-1",
        name: "Quarter 1",
        weight: 2,
        customFields: {},
      }),
    );
  });

  it("shows the grading scale tab with the current scale", async () => {
    render(<ExaminationsManager />);

    fireEvent.click(await screen.findByRole("tab", { name: "Grading Scales" }));

    expect(within((await screen.findAllByText("Standard"))[0].closest("tr")!).getByText("Current")).toBeInTheDocument();
  });
});

describe("ExaminationsManager in the platform console", () => {
  it("loads scales and terms through the institution mirror and narrows exams and classes to that institution", async () => {
    exams = [exam({}), exam({ id: "exam-x", name: "Other Institution Exam", campusId: "campus-2", classId: "class-2" })];
    render(<ExaminationsManager institutionId="inst-1" />);

    expect(await screen.findByText("First Term Exam")).toBeInTheDocument();
    expect(screen.queryByText("Other Institution Exam")).not.toBeInTheDocument();
    const urls = mocks.get.mock.calls.map((call) => call[0] as string);
    expect(urls).toContain("/platform/institutions/inst-1/grading-scales");
    expect(urls).toContain("/platform/institutions/inst-1/exam-terms");
    expect(urls).toContain("/platform/institutions/inst-1/academic-years");
    expect(urls).not.toContain("/examinations/grading-scales");
  });

  it("gives the console full access regardless of the signed-in permissions", async () => {
    mocks.runtime = { can: () => false };
    render(<ExaminationsManager institutionId="inst-1" />);

    expect(within(await rowOf("First Term Exam")).getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("creates a term through the institution mirror", async () => {
    render(<ExaminationsManager institutionId="inst-1" />);

    fireEvent.click(await screen.findByRole("tab", { name: "Terms" }));
    fireEvent.click((await screen.findAllByRole("button", { name: /Add Exam Term/ }))[0]);
    fireEvent.mouseDown(screen.getByLabelText(/Academic year/));
    fireEvent.click(screen.getByRole("option", { name: "2026-27" }));
    fireEvent.change(screen.getByLabelText(/Term Name/), { target: { value: "Quarter 2" } });
    await submitCreate();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith(
        "/platform/institutions/inst-1/exam-terms",
        expect.objectContaining({ name: "Quarter 2", academicYearId: "year-1" }),
      ),
    );
  });
});
