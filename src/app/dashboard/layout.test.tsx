import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: "/dashboard",
  showMessage: vi.fn(),
  confirm: vi.fn(),
  clearAuth: vi.fn(),
  logout: vi.fn(),
  user: { name: "Amna", role: "ADMIN" } as { name: string; role: string } | null,
  enabled: new Set<string>(),
  viewable: new Set<string>(),
  grants: new Set<string>(),
  config: null as unknown,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push, replace: state.replace }),
  usePathname: () => state.pathname,
}));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: state.showMessage }) }));
vi.mock("@/contexts/ConfirmContext", () => ({ useConfirm: () => state.confirm }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: state.user, clearAuth: state.clearAuth }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({
  RuntimeConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRuntimeConfig: () => ({
    config: state.config,
    isModuleEnabled: (k: string) => state.enabled.has(k),
    canViewModule: (k: string) => state.viewable.has(k),
    can: (f: string, a: string) => state.grants.has(`${f}.${a}`),
  }),
}));
vi.mock("@/services/auth.service", () => ({ authService: { logout: state.logout } }));
vi.mock("@/components/shared/NexusLogo", () => ({ default: () => <span>nexus-logo</span> }));
vi.mock("@/components/shared/ThemeToggle", () => ({ default: () => <span>theme-toggle</span> }));
vi.mock("@/components/shared/ProfileDialog", () => ({ default: ({ open }: { open: boolean }) => (open ? <div>profile-open</div> : null) }));
vi.mock("@/components/dashboard/AcademicYearSelector", () => ({ default: () => <span>year-selector</span> }));
vi.mock("@/components/dashboard/NoticeBell", () => ({ default: () => <span>notice-bell</span> }));
vi.mock("@/components/dashboard/TrialBanner", () => ({ default: () => <span>trial-banner</span> }));

import DashboardLayout from "./layout";

const labels = () =>
  ["Overview", "People", "Academics", "Attendance", "Finance", "Notices", "Campuses", "Users", "Roles", "Custom Fields", "Activity"].filter(
    (l) => screen.queryByText(l),
  );

beforeEach(() => {
  vi.clearAllMocks();
  state.pathname = "/dashboard";
  state.user = { name: "Amna", role: "ADMIN" };
  state.enabled = new Set(["PEOPLE", "FINANCE"]);
  state.viewable = new Set(["PEOPLE", "FINANCE"]);
  state.grants = new Set();
  state.config = { branding: { displayName: "Green School", logoUrl: null }, subscription: { planName: "Starter", status: "ACTIVE" } };
  state.confirm.mockResolvedValue(true);
  state.logout.mockResolvedValue({ data: { data: {} } });
});

