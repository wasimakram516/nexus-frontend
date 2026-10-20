import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ role: "ADMIN" as string | undefined }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.role ? { role: mocks.role } : null }) }));

import ScreenGuide, { SCREEN_GUIDE_KEY } from "@/components/guide/ScreenGuide";

beforeEach(() => {
  mocks.role = "ADMIN";
});

describe("ScreenGuide", () => {
  it("shows an institution admin the first-setup tip for the screen", () => {
    render(<ScreenGuide screen="campuses" />);
    expect(screen.getByRole("button", { name: "Hide guide" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Everything starts with a campus");
  });

  it("uses a different tip for each screen", () => {
    render(<ScreenGuide screen="academics" />);
    expect(screen.getByRole("status")).toHaveTextContent("levels first");
  });

  it.each(["STAFF", "STUDENT", "GUARDIAN", "SUPERADMIN"])("stays out of the way for %s", (role) => {
    mocks.role = role;
    const { container } = render(<ScreenGuide screen="people" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays out of the way when nobody is signed in", () => {
    mocks.role = undefined;
    const { container } = render(<ScreenGuide screen="people" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows once per screen per session, and one dismissal hides it on every screen", () => {
    const first = render(<ScreenGuide screen="campuses" />);
    first.unmount();
    render(<ScreenGuide screen="campuses" />);
    expect(screen.queryByRole("button", { name: "Hide guide" })).not.toBeInTheDocument();

    localStorage.setItem(SCREEN_GUIDE_KEY, "1");
    sessionStorage.clear();
    render(<ScreenGuide screen="people" />);
    expect(screen.queryByRole("button", { name: "Hide guide" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Show guide/ }));
    expect(localStorage.getItem(SCREEN_GUIDE_KEY)).toBeNull();
  });
});
