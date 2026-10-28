import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomFieldInputs from "./CustomFieldInputs";
import type { CustomFieldDefinition } from "@/services/customFields.service";

const mocks = vi.hoisted(() => ({ uploadFile: vi.fn() }));
vi.mock("@/lib/upload", () => ({ uploadFile: mocks.uploadFile }));
vi.mock("@/contexts/RuntimeConfigContext", () => ({ useOptionalRuntimeConfig: () => ({ config: { defaultCountry: "AE" } }) }));

const textDefinition: CustomFieldDefinition = {
  id: "def-text",
  fieldKey: "nickname",
  label: "Nickname",
  inputType: "TEXT",
  isRequired: false,
};

const fileDefinition: CustomFieldDefinition = {
  id: "def-file",
  fieldKey: "report",
  label: "Report",
  inputType: "FILE",
  isRequired: true,
};

const uploadResult = {
  url: "https://res.cloudinary.com/demo/raw/upload/report.pdf",
  publicId: "nexus/reports/report",
  resourceType: "raw",
  format: "pdf",
  folder: "nexus/reports",
  bytes: 2048,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomFieldInputs", () => {
  it("renders a phone field as a country picker and number, starting on the school's country", () => {
    const onChange = vi.fn();
    render(<CustomFieldInputs definitions={[{ id: "def-phone", fieldKey: "emergency", label: "Emergency phone", inputType: "PHONE", isRequired: false }]} values={{}} onChange={onChange} />);

    expect(screen.getByRole("combobox", { name: /country code/i })).toHaveTextContent("+971");
    fireEvent.change(screen.getByLabelText("Emergency phone"), { target: { value: "50 123 4567" } });
    expect(onChange).toHaveBeenLastCalledWith("emergency", "+971501234567");
    fireEvent.change(screen.getByLabelText("Emergency phone"), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith("emergency", null);
  });
  it("displays a saved external URL in a read-only file field", () => {
    render(<CustomFieldInputs definitions={[fileDefinition]} values={{ report: "https://example.com/report.pdf" }} onChange={vi.fn()} disabled />);
    expect(screen.getByRole("link", { name: "https://example.com/report.pdf" })).toHaveAttribute("href", "https://example.com/report.pdf");
    expect(screen.queryByText("No file selected.")).not.toBeInTheDocument();
  });
  it("keeps the parent busy until an optional file upload completes", async () => {
    let finish!: (value: typeof uploadResult) => void;
    mocks.uploadFile.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const onBusyChange = vi.fn();
    const onChange = vi.fn();
    render(<CustomFieldInputs definitions={[{ ...fileDefinition, isRequired: false }]} values={{}} onChange={onChange} onBusyChange={onBusyChange} />);
    fireEvent.change(screen.getByLabelText("Report file", { selector: "input" }), { target: { files: [new File(["data"], "report.pdf")] } });
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    expect(onChange).not.toHaveBeenCalled();
    finish(uploadResult);
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    expect(onChange).toHaveBeenCalledWith("report", uploadResult);
  });
  it("renders nothing when there are no definitions", () => {
    const { container } = render(
      <CustomFieldInputs definitions={[]} values={{}} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the group with an accessible label and a plain text field", () => {
    render(
      <CustomFieldInputs definitions={[textDefinition]} values={{}} onChange={vi.fn()} />,
    );
    expect(screen.getByRole("group", { name: "Additional information" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nickname")).toBeInTheDocument();
  });

  it("uploads a file through the shared upload contract and stores the full UploadResult", async () => {
    mocks.uploadFile.mockResolvedValue(uploadResult);
    const onChange = vi.fn();
    render(
      <CustomFieldInputs definitions={[fileDefinition]} values={{}} onChange={onChange} />,
    );

    const input = screen.getByLabelText("Report file", { selector: "input" });
    const file = new File(["content"], "report.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("report", uploadResult));
    expect(mocks.uploadFile).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ subfolder: "documents" }),
    );
  });

  it("shows an accessible error when the upload fails, without calling onChange", async () => {
    mocks.uploadFile.mockRejectedValue(new Error("Upload rejected"));
    const onChange = vi.fn();
    render(
      <CustomFieldInputs definitions={[fileDefinition]} values={{}} onChange={onChange} />,
    );

    const input = screen.getByLabelText("Report file", { selector: "input" });
    const file = new File(["content"], "report.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload rejected");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("lets an uploaded file be removed via an accessible control", () => {
    const onChange = vi.fn();
    render(
      <CustomFieldInputs
        definitions={[fileDefinition]}
        values={{ report: uploadResult }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("link", { name: /report\.pdf/ })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Remove Report"));
    expect(onChange).toHaveBeenCalledWith("report", null);
  });

  it("disables the upload control and hides the remove action when disabled", () => {
    render(
      <CustomFieldInputs
        definitions={[fileDefinition]}
        values={{ report: uploadResult }}
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByRole("button", { name: /Replace/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByLabelText("Remove Report")).not.toBeInTheDocument();
  });
});
