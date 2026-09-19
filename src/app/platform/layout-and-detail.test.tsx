import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: "/platform",
  params: { id: "green-school" },
  showMessage: vi.fn(),
  confirm: vi.fn(),
  clearAuth: vi.fn(),
  logout: vi.fn(),
  getInstitution: vi.fn(),
  getRuntimeConfig: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => mocks.pathname,
  useParams: () => mocks.params,
}));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/ConfirmContext", () => ({ useConfirm: () => mocks.confirm }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Super Admin", email: "root@nexus.io" }, clearAuth: mocks.clearAuth }),
}));
vi.mock("@/services/auth.service", () => ({ authService: { logout: mocks.logout } }));
vi.mock("@/services/platform.service", () => ({
  platformService: { getInstitution: mocks.getInstitution, getRuntimeConfig: mocks.getRuntimeConfig },
}));
vi.mock("@/components/shared/NexusLogo", () => ({ default: () => <span>logo</span> }));
vi.mock("@/components/shared/ThemeToggle", () => ({ default: () => <span>theme-toggle</span> }));
vi.mock("@/components/shared/ProfileDialog", () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>profile-dialog-open</div> : null),
}));
vi.mock("@/components/shared/PlatformBreadcrumbs", () => ({ default: () => <nav>crumbs</nav> }));
vi.mock("@/components/platform/InstitutionOverviewTab", () => ({
  default: ({ institution, onSaved }: { institution: { name: string }; onSaved: () => void }) => (
    <div>overview-tab {institution.name}<button onClick={onSaved}>saved</button></div>
  ),
}));
vi.mock("@/components/platform/InstitutionBrandingTab", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>branding-tab {institutionId}</div> }));
vi.mock("@/components/platform/InstitutionEntitlementsTab", () => ({ default: () => <div>entitlements-tab</div> }));
vi.mock("@/components/platform/InstitutionSubscriptionTab", () => ({ default: () => <div>subscription-tab</div> }));
vi.mock("@/components/platform/InstitutionSettingsTab", () => ({ default: () => <div>settings-tab</div> }));
vi.mock("@/components/platform/InstitutionPermissionsTab", () => ({ default: ({ institutionId }: { institutionId: string }) => <div>permissions-tab {institutionId}</div> }));

import PlatformLayout from "./layout";
import InstitutionDetailPage from "./institutions/[id]/page";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pathname = "/platform";
  mocks.params = { id: "green-school" };
  mocks.confirm.mockResolvedValue(true);
  mocks.logout.mockImplementation(() => ok());
});

