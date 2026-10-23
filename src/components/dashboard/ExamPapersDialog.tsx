"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import MarksEntryDialog, { ClassSection } from "@/components/dashboard/MarksEntryDialog";
import ResourceSection from "@/components/dashboard/ResourceSection";
import EditNote from "@mui/icons-material/EditNote";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { examinationsService } from "@/services/examinations.service";

export interface ExamPaperExam {
  id: string;
  name: string;
  classId: string;
  status: "DRAFT" | "PUBLISHED";
  unlockedForEditing: boolean;
}

export interface ExamPaper {
  id: string;
  subjectId: string;
  maxMarks: string | number;
  passingMarks: string | number;
  examDate: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  subject?: { id: string; name: string };
}

export interface ClassSubject {
  id: string;
  name: string;
  classId?: string;
}

interface ExamPapersDialogProps {
  exam: ExamPaperExam | null;
  /** Every subject in scope; the dialog narrows it to the exam's class. */
  subjects: ClassSubject[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** Every section in scope; the marks grid narrows it to the exam's class. */
  sections?: ClassSection[];
  canEnterMarks?: boolean;
  onClose: () => void;
}

/**
 * The papers of one exam: which subjects are sat, their marks, date, time and
 * room. Papers can only be added or removed while the exam is a draft, and
 * marks only change while it is a draft or unlocked; the server enforces both
 * and this screen hides the controls that cannot work.
 */
export default function ExamPapersDialog({
  exam,
  subjects,
  canCreate,
  canUpdate,
  canDelete,
  sections = [],
  canEnterMarks = false,
  onClose,
}: ExamPapersDialogProps) {
  const { showMessage } = useMessage();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [marksFor, setMarksFor] = useState<ExamPaper | null>(null);
  const examId = exam?.id;

  const load = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    const { data } = await apiHandler<ExamPaper[]>(
      () => examinationsService.getExamSubjects({ examId }),
      { showMessage, silent: true },
    );
    setPapers(data ?? []);
    setLoading(false);
  }, [examId, showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch whenever a different exam is opened
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
    const { success } = await apiHandler(() => action() as never, { showMessage, successMessage });
    if (success) void load();
    return success;
  };

  if (!exam) return <></>;

  const isDraft = exam.status === "DRAFT";
  const marksEditable = isDraft || exam.unlockedForEditing;
  const usedSubjectIds = new Set(papers.map((paper) => paper.subjectId));
  const subjectOptions = subjects
    .filter((subject) => subject.classId === exam.classId && !usedSubjectIds.has(subject.id))
    .map((subject) => ({ value: subject.id, label: subject.name }));
  const subjectName = (paper: ExamPaper) =>
    paper.subject?.name ?? subjects.find((subject) => subject.id === paper.subjectId)?.name ?? "—";

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{`Papers for ${exam.name}`}</DialogTitle>
      <DialogContent>
        {!isDraft && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {marksEditable
              ? "This exam is unlocked: marks, dates and rooms can change, but papers cannot be added or removed."
              : "This exam is published. Dates, times and rooms can still change; marks are locked until an admin unlocks the exam."}
          </Alert>
        )}
        <ResourceSection<ExamPaper>
          title="Exam Papers"
          singular="Paper"
          customFieldEntity="exam_subject"
          subtitle="One paper per subject, with its maximum and passing marks and when it is sat."
          rows={papers}
          loading={loading}
          emptyMessage={
            isDraft
              ? subjectOptions.length === 0
                ? "No papers yet, and this class has no subjects to add. Create the class's subjects under Academics first."
                : "No papers yet. Add the subjects this exam covers."
              : "This exam has no papers."
          }
          createLabel="Add Paper"
          columns={[
            { key: "subject", label: "Subject", render: subjectName },
            { key: "maxMarks", label: "Max marks", render: (r) => String(Number(r.maxMarks)) },
            { key: "passingMarks", label: "Passing marks", render: (r) => String(Number(r.passingMarks)) },
            { key: "examDate", label: "Date", render: (r) => (r.examDate ? formatDate(r.examDate) : "Not scheduled") },
            {
              key: "time",
              label: "Time",
              render: (r) => (r.startTime && r.endTime ? `${r.startTime}–${r.endTime}` : "—"),
            },
            { key: "room", label: "Room", render: (r) => r.room ?? "—" },
          ]}
          fields={[
            { key: "subjectId", label: "Subject", type: "select", options: subjectOptions, required: true, createOnly: true },
            { key: "maxMarks", label: "Maximum marks", type: "number", required: true, min: 0.01, max: 9999.99, cols: 6 },
            { key: "passingMarks", label: "Passing marks", type: "number", required: true, min: 0, max: 9999.99, cols: 6 },
            { key: "examDate", label: "Date", type: "date", cols: 6 },
            { key: "startTime", label: "Start time", type: "time", cols: 6 },
            { key: "endTime", label: "End time", type: "time", cols: 6 },
            { key: "room", label: "Room" },
          ]}
          onCreate={
            canCreate && isDraft
              ? (payload) => run(() => examinationsService.createExamSubject({ ...payload, examId: exam.id }), "Paper added.")
              : undefined
          }
          onUpdate={canUpdate ? (id, payload) => run(() => examinationsService.updateExamSubject(id, payload), "Paper updated.") : undefined}
          onDelete={
            canDelete && isDraft
              ? (id) => run(() => examinationsService.deleteExamSubject(id), "Paper moved to recycle bin.")
              : undefined
          }
          renderRowActions={(r) => (
            <Tooltip title="Enter marks">
              <IconButton aria-label="Enter marks" size="small" onClick={() => setMarksFor(r)}>
                <EditNote fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          deleteMessage={(r) => `Remove the ${subjectName(r)} paper from this exam?`}
        />
        <MarksEntryDialog
          paper={marksFor ? { id: marksFor.id, subjectName: subjectName(marksFor), maxMarks: Number(marksFor.maxMarks), passingMarks: Number(marksFor.passingMarks) } : null}
          exam={exam}
          sections={sections}
          canEdit={canEnterMarks}
          onClose={() => setMarksFor(null)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
