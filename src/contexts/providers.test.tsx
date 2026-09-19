import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({ getMyRuntimeConfig: vi.fn() }));
vi.mock("@/services/platform.service", () => ({ platformService: { getMyRuntimeConfig: mocks.getMyRuntimeConfig } }));

import { AuthProvider, useAuth, type AuthUser } from "./AuthContext";
import { ConfirmProvider, useConfirm } from "./ConfirmContext";
import { MessageProvider, useMessage } from "./MessageContext";
import { RuntimeConfigProvider, useOptionalRuntimeConfig, useRuntimeConfig, type RuntimeConfig } from "./RuntimeConfigContext";

const staff: AuthUser = { id: "u1", email: "s@x.io", name: "Sam", role: "STAFF", institutionId: "inst", sessionId: "s" };
const admin: AuthUser = { ...staff, role: "ADMIN" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

  it("throws outside a provider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
  });

  it("starts empty when nothing is stored", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("restores a stored user and token together", () => {
    sessionStorage.setItem("nexus-user", JSON.stringify(staff));
    sessionStorage.setItem("nexus-token", "tok");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toEqual(staff);
    expect(result.current.accessToken).toBe("tok");
  });

  it("treats a lone token, or corrupt user JSON, as no session", () => {
    sessionStorage.setItem("nexus-token", "tok");
    expect(renderHook(() => useAuth(), { wrapper }).result.current.user).toBeNull();
    sessionStorage.setItem("nexus-user", "{bad");
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it("setAuth persists, updateToken rotates, clearAuth wipes storage and the auth cookie", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => result.current.setAuth(staff, "t1"));
    expect(result.current.user).toEqual(staff);
    expect(sessionStorage.getItem("nexus-token")).toBe("t1");
    expect(JSON.parse(sessionStorage.getItem("nexus-user")!)).toEqual(staff);

    act(() => result.current.updateToken("t2"));
    expect(result.current.accessToken).toBe("t2");
    expect(sessionStorage.getItem("nexus-token")).toBe("t2");

    document.cookie = "isAuthenticated=true; path=/";
    act(() => result.current.clearAuth());
    expect(result.current.user).toBeNull();
    expect(sessionStorage.getItem("nexus-user")).toBeNull();
    expect(sessionStorage.getItem("nexus-token")).toBeNull();
    expect(document.cookie).not.toContain("isAuthenticated=true");
  });
});

describe("ConfirmContext", () => {
  function Harness({ onResult }: { onResult: (v: boolean) => void }) {
    const confirm = useConfirm();
    return (
      <button onClick={async () => onResult(await confirm({ title: "Delete it", message: "Really?", confirmLabel: "Yes do it" }))}>
        ask
      </button>
    );
  }

  it("throws outside a provider", () => {
    expect(() => renderHook(() => useConfirm())).toThrow("useConfirm must be used within ConfirmProvider");
  });

  it("resolves true when confirmed and shows the requested copy", async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);
    fireEvent.click(screen.getByText("ask"));
    expect(await screen.findByText("Delete it")).toBeInTheDocument();
    expect(screen.getByText("Really?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Yes do it/ }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it("resolves false when cancelled", async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);
    fireEvent.click(screen.getByText("ask"));
    await screen.findByText("Delete it");
    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });
});

