import { afterEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { slugify, useSectionCrumb, useSectionCrumbLabel, useUrlSection } from "./urlSection";

afterEach(() => {
  window.history.replaceState(null, "", "/");
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

describe("useUrlSection", () => {
  it("reads the section from the address bar", () => {
    window.history.replaceState(null, "", "/dashboard/finance?section=fee-vouchers");

    const { result } = renderHook(() => useUrlSection());

    expect(result.current[0]).toBe("fee-vouchers");
  });

  it("is empty when the address has no section", () => {
    const { result } = renderHook(() => useUrlSection());

    expect(result.current[0]).toBeNull();
  });

  it("puts the section in the address bar, keeping the rest of it, and clears it again", () => {
    window.history.replaceState(null, "", "/dashboard/finance?campus=main");
    const { result } = renderHook(() => useUrlSection());

    act(() => result.current[1]("fee-vouchers"));
    expect(result.current[0]).toBe("fee-vouchers");
    expect(window.location.search).toBe("?campus=main&section=fee-vouchers");

    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
    expect(window.location.search).toBe("?campus=main");
  });

  it("adds one history entry per change, so back returns to the module page", () => {
    const { result } = renderHook(() => useUrlSection());
    const before = window.history.length;

    act(() => result.current[1]("fines"));
    act(() => result.current[1]("fines"));

    expect(window.history.length).toBe(before + 1);
  });

  it("follows the browser's back and forward buttons", () => {
    const { result } = renderHook(() => useUrlSection());
    act(() => result.current[1]("fines"));

    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toBeNull();
  });

  it("can use another parameter name", () => {
    window.history.replaceState(null, "", "/?tab=settings");
    const { result } = renderHook(() => useUrlSection("tab"));

    expect(result.current[0]).toBe("settings");
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
