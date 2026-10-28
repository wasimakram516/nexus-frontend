import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PeopleManager from "./PeopleManager";
import { ModuleBase, useSectionCrumbLabel } from "@/lib/urlSection";

const mocks = vi.hoisted(() => ({ get: vi.fn(), showMessage: vi.fn(), pathname: "/dashboard/people", push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname, useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => null }));
vi.mock("@/lib/users", () => ({ fetchAllUsers: async () => [] }));
vi.mock("@/components/dashboard/PeopleTab", () => ({
  default: ({ kind }: { kind: string }) => <div>open tab: {kind}</div>,
}));

function Crumb() {
  return <span data-testid="crumb">{useSectionCrumbLabel() ?? "none"}</span>;
}

const renderPeople = () =>
  render(<><Crumb /><ModuleBase path="/dashboard/people"><PeopleManager /></ModuleBase></>);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pathname = "/dashboard/people";
  mocks.get.mockImplementation(async (url: string) => ({
    data: { data: url === "/campuses" ? { items: [{ id: "campus", name: "Main Campus" }] } : [] },
  }));
});

describe("PeopleManager navigation", () => {
  it("goes to a real address when a section is opened", async () => {
    renderPeople();

    fireEvent.click(await screen.findByRole("button", { name: /Staff/ }));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard/people/staff");
  });

  it("stays on the section named in the address, so a refresh does not return to the hub", async () => {
    mocks.pathname = "/dashboard/people/staff";
    renderPeople();

    expect(await screen.findByText("open tab: staff")).toBeInTheDocument();
    expect(screen.getByTestId("crumb")).toHaveTextContent("Staff");
    expect(screen.getByRole("button", { name: "All People" })).toBeInTheDocument();
  });

  it("goes back to the module's own address from inside a section", async () => {
    mocks.pathname = "/dashboard/people/guardians";
    renderPeople();

    fireEvent.click(await screen.findByRole("button", { name: "All People" }));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard/people");
  });

  it("shows the hub for a section name it does not know", async () => {
    mocks.pathname = "/dashboard/people/nonsense";
    renderPeople();

    await waitFor(() => expect(mocks.get).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: /Students/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All People" })).not.toBeInTheDocument();
  });
});
