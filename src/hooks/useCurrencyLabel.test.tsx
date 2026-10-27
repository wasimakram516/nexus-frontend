import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { platformService } from "@/services/platform.service";
import { useCurrencyLabel } from "./useCurrencyLabel";

vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: vi.fn() }));
vi.mock("@/services/platform.service", () => ({ platformService: { getRuntimeConfig: vi.fn() } }));

function Label({ institutionId }: { institutionId?: string }) {
  return <span data-testid="label">{useCurrencyLabel(institutionId)}</span>;
}

const withSettings = (settings: unknown) => vi.mocked(useOptionalRuntimeConfig).mockReturnValue({ config: { settings } } as never);

describe("useCurrencyLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOptionalRuntimeConfig).mockReturnValue(null);
  });

  it("uses the label the school chose", () => {
    withSettings({ finance: { currencyLabel: "SAR" } });
    render(<Label />);

    expect(screen.getByTestId("label")).toHaveTextContent("SAR");
  });

  it.each([
    ["no settings at all", undefined],
    ["no finance setting", { exams: {} }],
    ["a blank label", { finance: { currencyLabel: "   " } }],
    ["a label that is not text", { finance: { currencyLabel: 5 } }],
  ])("falls back to Rs. with %s", (_name, settings) => {
    withSettings(settings);
    render(<Label />);

    expect(screen.getByTestId("label")).toHaveTextContent("Rs.");
  });

  it("falls back to Rs. outside a school's session", () => {
    render(<Label />);

    expect(screen.getByTestId("label")).toHaveTextContent("Rs.");
  });

  it("for the institution a superadmin is viewing, reads that institution's setting, not the viewer's", async () => {
    withSettings({ finance: { currencyLabel: "WRONG" } });
    vi.mocked(platformService.getRuntimeConfig).mockResolvedValue({ data: { data: { settings: { finance: { currencyLabel: "AED" } } } } } as never);
    render(<Label institutionId="inst-1" />);

    await waitFor(() => expect(screen.getByTestId("label")).toHaveTextContent("AED"));
    expect(platformService.getRuntimeConfig).toHaveBeenCalledWith("inst-1");
  });

  it("shows Rs. while that is loading, and when it cannot be loaded", async () => {
    vi.mocked(platformService.getRuntimeConfig).mockRejectedValue(new Error("offline"));
    render(<Label institutionId="inst-1" />);

    expect(screen.getByTestId("label")).toHaveTextContent("Rs.");
    await waitFor(() => expect(platformService.getRuntimeConfig).toHaveBeenCalled());
    expect(screen.getByTestId("label")).toHaveTextContent("Rs.");
  });
});
