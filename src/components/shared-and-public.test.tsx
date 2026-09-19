import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
  setAuth: vi.fn(),
  user: null as Record<string, unknown> | null,
  token: "tok" as string | null,
  sounds: { playSend: vi.fn(), playReceive: vi.fn(), playOpen: vi.fn(), playClose: vi.fn() },
}));

vi.mock("next/link", () => ({ default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => <a href={href} {...rest}>{children}</a> }));
vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user, accessToken: mocks.token, setAuth: mocks.setAuth }) }));
vi.mock("@/services/users.service", () => ({ usersService: { getMe: mocks.getMe, updateMe: mocks.updateMe } }));
vi.mock("@/components/shared/ThemeToggle", () => ({ default: () => <span>theme-toggle</span> }));
vi.mock("@/components/shared/NexusLogo", () => ({ default: () => <span>nexus-logo</span> }));
vi.mock("@/lib/chatSounds", () => mocks.sounds);

import ProfileDialog from "./shared/ProfileDialog";
import PublicNavbar from "./public/PublicNavbar";
import AiChatWidget from "./public/AiChatWidget";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: "u1", email: "old@x.io", name: "Old", role: "STAFF", institutionId: "i", sessionId: "s" };
  mocks.token = "tok";
  mocks.getMe.mockImplementation(() => ok({ id: "u1", name: "Old Name", email: "old@x.io", role: "STAFF" }));
  mocks.updateMe.mockImplementation(() => ok({ id: "u1", name: "New Name", email: "new@x.io", role: "STAFF" }));
});

