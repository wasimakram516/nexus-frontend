import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authService } from "@/services/auth.service";
import SessionsDialog, { isActiveSession } from "./SessionsDialog";

const confirm = vi.fn();
const clearAuth = vi.fn();

vi.mock("@/contexts/ConfirmContext", () => ({ useConfirm: () => confirm }));
const messages = { showMessage: vi.fn() };
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => messages }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ clearAuth }) }));
vi.mock("@/services/auth.service", () => ({
  authService: { getSessions: vi.fn(), revokeSession: vi.fn(), revokeAllSessions: vi.fn() },
}));

const chrome = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
const phone = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36";
const future = "2099-01-01T00:00:00.000Z";
const rows = [
  { id: "s1", createdAt: "2026-10-27T08:00:00.000Z", expiresAt: future, revokedAt: null, userAgent: chrome, ipAddress: "10.0.0.1" },
  { id: "s2", createdAt: "2026-10-26T08:00:00.000Z", expiresAt: future, revokedAt: null, userAgent: phone, ipAddress: null },
  { id: "s3", createdAt: "2026-10-01T08:00:00.000Z", expiresAt: future, revokedAt: "2026-10-02T00:00:00.000Z", userAgent: chrome, ipAddress: null },
  { id: "s4", createdAt: "2026-01-01T08:00:00.000Z", expiresAt: "2026-02-01T00:00:00.000Z", revokedAt: null, userAgent: chrome, ipAddress: null },
];

describe("isActiveSession", () => {
  it("is false once signed out or past its end date", () => {
    expect(isActiveSession(rows[0])).toBe(true);
    expect(isActiveSession(rows[2])).toBe(false);
    expect(isActiveSession(rows[3])).toBe(false);
  });
});

describe("SessionsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getSessions).mockResolvedValue({ data: { data: rows } } as never);
    vi.mocked(authService.revokeSession).mockResolvedValue({ data: { data: null } } as never);
    vi.mocked(authService.revokeAllSessions).mockResolvedValue({ data: { data: null } } as never);
    confirm.mockResolvedValue(true);
  });

  it("lists only the sign-ins still in use, named by device", async () => {
    render(<SessionsDialog open onClose={vi.fn()} />);

    expect(await screen.findByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("Chrome on Android")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(2);
  });

  it("signs out one device after confirming, then reloads the list", async () => {
    const user = userEvent.setup();
    render(<SessionsDialog open onClose={vi.fn()} />);
    await screen.findByText("Chrome on Windows");

    await user.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    await waitFor(() => expect(authService.revokeSession).toHaveBeenCalledWith("s1"));
    await waitFor(() => expect(authService.getSessions).toHaveBeenCalledTimes(2));
  });

  it("does nothing when the person backs out of the confirmation", async () => {
    confirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<SessionsDialog open onClose={vi.fn()} />);
    await screen.findByText("Chrome on Windows");

    await user.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    expect(authService.revokeSession).not.toHaveBeenCalled();
  });

  it("signs out everywhere and clears this device's own sign-in too", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const user = userEvent.setup();
    render(<SessionsDialog open onClose={vi.fn()} />);
    await screen.findByText("Chrome on Windows");

    await user.click(screen.getByRole("button", { name: "Sign out everywhere" }));

    await waitFor(() => expect(authService.revokeAllSessions).toHaveBeenCalled());
    await waitFor(() => expect(clearAuth).toHaveBeenCalled());
    expect(assign).toHaveBeenCalledWith("/login");
    vi.unstubAllGlobals();
  });
});
