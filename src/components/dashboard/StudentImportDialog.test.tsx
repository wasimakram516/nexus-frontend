import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { peopleService } from "@/services/people.service";
import StudentImportDialog from "./StudentImportDialog";

vi.mock("@/services/people.service", () => ({
  peopleService: { previewStudentImport: vi.fn(), importStudents: vi.fn() },
}));

const campuses = [{ id: "c1", name: "Main" }, { id: "c2", name: "North" }];

const HEADER = "Name,Date of Birth,Gender,Class,Section";
const file = (...lines: string[]) =>
  new File([[HEADER, ...lines].join("\n")], "students.csv", { type: "text/csv" });

const previewReply = (rows: { line: number; name: string; errors?: string[]; warnings?: string[]; guardian?: string }[]) => {
  const checked = rows.map((row) => ({
    line: row.line,
    name: row.name,
    errors: row.errors ?? [],
    warnings: row.warnings ?? [],
    guardian: { mode: row.guardian ?? "NONE" },
  }));
  const valid = checked.filter((row) => row.errors.length === 0).length;
  return {
    data: {
      data: {
        rows: checked,
        summary: { total: rows.length, valid, invalid: rows.length - valid, newGuardians: 0, existingGuardians: 0 },
      },
    },
  };
};

const imported = (line: number, name: string, extra: Record<string, unknown> = {}) => ({
  line,
  name,
  status: "IMPORTED",
  regNo: `R-${line}`,
  studentPassword: `Pass${line}`,
  guardianPhone: null,
  guardianPassword: null,
  error: null,
  ...extra,
});

const renderIt = (props: Partial<React.ComponentProps<typeof StudentImportDialog>> = {}) => {
  const onClose = vi.fn();
  const onImported = vi.fn();
  render(
    <MessageProvider>
      <StudentImportDialog open campuses={campuses} onClose={onClose} onImported={onImported} {...props} />
    </MessageProvider>
  );
  return { onClose, onImported };
};

const upload = async (user: ReturnType<typeof userEvent.setup>, ...lines: string[]) => {
  await user.upload(screen.getByLabelText("CSV file"), file(...lines));
};

