import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BrandingColorEditor from "./BrandingColorEditor";

describe("BrandingColorEditor readability warning", () => {
  it("says nothing while the colours are Nexus's own", () => {
    render(<BrandingColorEditor mode="light" value={{}} onChange={vi.fn()} />);

    expect(screen.queryByText(/hard to read/)).not.toBeInTheDocument();
  });

  it("lists each pair that falls short of WCAG AA once a colour is chosen badly", () => {
    render(<BrandingColorEditor mode="light" value={{ light: { "primary.main": "#ffee00", "primary.contrastText": "#ffffff" } }} onChange={vi.fn()} />);

    expect(screen.getByText(/Some of these colors may be hard to read/)).toBeInTheDocument();
    expect(screen.getByText(/The text on primary buttons would be hard to read/)).toBeInTheDocument();
    expect(screen.getByText(/Primary buttons and links on cards and panels would be hard to read/)).toBeInTheDocument();
  });

  it("only warns about the mode being edited", () => {
    render(<BrandingColorEditor mode="dark" value={{ light: { "primary.main": "#ffee00", "primary.contrastText": "#ffffff" } }} onChange={vi.fn()} />);

    expect(screen.queryByText(/hard to read/)).not.toBeInTheDocument();
  });
});
