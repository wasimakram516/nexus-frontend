import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showMessage: vi.fn(),
  config: { permissionCatalog: [{ key: "finance.fees", label: "Fees", module: "FINANCE", actions: ["read"] }] } as unknown,
  canManageModule: vi.fn(() => true),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getStudents: vi.fn(),
  getStaffProfiles: vi.fn(),
  getGuardians: vi.fn(),
  getCampuses: vi.fn(),
  getLevels: vi.fn(),
  getClasses: vi.fn(),
  getSections: vi.fn(),
  fetchAllUsers: vi.fn(),
  peopleTabProps: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => ({ config: mocks.config }),
  useOptionalRuntimeConfig: () => ({ canManageModule: mocks.canManageModule }),
}));
vi.mock("@/services/roles.service", () => ({
  rolesService: { list: mocks.list, create: mocks.create, update: mocks.update, remove: mocks.remove },
}));
vi.mock("@/services/people.service", () => ({
  peopleService: { getStudents: mocks.getStudents, getStaffProfiles: mocks.getStaffProfiles, getGuardians: mocks.getGuardians },
}));
vi.mock("@/services/campuses.service", () => ({ campusesService: { getAll: mocks.getCampuses } }));
vi.mock("@/services/academics.service", () => ({
  academicsService: { getLevels: mocks.getLevels, getClasses: mocks.getClasses, getSections: mocks.getSections },
}));
vi.mock("@/lib/users", () => ({ fetchAllUsers: mocks.fetchAllUsers }));
vi.mock("@/components/dashboard/PeopleTab", () => ({
  default: (props: Record<string, unknown>) => {
    mocks.peopleTabProps(props);
    return <div>people-tab {String(props.kind)} rows={(props.rows as unknown[]).length} manage={String(props.canManage)}</div>;
  },
}));
vi.mock("@/components/dashboard/PermissionMatrixEditor", () => ({
  default: (props: { catalog: unknown[]; onChange: (v: unknown) => void }) => (
    <div>
      matrix catalog={props.catalog.length}
      <button onClick={() => props.onChange({ "finance.fees": { read: true } })}>grant-fees</button>
    </div>
  ),
}));

import RolesManager from "./RolesManager";
import PeopleManager from "./PeopleManager";
import OnboardingChecklist from "./OnboardingChecklist";
import CampusRequiredNotice from "./CampusRequiredNotice";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canManageModule.mockReturnValue(true);
});

