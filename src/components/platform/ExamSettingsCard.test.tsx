import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageProvider } from "@/contexts/MessageContext";
import { platformService } from "@/services/platform.service";
import ExamSettingsCard from "./ExamSettingsCard";
import InstitutionSettingsTab from "./InstitutionSettingsTab";

vi.mock("@/services/platform.service", () => ({
  platformService: { updateSettings: vi.fn() },
}));

function renderCard(setting: unknown, onSaved = vi.fn()) {
  render(
    <MessageProvider>
      <ExamSettingsCard institutionId="inst-1" setting={setting} onSaved={onSaved} />
    </MessageProvider>,
  );
  return onSaved;
}

beforeEach(() => {
  vi.mocked(platformService.updateSettings).mockReset();
  vi.mocked(platformService.updateSettings).mockResolvedValue({ data: { data: {}, message: "ok" } } as never);
});

describe("ExamSettingsCard", () => {
  it("defaults to passing every subject when nothing is set", () => {
    renderCard(undefined);

    expect(screen.getByText("Pass every subject")).toBeInTheDocument();
    expect(screen.queryByText(/Overall pass percentage/)).not.toBeInTheDocument();
  });

  it("shows the stored rule with its thresholds, in whichever form it was saved", () => {
    renderCard({ passPolicy: "AGGREGATE_WITH_MINIMUM", aggregatePassPercentage: 50, minimumSubjectPercentage: 33 });

    expect(screen.getByText("Pass on the overall percentage, with a minimum in every subject")).toBeInTheDocument();
    expect(screen.getByText("Overall pass percentage: 50% · Minimum per subject: 33%")).toBeInTheDocument();
  });

  it("reads a setting stored as a JSON string, and says when there is no minimum", () => {
    renderCard(JSON.stringify({ passPolicy: "AGGREGATE_WITH_MINIMUM", aggregatePassPercentage: 45 }));

    expect(screen.getByText("Overall pass percentage: 45% · No minimum per subject")).toBeInTheDocument();
  });

  it("falls back to the default for an unknown stored policy", () => {
    renderCard({ passPolicy: "SOMETHING_ELSE" });

    expect(screen.getByText("Pass every subject")).toBeInTheDocument();
  });

  it("saves the aggregate rule with only the fields it uses", async () => {
    const user = userEvent.setup();
    const onSaved = renderCard(undefined);

    await user.click(screen.getByRole("button", { name: "Edit exam pass rule" }));
    await user.click(screen.getByLabelText("Pass rule"));
    await user.click(screen.getByRole("option", { name: "Pass on the overall percentage" }));
    const aggregate = screen.getByLabelText("Overall pass percentage");
    await user.clear(aggregate);
    await user.type(aggregate, "55");
    expect(screen.queryByLabelText(/Minimum percentage/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(platformService.updateSettings).toHaveBeenCalledWith("inst-1", {
        settings: [
          expect.objectContaining({
            key: "exams",
            value: { passPolicy: "AGGREGATE", aggregatePassPercentage: 55 },
          }),
        ],
      }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("saves the hybrid rule with a minimum per subject", async () => {
    const user = userEvent.setup();
    renderCard(undefined);

    await user.click(screen.getByRole("button", { name: "Edit exam pass rule" }));
    await user.click(screen.getByLabelText("Pass rule"));
    await user.click(screen.getByRole("option", { name: /with a minimum in every subject/ }));
    await user.type(screen.getByLabelText("Minimum percentage in each subject"), "33");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(platformService.updateSettings).toHaveBeenCalledWith("inst-1", {
        settings: [
          expect.objectContaining({
            value: { passPolicy: "AGGREGATE_WITH_MINIMUM", aggregatePassPercentage: 40, minimumSubjectPercentage: 33 },
          }),
        ],
      }),
    );
  });

  it("keeps Save disabled and explains why for a percentage outside 0 to 100", async () => {
    const user = userEvent.setup();
    renderCard({ passPolicy: "AGGREGATE", aggregatePassPercentage: 50 });

    await user.click(screen.getByRole("button", { name: "Edit exam pass rule" }));
    const aggregate = screen.getByLabelText("Overall pass percentage");
    await user.clear(aggregate);
    await user.type(aggregate, "150");

    expect(screen.getByText("Must be a number from 0 to 100.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.clear(aggregate);
    expect(screen.getByText("Enter a percentage.")).toBeInTheDocument();
    expect(platformService.updateSettings).not.toHaveBeenCalled();
  });

  it("warns that a change reaches results that are already published", async () => {
    const user = userEvent.setup();
    renderCard(undefined);

    await user.click(screen.getByRole("button", { name: "Edit exam pass rule" }));

    expect(screen.getByText(/including ones already published/)).toBeInTheDocument();
  });
});

describe("InstitutionSettingsTab with the exam pass rule", () => {
  it("shows the card and no longer lists the exams setting under other settings", () => {
    render(
      <MessageProvider>
        <InstitutionSettingsTab
          institutionId="inst-1"
          runtimeConfig={{ settings: { exams: { passPolicy: "AGGREGATE", aggregatePassPercentage: 35 }, custom_flag: "yes" } }}
        />
      </MessageProvider>,
    );

    expect(screen.getByText("Exam pass rule")).toBeInTheDocument();
    expect(screen.getByText("Pass on the overall percentage")).toBeInTheDocument();
    expect(screen.getByText("custom_flag")).toBeInTheDocument();
    expect(screen.queryByText("exams")).not.toBeInTheDocument();
  });
});
