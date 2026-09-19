import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  submitInquiry: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/contact.service", () => ({ contactService: { submitInquiry: mocks.submitInquiry } }));

import ContactForm from "./ContactForm";

const fill = () => {
  fireEvent.change(screen.getByLabelText(/Full Name/), { target: { name: "name", value: "Ada" } });
  fireEvent.change(screen.getByLabelText(/Email Address/), { target: { name: "email", value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText(/Institution/), { target: { name: "institution", value: "Acme School" } });
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(within(screen.getByRole("listbox")).getByText("Pricing Question"));
  fireEvent.change(screen.getByLabelText(/^Message/), { target: { name: "message", value: "Hello there" } });
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: /Send Message/ }));

const httpError = (status: number, message?: unknown) => ({ response: { status, data: { message } } });

beforeEach(() => vi.clearAllMocks());

describe("ContactForm", () => {
  it("posts the mapped payload, shows success only after it resolves and clears the form", async () => {
    let resolve!: () => void;
    mocks.submitInquiry.mockImplementation(() => new Promise<void>((r) => { resolve = r; }));
    render(<ContactForm />);
    fill();
    submit();

    expect(mocks.submitInquiry).toHaveBeenCalledWith({
      name: "Ada",
      email: "ada@example.com",
      organisation: "Acme School",
      inquiryType: "Pricing Question",
      message: "Hello there",
      website: "",
    });
    expect(screen.getByRole("button")).toBeDisabled();
    expect(mocks.showMessage).not.toHaveBeenCalled();

    resolve();
    await waitFor(() =>
      expect(mocks.showMessage).toHaveBeenCalledWith(expect.stringContaining("Message sent"), "success"),
    );
    expect(screen.getByLabelText(/Full Name/)).toHaveValue("");
    expect(screen.getByRole("button", { name: /Send Message/ })).toBeEnabled();
  });

  it("keeps the entered data and shows a network error", async () => {
    mocks.submitInquiry.mockRejectedValue(new Error("Network Error"));
    render(<ContactForm />);
    fill();
    submit();
    await waitFor(() =>
      expect(mocks.showMessage).toHaveBeenCalledWith(expect.stringContaining("could not reach the server"), "error"),
    );
    expect(screen.getByLabelText(/Full Name/)).toHaveValue("Ada");
    expect(screen.getByLabelText(/^Message/)).toHaveValue("Hello there");
    expect(screen.getByRole("button", { name: /Send Message/ })).toBeEnabled();
  });

  it("shows a rate limit message on 429 without clearing the form", async () => {
    mocks.submitInquiry.mockRejectedValue(httpError(429));
    render(<ContactForm />);
    fill();
    submit();
    await waitFor(() =>
      expect(mocks.showMessage).toHaveBeenCalledWith(expect.stringContaining("Too many messages"), "error"),
    );
    expect(screen.getByLabelText(/Email Address/)).toHaveValue("ada@example.com");
  });

  it("shows validation detail on 400 (string and array) and a generic error on 500", async () => {
    render(<ContactForm />);
    fill();

    mocks.submitInquiry.mockRejectedValueOnce(httpError(400, ["email must be an email", "name too long"]));
    submit();
    await waitFor(() =>
      expect(mocks.showMessage).toHaveBeenLastCalledWith("email must be an email, name too long", "error"),
    );

    mocks.submitInquiry.mockRejectedValueOnce(httpError(400));
    submit();
    await waitFor(() =>
      expect(mocks.showMessage).toHaveBeenLastCalledWith(expect.stringContaining("check the highlighted"), "error"),
    );

    mocks.submitInquiry.mockRejectedValueOnce(httpError(500, "stack trace leak"));
    submit();
    await waitFor(() =>
      expect(mocks.showMessage).toHaveBeenLastCalledWith(expect.stringContaining("Something went wrong"), "error"),
    );
    expect(screen.getByLabelText(/Full Name/)).toHaveValue("Ada");
  });

  it("renders a hidden, unfocusable honeypot and forwards its value", async () => {
    mocks.submitInquiry.mockResolvedValue({});
    render(<ContactForm />);
    const honeypot = screen.getByTestId("contact-honeypot");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.closest("[aria-hidden='true']")).not.toBeNull();
    fill();
    expect(honeypot).not.toHaveAttribute("name", "website");
    fireEvent.change(honeypot, { target: { value: "http://spam" } });
    submit();
    await waitFor(() =>
      expect(mocks.submitInquiry).toHaveBeenCalledWith(expect.objectContaining({ website: "http://spam" })),
    );
  });
});