describe("RolesManager", () => {
  const roles = [
    { id: "r1", name: "Front Desk", description: "Reception", permissions: { "finance.fees": { read: true, create: true } } },
    { id: "r2", name: "Observer", description: null, permissions: {} },
  ];

  beforeEach(() => {
    mocks.list.mockImplementation(() => ok(roles));
    mocks.create.mockImplementation(() => ok());
    mocks.update.mockImplementation(() => ok());
    mocks.remove.mockImplementation(() => ok());
  });

  it("lists roles with grant counts, scoped to an institution when provided", async () => {
    render(<RolesManager institutionId="inst-9" />);
    expect(await screen.findByText("Front Desk")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith("inst-9");
    expect(screen.getByText("2 permissions granted")).toBeInTheDocument();
    expect(screen.getByText("0 permissions granted")).toBeInTheDocument();
  });

  it("shows an empty state, and a single grant reads as singular", async () => {
    mocks.list.mockImplementation(() => ok([{ id: "r", name: "One", permissions: { a: { read: true } } }]));
    const { unmount } = render(<RolesManager />);
    expect(await screen.findByText("1 permission granted")).toBeInTheDocument();
    unmount();
    mocks.list.mockImplementation(() => ok([]));
    render(<RolesManager />);
    expect(await screen.findByText("No roles yet.")).toBeInTheDocument();
  });

  it("creates a role with the granted permissions from the matrix", async () => {
    render(<RolesManager />);
    await screen.findByText("Front Desk");
    fireEvent.click(screen.getByRole("button", { name: "New Role" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("matrix catalog=1")).toBeInTheDocument();
    const create = within(dialog).getByRole("button", { name: "Create" });
    expect(create).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText(/Role Name/), { target: { value: "Cashier" } });
    fireEvent.click(within(dialog).getByText("grant-fees"));
    fireEvent.click(create);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(
      { name: "Cashier", description: "", permissions: { "finance.fees": { read: true } } }, undefined,
    ));
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });

  it("edits a role, defaulting a null description to empty", async () => {
    render(<RolesManager institutionId="i1" />);
    await screen.findByText("Observer");
    fireEvent.click(screen.getAllByTestId("EditIcon")[1].closest("button")!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Description")).toHaveValue("");
    fireEvent.change(within(dialog).getByLabelText(/Role Name/), { target: { value: "Watcher" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("r2", { name: "Watcher", description: "", permissions: {} }, "i1"));
  });

  it("deletes only after confirming", async () => {
    render(<RolesManager />);
    await screen.findByText("Front Desk");
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0].closest("button")!);
    expect(await screen.findByText(/Delete "Front Desk"\?/)).toBeInTheDocument();
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("r1", undefined));
  });
});

describe("PeopleManager", () => {
  const person = (id: string, campusId: string) => ({ id, campusId, name: id });

  beforeEach(() => {
    mocks.getStudents.mockImplementation(() => ok([person("s1", "c1"), person("s2", "c2")]));
    mocks.getStaffProfiles.mockImplementation(() => ok([person("t1", "c1")]));
    mocks.getGuardians.mockImplementation(() => ok([]));
    mocks.getCampuses.mockImplementation(() => ok({ items: [{ id: "c1", name: "Main", institutionId: "i1" }, { id: "c2", name: "Other", institutionId: "i2" }] }));
    mocks.getLevels.mockImplementation(() => ok([{ id: "l1", name: "Lvl", campusId: "c1" }, { id: "l2", name: "L2", campusId: "c2" }]));
    mocks.getClasses.mockImplementation(() => ok([{ id: "k1", name: "K1", levelId: "l1" }, { id: "k2", name: "K2", levelId: "l2" }]));
    mocks.getSections.mockImplementation(() => ok([{ id: "e1", name: "A", classId: "k1" }, { id: "e2", name: "B", classId: "k2" }]));
    mocks.fetchAllUsers.mockResolvedValue([{ id: "u1", institutionId: "i1" }, { id: "u2", institutionId: "i2" }]);
  });

  it("shows a hub with per-kind counts and opens a section", async () => {
    render(<PeopleManager />);
    expect(await screen.findByText("Students")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Staff"));
    expect(await screen.findByText("people-tab staff rows=1 manage=true")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /All People/ }));
    expect(await screen.findByText("Guardians")).toBeInTheDocument();
  });

  it("scopes all data to the institution in platform-console mode", async () => {
    render(<PeopleManager institutionId="i1" />);
    fireEvent.click(await screen.findByText("Students"));
    expect(await screen.findByText("people-tab students rows=1 manage=true")).toBeInTheDocument();
    await waitFor(() => {
      const last = mocks.peopleTabProps.mock.calls.at(-1)![0];
      expect((last.campuses as unknown[]).length).toBe(1);
      expect((last.users as Array<{ id: string }>).map((u) => u.id)).toEqual(["u1"]);
      expect((last.classes as Array<{ id: string }>).map((c) => c.id)).toEqual(["k1"]);
      expect((last.sections as Array<{ id: string }>).map((s) => s.id)).toEqual(["e1"]);
    });
  });

  it("passes the runtime module permission through as canManage", async () => {
    mocks.canManageModule.mockReturnValue(false);
    render(<PeopleManager />);
    fireEvent.click(await screen.findByText("Guardians"));
    expect(await screen.findByText(/people-tab guardians rows=0 manage=false/)).toBeInTheDocument();
    expect(mocks.canManageModule).toHaveBeenCalledWith("PEOPLE");
  });

  it("asks for a campus first when none exist, linking to campus setup for institution admins", async () => {
    mocks.getCampuses.mockImplementation(() => ok({ items: [] }));
    render(<PeopleManager />);
    expect(await screen.findByText("Create a campus first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create Campus/ })).toHaveAttribute("href", "/dashboard/campuses");
  });

  it("tolerates a failing users fetch", async () => {
    mocks.fetchAllUsers.mockRejectedValue(new Error("no access"));
    render(<PeopleManager />);
    fireEvent.click(await screen.findByText("Students"));
    await waitFor(() => expect(mocks.peopleTabProps.mock.calls.at(-1)![0].users).toEqual([]));
  });
});

describe("CampusRequiredNotice", () => {
  it("omits the call to action without a target", () => {
    render(<CampusRequiredNotice moduleLabel="attendance" />);
    expect(screen.getByText(/Every attendance record belongs to a campus/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("OnboardingChecklist", () => {
  const steps = [
    { key: "campus", label: "Add a campus", description: "Create one", done: false, href: "/dashboard/campuses", required: true },
    { key: "people", label: "Add people", description: "Enroll", done: true, href: "/dashboard/people" },
    { key: "fees", label: "Set fees", description: "Fee plans", done: false, href: "/dashboard/finance" },
  ];

  it("renders progress, marks the required step and routes on click", () => {
    render(<OnboardingChecklist steps={steps} />);
    expect(screen.getByText(/1 of 3 steps done/)).toBeInTheDocument();
    expect(screen.getAllByText("Start here")).toHaveLength(1);
    expect(screen.queryByText("Enroll")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Set fees"));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/finance");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33.33333333333333");
  });

  it("renders nothing when complete or empty", () => {
    const { container, rerender } = render(<OnboardingChecklist steps={steps.map((s) => ({ ...s, done: true }))} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<OnboardingChecklist steps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays dismissed after 'I'll do this later' and persists the choice", () => {
    const { container, unmount } = render(<OnboardingChecklist steps={steps} />);
    fireEvent.click(screen.getByRole("button", { name: /do this later/ }));
    expect(container).toBeEmptyDOMElement();
    expect(localStorage.getItem("nexus-onboarding-dismissed")).toBe("1");
    unmount();
    const again = render(<OnboardingChecklist steps={steps} />);
    expect(again.container).toBeEmptyDOMElement();
  });

  it("re-shows the guide when the welcome flag is in the URL", () => {
    localStorage.setItem("nexus-onboarding-dismissed", "1");
    window.history.pushState({}, "", "/dashboard?welcome=1");
    render(<OnboardingChecklist steps={steps} />);
    expect(screen.getByText("Set up your institution")).toBeInTheDocument();
    expect(localStorage.getItem("nexus-onboarding-dismissed")).toBeNull();
    window.history.pushState({}, "", "/");
  });
});
