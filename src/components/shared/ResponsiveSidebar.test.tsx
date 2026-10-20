import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ResponsiveSidebar from "@/components/shared/ResponsiveSidebar";
import MobileTopBar from "@/components/shared/MobileTopBar";

/** MUI's down("md") asks matchMedia for a max-width query; answer it as a phone-sized screen. */
function setViewport(mobile: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: mobile && query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => setViewport(false));

const content = (ctx: { compact: boolean; isMobile: boolean; closeMobile: () => void }) => (
  <div>
    <span>menu compact={String(ctx.compact)} mobile={String(ctx.isMobile)}</span>
    <button onClick={ctx.closeMobile}>nav item</button>
  </div>
);

describe("ResponsiveSidebar", () => {
  it("is a permanent sidebar on desktop and passes the collapsed state to its content", () => {
    setViewport(false);
    const { rerender } = render(
      <ResponsiveSidebar collapsed={false} desktopWidth={240} mobileOpen={false} onMobileClose={() => {}}>{content}</ResponsiveSidebar>,
    );
    expect(screen.getByText("menu compact=false mobile=false")).toBeInTheDocument();
    rerender(<ResponsiveSidebar collapsed desktopWidth={64} mobileOpen={false} onMobileClose={() => {}}>{content}</ResponsiveSidebar>);
    expect(screen.getByText("menu compact=true mobile=false")).toBeInTheDocument();
  });

  it("is hidden on a phone until the drawer is opened", () => {
    setViewport(true);
    const { rerender } = render(
      <ResponsiveSidebar collapsed={false} desktopWidth={240} mobileOpen={false} onMobileClose={() => {}}>{content}</ResponsiveSidebar>,
    );
    expect(screen.queryByText(/menu compact/)).not.toBeInTheDocument();
    rerender(<ResponsiveSidebar collapsed={false} desktopWidth={240} mobileOpen onMobileClose={() => {}}>{content}</ResponsiveSidebar>);
    expect(screen.getByText("menu compact=false mobile=true")).toBeInTheDocument();
  });

  it("always shows full labels in the phone drawer, even if the desktop rail is collapsed", () => {
    setViewport(true);
    render(<ResponsiveSidebar collapsed desktopWidth={64} mobileOpen onMobileClose={() => {}}>{content}</ResponsiveSidebar>);
    expect(screen.getByText("menu compact=false mobile=true")).toBeInTheDocument();
  });

  it("lets the content close the phone drawer", () => {
    setViewport(true);
    const onMobileClose = vi.fn();
    render(<ResponsiveSidebar collapsed={false} desktopWidth={240} mobileOpen onMobileClose={onMobileClose}>{content}</ResponsiveSidebar>);
    fireEvent.click(screen.getByRole("button", { name: "nav item" }));
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });
});

describe("MobileTopBar", () => {
  it("opens the navigation from the hamburger and shows the brand", () => {
    const onMenu = vi.fn();
    render(<MobileTopBar onMenu={onMenu}>Green School</MobileTopBar>);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Green School")).toBeInTheDocument();
  });
});