describe("DashboardLayout navigation gating", () => {
  it("shows enabled+viewable modules and admin-only items for an ADMIN", () => {
    render(<DashboardLayout><div>page</div></DashboardLayout>);
    expect(screen.getByText("page")).toBeInTheDocument();
    expect(labels()).toEqual(["Overview", "People", "Finance", "Campuses", "Users", "Roles", "Custom Fields"]);
  });

  it("hides modules the institution has not enabled or the user cannot view", () => {
    state.enabled = new Set(["PEOPLE", "ATTENDANCE"]);
    state.viewable = new Set(["ATTENDANCE"]);
    render(<DashboardLayout><div /></DashboardLayout>);
    expect(labels()).toContain("Attendance");
    expect(labels()).not.toContain("People");
    expect(labels()).not.toContain("Finance");
  });

  it("hides admin-only items from STAFF and shows Activity only with an audit grant", () => {
    state.user = { name: "Sam", role: "STAFF" };
    const { unmount } = render(<DashboardLayout><div /></DashboardLayout>);
    expect(labels()).toEqual(["Overview", "People", "Finance"]);
    unmount();
    state.grants = new Set(["audit_logs.read"]);
    render(<DashboardLayout><div /></DashboardLayout>);
    expect(labels()).toEqual(["Overview", "People", "Finance", "Activity"]);
  });

  it("navigates on click", () => {
    render(<DashboardLayout><div /></DashboardLayout>);
    fireEvent.click(screen.getByText("Finance"));
    expect(state.push).toHaveBeenCalledWith("/dashboard/finance");
  });

  it("shows institution name, plan chip, user and role", () => {
    render(<DashboardLayout><div /></DashboardLayout>);
    expect(screen.getByText("Green School")).toBeInTheDocument();
    expect(screen.getByText("Starter · ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Amna")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByText("trial-banner")).toBeInTheDocument();
  });

  it("falls back to the Nexus logo and default names when there is no branding", () => {
    state.config = null;
    state.user = null;
    render(<DashboardLayout><div /></DashboardLayout>);
    expect(screen.getByText("nexus-logo")).toBeInTheDocument();
    expect(screen.getByText("Institution")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("uses the institution logo and warns on non-active subscription states", () => {
    state.config = { branding: { displayName: "Green School", logoUrl: "https://cdn/logo.png" }, subscription: { planName: "Starter", status: "SUSPENDED" } };
    render(<DashboardLayout><div /></DashboardLayout>);
    expect(screen.getByAltText("Green School")).toHaveAttribute("src", "https://cdn/logo.png");
    expect(screen.queryByText("nexus-logo")).not.toBeInTheDocument();
    expect(screen.getByText("Starter · SUSPENDED").closest(".MuiChip-root")!.className).toMatch(/colorWarning/);
  });

  it("only highlights Overview on the exact dashboard route", () => {
    state.pathname = "/dashboard/finance";
    render(<DashboardLayout><div /></DashboardLayout>);
    const bg = (label: string) => getComputedStyle(screen.getByText(label).closest("[role=button]") as HTMLElement).backgroundColor;
    expect(bg("Finance")).not.toBe(bg("Overview"));
    expect(bg("People")).toBe(bg("Overview"));
  });

  it("applies valid branding hex colors and ignores invalid ones without crashing", () => {
    state.config = { branding: { displayName: "G", logoUrl: null, primaryColorLight: "#123456", secondaryColorLight: "nothex", backgroundColorLight: "#abc" }, subscription: null };
    render(<DashboardLayout><div>ok</div></DashboardLayout>);
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("collapses and expands the sidebar", () => {
    render(<DashboardLayout><div /></DashboardLayout>);
    expect(screen.getByText("year-selector")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("ChevronLeftIcon").closest("button")!);
    expect(screen.queryByText("year-selector")).not.toBeInTheDocument();
    expect(screen.queryByText("Back to Site")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("ChevronRightIcon").closest("button")!);
    expect(screen.getByText("year-selector")).toBeInTheDocument();
  });
});

describe("DashboardLayout actions", () => {
  it("opens the profile dialog", () => {
    render(<DashboardLayout><div /></DashboardLayout>);
    fireEvent.click(screen.getByTestId("PersonIcon").closest("button")!);
    expect(screen.getByText("profile-open")).toBeInTheDocument();
  });

  it("signs out after confirmation", async () => {
    render(<DashboardLayout><div /></DashboardLayout>);
    fireEvent.click(screen.getByTestId("LogoutIcon").closest("button")!);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/login"));
    expect(state.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Sign Out" }));
    expect(state.logout).toHaveBeenCalled();
    expect(state.clearAuth).toHaveBeenCalled();
  });

  it("keeps the session when sign-out is declined", async () => {
    state.confirm.mockResolvedValue(false);
    render(<DashboardLayout><div /></DashboardLayout>);
    fireEvent.click(screen.getByTestId("LogoutIcon").closest("button")!);
    await waitFor(() => expect(state.confirm).toHaveBeenCalled());
    expect(state.logout).not.toHaveBeenCalled();
    expect(state.clearAuth).not.toHaveBeenCalled();
  });
});
