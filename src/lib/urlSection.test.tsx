import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { ModuleBase, sectionFromPath, slugify, useModuleSection, useSectionCrumb, useSectionCrumbLabel } from "./urlSection";

const mocks = vi.hoisted(() => ({ pathname: "/", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

beforeEach(() => {
  mocks.pathname = "/";
  mocks.push.mockReset();
});

describe("slugify", () => {
  it.each([
    ["Fee Vouchers", "fee-vouchers"],
    ["Recycle Bin, Payroll & Attendance", "recycle-bin-payroll-and-attendance"],
    ["  Student  Ledger  ", "student-ledger"],
    ["Grading Scales", "grading-scales"],
  ])("turns %s into %s", (label, slug) => {
    expect(slugify(label)).toBe(slug);
  });
});

describe("sectionFromPath", () => {
  it.each([
    ["/dashboard/finance", null],
    ["/dashboard/finance/", null],
    ["/dashboard/finance/fee-vouchers", "fee-vouchers"],
    ["/dashboard/finance/fee-vouchers/extra", "fee-vouchers"],
    ["/dashboard/finance/fee%20vouchers", "fee vouchers"],
    ["/dashboard/financeX/fee-vouchers", null],
    ["/dashboard/people/fee-vouchers", null],
    [null, null],
  ])("reads %s as %s", (pathname, section) => {
    expect(sectionFromPath(pathname, "/dashboard/finance")).toBe(section);
  });
});

describe("useModuleSection", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ModuleBase path="/dashboard/finance">{children}</ModuleBase>
  );

  it("reads the open section from the address below the module", () => {
    mocks.pathname = "/dashboard/finance/fee-vouchers";

    const { result } = renderHook(() => useModuleSection(), { wrapper });

    expect(result.current[0]).toBe("fee-vouchers");
  });

  it("is empty on the module's own page", () => {
    mocks.pathname = "/dashboard/finance";

    const { result } = renderHook(() => useModuleSection(), { wrapper });

    expect(result.current[0]).toBeNull();
  });

  it("navigates to a real address below the module, and back to the module's page for null", () => {
    mocks.pathname = "/dashboard/finance";
    const { result } = renderHook(() => useModuleSection(), { wrapper });

    act(() => result.current[1]("fines"));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard/finance/fines");

    act(() => result.current[1](null));
    expect(mocks.push).toHaveBeenLastCalledWith("/dashboard/finance");
  });

  it("follows the address when it changes, as it does for a breadcrumb or the back button", () => {
    mocks.pathname = "/dashboard/finance/fines";
    const { result, rerender } = renderHook(() => useModuleSection(), { wrapper });
    expect(result.current[0]).toBe("fines");

    mocks.pathname = "/dashboard/finance";
    rerender();

    expect(result.current[0]).toBeNull();
  });

  it("remembers the place in memory when it is not inside a module page", () => {
    const { result } = renderHook(() => useModuleSection());

    act(() => result.current[1]("fines"));

    expect(result.current[0]).toBe("fines");
    expect(mocks.push).not.toHaveBeenCalled();

    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
  });
});

describe("section breadcrumb", () => {
  function Reader() {
    return <span data-testid="crumb">{useSectionCrumbLabel() ?? "none"}</span>;
  }
  function Setter({ label }: { label: string | null }) {
    useSectionCrumb(label);
    return null;
  }

  it("shows the open place, changes with it, and clears when the module leaves", () => {
    const { rerender } = render(<><Reader /><Setter label="Fee Vouchers" /></>);
    expect(screen.getByTestId("crumb")).toHaveTextContent("Fee Vouchers");

    rerender(<><Reader /><Setter label="Fines" /></>);
    expect(screen.getByTestId("crumb")).toHaveTextContent("Fines");

    rerender(<><Reader /><Setter label={null} /></>);
    expect(screen.getByTestId("crumb")).toHaveTextContent("none");

    rerender(<><Reader /><Setter label="Fines" /></>);
    fireEvent.click(screen.getByTestId("crumb"));
    rerender(<Reader />);
    expect(screen.getByTestId("crumb")).toHaveTextContent("none");
  });
});
