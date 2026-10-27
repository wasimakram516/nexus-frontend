import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { reportsService } from "@/services/reports.service";
import type { ReportTable } from "@/lib/reports";
import ReportsManager from "./ReportsManager";

vi.mock("@/services/reports.service", () => ({
  reportsService: { get: vi.fn(), download: vi.fn() },
}));
vi.mock("@/services/campuses.service", () => ({ campusesService: { getAll: vi.fn() } }));
vi.mock("@/services/academics.service", () => ({
  academicsService: { getLevels: vi.fn(), getClasses: vi.fn(), getSections: vi.fn() },
}));

const comparison: ReportTable = {
  key: "campus-comparison",
  title: "Campus comparison",
  subtitle: "As of today at each campus",
  columns: [
    { key: "campus", label: "Campus" },
    { key: "students", label: "Students", align: "right" },
  ],
  rows: [{ campus: "Main", students: 100 }, { campus: "North", students: 50 }],
  totals: {
    campus: "All campuses",
    students: 150,
    present: 120,
    absent: 20,
    attendance: 85.7,
    billed: "15000.00",
    collected: "8500.00",
    collection: 56.7,
    outstanding: "3500.00",
    defaulters: 7,
  },
  notes: ["Amounts are in PKR"],
  institutionId: "inst-1",
  campusId: null,
};

const reply = (table: ReportTable) => ({ data: { data: table } });
const other = (overrides: Partial<ReportTable>): ReportTable => ({ ...comparison, totals: null, ...overrides });

const campuses = [
  { id: "c1", name: "Main", institutionId: "inst-1" },
  { id: "c2", name: "North", institutionId: "inst-1" },
  { id: "c9", name: "Elsewhere", institutionId: "inst-9" },
];
const levels = [
  { id: "l1", name: "Primary", campusId: "c1" },
  { id: "l9", name: "Other", campusId: "c9" },
];
const classes = [
  { id: "k1", name: "Grade 5", levelId: "l1" },
  { id: "k9", name: "Grade 9", levelId: "l9" },
];
const sections = [
  { id: "s1", name: "A", classId: "k1" },
  { id: "s9", name: "Z", classId: "k9" },
];

const renderIt = (institutionId?: string) =>
  render(
    <MessageProvider>
      <ReportsManager institutionId={institutionId} />
    </MessageProvider>
  );

const choose = async (user: ReturnType<typeof userEvent.setup>, label: string, option: string | RegExp) => {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
};

