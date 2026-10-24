import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CalculateFinesDialog from "./CalculateFinesDialog";

const mocks = vi.hoisted(() => ({ post: vi.fn(), showMessage: vi.fn() }));

vi.mock("@/lib/axios", () => ({ default: { post: mocks.post } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));

const campuses = [{ id: "campus-1", name: "Main Campus" }];
const classes = [
  { id: "class-1", name: "Grade 1", campusId: "campus-1" },
  { id: "class-9", name: "Elsewhere", campusId: "campus-9" },
];

const result = (preview: boolean, overrides: Record<string, unknown> = {}) => ({
  data: {
    data: {
      preview,
      fined: [
        {
          studentId: "s1",
          name: "Ayesha",
          regNo: "R-1",
          amount: "290.00",
          action: "created",
          counts: { absent: 4, late: 3, halfDay: 1, leave: 2 },
        },
      ],
      unchanged: [{ studentId: "s2", name: "Bilal", regNo: "R-2", reason: "No fine is due." }],
      totals: { fined: 1, unchanged: 1, totalAmount: "290.00" },
      ...overrides,
    },
  },
});

function renderDialog(onCalculated = vi.fn(), onClose = vi.fn()) {
  render(<CalculateFinesDialog open campuses={campuses} classes={classes} onClose={onClose} onCalculated={onCalculated} />);
  return { onCalculated, onClose };
}

const preview = () => fireEvent.click(screen.getByRole("button", { name: "Preview" }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockImplementation(async (_url: string, body: { preview: boolean }) => result(body.preview));
});

describe("CalculateFinesDialog", () => {
  it("starts on the only campus and cannot save before a preview", () => {
    renderDialog();

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Preview" })).toBeEnabled();
  });

  it("previews with the chosen period and shows the counts and fine", async () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2026" } });
    preview();

    expect(await screen.findByText("1 would be saved")).toBeInTheDocument();
    expect(screen.getByText("290.00")).toBeInTheDocument();
    expect(screen.getByText(/Preview only, nothing has been saved yet/)).toBeInTheDocument();
    expect(screen.getByText("No fine is due.")).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith(
      "/finance/student-fines/generate",
      expect.objectContaining({ campusId: "campus-1", year: 2026, preview: true }),
    );
  });

  it("saves only after a preview, then shows the report and reloads the list", async () => {
    const { onCalculated } = renderDialog();
    preview();
    fireEvent.click(await screen.findByRole("button", { name: "Save 1 fines" }));

    expect(await screen.findByText("1 saved")).toBeInTheDocument();
    expect(mocks.post).toHaveBeenLastCalledWith("/finance/student-fines/generate", expect.objectContaining({ preview: false }));
    expect(onCalculated).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("cannot save when the preview shows no fines", async () => {
    mocks.post.mockResolvedValue(result(true, { fined: [], totals: { fined: 0, unchanged: 1, totalAmount: "0.00" } }));
    renderDialog();
    preview();

    await screen.findByText("0 would be saved");
    expect(screen.getByRole("button", { name: "Save 0 fines" })).toBeDisabled();
  });

  it("invalidates the preview when anything changes", async () => {
    renderDialog();
    preview();
    await screen.findByText("1 would be saved");

    fireEvent.change(screen.getByLabelText(/Year/), { target: { value: "2027" } });

    expect(screen.queryByText("1 would be saved")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("offers only this campus's classes and sends the choice", async () => {
    renderDialog();

    fireEvent.mouseDown(screen.getByLabelText("Class"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Grade 1" }));
    preview();

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/finance/student-fines/generate", expect.objectContaining({ classId: "class-1" })),
    );
  });

  it("shows an error and saves nothing when the server refuses", async () => {
    mocks.post.mockRejectedValue({ response: { data: { message: "Set the current academic year before calculating fines." } }, message: "x" });
    renderDialog();
    preview();

    expect(await screen.findByText(/could not be calculated/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
