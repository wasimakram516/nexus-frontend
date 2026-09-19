import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";

const mocks = vi.hoisted(() => ({
  showMessage: vi.fn(),
  getModuleCatalog: vi.fn(),
  getCatalog: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@/contexts/MessageContext", () => ({ useMessage: () => ({ showMessage: mocks.showMessage }) }));
vi.mock("@/services/roles.service", () => ({
  rolesService: {
    getModuleCatalog: mocks.getModuleCatalog, getCatalog: mocks.getCatalog, list: mocks.list,
    create: mocks.create, update: mocks.update, remove: mocks.remove,
  },
}));
vi.mock("@/lib/upload", () => ({ uploadFile: mocks.uploadFile }));

import type { WizardData } from "@/app/platform/institutions/new/page";
import StepSettings from "./StepSettings";
import StepBranding from "./StepBranding";
import StepReview from "./StepReview";
import StepPermissions from "./StepPermissions";
import StepBasicInfo from "./StepBasicInfo";

const ok = (data: unknown = {}) => Promise.resolve({ data: { data, message: "ok" } });

const base: WizardData = {
  name: "Green School", slug: "green-school", status: "ACTIVE", deploymentMode: "DEDICATED_HOSTED",
  contactEmail: "hi@g.io", contactPhone: "", primaryDomain: "green.edu", notes: "",
  adminName: "", adminEmail: "", adminPassword: "", skipAdmin: false,
  planId: "p", planName: "Starter", billingCycle: "MONTHLY", agreedPrice: "5000", currency: "PKR", setupFee: "",
  displayName: "Green", logoUrl: "",
  primaryColorLight: "#111111", secondaryColorLight: "#222222", accentColorLight: "#333333", backgroundColorLight: "#444444",
  primaryColorDark: "#aaaaaa", secondaryColorDark: "#bbbbbb", accentColorDark: "#cccccc", backgroundColorDark: "#dddddd",
  theme: "default", modules: { ACADEMICS: true, FINANCE: false },
  campusName: "Main", campusAddress: "Lahore", campusStudentStart: "08:00", campusStudentEnd: "14:00",
  campusStaffStart: "07:30", campusStaffEnd: "15:00", campusLateThreshold: "15", campusEarlyLeave: "15",
  skipCampus: false, settings: [],
};

/** Stateful harness so controlled steps behave like inside the wizard, exposing the latest data. */
function Harness({ initial, onData, children }: { initial: WizardData; onData: (d: WizardData) => void; children: (p: { data: WizardData; update: (p: Partial<WizardData>) => void }) => React.ReactNode }) {
  const [data, setData] = useState(initial);
  onData(data);
  return <>{children({ data, update: (p) => setData((prev) => ({ ...prev, ...p })) })}</>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getModuleCatalog.mockImplementation(() => ok([{ key: "ACADEMICS", label: "Academics", description: "" }]));
});

describe("StepSettings", () => {
  it("adds, edits, normalizes and removes settings entries", () => {
    let latest = base;
    render(<Harness initial={base} onData={(d) => (latest = d)}>{(p) => <StepSettings {...p} />}</Harness>);
    expect(screen.getByText("No settings added yet.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add First Entry" }));
    expect(latest.settings).toEqual([{ key: "", value: "" }]);
    fireEvent.click(screen.getByRole("button", { name: "Add Entry" }));
    expect(latest.settings).toHaveLength(2);

    const names = screen.getAllByLabelText("Setting Name");
    fireEvent.change(names[0], { target: { value: "Max Students Per Class" } });
    fireEvent.blur(names[0], { target: { value: "Max Students Per Class" } });
    expect(latest.settings[0].key).toBe("max_students_per_class");
    fireEvent.change(screen.getAllByLabelText("Value")[0], { target: { value: "40" } });
    expect(latest.settings[0]).toEqual({ key: "max_students_per_class", value: "40" });

    const deleteButtons = screen.getAllByTestId("DeleteIcon").map((i) => i.closest("button")!);
    fireEvent.click(deleteButtons[0]);
    expect(latest.settings).toEqual([{ key: "", value: "" }]);
  });
});

describe("StepBasicInfo", () => {
  it("updates identity, status, deployment and contact fields", async () => {
    let latest = base;
    render(<Harness initial={base} onData={(d) => (latest = d)}>{(p) => <StepBasicInfo {...p} />}</Harness>);
    fireEvent.change(screen.getByLabelText(/Institution Name/), { target: { value: "New Name" } });
    expect(latest).toMatchObject({ name: "New Name", slug: "new-name" });
    fireEvent.change(screen.getByLabelText("Contact Phone"), { target: { value: "0300" } });
    fireEvent.change(screen.getByLabelText("Primary Domain"), { target: { value: "x.edu" } });
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "vip" } });
    expect(latest).toMatchObject({ contactPhone: "0300", primaryDomain: "x.edu", notes: "vip" });
    fireEvent.mouseDown(screen.getAllByRole("combobox")[0]);
    fireEvent.click(await screen.findByRole("option", { name: "SUSPENDED" }));
    expect(latest.status).toBe("SUSPENDED");
    fireEvent.mouseDown(screen.getAllByRole("combobox")[1]);
    fireEvent.click(await screen.findByRole("option", { name: /Self Hosted/ }));
    expect(latest.deploymentMode).toBe("SELF_HOSTED");
  });
});

