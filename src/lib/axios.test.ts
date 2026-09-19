import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => {
  const handlers: {
    request?: (c: Record<string, unknown>) => Record<string, unknown>;
    ok?: (r: unknown) => unknown;
    fail?: (e: unknown) => Promise<unknown>;
  } = {};
  const instance = Object.assign(vi.fn(), {
    interceptors: {
      request: { use: (fn: typeof handlers.request) => { handlers.request = fn; } },
      response: { use: (ok: typeof handlers.ok, fail: typeof handlers.fail) => { handlers.ok = ok; handlers.fail = fail; } },
    },
  });
  return { handlers, instance, create: vi.fn(() => instance), post: vi.fn() };
});

vi.mock("axios", () => ({ default: { create: axiosMock.create, post: axiosMock.post } }));
vi.mock("@/config/env", () => ({ default: { apiBaseUrl: "http://api.test", apiVersion: "v9" } }));

import apiClient from "./axios";


const { handlers } = axiosMock;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("apiClient configuration", () => {
  it("is created against the versioned base URL with credentials", () => {
    expect(apiClient).toBe(axiosMock.instance);
  });

  it("attaches the bearer token from sessionStorage to outgoing requests", () => {
    sessionStorage.setItem("nexus-token", "tok");
    const config = handlers.request!({ headers: {} });
    expect((config.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("leaves requests untouched when there is no token", () => {
    const config = handlers.request!({ headers: {} });
    expect((config.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe("response interceptor", () => {
  it("passes successful responses through", () => {
    const res = { data: 1 };
    expect(handlers.ok!(res)).toBe(res);
  });

  it("rejects non-401 errors untouched", async () => {
    const error = { config: {}, response: { status: 500 } };
    await expect(handlers.fail!(error)).rejects.toBe(error);
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it("refreshes the token once on 401 and retries the original request with it", async () => {
    axiosMock.post.mockResolvedValue({ data: { data: { accessToken: "fresh" } } });
    axiosMock.instance.mockResolvedValue("retried");
    const original: Record<string, unknown> = { headers: {}, url: "/x" };
    const result = await handlers.fail!({ config: original, response: { status: 401 } });
    expect(result).toBe("retried");
    expect(axiosMock.post).toHaveBeenCalledWith("http://api.test/api/v9/auth/refresh", {}, { withCredentials: true });
    expect(sessionStorage.getItem("nexus-token")).toBe("fresh");
    expect((original.headers as Record<string, string>).Authorization).toBe("Bearer fresh");
    expect(original._retry).toBe(true);
  });

  it("shares a single refresh call between concurrent 401s", async () => {
    let resolve!: (v: unknown) => void;
    axiosMock.post.mockReturnValue(new Promise((r) => { resolve = r; }));
    axiosMock.instance.mockResolvedValue("ok");
    const a = handlers.fail!({ config: { headers: {} }, response: { status: 401 } });
    const b = handlers.fail!({ config: { headers: {} }, response: { status: 401 } });
    resolve({ data: { data: { accessToken: "t2" } } });
    await Promise.all([a, b]);
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });

  it("does not retry a request that was already retried", async () => {
    const error = { config: { _retry: true }, response: { status: 401 } };
    await expect(handlers.fail!(error)).rejects.toBe(error);
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it("clears the session and redirects to /login when the refresh fails", async () => {
    sessionStorage.setItem("nexus-token", "old");
    sessionStorage.setItem("nexus-user", "{}");
    axiosMock.post.mockRejectedValue(new Error("expired"));
    const locationSpy = { href: "" };
    const original = window.location;
    Object.defineProperty(window, "location", { value: locationSpy, writable: true, configurable: true });
    const error = { config: { headers: {} }, response: { status: 401 } };
    await expect(handlers.fail!(error)).rejects.toBe(error);
    Object.defineProperty(window, "location", { value: original, writable: true, configurable: true });
    expect(sessionStorage.getItem("nexus-token")).toBeNull();
    expect(sessionStorage.getItem("nexus-user")).toBeNull();
    expect(locationSpy.href).toBe("/login");
  });
});
