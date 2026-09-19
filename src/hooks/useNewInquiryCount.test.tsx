import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { setInquirySoundEnabled } from "@/lib/chatSounds";

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, (arg?: unknown) => void>();
  const socket = {
    on: vi.fn((ev: string, fn: (arg?: unknown) => void) => { handlers.set(ev, fn); }),
    off: vi.fn(),
    disconnect: vi.fn(),
  };
  return { getAll: vi.fn(), showMessage: vi.fn(), playInquiry: vi.fn(), handlers, socket, io: vi.fn(() => socket) };
});

vi.mock("socket.io-client", () => ({ io: mocks.io }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/lib/chatSounds", async (orig) => ({ ...(await orig<typeof import("@/lib/chatSounds")>()), playInquiry: mocks.playInquiry }));

vi.mock("@/services/contact.service", () => ({
  contactInquiriesService: { getAll: mocks.getAll },
}));

import { notifyInquiriesChanged, useNewInquiryCount } from "./useNewInquiryCount";

const reply = (total: number) => Promise.resolve({ data: { data: { items: [], total }, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.io.mockImplementation(() => mocks.socket);
  mocks.getAll.mockImplementation(() => reply(0));
});

describe("useNewInquiryCount", () => {
  it("asks only for the total of NEW inquiries and returns it", async () => {
    mocks.getAll.mockImplementation(() => reply(5));
    const { result } = renderHook(() => useNewInquiryCount());
    await waitFor(() => expect(result.current).toBe(5));
    expect(mocks.getAll).toHaveBeenCalledWith({ status: "NEW", page: 1, limit: 1 });
  });

  it("starts at 0 and keeps the last known count when a refetch fails", async () => {
    mocks.getAll.mockImplementationOnce(() => reply(2));
    const { result } = renderHook(() => useNewInquiryCount());
    expect(result.current).toBe(0);
    await waitFor(() => expect(result.current).toBe(2));

    mocks.getAll.mockRejectedValue(new Error("network"));
    act(() => notifyInquiriesChanged());
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(2));
    expect(result.current).toBe(2);
  });

  it("refetches when notifyInquiriesChanged is called", async () => {
    mocks.getAll.mockImplementationOnce(() => reply(3));
    const { result } = renderHook(() => useNewInquiryCount());
    await waitFor(() => expect(result.current).toBe(3));

    mocks.getAll.mockImplementation(() => reply(2));
    act(() => notifyInquiriesChanged());
    await waitFor(() => expect(result.current).toBe(2));
  });

  it("refetches when the refresh key changes and stops listening after unmount", async () => {
    const { rerender, unmount } = renderHook(({ k }) => useNewInquiryCount(k), {
      initialProps: { k: "/platform" },
    });
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(1));
    rerender({ k: "/platform/plans" });
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(2));

    unmount();
    notifyInquiriesChanged();
    await new Promise((r) => setTimeout(r, 20));
    expect(mocks.getAll).toHaveBeenCalledTimes(2);
  });
});

describe("useNewInquiryCount realtime", () => {
  const emit = (name = "Ada") => act(() => mocks.handlers.get("inquiry.created")?.({ id: "1", name, inquiryType: "Other", createdAt: "" }));

  beforeEach(() => {
    mocks.handlers.clear();
    sessionStorage.setItem("nexus-token", "tok-1");
  });

  it("connects to <API>/realtime with a token function that reads the fresh token", () => {
    renderHook(() => useNewInquiryCount());
    expect(mocks.io).toHaveBeenCalledTimes(1);
    const [url, opts] = mocks.io.mock.calls[0] as unknown as [string, { auth: (cb: (d: unknown) => void) => void }];
    expect(url).toBe("http://localhost:4000/realtime");
    const cb = vi.fn();
    sessionStorage.setItem("nexus-token", "tok-2");
    opts.auth(cb);
    expect(cb).toHaveBeenCalledWith({ token: "tok-2" });
  });

  it("opens no socket without a token", () => {
    sessionStorage.clear();
    renderHook(() => useNewInquiryCount());
    expect(mocks.io).not.toHaveBeenCalled();
  });

  it("shares one connection and closes it after the last consumer unmounts", () => {
    const a = renderHook(() => useNewInquiryCount());
    const b = renderHook(() => useNewInquiryCount("/x", { announce: true }));
    expect(mocks.io).toHaveBeenCalledTimes(1);
    a.unmount();
    expect(mocks.socket.disconnect).not.toHaveBeenCalled();
    b.unmount();
    expect(mocks.socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("plays the chime, refetches the authoritative count and shows a message on the event", async () => {
    const { result } = renderHook(() => useNewInquiryCount("/p", { announce: true }));
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(1));
    mocks.getAll.mockImplementation(() => reply(7));
    emit("Ada");
    await waitFor(() => expect(result.current).toBe(7));
    expect(mocks.playInquiry).toHaveBeenCalledTimes(1);
    expect(mocks.showMessage).toHaveBeenCalledWith("New inquiry from Ada", "info");
  });

  it("does not play or toast for a non-announcing consumer but still refetches", async () => {
    renderHook(() => useNewInquiryCount());
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(1));
    emit();
    await waitFor(() => expect(mocks.getAll).toHaveBeenCalledTimes(2));
    expect(mocks.playInquiry).not.toHaveBeenCalled();
    expect(mocks.showMessage).not.toHaveBeenCalled();
  });

  it("respects the muted sound preference but still toasts", async () => {
    setInquirySoundEnabled(false);
    renderHook(() => useNewInquiryCount("/p", { announce: true }));
    emit();
    expect(mocks.playInquiry).not.toHaveBeenCalled();
    expect(mocks.showMessage).toHaveBeenCalled();
  });

  it("falls back to a 60s refetch while visible and never toasts on connect errors", async () => {
    vi.useFakeTimers();
    try {
      renderHook(() => useNewInquiryCount());
      await vi.advanceTimersByTimeAsync(0);
      const before = mocks.getAll.mock.calls.length;
      await vi.advanceTimersByTimeAsync(60_000);
      expect(mocks.getAll.mock.calls.length).toBe(before + 1);
      mocks.handlers.get("connect_error")?.(new Error("blocked"));
      expect(mocks.showMessage).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