describe("StepBranding", () => {
  const png = () => new File(["x"], "logo.png", { type: "image/png" });
  const upload = (file: File) => {
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
  };

  it("rejects unsupported file types and oversized files without uploading", () => {
    render(<Harness initial={base} onData={() => {}}>{(p) => <StepBranding {...p} />}</Harness>);
    upload(new File(["x"], "a.gif", { type: "image/gif" }));
    expect(mocks.showMessage).toHaveBeenCalledWith("Please upload a PNG, JPG, SVG, or WebP file.", "error");
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    upload(big);
    expect(mocks.showMessage).toHaveBeenCalledWith("File size must be under 2MB.", "error");
    expect(mocks.uploadFile).not.toHaveBeenCalled();
  });

  it("uploads a valid logo into the images subfolder and stores the resulting URL", async () => {
    mocks.uploadFile.mockResolvedValue({ url: "https://cdn/logo.png" });
    let latest = base;
    render(<Harness initial={base} onData={(d) => (latest = d)}>{(p) => <StepBranding {...p} />}</Harness>);
    const file = png();
    upload(file);
    await waitFor(() => expect(latest.logoUrl).toBe("https://cdn/logo.png"));
    expect(mocks.uploadFile).toHaveBeenCalledWith(file, expect.objectContaining({ subfolder: "images" }));
    expect(mocks.showMessage).toHaveBeenCalledWith("Logo uploaded successfully.", "success");
  });

  it("reports upload failures", async () => {
    mocks.uploadFile.mockRejectedValue(new Error("Storage down"));
    render(<Harness initial={base} onData={() => {}}>{(p) => <StepBranding {...p} />}</Harness>);
    upload(png());
    await waitFor(() => expect(mocks.showMessage).toHaveBeenCalledWith("Storage down", "error"));
  });

  it("edits display fields, removes the logo and resets colors to defaults", () => {
    let latest: WizardData = { ...base, logoUrl: "https://cdn/x.png" };
    render(<Harness initial={latest} onData={(d) => (latest = d)}>{(p) => <StepBranding {...p} />}</Harness>);
    fireEvent.change(screen.getByLabelText("Display Name"), { target: { value: "Shown" } });
    fireEvent.change(screen.getByLabelText("Theme"), { target: { value: "ocean" } });
    expect(latest).toMatchObject({ displayName: "Shown", theme: "ocean" });
    fireEvent.click(screen.getByTestId("DeleteIcon").closest("button")!);
    expect(latest.logoUrl).toBe("");
    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(latest.primaryColorLight).toBe("#2C6B48");
    expect(latest.backgroundColorDark).toBe("#141D18");
    expect(latest.theme).toBe("default");
  });
});

