import { beforeEach, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useThemeMode } from "./ThemeContext";

function DefaultModeProbe({ preferred }: { preferred: string }) {
  const { mode, applyDefaultMode } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button onClick={() => applyDefaultMode(preferred)}>Apply</button>
    </div>
  );
}

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

  describe("the school's default mode", () => {
    beforeEach(() => localStorage.clear());

    it("is used when the person has not chosen a mode themselves", async () => {
      const user = userEvent.setup();
      render(<ThemeProvider><DefaultModeProbe preferred="dark" /></ThemeProvider>);

      await user.click(screen.getByRole("button", { name: "Apply" }));

      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    });

    it("never overrides a mode the person picked", async () => {
      localStorage.setItem("nexus-theme", "light");
      const user = userEvent.setup();
      render(<ThemeProvider><DefaultModeProbe preferred="dark" /></ThemeProvider>);

      await user.click(screen.getByRole("button", { name: "Apply" }));

      expect(screen.getByTestId("mode")).toHaveTextContent("light");
    });

    it("ignores a theme name that is neither light nor dark, such as 'default'", async () => {
      const user = userEvent.setup();
      render(<ThemeProvider><DefaultModeProbe preferred="default" /></ThemeProvider>);

      await user.click(screen.getByRole("button", { name: "Apply" }));

      expect(screen.getByTestId("mode")).toHaveTextContent("light");
    });
  });
});
