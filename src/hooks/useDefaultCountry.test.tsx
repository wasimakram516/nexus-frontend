import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDefaultCountry } from "./useDefaultCountry";

const mocks = vi.hoisted(() => ({ runtime: null as unknown, getRuntimeConfig: vi.fn() }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => mocks.runtime }));
vi.mock("@/services/platform.service", () => ({ platformService: { getRuntimeConfig: mocks.getRuntimeConfig } }));

beforeEach(() => {
  mocks.runtime = null;
  mocks.getRuntimeConfig.mockReset();
});

describe("useDefaultCountry", () => {
  it("reads the signed-in school's country", () => {
    mocks.runtime = { config: { defaultCountry: "AE" } };
    expect(renderHook(() => useDefaultCountry()).result.current).toBe("AE");
  });

  it("falls back to Pakistan when the school has none", () => {
    mocks.runtime = { config: {} };
    expect(renderHook(() => useDefaultCountry()).result.current).toBe("PK");
    mocks.runtime = null;
    expect(renderHook(() => useDefaultCountry()).result.current).toBe("PK");
  });

  it("reads the school being viewed in the platform console", async () => {
    mocks.getRuntimeConfig.mockResolvedValue({ data: { data: { defaultCountry: "SA" } } });
    const { result } = renderHook(() => useDefaultCountry("inst-1"));

    await waitFor(() => expect(result.current).toBe("SA"));
    expect(mocks.getRuntimeConfig).toHaveBeenCalledWith("inst-1");
  });

  it("stays on the fallback when the school cannot be read", async () => {
    mocks.getRuntimeConfig.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useDefaultCountry("inst-1"));

    await waitFor(() => expect(mocks.getRuntimeConfig).toHaveBeenCalled());
    expect(result.current).toBe("PK");
  });
});
