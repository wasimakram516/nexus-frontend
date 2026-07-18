import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usersService } from "@/services/users.service";
import RecordMetadataPopover from "./RecordMetadataPopover";

vi.mock("@/services/users.service", () => ({
  usersService: { resolve: vi.fn() },
}));

describe("RecordMetadataPopover", () => {
  beforeEach(() => {
    vi.mocked(usersService.resolve).mockReset();
  });

  it("shows 'System' for a record with no creator/updater id", async () => {
    const user = userEvent.setup();
    render(<RecordMetadataPopover createdById={null} updatedById={null} />);

    await user.click(screen.getByLabelText(/record details/i));

    expect(await screen.findAllByText("System")).toHaveLength(2);
    expect(usersService.resolve).not.toHaveBeenCalled();
  });

  it("resolves and displays the creator/updater name and email on open", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.resolve).mockResolvedValue({
      data: {
        data: {
          "user-1": { name: "Alice Admin", email: "alice@nexus.test" },
          "user-2": { name: "Bob Staff", email: "bob@nexus.test" },
        },
      },
    } as never);

    render(
      <RecordMetadataPopover
        createdById="user-1"
        createdAt="2026-07-01T00:00:00.000Z"
        updatedById="user-2"
        updatedAt="2026-07-18T00:00:00.000Z"
      />
    );

    await user.click(screen.getByLabelText(/record details/i));

    expect(usersService.resolve).toHaveBeenCalledWith(["user-1", "user-2"]);
    expect(await screen.findByText("Alice Admin (alice@nexus.test)")).toBeInTheDocument();
    expect(screen.getByText("Bob Staff (bob@nexus.test)")).toBeInTheDocument();
  });

  it("falls back to a truncated id when the actor can't be resolved", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.resolve).mockResolvedValue({
      data: { data: {} },
    } as never);

    render(<RecordMetadataPopover createdById="unresolvable-user-id" />);

    await user.click(screen.getByLabelText(/record details/i));

    expect(await screen.findByText(/unresolv…/)).toBeInTheDocument();
  });

  it("does not re-fetch already-resolved ids on a second open", async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.resolve).mockResolvedValue({
      data: { data: { "user-1": { name: "Alice Admin", email: "alice@nexus.test" } } },
    } as never);

    render(<RecordMetadataPopover createdById="user-1" />);

    await user.click(screen.getByLabelText(/record details/i));
    await screen.findByText("Alice Admin (alice@nexus.test)");
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText(/record details/i));
    await screen.findByText("Alice Admin (alice@nexus.test)");

    expect(usersService.resolve).toHaveBeenCalledTimes(1);
  });
});
