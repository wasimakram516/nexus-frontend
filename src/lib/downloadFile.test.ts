import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadFile, filenameFromDisposition } from "./downloadFile";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/axios", () => ({ default: { get: mocks.get } }));

describe("filenameFromDisposition", () => {
  it.each([
    ['attachment; filename="FV-202610-R-1.pdf"', "FV-202610-R-1.pdf"],
    ["attachment; filename=report.pdf", "report.pdf"],
    ["attachment; filename*=UTF-8''fee%20vouchers.pdf", "fee vouchers.pdf"],
    [undefined, "fallback.pdf"],
    ["inline", "fallback.pdf"],
  ])("reads %s as %s", (header, name) => {
    expect(filenameFromDisposition(header, "fallback.pdf")).toBe(name);
  });
});

describe("downloadFile", () => {
  let click: ReturnType<typeof vi.fn>;
  let savedAs: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    savedAs = [];
    click = vi.fn(function (this: HTMLAnchorElement) {
      savedAs.push(this.download);
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click as never);
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks for the file as a download and saves it under the name the server gave", async () => {
    mocks.get.mockResolvedValue({
      data: new Blob(["%PDF-"]),
      headers: { "content-disposition": 'attachment; filename="FV-202610-R-1.pdf"' },
    });

    await downloadFile("/finance/fee-vouchers/v1/pdf", { month: 10 }, "fallback.pdf");

    expect(mocks.get).toHaveBeenCalledWith("/finance/fee-vouchers/v1/pdf", { params: { month: 10 }, responseType: "blob" });
    expect(click).toHaveBeenCalledTimes(1);
    expect(savedAs).toEqual(["FV-202610-R-1.pdf"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("falls back to the given name when the server suggests none", async () => {
    mocks.get.mockResolvedValue({ data: new Blob(["%PDF-"]), headers: {} });

    await downloadFile("/x/pdf", undefined, "fee-vouchers.pdf");

    expect(savedAs).toEqual(["fee-vouchers.pdf"]);
  });

  it("reads the server's message out of a failed download", async () => {
    mocks.get.mockRejectedValue({
      response: { status: 403, data: new Blob([JSON.stringify({ message: "You can only print your own vouchers." })]) },
      message: "Request failed",
    });

    await expect(downloadFile("/x/pdf")).rejects.toMatchObject({
      message: "You can only print your own vouchers.",
      response: { status: 403 },
    });
    expect(click).not.toHaveBeenCalled();
  });

  it("passes on an error that is not a readable message", async () => {
    const failure = Object.assign(new Error("Network Error"), { response: undefined });
    mocks.get.mockRejectedValue(failure);

    await expect(downloadFile("/x/pdf")).rejects.toBe(failure);
  });
});