describe("ReportsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(campusesService.getAll).mockResolvedValue({ data: { data: { items: campuses } } } as never);
    vi.mocked(academicsService.getLevels).mockResolvedValue({ data: { data: levels } } as never);
    vi.mocked(academicsService.getClasses).mockResolvedValue({ data: { data: classes } } as never);
    vi.mocked(academicsService.getSections).mockResolvedValue({ data: { data: sections } } as never);
    vi.mocked(reportsService.get).mockResolvedValue(reply(comparison) as never);
  });

  it("opens on the campus comparison with headline figures above the table", async () => {
    renderIt();

    expect(await screen.findByRole("heading", { name: "Campus comparison" })).toBeInTheDocument();
    expect(reportsService.get).toHaveBeenCalledWith("campus-comparison", {});
    expect(screen.getByText("Collected this month")).toBeInTheDocument();
    expect(screen.getByText("8500.00")).toBeInTheDocument();
    expect(screen.getByText("85.7%")).toBeInTheDocument();
    expect(screen.getByText("56.7% of 15000.00 billed")).toBeInTheDocument();
    expect(screen.getByText("Defaulters")).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
  });

  it("asks for another report with the filters chosen for it, and shows no headline cards", async () => {
    const user = userEvent.setup();
    vi.mocked(reportsService.get).mockResolvedValueOnce(reply(comparison) as never).mockResolvedValue(
      reply(other({ key: "fee-collection", title: "Fee collection" })) as never
    );
    renderIt();
    await screen.findByRole("heading", { name: "Campus comparison" });

    await choose(user, "Report", "Fee collection");
    await choose(user, "Campus", "North");
    await choose(user, "Group by", "Month");

    await waitFor(() =>
      expect(reportsService.get).toHaveBeenLastCalledWith("finance/collection", { campusId: "c2", groupBy: "MONTH" })
    );
    expect(await screen.findByRole("heading", { name: "Fee collection" })).toBeInTheDocument();
    expect(screen.queryByText("Collected this month")).not.toBeInTheDocument();
  });

  it("sends the period as chosen and nothing for what was left empty", async () => {
    const user = userEvent.setup();
    renderIt();
    await screen.findByRole("heading", { name: "Campus comparison" });
    await choose(user, "Report", "Staff attendance summary");

    await user.type(screen.getByLabelText("From"), "2026-10-01");
    await user.type(screen.getByLabelText("To"), "2026-10-31");

    await waitFor(() =>
      expect(reportsService.get).toHaveBeenLastCalledWith("attendance/staff-summary", { from: "2026-10-01", to: "2026-10-31" })
    );
  });

  it("will not run the register until a class and a section are chosen", async () => {
    const user = userEvent.setup();
    renderIt();
    await screen.findByRole("heading", { name: "Campus comparison" });
    vi.mocked(reportsService.get).mockClear();

    await choose(user, "Report", "Monthly attendance register");
    expect(screen.getByText("Choose a class and a section to see its register.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();
    expect(reportsService.get).not.toHaveBeenCalled();

    await choose(user, "Class", /Grade 5/);
    await choose(user, "Section", "A");

    await waitFor(() => expect(reportsService.get).toHaveBeenCalledWith("attendance/monthly-register", { sectionId: "s1" }));
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeEnabled();
  });

  it("downloads the report in view as a CSV or a PDF with the same filters", async () => {
    const user = userEvent.setup();
    vi.mocked(reportsService.download).mockResolvedValue(undefined);
    renderIt();
    await screen.findByRole("heading", { name: "Campus comparison" });

    await user.click(screen.getByRole("button", { name: "Download CSV" }));
    await user.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(reportsService.download).toHaveBeenNthCalledWith(1, "campus-comparison", {}, "csv");
    expect(reportsService.download).toHaveBeenNthCalledWith(2, "campus-comparison", {}, "pdf");
  });

  it("shows why a download was refused", async () => {
    const user = userEvent.setup();
    vi.mocked(reportsService.download).mockRejectedValue(new Error("Reports are available to institution administrators."));
    renderIt();
    await screen.findByRole("heading", { name: "Campus comparison" });

    await user.click(screen.getByRole("button", { name: "Download PDF" }));

    expect(await screen.findByText("Reports are available to institution administrators.")).toBeInTheDocument();
  });

  it("shows the server's reason when a report cannot be run", async () => {
    vi.mocked(reportsService.get).mockRejectedValue({
      response: { status: 403, data: { message: "reporting is not enabled for this institution." } },
    });
    renderIt();

    expect(await screen.findByText("reporting is not enabled for this institution.")).toBeInTheDocument();
  });

  it("for a superadmin viewing one institution, asks about that institution and offers only its campuses", async () => {
    const user = userEvent.setup();
    renderIt("inst-1");
    await screen.findByRole("heading", { name: "Campus comparison" });

    expect(reportsService.get).toHaveBeenCalledWith("campus-comparison", { institutionId: "inst-1" });

    await choose(user, "Report", "Outstanding dues");
    await user.click(screen.getByLabelText("Campus"));
    expect(screen.queryByRole("option", { name: "Elsewhere" })).not.toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "North" })).toBeInTheDocument();
  });

  it("offers only the institution's classes for the register in the platform console", async () => {
    const user = userEvent.setup();
    renderIt("inst-1");
    await screen.findByRole("heading", { name: "Campus comparison" });

    await choose(user, "Report", "Monthly attendance register");
    await user.click(screen.getByLabelText("Class"));

    expect(await screen.findByRole("option", { name: /Grade 5/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Grade 9/ })).not.toBeInTheDocument();
  });

  it("shows an empty report as nothing to report", async () => {
    vi.mocked(reportsService.get).mockResolvedValue(reply(other({ rows: [] })) as never);
    renderIt();

    expect(await screen.findByText("There is nothing to report for this selection.")).toBeInTheDocument();
  });
});