describe("ProfileDialog", () => {
  it("does not fetch while closed", () => {
    render(<ProfileDialog open={false} onClose={() => {}} />);
    expect(mocks.getMe).not.toHaveBeenCalled();
  });

  it("loads the profile into the form and shows the role", async () => {
    render(<ProfileDialog open onClose={() => {}} />);
    expect(await screen.findByLabelText("Full Name")).toHaveValue("Old Name");
    expect(screen.getByLabelText("Email")).toHaveValue("old@x.io");
    expect(screen.getByText(/Signed in as STAFF/)).toBeInTheDocument();
  });

  it("saves only filled fields, refreshes the auth user and closes", async () => {
    const onClose = vi.fn();
    render(<ProfileDialog open onClose={onClose} />);
    fireEvent.change(await screen.findByLabelText("Full Name"), { target: { value: "New Name" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@x.io" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.updateMe).toHaveBeenCalledWith({ name: "New Name", email: "new@x.io" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.setAuth).toHaveBeenCalledWith(expect.objectContaining({ name: "New Name", email: "new@x.io", role: "STAFF" }), "tok");
  });

  it("includes a new password only when provided and enforces the 8 character minimum", async () => {
    render(<ProfileDialog open onClose={() => {}} />);
    const password = await screen.findByLabelText("New Password");
    const save = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.change(password, { target: { value: "short" } });
    expect(save).toBeDisabled();
    fireEvent.change(password, { target: { value: "longenough" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(mocks.updateMe).toHaveBeenCalledWith({ name: "Old Name", email: "old@x.io", password: "longenough" }));
  });

  it("blocks saving when name or email is cleared", async () => {
    render(<ProfileDialog open onClose={() => {}} />);
    fireEvent.change(await screen.findByLabelText("Full Name"), { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });

  it("stays open and does not touch the session when saving fails", async () => {
    mocks.updateMe.mockRejectedValue(new Error("Email taken"));
    const onClose = vi.fn();
    render(<ProfileDialog open onClose={onClose} />);
    await screen.findByLabelText("Full Name");
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Email taken", "error"));
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.setAuth).not.toHaveBeenCalled();
  });

  it("closes on cancel", async () => {
    const onClose = vi.fn();
    render(<ProfileDialog open onClose={onClose} />);
    await screen.findByLabelText("Full Name");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("PublicNavbar", () => {
  it("offers sign in to anonymous visitors", () => {
    mocks.user = null;
    render(<PublicNavbar />);
    expect(screen.getAllByRole("link", { name: /Sign In/ })[0]).toHaveAttribute("href", "/login");
    expect(screen.queryByText("Go to Dashboard")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
  });

  it("links signed-in users to their dashboard and superadmins to the platform console", () => {
    const { unmount } = render(<PublicNavbar />);
    expect(screen.getByRole("link", { name: "Go to Dashboard" })).toHaveAttribute("href", "/dashboard");
    unmount();
    mocks.user = { ...mocks.user, role: "SUPERADMIN" };
    render(<PublicNavbar />);
    expect(screen.getByRole("link", { name: "Go to Dashboard" })).toHaveAttribute("href", "/platform");
  });

  it("opens the features menu with every module link", () => {
    render(<PublicNavbar />);
    fireEvent.click(screen.getByRole("button", { name: /^Features/ }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: /All Features/ })).toHaveAttribute("href", "/features");
    expect(within(menu).getByRole("menuitem", { name: "Custom Fields" })).toHaveAttribute("href", "/features/custom-fields");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(9);
  });

  it("opens and closes the mobile drawer", async () => {
    render(<PublicNavbar />);
    fireEvent.click(screen.getByTestId("MenuIcon").closest("button")!);
    const drawer = await screen.findByRole("presentation", {}, { timeout: 2000 }).catch(() => null);
    expect(drawer).not.toBeNull();
    expect(screen.getAllByRole("link", { name: "FAQ" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTestId("CloseIcon").closest("button")!);
    await waitFor(() => expect(screen.queryByTestId("CloseIcon")).not.toBeInTheDocument());
  });

  it("scrolls to top instead of navigating when already on the home page", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, configurable: true, writable: true });
    render(<PublicNavbar />);
    const home = screen.getByText("nexus-logo").closest("a")!;
    fireEvent.click(home); // jsdom pathname is "/"
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("AiChatWidget", () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, "scrollIntoView", { value: vi.fn(), configurable: true, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const openChat = () => fireEvent.click(screen.getByTestId("SmartToyIcon").closest("button")!);

  it("toggles the panel and plays the matching sounds", () => {
    render(<AiChatWidget />);
    expect(screen.queryByPlaceholderText("Ask about Nexus...")).not.toBeInTheDocument();
    openChat();
    expect(mocks.sounds.playOpen).toHaveBeenCalled();
    expect(screen.getByText(/Hi! I'm Nexus AI/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId("CloseIcon")[0].closest("button")!);
    expect(screen.queryByPlaceholderText("Ask about Nexus...")).not.toBeInTheDocument();
    openChat();
    const icons = screen.getAllByTestId("CloseIcon");
    fireEvent.click(icons[icons.length - 1].closest("button")!);
    expect(screen.queryByPlaceholderText("Ask about Nexus...")).not.toBeInTheDocument();
    expect(mocks.sounds.playClose).toHaveBeenCalledTimes(1);
  });

  it("answers a typed question after a short delay and offers suggestions", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<AiChatWidget />);
    openChat();
    const input = screen.getByPlaceholderText("Ask about Nexus...");
    const send = screen.getAllByTestId("SendIcon")[0].closest("button")!;
    expect(send).toBeDisabled();
    fireEvent.change(input, { target: { value: "Tell me about attendance" } });
    fireEvent.click(send);
    expect(mocks.sounds.playSend).toHaveBeenCalled();
    expect(screen.getByText("Tell me about attendance")).toBeInTheDocument();
    expect(input).toHaveValue("");
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    expect(mocks.sounds.playReceive).toHaveBeenCalled();
    expect(screen.getByText(/Attendance module handles daily tracking/)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("sends on Enter but not on Shift+Enter, and ignores blank input", async () => {
    vi.useFakeTimers();
    render(<AiChatWidget />);
    openChat();
    const input = screen.getByPlaceholderText("Ask about Nexus...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.sounds.playSend).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "pricing" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(mocks.sounds.playSend).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.sounds.playSend).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  });

  it("sends a suggestion chip as a question", async () => {
    vi.useFakeTimers();
    render(<AiChatWidget />);
    openChat();
    fireEvent.click(screen.getByText("Show me pricing"));
    expect(screen.getAllByText("Show me pricing").length).toBeGreaterThan(0);
    expect(mocks.sounds.playSend).toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  });

  it("does not accept a second message while the assistant is typing", async () => {
    vi.useFakeTimers();
    render(<AiChatWidget />);
    openChat();
    const input = screen.getByPlaceholderText("Ask about Nexus...");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "again" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.sounds.playSend).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
  });

  it("turns URLs in replies into links, internal ones opening in the same tab", async () => {
    vi.useFakeTimers();
    render(<AiChatWidget />);
    openChat();
    const input = screen.getByPlaceholderText("Ask about Nexus...");
    fireEvent.change(input, { target: { value: "what is nexus" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === "http://localhost:3000/")!;
    expect(link).toHaveAttribute("target", "_self");
    expect(link).toHaveTextContent("nexus.wisemensoft.com");
  });
});
