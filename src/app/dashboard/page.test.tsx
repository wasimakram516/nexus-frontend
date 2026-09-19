import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const state = vi.hoisted(() => ({
  push: vi.fn(),
  showMessage: vi.fn(),
  user: null as Record<string, unknown> | null,
  enabled: new Set<string>(),
  viewable: new Set<string>(),
  config: null as unknown,
  configLoading: false,
  getStudents: vi.fn(),
  getStaff: vi.fn(),
  getGuardians: vi.fn(),
  getCampuses: vi.fn(),
  getClasses: vi.fn(),
  getSummary: vi.fn(),
  getAll: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: state.showMessage }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => {
  // Stable function identities: the page lists them as effect dependencies.
  const isModuleEnabled = (k: string) => state.enabled.has(k);
  const canViewModule = (k: string) => state.viewable.has(k);
  return {
    useRuntimeConfig: () => ({ config: state.config, isLoading: state.configLoading, isModuleEnabled, canViewModule }),
  };
});
vi.mock("@/services/people.service", () => ({
  peopleService: { getStudents: state.getStudents, getStaffProfiles: state.getStaff, getGuardians: state.getGuardians },
}));
vi.mock("@/services/campuses.service", () => ({ campusesService: { getAll: state.getCampuses } }));
vi.mock("@/services/academics.service", () => ({ academicsService: { getClasses: state.getClasses } }));
vi.mock("@/services/attendance.service", () => ({ attendanceService: { getSummary: state.getSummary, getAll: state.getAll } }));
vi.mock("@/components/dashboard/OnboardingChecklist", () => ({
  default: ({ steps }: { steps: Array<{ key: string; done: boolean }> }) => (
    <div>onboarding {steps.map((s) => `${s.key}:${s.done}`).join(",")}</div>
  ),
}));

import DashboardOverviewPage from "./page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  state.configLoading = false;
  state.enabled = new Set(["PEOPLE", "ACADEMICS", "ATTENDANCE", "FINANCE"]);
  state.viewable = new Set(["PEOPLE", "ATTENDANCE"]);
  state.config = { branding: { displayName: "Green School" }, subscription: { planName: "Starter", status: "TRIAL" } };
  state.user = { id: "u", name: "Amna Khan", email: "a@x.io", role: "ADMIN" };
  state.getStudents.mockImplementation(() => ok([{}, {}, {}]));
  state.getStaff.mockImplementation(() => ok([{}]));
  state.getGuardians.mockImplementation(() => ok([]));
  state.getCampuses.mockImplementation(() => ok({ items: [{}], total: 4 }));
  state.getClasses.mockImplementation(() => ok([{}, {}]));
  state.getSummary.mockImplementation(() => ok({ totalRecords: 9, presentCount: 5, absentCount: 2, lateCount: 1, leaveCount: 1, halfDayCount: 0 }));
  state.getAll.mockImplementation(() => ok([]));
});

describe("Dashboard greeting fallback", () => {
  it.each([[null], [undefined], [""], ["   "]])("uses 'there' when the name is %j", (name) => {
    state.user = { id: "u", name, email: "a@x.io", role: "ADMIN" };
    render(<DashboardOverviewPage />);
    expect(screen.getByText("Welcome back, there")).toBeInTheDocument();
  });
});