describe("StudentImportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("checks the file as soon as it is chosen, sending the lines with the campus and writing nothing", async () => {
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(previewReply([{ line: 2, name: "Ayesha" }, { line: 3, name: "Bilal" }]) as never);
    const user = userEvent.setup();
    renderIt();

    await upload(user, "Ayesha,12/06/2016,F,Grade 5,A", "Bilal,03/02/2014,M,Grade 5,");

    await waitFor(() =>
      expect(peopleService.previewStudentImport).toHaveBeenCalledWith({
        campusId: "c1",
        rows: [
          { name: "Ayesha", dob: "12/06/2016", gender: "F", className: "Grade 5", sectionName: "A" },
          { name: "Bilal", dob: "03/02/2014", gender: "M", className: "Grade 5" },
        ],
      })
    );
    expect(await screen.findByText("2 ready")).toBeInTheDocument();
    expect(peopleService.importStudents).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Import 2 students" })).toBeEnabled();
  });

  it("lists the lines with problems and says they will be skipped, importing only the good ones", async () => {
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(
      previewReply([{ line: 2, name: "Ayesha" }, { line: 3, name: "", errors: ["Name is missing."] }]) as never
    );
    const user = userEvent.setup();
    renderIt();

    await upload(user, "Ayesha,12/06/2016,F,Grade 5,A", ",03/02/2014,M,Grade 5,");

    const table = await screen.findByRole("table", { name: "Lines with problems" });
    expect(within(table).getByText("Name is missing.")).toBeInTheDocument();
    expect(screen.getByText("1 with problems")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import 1 student" })).toBeEnabled();
  });

  it("says which required columns are missing and does not ask the server", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.upload(screen.getByLabelText("CSV file"), new File(["Name,Shoe size\nAyesha,34"], "x.csv", { type: "text/csv" }));

    expect(await screen.findByText(/The file has no Date of Birth, Gender, Class column/)).toBeInTheDocument();
    expect(screen.getByText("Not used: Shoe size.")).toBeInTheDocument();
    expect(peopleService.previewStudentImport).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });

  it("cannot import when every line has a problem", async () => {
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(
      previewReply([{ line: 2, name: "X", errors: ["Gender is missing."] }]) as never
    );
    const user = userEvent.setup();
    renderIt();

    await upload(user, "X,12/06/2016,,Grade 5,");

    expect(await screen.findByText("1 with problems")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import 0 students" })).toBeDisabled();
  });

  it("checks the file again for another campus", async () => {
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(previewReply([{ line: 2, name: "Ayesha" }]) as never);
    const user = userEvent.setup();
    renderIt();
    await upload(user, "Ayesha,12/06/2016,F,Grade 5,A");
    await screen.findByText("1 ready");

    await user.click(screen.getByLabelText("Campus"));
    await user.click(await screen.findByRole("option", { name: "North" }));

    await waitFor(() => expect(peopleService.previewStudentImport).toHaveBeenLastCalledWith(expect.objectContaining({ campusId: "c2" })));
  });

  it("saves the lines a few at a time in order, then offers the first passwords once, and reloads when done", async () => {
    const many = Array.from({ length: 20 }, (_, index) => `Student ${index + 1},12/06/2016,F,Grade 5,A`);
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(
      previewReply(many.map((_, index) => ({ line: index + 2, name: `Student ${index + 1}` }))) as never
    );
    vi.mocked(peopleService.importStudents)
      .mockResolvedValueOnce({ data: { data: { results: Array.from({ length: 15 }, (_, i) => imported(i + 2, `Student ${i + 1}`)) } } } as never)
      .mockResolvedValueOnce({ data: { data: { results: Array.from({ length: 5 }, (_, i) => imported(i + 17, `Student ${i + 16}`)) } } } as never);
    const user = userEvent.setup();
    const { onImported, onClose } = renderIt();
    await upload(user, ...many);
    await screen.findByText("20 ready");

    await user.click(screen.getByRole("button", { name: "Import 20 students" }));

    expect(await screen.findByText(/20 of 20 lines imported/)).toBeInTheDocument();
    expect(peopleService.importStudents).toHaveBeenNthCalledWith(1, expect.objectContaining({ campusId: "c1", rowOffset: 0 }));
    expect(peopleService.importStudents).toHaveBeenNthCalledWith(2, expect.objectContaining({ rowOffset: 15 }));
    expect(vi.mocked(peopleService.importStudents).mock.calls[0][0].rows).toHaveLength(15);
    expect(vi.mocked(peopleService.importStudents).mock.calls[1][0].rows).toHaveLength(5);
    expect(screen.getByText(/shown only here and cannot be looked up later/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(URL.createObjectURL).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onImported).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("lists the lines that failed with the reason, including a student whose guardian could not be added", async () => {
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(
      previewReply([{ line: 2, name: "Ayesha" }, { line: 3, name: "Bilal" }]) as never
    );
    vi.mocked(peopleService.importStudents).mockResolvedValue({
      data: {
        data: {
          results: [
            imported(2, "Ayesha", { status: "IMPORTED_GUARDIAN_FAILED", error: "The student was imported but the guardian was not: That phone number is in use." }),
            { ...imported(3, "Bilal"), status: "FAILED", regNo: null, studentPassword: null, error: "A user with this email already exists." },
          ],
        },
      },
    } as never);
    const user = userEvent.setup();
    renderIt();
    await upload(user, "Ayesha,12/06/2016,F,Grade 5,A", "Bilal,03/02/2014,M,Grade 5,");
    await screen.findByText("2 ready");

    await user.click(screen.getByRole("button", { name: "Import 2 students" }));

    expect(await screen.findByText(/1 of 2 lines imported, 2 need attention/)).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Lines that need attention" });
    expect(within(table).getByText(/That phone number is in use/)).toBeInTheDocument();
    expect(within(table).getByText("A user with this email already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import another file" })).toBeInTheDocument();
  });

  it("stops and says where when the server cannot be reached part way, keeping what was already saved", async () => {
    const many = Array.from({ length: 20 }, (_, index) => `Student ${index + 1},12/06/2016,F,Grade 5,A`);
    vi.mocked(peopleService.previewStudentImport).mockResolvedValue(
      previewReply(many.map((_, index) => ({ line: index + 2, name: `S${index}` }))) as never
    );
    vi.mocked(peopleService.importStudents)
      .mockResolvedValueOnce({ data: { data: { results: Array.from({ length: 15 }, (_, i) => imported(i + 2, `S${i}`)) } } } as never)
      .mockRejectedValueOnce(new Error("Network Error"));
    const user = userEvent.setup();
    renderIt();
    await upload(user, ...many);
    await screen.findByText("20 ready");

    await user.click(screen.getByRole("button", { name: "Import 20 students" }));

    expect(await screen.findByText(/15 of 15 lines imported/)).toBeInTheDocument();
    expect(screen.getByText(/The import stopped at line 17/)).toBeInTheDocument();
  });

  it("closes without importing when cancelled", async () => {
    const user = userEvent.setup();
    const { onClose, onImported } = renderIt();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });

  it("offers the template to start from", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(screen.getByRole("button", { name: "Download template" }));

    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