describe("PlatformLayout", () => {
  it("renders navigation, the user and children, highlighting the active section", () => {
    mocks.pathname = "/platform/institutions/green";
    render(<PlatformLayout><div>child-content</div></PlatformLayout>);
    expect(screen.getByText("child-content")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByText("root@nexus.io")).toBeInTheDocument();
    const institutions = screen.getByText("Institutions").closest("[role=button]") as HTMLElement;
    const overview = screen.getByText("Overview").closest("[role=button]") as HTMLElement;
    expect(institutions.className).not.toBe(overview.className);
    fireEvent.click(screen.getByText("Plans"));
    expect(mocks.push).toHaveBeenCalledWith("/platform/plans");
    fireEvent.click(screen.getByText("Recycle Bin"));
    expect(mocks.push).toHaveBeenCalledWith("/platform/recycle-bin");
    expect(screen.getByText("Back to Site").closest("a")).toHaveAttribute("href", "/");
  });

  it("only treats /platform exactly as the Overview route", () => {
    mocks.pathname = "/platform/plans";
    render(<PlatformLayout><div /></PlatformLayout>);
    const overview = screen.getByText("Overview").closest("[role=button]") as HTMLElement;
    const plans = screen.getByText("Plans").closest("[role=button]") as HTMLElement;
    expect(getComputedStyle(plans).backgroundColor).not.toBe(getComputedStyle(overview).backgroundColor);
  });

  it("collapses and expands the sidebar, hiding labels when collapsed", () => {
    render(<PlatformLayout><div /></PlatformLayout>);
    expect(screen.getByText("Platform Console")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("ChevronLeftIcon").closest("button")!);
    expect(screen.queryByText("Platform Console")).not.toBeInTheDocument();
    expect(screen.queryByText("Back to Site")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("ChevronRightIcon").closest("button")!);
    expect(screen.getByText("Platform Console")).toBeInTheDocument();
  });

  it("opens the profile dialog", () => {
    render(<PlatformLayout><div /></PlatformLayout>);
    fireEvent.click(screen.getByTestId("PersonIcon").closest("button")!);
    expect(screen.getByText("profile-dialog-open")).toBeInTheDocument();
  });

  it("signs out after confirmation: logs out, clears auth and redirects to login", async () => {
    render(<PlatformLayout><div /></PlatformLayout>);
    fireEvent.click(screen.getByTestId("LogoutIcon").closest("button")!);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Sign Out", confirmLabel: "Sign Out" }));
    expect(mocks.logout).toHaveBeenCalled();
    expect(mocks.clearAuth).toHaveBeenCalled();
  });

  it("does nothing when the sign-out confirmation is declined", async () => {
    mocks.confirm.mockResolvedValue(false);
    render(<PlatformLayout><div /></PlatformLayout>);
    fireEvent.click(screen.getByTestId("LogoutIcon").closest("button")!);
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalled());
    expect(mocks.logout).not.toHaveBeenCalled();
    expect(mocks.clearAuth).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("still clears the local session when the logout request fails", async () => {
    mocks.logout.mockRejectedValue(new Error("network"));
    render(<PlatformLayout><div /></PlatformLayout>);
    fireEvent.click(screen.getByTestId("LogoutIcon").closest("button")!);
    await waitFor(() => expect(mocks.clearAuth).toHaveBeenCalled());
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });
});

describe("InstitutionDetailPage", () => {
  const inst = { id: "uuid-1", name: "Green School", slug: "green-school", status: "SUSPENDED" };

  beforeEach(() => {
    mocks.getInstitution.mockImplementation(() => ok(inst));
    mocks.getRuntimeConfig.mockImplementation(() => ok({ modules: {} }));
  });

  it("resolves the institution by slug and shows its identity and overview tab", async () => {
    render(<InstitutionDetailPage />);
    expect(await screen.findByText("overview-tab Green School")).toBeInTheDocument();
    expect(mocks.getInstitution).toHaveBeenCalledWith("green-school");
    expect(mocks.getRuntimeConfig).toHaveBeenCalledWith("green-school");
    expect(screen.getByText("SUSPENDED")).toBeInTheDocument();
    expect(screen.getByText("green-school")).toBeInTheDocument();
  });

  it("switches tabs and passes the resolved UUID to child tabs", async () => {
    render(<InstitutionDetailPage />);
    await screen.findByText(/overview-tab/);
    fireEvent.click(screen.getByRole("tab", { name: /Branding/ }));
    expect(screen.getByText("branding-tab uuid-1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Entitlements/ }));
    expect(screen.getByText("entitlements-tab")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Subscription/ }));
    expect(screen.getByText("subscription-tab")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Settings/ }));
    expect(screen.getByText("settings-tab")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Permissions/ }));
    expect(screen.getByText("permissions-tab uuid-1")).toBeInTheDocument();
  });

  it("refreshes using the UUID after a tab saves", async () => {
    render(<InstitutionDetailPage />);
    await screen.findByText(/overview-tab/);
    fireEvent.click(screen.getByText("saved"));
    await waitFor(() => expect(mocks.getInstitution).toHaveBeenLastCalledWith("uuid-1"));
    expect(mocks.getRuntimeConfig).toHaveBeenLastCalledWith("uuid-1");
  });

  it("opens the tenant dashboard by slug", async () => {
    render(<InstitutionDetailPage />);
    await screen.findByText(/overview-tab/);
    fireEvent.click(screen.getByRole("button", { name: /Open Dashboard/ }));
    expect(mocks.push).toHaveBeenCalledWith("/platform/institutions/green-school/manage");
  });

  it("shows not-found when the institution cannot be loaded", async () => {
    mocks.getInstitution.mockRejectedValue(Object.assign(new Error("nf"), { response: { status: 404 } }));
    mocks.getRuntimeConfig.mockRejectedValue(Object.assign(new Error("nf"), { response: { status: 404 } }));
    render(<InstitutionDetailPage />);
    expect(await screen.findByText("Institution not found.")).toBeInTheDocument();
  });
});