describe("MessageContext", () => {
  function Harness() {
    const { showMessage } = useMessage();
    return (
      <>
        <button onClick={() => showMessage("Saved OK", "success")}>ok</button>
        <button onClick={() => showMessage("Plain")}>plain</button>
      </>
    );
  }

  it("throws outside a provider", () => {
    expect(() => renderHook(() => useMessage())).toThrow("useMessage must be used within MessageProvider");
  });

  it("renders the message with its severity and can be dismissed", async () => {
    render(<MessageProvider><Harness /></MessageProvider>);
    fireEvent.click(screen.getByText("ok"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Saved OK");
    expect(alert.className).toMatch(/Success/);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(screen.queryByText("Saved OK")).not.toBeInTheDocument());
  });

  it("defaults the severity to info", async () => {
    render(<MessageProvider><Harness /></MessageProvider>);
    fireEvent.click(screen.getByText("plain"));
    expect((await screen.findByRole("alert")).className).toMatch(/Info/);
  });
});

describe("RuntimeConfigContext", () => {
  const baseConfig: RuntimeConfig = {
    institutionId: "inst",
    branding: null,
    settings: {},
    modules: { FINANCE: { enabled: true, configuration: {} }, ATTENDANCE: { enabled: false, configuration: {} } },
    subscription: null,
    permissions: { "finance.fees": { read: true }, "people.students": { update: true } },
    permissionCatalog: [
      { key: "finance.fees", label: "Fees", module: "FINANCE", actions: ["read", "create"] },
      { key: "people.students", label: "Students", module: "PEOPLE", actions: ["read", "update"] },
    ],
  };

  /** Wraps hooks with a fake auth session by seeding sessionStorage. */
  function wrapperFor(user: AuthUser | null) {
    if (user) {
      sessionStorage.setItem("nexus-user", JSON.stringify(user));
      sessionStorage.setItem("nexus-token", "tok");
    }
    return function W({ children }: { children: ReactNode }) {
      return <AuthProvider><RuntimeConfigProvider>{children}</RuntimeConfigProvider></AuthProvider>;
    };
  }

  it("useRuntimeConfig throws outside a provider while the optional variant returns null", () => {
    expect(() => renderHook(() => useRuntimeConfig())).toThrow("useRuntimeConfig must be used within RuntimeConfigProvider");
    expect(renderHook(() => useOptionalRuntimeConfig()).result.current).toBeNull();
  });

  it("does not fetch for users without an institution", async () => {
    const { result } = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor({ ...staff, institutionId: null }) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.config).toBeNull();
    expect(mocks.getMyRuntimeConfig).not.toHaveBeenCalled();
  });

  it("loads config, evaluates module flags and per-feature permissions for staff", async () => {
    mocks.getMyRuntimeConfig.mockResolvedValue({ data: { data: baseConfig } });
    const { result } = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor(staff) });
    await waitFor(() => expect(result.current.config).not.toBeNull());
    expect(result.current.isModuleEnabled("FINANCE")).toBe(true);
    expect(result.current.isModuleEnabled("ATTENDANCE")).toBe(false);
    expect(result.current.isModuleEnabled("PEOPLE")).toBe(false);
    expect(result.current.can("finance.fees", "read")).toBe(true);
    expect(result.current.can("finance.fees", "delete")).toBe(false);
    expect(result.current.can("nothing", "read")).toBe(false);
    expect(result.current.canViewModule("FINANCE")).toBe(true);
    expect(result.current.canManageModule("FINANCE")).toBe(false);
    expect(result.current.canManageModule("PEOPLE")).toBe(true);
    expect(result.current.canViewModule("PEOPLE")).toBe(false);
    expect(result.current.trialDaysLeft).toBeNull();
  });

  it("grants admins full access regardless of permission map", async () => {
    mocks.getMyRuntimeConfig.mockResolvedValue({ data: { data: { ...baseConfig, permissions: null } } });
    const { result } = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor(admin) });
    await waitFor(() => expect(result.current.config).not.toBeNull());
    expect(result.current.can("anything", "delete")).toBe(true);
    expect(result.current.canViewModule("REPORTING")).toBe(true);
    expect(result.current.canManageModule("REPORTING")).toBe(true);
  });

  it("computes remaining trial days, negative once expired, and null for non-trials", async () => {
    const inDays = (d: number) => new Date(Date.now() + d * 86_400_000 - 1000).toISOString();
    const sub = (status: string, endsAt: string | null) => ({
      id: "s", status, planId: null, planKey: null, planName: null, autoRenew: false, startsAt: null, endsAt,
    });
    mocks.getMyRuntimeConfig.mockResolvedValue({ data: { data: { ...baseConfig, subscription: sub("TRIAL", inDays(5)) } } });
    const trial = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor(staff) });
    await waitFor(() => expect(trial.result.current.trialDaysLeft).toBe(5));

    mocks.getMyRuntimeConfig.mockResolvedValue({ data: { data: { ...baseConfig, subscription: sub("TRIAL", inDays(-3)) } } });
    const expired = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor(staff) });
    await waitFor(() => expect(expired.result.current.trialDaysLeft).toBeLessThan(0));

    mocks.getMyRuntimeConfig.mockResolvedValue({ data: { data: { ...baseConfig, subscription: sub("ACTIVE", inDays(5)) } } });
    const active = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor(staff) });
    await waitFor(() => expect(active.result.current.config).not.toBeNull());
    expect(active.result.current.trialDaysLeft).toBeNull();
  });

  it("falls back to null config when the request fails and refresh re-fetches", async () => {
    mocks.getMyRuntimeConfig.mockRejectedValueOnce(new Error("down"));
    const { result } = renderHook(() => useRuntimeConfig(), { wrapper: wrapperFor(staff) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.config).toBeNull();
    mocks.getMyRuntimeConfig.mockResolvedValue({ data: { data: baseConfig } });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.config?.institutionId).toBe("inst");
  });
});
