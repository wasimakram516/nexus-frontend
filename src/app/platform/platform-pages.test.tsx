import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showMessage: vi.fn(),
  getInstitutions: vi.fn(),
  getAll: vi.fn(),
  restore: vi.fn(),
  permanentDelete: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/platform.service", () => ({ platformService: { getInstitutions: mocks.getInstitutions } }));
vi.mock("@/services/recycleBin.service", () => ({
  recycleBinService: { getAll: mocks.getAll, restore: mocks.restore, permanentDelete: mocks.permanentDelete },
}));

import PlatformOverviewPage from "./page";
import InstitutionsPage from "./institutions/page";
import RecycleBinPage from "./recycle-bin/page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });
const thisMonth = new Date().toISOString();
const longAgo = "2020-01-15T00:00:00Z";

const institutions = [
  { id: "1", name: "Alpha School", slug: "alpha", status: "ACTIVE", deploymentMode: "SHARED_HOSTED", contactEmail: "a@alpha.io", createdAt: thisMonth },
  { id: "2", name: "Beta College", slug: "beta", status: "SUSPENDED", deploymentMode: "SELF_HOSTED", createdAt: longAgo },
  { id: "3", name: "Gamma Academy", slug: "gamma", status: "INACTIVE", deploymentMode: "DEDICATED_HOSTED", contactEmail: "g@gamma.io", createdAt: longAgo },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getInstitutions.mockImplementation(() => ok(institutions));
});

describe("Platform overview page", () => {
  it("computes stats from the institutions", async () => {
    render(<PlatformOverviewPage />);
    expect(await screen.findByText("Alpha School")).toBeInTheDocument();
    const statValue = (label: string) => screen.getByText(label).parentElement!.querySelector("h4")!.textContent;
    expect(statValue("Total Institutions")).toBe("3");
    expect(statValue("Active")).toBe("1");
    expect(statValue("Suspended")).toBe("1");
    expect(Number(statValue("This Month"))).toBeGreaterThanOrEqual(1);
  });

  it("navigates to an institution and to the creation wizard", async () => {
    render(<PlatformOverviewPage />);
    fireEvent.click(await screen.findByText("Beta College"));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/2");
    fireEvent.click(screen.getByRole("button", { name: /New Institution/ }));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/new");
    fireEvent.click(screen.getByRole("button", { name: /View All/ }));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions");
  });

  it("shows an empty state when the request fails or returns nothing", async () => {
    mocks.getInstitutions.mockRejectedValue(Object.assign(new Error("x"), { response: { status: 403 } }));
    render(<PlatformOverviewPage />);
    expect(await screen.findByText("No institutions yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Create Institution/ }));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/new");
  });
});

describe("Institutions list page", () => {
  it("lists institutions and filters by name, slug or email", async () => {
    render(<InstitutionsPage />);
    expect(await screen.findByText("Alpha School")).toBeInTheDocument();
    expect(screen.getByText("3 institutions registered on the platform.")).toBeInTheDocument();
    expect(screen.getByText("SELF HOSTED")).toBeInTheDocument();
    const search = screen.getByPlaceholderText(/Search by name/);
    fireEvent.change(search, { target: { value: "gamma.io" } });
    expect(screen.getByText("Gamma Academy")).toBeInTheDocument();
    expect(screen.queryByText("Alpha School")).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "BETA" } });
    expect(screen.getByText("Beta College")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText("No institutions found.")).toBeInTheDocument();
  });

  it("requests the server-side status filter when a status is picked", async () => {
    render(<InstitutionsPage />);
    await screen.findByText("Alpha School");
    expect(mocks.getInstitutions).toHaveBeenLastCalledWith({});
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "SUSPENDED" }));
    await waitFor(() => expect(mocks.getInstitutions).toHaveBeenLastCalledWith({ status: "SUSPENDED" }));
  });

  it("navigates by slug from the row and from the arrow button without double-firing", async () => {
    render(<InstitutionsPage />);
    fireEvent.click(await screen.findByText("Alpha School"));
    expect(mocks.push).toHaveBeenLastCalledWith("/platform/institutions/alpha");
    mocks.push.mockClear();
    const row = screen.getByText("Beta College").closest("tr")!;
    fireEvent.click(within(row).getByTestId("ArrowForwardIcon").closest("button")!);
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/beta");
  });
});

