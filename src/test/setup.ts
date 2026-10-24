import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

// jsdom doesn't implement matchMedia; MUI's theme/breakpoint hooks call it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Never open a real socket from any test; suites that care re-mock this.
vi.mock("socket.io-client", () => ({
  io: () => ({ on: () => undefined, off: () => undefined, disconnect: () => undefined }),
}));
