import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MessageProvider } from "@/contexts/MessageContext";
import { examinationsService } from "@/services/examinations.service";
import GradingScalesSection, { GradingScale } from "./GradingScalesSection";

vi.mock("@/services/examinations.service", () => ({
  examinationsService: {
    createGradingScale: vi.fn(),
    updateGradingScale: vi.fn(),
    setCurrentGradingScale: vi.fn(),
    deleteGradingScale: vi.fn(),
  },
}));

const scales: GradingScale[] = [
  {
    id: "scale-1",
    name: "Standard",
    isCurrent: true,
    bands: [
      { id: "b1", grade: "F", minPercentage: "0.00", maxPercentage: "59.99" },
      { id: "b2", grade: "A", minPercentage: "80.00", maxPercentage: "100.00" },
    ],
  },
  { id: "scale-2", name: "Letter", isCurrent: false, bands: [{ id: "b3", grade: "P", minPercentage: "40", maxPercentage: "100" }] },
];

function renderSection(overrides: Partial<{ canCreate: boolean; canUpdate: boolean; canDelete: boolean; institutionId: string }> = {}) {
  const onReload = vi.fn();
  render(
    <MessageProvider>
      <GradingScalesSection
        scales={scales}
        loading={false}
        canCreate={overrides.canCreate ?? true}
        canUpdate={overrides.canUpdate ?? true}
        canDelete={overrides.canDelete ?? true}
        institutionId={overrides.institutionId}
        onReload={onReload}
      />
    </MessageProvider>,
  );
  return onReload;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(examinationsService)) {
    vi.mocked(fn).mockResolvedValue({ data: { data: {}, message: "ok" } } as never);
  }
});

describe("GradingScalesSection", () => {
  it("shows bands highest first and marks only the current scale", () => {
    renderSection();

    const row = screen.getByText("Standard").closest("tr")!;
    const chips = within(row).getAllByText(/^[AF] \d/);
    expect(chips.map((chip) => chip.textContent)).toEqual(["A 80–100", "F 0–59.99"]);
    expect(within(row).getByText("Current")).toBeInTheDocument();
    expect(within(screen.getByText("Letter").closest("tr")!).queryByText("Current")).not.toBeInTheDocument();
  });

  it("disables delete on the current scale and offers make-current only on the others", () => {
    renderSection();

    const current = screen.getByText("Standard").closest("tr")!;
    const other = screen.getByText("Letter").closest("tr")!;
    expect(within(current).getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(within(current).queryByRole("button", { name: "Make current" })).not.toBeInTheDocument();
    expect(within(other).getByRole("button", { name: "Delete" })).toBeEnabled();
    expect(within(other).getByRole("button", { name: "Make current" })).toBeInTheDocument();
  });

  it("hides every action for a read-only user", () => {
    renderSection({ canCreate: false, canUpdate: false, canDelete: false });

    expect(screen.queryByRole("button", { name: /Add Grading Scale/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("makes another scale current through the institution route", async () => {
    const onReload = renderSection({ institutionId: "inst-1" });

    fireEvent.click(within(screen.getByText("Letter").closest("tr")!).getByRole("button", { name: "Make current" }));

    await waitFor(() => expect(examinationsService.setCurrentGradingScale).toHaveBeenCalledWith("scale-2", "inst-1"));
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it("blocks saving overlapping bands and shows why, without calling the API", async () => {
    renderSection();

    fireEvent.click(screen.getAllByRole("button", { name: /Add Grading Scale/ })[0]);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Broken" } });
    fireEvent.change(screen.getByLabelText("To percent 2"), { target: { value: "85" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/overlapping/i);
    expect(examinationsService.createGradingScale).not.toHaveBeenCalled();
  });

  it("creates a scale from the default bands with the exact payload", async () => {
    const onReload = renderSection();

    fireEvent.click(screen.getAllByRole("button", { name: /Add Grading Scale/ })[0]);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "My Scale" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(examinationsService.createGradingScale).toHaveBeenCalledWith(
        {
          name: "My Scale",
          bands: [
            { grade: "A", minPercentage: 80, maxPercentage: 100, sortOrder: 0 },
            { grade: "B", minPercentage: 60, maxPercentage: 79.99, sortOrder: 1 },
            { grade: "F", minPercentage: 0, maxPercentage: 59.99, remarks: "Fail", sortOrder: 2 },
          ],
        },
        undefined,
      ),
    );
    await waitFor(() => expect(onReload).toHaveBeenCalled());
  });

  it("edits an existing scale with its bands loaded, and keeps at least one band", async () => {
    renderSection();

    fireEvent.click(within(screen.getByText("Letter").closest("tr")!).getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Grade 1")).toHaveValue("P");
    expect(screen.getByRole("button", { name: "Remove band 1" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Letter v2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(examinationsService.updateGradingScale).toHaveBeenCalledWith(
        "scale-2",
        { name: "Letter v2", bands: [{ grade: "P", minPercentage: 40, maxPercentage: 100, sortOrder: 0 }] },
        undefined,
      ),
    );
  });

  it("deletes a non-current scale after confirmation", async () => {
    renderSection();

    fireEvent.click(within(screen.getByText("Letter").closest("tr")!).getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete", hidden: false }));

    await waitFor(() => expect(examinationsService.deleteGradingScale).toHaveBeenCalledWith("scale-2", undefined));
  });
});