describe("Dashboard overview: admin", () => {
  it("shows counts, today's attendance and onboarding progress from real data", async () => {
    render(<DashboardOverviewPage />);
    expect(screen.getByText("Welcome back, Amna")).toBeInTheDocument();
    expect(screen.getByText("Green School at a glance.")).toBeInTheDocument();
    expect(screen.getByText("Starter · TRIAL")).toBeInTheDocument();
    const card = (label: string) => screen.getByText(label).parentElement!.querySelector("h5")!;
    await waitFor(() => expect(card("Students")).toHaveTextContent("3"));
    expect(card("Staff")).toHaveTextContent("1");
    expect(card("Guardians")).toHaveTextContent("0");
    expect(card("Campuses")).toHaveTextContent("4");
    expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
    expect(card("Present")).toHaveTextContent("5");
    expect(card("On Leave")).toHaveTextContent("1");
    expect(screen.getByText("onboarding campus:true,academics:true,people:true,attendance:true")).toBeInTheDocument();
  });

  it("requests today's summary and uses only permitted module quick links", async () => {
    render(<DashboardOverviewPage />);
    await screen.findByText("Today's Attendance");
    expect(state.getSummary).toHaveBeenCalledWith({ date: new Date().toISOString().slice(0, 10) });
    const modules = screen.getByText("Modules").parentElement!;
    expect(within(modules).getByText("People")).toBeInTheDocument();
    expect(within(modules).getByText("Attendance")).toBeInTheDocument();
    expect(within(modules).queryByText("Finance")).not.toBeInTheDocument();
    expect(within(modules).queryByText("Academics")).not.toBeInTheDocument();
    fireEvent.click(within(modules).getByText("Attendance"));
    expect(state.push).toHaveBeenCalledWith("/dashboard/attendance");
  });

  it("skips data for disabled modules and shows a not-started onboarding state", async () => {
    state.enabled = new Set();
    state.getCampuses.mockImplementation(() => ok({ items: [] }));
    render(<DashboardOverviewPage />);
    expect(await screen.findByText("onboarding campus:false")).toBeInTheDocument();
    expect(state.getStudents).not.toHaveBeenCalled();
    expect(state.getClasses).not.toHaveBeenCalled();
    expect(state.getSummary).not.toHaveBeenCalled();
    expect(screen.queryByText("Students")).not.toBeInTheDocument();
    expect(screen.queryByText("Modules")).not.toBeInTheDocument();
  });

  it("navigates from a stat card", async () => {
    render(<DashboardOverviewPage />);
    await waitFor(() => expect(screen.getByText("Students").parentElement!.querySelector("h5")).toHaveTextContent("3"));
    fireEvent.click(screen.getByText("Campuses"));
    expect(state.push).toHaveBeenCalledWith("/dashboard/campuses");
  });

  it("does not load anything until the runtime config has loaded", () => {
    state.configLoading = true;
    render(<DashboardOverviewPage />);
    expect(state.getCampuses).not.toHaveBeenCalled();
  });

  it("uses the neutral header defaults when there is no config and warns for a lapsed subscription", () => {
    state.config = { branding: null, subscription: { planName: null, status: "SUSPENDED" } };
    state.user = { id: "u", role: "ADMIN" };
    render(<DashboardOverviewPage />);
    expect(screen.getByText("Welcome back, there")).toBeInTheDocument();
    expect(screen.getByText("Your institution at a glance.")).toBeInTheDocument();
    expect(screen.getByText("Plan · SUSPENDED").closest(".MuiChip-root")!.className).toMatch(/colorWarning/);
  });
});

describe("Dashboard overview: personal roles", () => {
  beforeEach(() => {
    state.user = { id: "u", name: "Sam Staff", email: "sam@x.io", role: "STAFF" };
  });

  it("shows only the user's own attendance, tallied by status, and no admin stats", async () => {
    state.getAll.mockImplementation(() =>
      ok([
        { id: "1", date: "2026-05-01", status: "PRESENT", checkIn: null, checkOut: null },
        { id: "2", date: "2026-05-02", status: "PRESENT", halfDay: true },
        { id: "3", date: "2026-05-03", status: "ABSENT" },
        { id: "4", date: "2026-05-04", status: "LATE" },
        { id: "5", date: "2026-05-05", status: "LEAVE" },
      ]),
    );
    render(<DashboardOverviewPage />);
    expect(await screen.findByText("Present 2")).toBeInTheDocument();
    expect(screen.getByText("Absent 1")).toBeInTheDocument();
    expect(screen.getByText("Late 1")).toBeInTheDocument();
    expect(screen.getByText("Leave 1")).toBeInTheDocument();
    expect(screen.getByText("PRESENT · HALF")).toBeInTheDocument();
    expect(screen.getByText("sam@x.io")).toBeInTheDocument();
    expect(state.getSummary).not.toHaveBeenCalled();
    expect(state.getStudents).not.toHaveBeenCalled();
    expect(screen.queryByText("Today's Attendance")).not.toBeInTheDocument();
    expect(screen.queryByText(/^onboarding/)).not.toBeInTheDocument();
    const args = state.getAll.mock.calls[0][0];
    expect(args.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(args.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shows an empty state when there are no records this month", async () => {
    render(<DashboardOverviewPage />);
    expect(await screen.findByText("No attendance records yet this month.")).toBeInTheDocument();
  });

  it("omits the attendance card when the module is disabled", () => {
    state.enabled = new Set(["PEOPLE"]);
    render(<DashboardOverviewPage />);
    expect(screen.queryByText(/My Attendance/)).not.toBeInTheDocument();
    expect(state.getAll).not.toHaveBeenCalled();
  });
});