describe("Recycle bin page", () => {
  const item = (over: Record<string, unknown>) => ({
    entity: "students", id: "r1", label: "Ali Khan", subtitle: "REG-1", institutionId: "i", deletedAt: "2026-01-01T00:00:00Z",
    deletedBy: "u", deleteReason: "left school", deletedByUser: { name: "Admin One", email: "admin@x.io" }, metadata: {},
    retentionDays: 30, purgeEligibleAt: "2026-02-01T00:00:00Z", daysLeft: 20, isPurgeEligible: false, ...over,
  });

  beforeEach(() => {
    mocks.getAll.mockImplementation(() => ok({
      items: [
        item({}),
        item({ id: "r2", label: "Old Record", subtitle: null, deletedByUser: null, deleteReason: null, isPurgeEligible: true, daysLeft: 0 }),
        item({ id: "r3", label: "Soon", daysLeft: 1 }),
        item({ id: "r4", label: "Sooner", daysLeft: 3 }),
      ],
      total: 4,
    }));
    mocks.restore.mockImplementation(() => ok());
    mocks.permanentDelete.mockImplementation(() => ok());
  });

  it("shows retention state and gates permanent delete on purge eligibility", async () => {
    render(<RecycleBinPage />);
    expect(await screen.findByText("Ali Khan")).toBeInTheDocument();
    expect(screen.getByText("20 days left")).toBeInTheDocument();
    expect(screen.getByText("1 day left")).toBeInTheDocument();
    expect(screen.getByText("Eligible now")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getAllByText("admin@x.io")).toHaveLength(3);
    const deletes = screen.getAllByRole("button", { name: /^Delete$/ });
    expect(deletes.map((b) => (b as HTMLButtonElement).disabled)).toEqual([true, false, true, true]);
  });

  it("shows an empty message", async () => {
    mocks.getAll.mockImplementation(() => ok({ items: [], total: 0 }));
    render(<RecycleBinPage />);
    expect(await screen.findByText("Recycle bin is empty.")).toBeInTheDocument();
  });

  it("restores only after confirmation and then reloads", async () => {
    render(<RecycleBinPage />);
    await screen.findByText("Ali Khan");
    fireEvent.click(screen.getAllByRole("button", { name: /Restore/ })[0]);
    expect(await screen.findByText(/Restore "Ali Khan" \(students\)\?/)).toBeInTheDocument();
    expect(mocks.restore).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Restore" }));
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith("students", "r1"));
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(2));
  });

  it("cancelling the confirmation performs no action", async () => {
    render(<RecycleBinPage />);
    await screen.findByText("Ali Khan");
    fireEvent.click(screen.getAllByRole("button", { name: /Restore/ })[0]);
    fireEvent.click(await screen.findByRole("button", { name: /Cancel/ }));
    await waitFor(() => expect(screen.queryByText(/Restore "Ali Khan"/)).not.toBeInTheDocument());
    expect(mocks.restore).not.toHaveBeenCalled();
  });

  it("permanently deletes an eligible record after confirmation", async () => {
    render(<RecycleBinPage />);
    await screen.findByText("Old Record");
    const enabled = screen.getAllByRole("button", { name: /^Delete$/ }).find((b) => !(b as HTMLButtonElement).disabled)!;
    fireEvent.click(enabled);
    expect(await screen.findByText(/Permanently delete "Old Record"/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Forever" }));
    await waitFor(() => expect(mocks.permanentDelete).toHaveBeenCalledWith("students", "r2"));
  });
});
