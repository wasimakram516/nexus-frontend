import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  getAll: vi.fn(),
  updateStatus: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/components/shared/PlatformBreadcrumbs", () => ({ default: () => <nav>crumbs</nav> }));
vi.mock("@/services/contact.service", () => ({
  contactInquiriesService: { getAll: mocks.getAll, updateStatus: mocks.updateStatus, remove: mocks.remove },
}));

import InquiriesPage from "./page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

const inquiry = (over: Record<string, unknown>) => ({
  id: "i1", name: "Ada Lovelace", email: "ada@example.com", organisation: "Acme School",
  inquiryType: "Request a Demo", message: "We would like a demo", status: "NEW",
  createdAt: "2026-09-01T10:00:00.000Z", ...over,
});

const list = (items: unknown[]) => ok({ items, total: items.length, page: 1, limit: 10 });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAll.mockImplementation(() => list([inquiry({}), inquiry({ id: "i2", name: "Grace", email: "g@example.com", status: "READ" })]));
  mocks.updateStatus.mockImplementation(() => ok());
  mocks.remove.mockImplementation(() => ok());
});

describe("Inquiries page", () => {
  it("lists inquiries with status chips and requests the first page", async () => {
    render(<InquiriesPage />);
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.getByText("NEW")).toBeInTheDocument();
    expect(screen.getByText("READ")).toBeInTheDocument();
    expect(mocks.getAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("shows an empty state", async () => {
    mocks.getAll.mockImplementation(() => list([]));
    render(<InquiriesPage />);
    expect(await screen.findByText("No inquiries found.")).toBeInTheDocument();
  });

  it("filters by status and resets to the first page", async () => {
    render(<InquiriesPage />);
    await screen.findByText("Ada Lovelace");
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Status" }));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("Archived"));
    await waitFor(() => expect(mocks.getAll).toHaveBeenLastCalledWith({ page: 1, limit: 10, status: "ARCHIVED" }));
  });

  it("opens a NEW message, marks it read automatically and can archive it", async () => {
    render(<InquiriesPage />);
    await screen.findByText("Ada Lovelace");
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("We would like a demo")).toBeInTheDocument();
    await waitFor(() => expect(mocks.updateStatus).toHaveBeenCalledWith("i1", "READ"));

    fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(mocks.updateStatus).toHaveBeenLastCalledWith("i1", "ARCHIVED"));
    expect(mocks.showMessage).toHaveBeenCalledWith("Marked as archived.", "success");
  });

  it("marks a message as read from the dialog and does not re-mark a READ message on open", async () => {
    render(<InquiriesPage />);
    await screen.findByText("Grace");
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[1]);
    await screen.findByRole("dialog");
    expect(mocks.updateStatus).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Mark as read" })).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting and only deletes on confirm", async () => {
    render(<InquiriesPage />);
    await screen.findByText("Ada Lovelace");
    fireEvent.click(screen.getAllByRole("button", { name: /Delete/ })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Delete the inquiry from "Ada Lovelace"/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: /Delete/ })[0]);
    const again = await screen.findByRole("dialog");
    fireEvent.click(within(again).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("i1"));
    expect(mocks.showMessage).toHaveBeenCalledWith("Inquiry deleted.", "success");
  });
});
