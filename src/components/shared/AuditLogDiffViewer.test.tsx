import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuditLogDiffViewer from "./AuditLogDiffViewer";

describe("AuditLogDiffViewer", () => {
  it("renders nothing when no log is selected", () => {
    const { container } = render(<AuditLogDiffViewer log={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a no-snapshot message when neither before nor after exists", () => {
    render(
      <AuditLogDiffViewer
        log={{
          id: "log-1",
          action: "STUDENT_UPDATED",
          entity: "Student",
          createdAt: "2026-07-18T10:00:00.000Z",
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/no before\/after snapshot is available/i)).toBeInTheDocument();
  });

  it("shows a truncated message when the snapshot exceeded the size cap", () => {
    render(
      <AuditLogDiffViewer
        log={{
          id: "log-1",
          action: "FEE_STRUCTURE_UPDATED",
          entity: "FeeStructure",
          createdAt: "2026-07-18T10:00:00.000Z",
          after: { truncated: true, note: "Snapshot exceeded 8000 bytes and was omitted." },
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/too large to store/i)).toBeInTheDocument();
  });

  it("renders a diff table and marks changed fields, for a full before/after pair", () => {
    render(
      <AuditLogDiffViewer
        log={{
          id: "log-1",
          action: "STUDENT_UPDATED",
          entity: "Student",
          entityId: "student-1",
          createdAt: "2026-07-18T10:00:00.000Z",
          before: { name: "Old Name", classId: "class-1" },
          after: { name: "New Name", classId: "class-1" },
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Old Name")).toBeInTheDocument();
    expect(screen.getByText("New Name")).toBeInTheDocument();
    // classId is unchanged, appears once per column but not flagged "changed"
    expect(screen.getAllByText("class-1")).toHaveLength(2);
    expect(screen.getByText("changed")).toBeInTheDocument();
  });

  it("shows only the after column for a create with no before snapshot", () => {
    render(
      <AuditLogDiffViewer
        log={{
          id: "log-1",
          action: "STUDENT_CREATED",
          entity: "Student",
          createdAt: "2026-07-18T10:00:00.000Z",
          after: { name: "New Student" },
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("New Student")).toBeInTheDocument();
    // Field is new (before is undefined), so it's still flagged as a change.
    expect(screen.getByText("changed")).toBeInTheDocument();
  });
});