describe("StepReview", () => {
  it("summarizes the entered data with module labels and campus details", async () => {
    render(<StepReview data={base} update={() => {}} onSubmit={() => {}} submitting={false} />);
    expect(screen.getByText("Green School")).toBeInTheDocument();
    expect(screen.getByText("DEDICATED HOSTED")).toBeInTheDocument();
    expect(screen.getByText("PKR 5000")).toBeInTheDocument();
    expect(await screen.findByText("Academics")).toBeInTheDocument();
    expect(screen.getByText("Modules (1 enabled)")).toBeInTheDocument();
    expect(screen.getByText("08:00 – 14:00")).toBeInTheDocument();
    expect(screen.queryByText("Contact Phone")).not.toBeInTheDocument();
  });

  it("disables submit while submitting or when identity is missing, and wires back/cancel/submit", () => {
    const onSubmit = vi.fn();
    const onBack = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(<StepReview data={base} update={() => {}} onSubmit={onSubmit} onBack={onBack} onCancel={onCancel} submitting={false} submitLabel="Save" hideCampus />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("First Campus")).not.toBeInTheDocument();
    expect(screen.getByText(/Permission templates are managed live/)).toBeInTheDocument();
    rerender(<StepReview data={base} update={() => {}} onSubmit={onSubmit} submitting submitLabel="Save" />);
    expect(screen.getByRole("button", { name: "Save..." })).toBeDisabled();
    rerender(<StepReview data={{ ...base, slug: "" }} update={() => {}} onSubmit={onSubmit} submitting={false} />);
    expect(screen.getByRole("button", { name: "Create Institution" })).toBeDisabled();
  });

  it("lists non-empty settings entries in save mode and shows an empty-modules message", () => {
    render(
      <StepReview
        data={{ ...base, modules: {}, settings: [{ key: "a", value: "" }, { key: "  ", value: "skip" }, { key: "b", value: "2" }] }}
        update={() => {}} onSubmit={() => {}} submitting={false} hideCampus
      />,
    );
    expect(screen.getByText("Settings (2 entries)")).toBeInTheDocument();
    expect(screen.getByText("(empty)")).toBeInTheDocument();
    expect(screen.queryByText("skip")).not.toBeInTheDocument();
    expect(screen.getByText("No modules selected.")).toBeInTheDocument();
  });
});

describe("StepPermissions", () => {
  const catalog = [{ key: "finance.fees", label: "Fees", module: "FINANCE", actions: ["read", "create"] }];
  const roles = [
    { id: "r1", name: "Accountant", description: "Money", permissions: { "finance.fees": { read: true, create: true } } },
    { id: "r2", name: "Viewer", permissions: {} },
  ];

  beforeEach(() => {
    mocks.getCatalog.mockImplementation(() => ok(catalog));
    mocks.list.mockImplementation(() => ok(roles));
    mocks.create.mockImplementation(() => ok());
    mocks.update.mockImplementation(() => ok());
    mocks.remove.mockImplementation(() => ok());
  });

  it("lists roles scoped to the institution with granted permission counts", async () => {
    render(<StepPermissions institutionId="inst" />);
    expect(await screen.findByText("Accountant")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith("inst");
    expect(screen.getByText("2 permissions granted")).toBeInTheDocument();
    expect(screen.getByText("0 permissions granted")).toBeInTheDocument();
  });

  it("shows an empty state when there are no roles", async () => {
    mocks.list.mockImplementation(() => ok([]));
    render(<StepPermissions institutionId="inst" />);
    expect(await screen.findByText("No roles yet.")).toBeInTheDocument();
  });

  it("creates a role and reloads", async () => {
    render(<StepPermissions institutionId="inst" />);
    await screen.findByText("Accountant");
    fireEvent.click(screen.getByRole("button", { name: "New Role" }));
    const dialog = await screen.findByRole("dialog");
    const create = within(dialog).getByRole("button", { name: "Create" });
    expect(create).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText(/Role Name/), { target: { value: "Clerk" } });
    fireEvent.click(create);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ name: "Clerk", description: "", permissions: {} }, "inst"));
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });

  it("edits an existing role, preserving its permissions", async () => {
    render(<StepPermissions institutionId="inst" />);
    await screen.findByText("Accountant");
    fireEvent.click(screen.getAllByTestId("EditIcon")[0].closest("button")!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Role Name/)).toHaveValue("Accountant");
    fireEvent.change(within(dialog).getByLabelText(/Role Name/), { target: { value: "Senior Accountant" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(
      "r1",
      { name: "Senior Accountant", description: "Money", permissions: roles[0].permissions },
      "inst",
    ));
  });

  it("only deletes after confirmation", async () => {
    render(<StepPermissions institutionId="inst" />);
    await screen.findByText("Accountant");
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0].closest("button")!);
    expect(await screen.findByText(/Delete "Accountant"\?/)).toBeInTheDocument();
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("r1", "inst"));
  });
});
