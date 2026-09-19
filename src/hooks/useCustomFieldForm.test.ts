import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ getFormDefinitions: vi.fn() }));
vi.mock("@/services/customFields.service", () => ({ customFieldsService: { getFormDefinitions: mocks.getFormDefinitions } }));

import { useCustomFieldForm } from "./useCustomFieldForm";

const defs = [
  { id: "1", fieldKey: "code", label: "Code", inputType: "TEXT", isRequired: true, defaultValue: "D-1" },
  { id: "2", fieldKey: "tags", label: "Tags", inputType: "MULTI_SELECT", isRequired: true },
  { id: "3", fieldKey: "note", label: "Note", inputType: "TEXT", isRequired: false, defaultValue: "n" },
];

beforeEach(() => vi.clearAllMocks());

describe("useCustomFieldForm", () => {
  it("does nothing without an entity type", async () => {
    const { result } = renderHook(() => useCustomFieldForm());
    await act(async () => { await result.current.load("create"); });
    expect(mocks.getFormDefinitions).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.definitions).toEqual([]);
    expect(result.current.missingRequired).toBe(false);
  });

  it("loads definitions with the action and seeds defaults only on create", async () => {
    mocks.getFormDefinitions.mockResolvedValue({ data: { data: defs } });
    const { result } = renderHook(() => useCustomFieldForm("STUDENT", "inst"));
    await act(async () => { await result.current.load("create"); });
    expect(mocks.getFormDefinitions).toHaveBeenCalledWith({ entityType: "STUDENT", institutionId: "inst", action: "create" });
    expect(result.current.values).toEqual({ code: "D-1", tags: null, note: "n" });
    expect(result.current.missingRequired).toBe(true);

    act(() => result.current.setValues({ code: "x", tags: ["a"], note: null }));
    expect(result.current.missingRequired).toBe(false);

    await act(async () => { await result.current.load("update"); });
    expect(result.current.values).toEqual({ code: null, tags: null, note: null });
  });

  it("keeps saved falsy values rather than replacing them with defaults", async () => {
    mocks.getFormDefinitions.mockResolvedValue({ data: { data: defs } });
    const { result } = renderHook(() => useCustomFieldForm("STUDENT"));
    await act(async () => { await result.current.load("create", { code: "", note: 0 }); });
    expect(result.current.values.code).toBe("");
    expect(result.current.values.note).toBe(0);
  });

  it("treats empty arrays and empty strings as missing required values", async () => {
    mocks.getFormDefinitions.mockResolvedValue({ data: { data: defs } });
    const { result } = renderHook(() => useCustomFieldForm("STUDENT"));
    await act(async () => { await result.current.load("update", { code: "ok", tags: [] }); });
    expect(result.current.missingRequired).toBe(true);
    act(() => result.current.setValues({ code: "ok", tags: ["t"], note: null }));
    expect(result.current.missingRequired).toBe(false);
  });

  it("exposes a retry message when loading fails", async () => {
    mocks.getFormDefinitions.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useCustomFieldForm("STUDENT"));
    await act(async () => { await result.current.load("create"); });
    expect(result.current.error).toMatch(/could not be loaded/);
    expect(result.current.loading).toBe(false);
  });

  it("discards a stale response when a newer load starts", async () => {
    let releaseFirst!: (v: unknown) => void;
    mocks.getFormDefinitions
      .mockReturnValueOnce(new Promise((r) => { releaseFirst = r; }))
      .mockResolvedValueOnce({ data: { data: [defs[2]] } });
    const { result } = renderHook(() => useCustomFieldForm("STUDENT"));
    let first!: Promise<void>;
    act(() => { first = result.current.load("create"); });
    await act(async () => { await result.current.load("create"); });
    await act(async () => { releaseFirst({ data: { data: defs } }); await first; });
    expect(result.current.definitions.map((d) => d.fieldKey)).toEqual(["note"]);
  });

  it("reports loading while uploads are in flight", () => {
    const { result } = renderHook(() => useCustomFieldForm("STUDENT"));
    act(() => result.current.setUploading(true));
    act(() => result.current.setUploading(true));
    expect(result.current.loading).toBe(true);
    act(() => result.current.setUploading(false));
    expect(result.current.loading).toBe(true);
    act(() => result.current.setUploading(false));
    act(() => result.current.setUploading(false));
    expect(result.current.loading).toBe(false);
  });
});
