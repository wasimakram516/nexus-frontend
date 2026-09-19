import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider, useThemeMode } from "./ThemeContext";

const stored = {
  id: "u1",
  email: "root@nexus.io",
  name: "Super Admin",
  role: "SUPERADMIN" as const,
  institutionId: null,
  sessionId: "s1",
};

function AuthProbe() {
  const { user, isLoading } = useAuth();
  return <p>{isLoading ? "loading" : user ? `user:${user.name}` : "anonymous"}</p>;
}

function ThemeProbe() {
  const { mode } = useThemeMode();
  return <p>mode:{mode}</p>;
}

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

/** Server HTML is produced with the browser storage present, the worst case for hydration. */
function hydrate(tree: React.ReactElement) {
  container.innerHTML = renderToString(tree);
  const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
  let root!: ReturnType<typeof hydrateRoot>;
  act(() => {
    root = hydrateRoot(container, tree);
  });
  return { errors, root };
}

describe("hydration safety of the browser-storage contexts", () => {
  it("AuthProvider renders the same first output as the server, then restores the saved session", async () => {
    sessionStorage.setItem("nexus-user", JSON.stringify(stored));
    sessionStorage.setItem("nexus-token", "tok");
    const tree = (
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(renderToString(tree)).toContain("loading");
    expect(renderToString(tree)).not.toContain("Super Admin");

    const { errors, root } = hydrate(tree);
    await act(async () => {});

    expect(container.textContent).toBe("user:Super Admin");
    const hydrationErrors = errors.mock.calls.filter((call) => String(call[0]).includes("ydrat"));
    expect(hydrationErrors).toEqual([]);
    act(() => root.unmount());
  });

  it("AuthProvider settles to anonymous when nothing is stored", async () => {
    const tree = (
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );
    const { errors, root } = hydrate(tree);
    await act(async () => {});
    expect(container.textContent).toBe("anonymous");
    expect(errors.mock.calls.filter((call) => String(call[0]).includes("ydrat"))).toEqual([]);
    act(() => root.unmount());
  });

  it("AuthProvider ignores a half-stored or corrupted session", async () => {
    sessionStorage.setItem("nexus-user", "{not json");
    sessionStorage.setItem("nexus-token", "tok");
    const { root } = hydrate(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );
    await act(async () => {});
    expect(container.textContent).toBe("anonymous");
    act(() => root.unmount());
  });

  it("ThemeProvider renders light on the first pass and applies the saved theme after mount", async () => {
    localStorage.setItem("nexus-theme", "dark");
    const tree = (
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(renderToString(tree)).toContain("mode:<!-- -->light");

    const { errors, root } = hydrate(tree);
    await act(async () => {});

    expect(container.textContent).toBe("mode:dark");
    expect(errors.mock.calls.filter((call) => String(call[0]).includes("ydrat"))).toEqual([]);
    act(() => root.unmount());
  });

  it("ThemeProvider ignores an invalid stored value", async () => {
    localStorage.setItem("nexus-theme", "purple");
    const { root } = hydrate(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(container.textContent).toBe("mode:light");
    act(() => root.unmount());
  });
});
