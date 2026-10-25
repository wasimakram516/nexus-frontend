import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { timetableService } from "@/services/timetable.service";
import DuplicatePeriodsDialog from "./DuplicatePeriodsDialog";

vi.mock("@/services/timetable.service", () => ({
  timetableService: { duplicatePeriodSlots: vi.fn() },
}));

const sources = [{ id: "s1", dayOfWeek: "MONDAY" as const }];

const renderDialog = (props: Partial<React.ComponentProps<typeof DuplicatePeriodsDialog>> = {}) => {
  const onClose = vi.fn();
  const onDone = vi.fn();
  render(
    <MessageProvider>
      <DuplicatePeriodsDialog sources={sources} subject="Period 1" onClose={onClose} onDone={onDone} {...props} />
    </MessageProvider>
  );
  return { onClose, onDone };
};

const reply = (created: number, skipped: unknown[] = []) => ({
  data: { message: "done", data: { created, skipped } },
});

describe("DuplicatePeriodsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stays closed without periods to copy", () => {
    render(
      <MessageProvider>
        <DuplicatePeriodsDialog sources={null} subject="x" onClose={vi.fn()} onDone={vi.fn()} />
      </MessageProvider>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers the other days, not the one the period is on, and copies nothing until a day is ticked", async () => {
    renderDialog();

    expect(await screen.findByText("Copy Period 1 to other days")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
  });

  it("copies onto the ticked days and closes when everything was made", async () => {
    vi.mocked(timetableService.duplicatePeriodSlots).mockResolvedValue(reply(2) as never);
    const user = userEvent.setup();
    const { onClose, onDone } = renderDialog();

    await user.click(await screen.findByRole("checkbox", { name: "Tuesday" }));
    await user.click(screen.getByRole("checkbox", { name: "Wednesday" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(timetableService.duplicatePeriodSlots).toHaveBeenCalledWith(["s1"], ["TUESDAY", "WEDNESDAY"]);
    expect(onDone).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("lists what was skipped and why, refreshing the grid for what was copied", async () => {
    vi.mocked(timetableService.duplicatePeriodSlots).mockResolvedValue(
      reply(1, [{ sourceId: "s1", name: "Period 1", dayOfWeek: "TUESDAY", reason: "Tuesday already has a period 1." }]) as never
    );
    const user = userEvent.setup();
    const { onClose, onDone } = renderDialog();

    await user.click(await screen.findByRole("checkbox", { name: "Tuesday" }));
    await user.click(screen.getByRole("checkbox", { name: "Wednesday" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(await screen.findByText("Some copies were skipped")).toBeInTheDocument();
    expect(screen.getByText(/Tuesday already has a period 1\./)).toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("for a whole day, every day is offered once periods come from several days", async () => {
    renderDialog({
      sources: [{ id: "a", dayOfWeek: "MONDAY" }, { id: "b", dayOfWeek: "TUESDAY" }],
      subject: "two periods",
    });

    expect(await screen.findByRole("checkbox", { name: "Monday" })).toBeEnabled();
  });

  it("keeps the dialog open and does not refresh when the server refuses", async () => {
    vi.mocked(timetableService.duplicatePeriodSlots).mockRejectedValue({
      response: { status: 403, data: { message: "You do not have access." } },
    });
    const user = userEvent.setup();
    const { onClose, onDone } = renderDialog();

    await user.click(await screen.findByRole("checkbox", { name: "Tuesday" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(await screen.findByText("You do not have access.")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
