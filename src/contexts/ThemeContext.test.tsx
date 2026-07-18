import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useThemeMode } from "./ThemeContext";

function ModeReadout() {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe("ThemeContext", () => {
  it("throws when useThemeMode is used outside a ThemeProvider", () => {
    // Guard pattern: the hook must fail loudly, not silently return a default.
    expect(() => render(<ModeReadout />)).toThrow(
      "useThemeMode must be used within ThemeProvider"
    );
  });

  it("defaults to light mode and toggles to dark on click", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ModeReadout />
      </ThemeProvider>
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("light");

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("persists the toggled mode to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ModeReadout />
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(window.localStorage.getItem("nexus-theme")).toBe("dark");
  });

  it("restores a previously persisted mode on mount", () => {
    window.localStorage.setItem("nexus-theme", "dark");
    render(
      <ThemeProvider>
        <ModeReadout />
      </ThemeProvider>
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });
});
