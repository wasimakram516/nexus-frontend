"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EventRepeat from "@mui/icons-material/EventRepeat";
import ListAlt from "@mui/icons-material/ListAlt";
import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import Publish from "@mui/icons-material/Publish";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ExamPapersDialog, { ClassSubject } from "@/components/dashboard/ExamPapersDialog";
import { ClassSection } from "@/components/dashboard/MarksEntryDialog";
import GradingScalesSection, { GradingScale } from "@/components/dashboard/GradingScalesSection";
import ResourceSection from "@/components/dashboard/ResourceSection";
import { useMessage } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { examinationsService } from "@/services/examinations.service";

type ExamType = "REGULAR" | "RETAKE" | "IMPROVEMENT" | "SUPPLEMENTARY";

interface Exam {
  id: string;
  name: string;
  classId: string;
  campusId: string;
  examTermId: string;
  gradingScaleId: string;
  status: "DRAFT" | "PUBLISHED";
  examType: ExamType;
  originalExamId: string | null;
  unlockedForEditing: boolean;
  createdAt: string;
}

interface ExamTerm {
  id: string;
  name: string;
  academicYearId: string;
  weight: string | number;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
}

interface Named {
  id: string;
  name: string;
  institutionId?: string;
  campusId?: string;
  levelId?: string;
}

const TAB_SCALES = 0;
const TAB_TERMS = 1;
const TAB_EXAMS = 2;

const RETAKE_TYPES: Array<{ value: Exclude<ExamType, "REGULAR">; label: string }> = [
  { value: "RETAKE", label: "Retake" },
  { value: "IMPROVEMENT", label: "Improvement" },
  { value: "SUPPLEMENTARY", label: "Supplementary" },
];

const TYPE_LABELS: Record<ExamType, string> = {
  REGULAR: "Regular",
  RETAKE: "Retake",
  IMPROVEMENT: "Improvement",
  SUPPLEMENTARY: "Supplementary",
};

interface ExaminationsManagerProps {
  /** When set (superadmin console), data is scoped to this institution. */
  institutionId?: string;
}

/**
 * Examinations setup and workflow: grading scales, exam terms, and exams
 * (including retake, improvement and supplementary sittings and the
 * publish / unlock / relock controls). Marks entry and results arrive with
 * later phases of the module.
 */
export default function ExaminationsManager({ institutionId }: ExaminationsManagerProps) {
  const { showMessage } = useMessage();
  const runtime = useOptionalRuntimeConfig();
  // The platform console is superadmin: always full access.
  const can = (feature: string, action: "create" | "read" | "update" | "delete") =>
    institutionId ? true : (runtime?.can(feature, action) ?? true);

  // Tabs follow the setup order. null until the first load finishes, so the
  // screen can open on the first step that has nothing in it yet.
  const [tab, setTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [years, setYears] = useState<Named[]>([]);
  const [classes, setClasses] = useState<Named[]>([]);
  const [subjects, setSubjects] = useState<ClassSubject[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [papersFor, setPapersFor] = useState<Exam | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<Exam | null>(null);
  const [retakeFor, setRetakeFor] = useState<Exam | null>(null);

  const load = useCallback(async () => {
    const [scalesRes, termsRes, examsRes, yearsRes, campusesRes, levelsRes, classesRes, subjectsRes, sectionsRes] = await Promise.all([
      apiHandler<GradingScale[]>(() => examinationsService.getGradingScales(institutionId), { showMessage, silent: true }),
      apiHandler<ExamTerm[]>(() => examinationsService.getExamTerms(undefined, institutionId), { showMessage, silent: true }),
      apiHandler<Exam[]>(() => examinationsService.getExams(), { showMessage, silent: true }),
      apiHandler<Named[]>(() => academicsService.getAcademicYears(institutionId), { showMessage, silent: true }),
      apiHandler<{ items: Named[] }>(() => campusesService.getAll({ limit: 100 }), { showMessage, silent: true }),
      apiHandler<Named[]>(() => academicsService.getLevels(), { showMessage, silent: true }),
      apiHandler<Named[]>(() => academicsService.getClasses(), { showMessage, silent: true }),
      apiHandler<ClassSubject[]>(() => academicsService.getSubjects(), { showMessage, silent: true }),
      apiHandler<ClassSection[]>(() => academicsService.getSections(), { showMessage, silent: true }),
    ]);

    // The exam list and class list are not institution-addressed, so the
    // console narrows them to the chosen institution's campuses client-side.
    const campusIds = new Set(
      (campusesRes.data?.items ?? [])
        .filter((c) => !institutionId || c.institutionId === institutionId)
        .map((c) => c.id),
    );
    const levelIds = new Set(
      (levelsRes.data ?? []).filter((l) => !institutionId || (l.campusId && campusIds.has(l.campusId))).map((l) => l.id),
    );
    const loadedScales = scalesRes.data ?? [];
    const loadedTerms = termsRes.data ?? [];
    setTab((current) => current ?? (loadedScales.length === 0 ? TAB_SCALES : loadedTerms.length === 0 ? TAB_TERMS : TAB_EXAMS));
    setScales(loadedScales);
    setTerms(loadedTerms);
    setYears(yearsRes.data ?? []);
    const scopedClasses = (classesRes.data ?? []).filter((c) => !institutionId || (c.levelId && levelIds.has(c.levelId)));
    const classIds = new Set(scopedClasses.map((c) => c.id));
    setClasses(scopedClasses);
    setSections((sectionsRes.data ?? []).filter((section) => !institutionId || (section.classId && classIds.has(section.classId))));
    setSubjects((subjectsRes.data ?? []).filter((subject) => !institutionId || (subject.classId && classIds.has(subject.classId))));
    setExams((examsRes.data ?? []).filter((e) => !institutionId || campusIds.has(e.campusId)));
    setLoading(false);
  }, [showMessage, institutionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void load();
  }, [load]);

  const className = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.name])), [classes]);
  const termName = useMemo(() => Object.fromEntries(terms.map((t) => [t.id, t.name])), [terms]);
  const yearName = useMemo(() => Object.fromEntries(years.map((y) => [y.id, y.name])), [years]);
  const scaleName = useMemo(() => Object.fromEntries(scales.map((s) => [s.id, s.name])), [scales]);
  const examName = useMemo(() => Object.fromEntries(exams.map((e) => [e.id, e.name])), [exams]);

  const classOptions = classes.map((c) => ({ value: c.id, label: c.name }));
  const termOptions = terms.map((t) => ({ value: t.id, label: `${t.name} (${yearName[t.academicYearId] ?? "—"})` }));
  const yearOptions = years.map((y) => ({ value: y.id, label: y.name }));
  const scaleOptions = scales.map((s) => ({ value: s.id, label: s.isCurrent ? `${s.name} (current)` : s.name }));

  const run = async (action: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
    const { success } = await apiHandler(() => action() as never, { showMessage, successMessage });
    if (success) void load();
    return success;
  };

  const canCreateExam = can("exams", "create");
  const canUpdateExam = can("exams", "update");
  const canDeleteExam = can("exams", "delete");
  const canCreateTerm = can("exam_terms", "create");
  const canUpdateTerm = can("exam_terms", "update");
  const canDeleteTerm = can("exam_terms", "delete");

  const statusChip = (exam: Exam) => (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Chip size="small" color={exam.status === "PUBLISHED" ? "success" : "default"} label={exam.status === "PUBLISHED" ? "Published" : "Draft"} />
      {exam.unlockedForEditing && <Chip size="small" color="warning" label="Unlocked" />}
    </Box>
  );

  const examActions = (exam: Exam) => (
    <>
      {can("exam_subjects", "read") && (
        <Tooltip title="Papers (subjects, marks and dates)">
          <IconButton aria-label="Papers" size="small" onClick={() => setPapersFor(exam)}><ListAlt fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {canUpdateExam && exam.status === "DRAFT" && (
        <Tooltip title="Publish">
          <IconButton aria-label="Publish" size="small" onClick={() => setConfirmPublish(exam)}><Publish fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {canUpdateExam && exam.status === "PUBLISHED" && !exam.unlockedForEditing && (
        <Tooltip title="Unlock for corrections">
          <IconButton aria-label="Unlock" size="small" onClick={() => run(() => examinationsService.unlockExam(exam.id), "Exam unlocked for editing.")}><LockOpen fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {canUpdateExam && exam.status === "PUBLISHED" && exam.unlockedForEditing && (
        <Tooltip title="Lock again">
          <IconButton aria-label="Relock" size="small" onClick={() => run(() => examinationsService.relockExam(exam.id), "Exam locked again.")}><Lock fontSize="small" /></IconButton>
        </Tooltip>
      )}
      {canCreateExam && exam.status === "PUBLISHED" && (
        <Tooltip title="Create retake, improvement or supplementary exam">
          <IconButton aria-label="Create retake" size="small" onClick={() => setRetakeFor(exam)}><EventRepeat fontSize="small" /></IconButton>
        </Tooltip>
      )}
    </>
  );

  return (
    <Box>
      <Tabs value={tab ?? false} onChange={(_, value: number) => setTab(value)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Grading Scales" />
        <Tab label="Terms" />
        <Tab label="Exams" />
      </Tabs>

      {tab === null && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      )}

      {tab === TAB_EXAMS && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Use Papers on each exam to add its subjects, marks and dates. Open a paper and use Enter marks to record scores for each student.
        </Alert>
      )}

      {tab === TAB_EXAMS && (
        <ResourceSection<Exam>
          title="Exams"
          customFieldEntity="exam"
          institutionId={institutionId}
          subtitle="One regular exam per class and term. Publish an exam to release its results; retake exams are created from a published one."
          rows={exams}
          loading={loading}
          emptyMessage={
            scales.length === 0
              ? "No exams yet. Create a grading scale and a term first."
              : "No exams yet."
          }
          columns={[
            { key: "name", label: "Name" },
            { key: "classId", label: "Class", render: (r) => className[r.classId] ?? "—" },
            { key: "examTermId", label: "Term", render: (r) => termName[r.examTermId] ?? "—" },
            {
              key: "examType",
              label: "Type",
              render: (r) =>
                r.originalExamId
                  ? `${TYPE_LABELS[r.examType]} of ${examName[r.originalExamId] ?? "another exam"}`
                  : TYPE_LABELS[r.examType],
            },
            { key: "status", label: "Status", render: statusChip },
            { key: "gradingScaleId", label: "Grading scale", render: (r) => scaleName[r.gradingScaleId] ?? "—" },
            { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
          ]}
          fields={[
            { key: "classId", label: "Class", type: "select", options: classOptions, required: true, createOnly: true, cols: 6 },
            { key: "examTermId", label: "Term", type: "select", options: termOptions, required: true, createOnly: true, cols: 6 },
            { key: "name", label: "Exam Name", required: true },
            {
              key: "gradingScaleId",
              label: "Grading scale",
              type: "select",
              options: scaleOptions,
              helperText: "Leave empty to use the current grading scale. It cannot be changed after publishing.",
            },
          ]}
          renderRowActions={examActions}
          onCreate={canCreateExam ? (payload) => run(() => examinationsService.createExam(payload), "Exam created.") : undefined}
          onUpdate={canUpdateExam ? (id, payload) => run(() => examinationsService.updateExam(id, payload), "Exam updated.") : undefined}
          onDelete={canDeleteExam ? (id) => run(() => examinationsService.deleteExam(id), "Exam moved to recycle bin.") : undefined}
          deleteMessage={(r) => `Move "${r.name}" to the recycle bin? Delete its retake exams first if it has any.`}
        />
      )}

      {tab === TAB_TERMS && (
        <ResourceSection<ExamTerm>
          title="Exam Terms"
          singular="Exam Term"
          customFieldEntity="exam_term"
          institutionId={institutionId}
          subtitle="Terms such as First Term or Annual, inside an academic year. Weight is used when results are combined across terms."
          rows={terms}
          loading={loading}
          columns={[
            { key: "name", label: "Name" },
            { key: "academicYearId", label: "Academic year", render: (r) => yearName[r.academicYearId] ?? "—" },
            { key: "weight", label: "Weight", render: (r) => String(Number(r.weight)) },
            { key: "startDate", label: "Starts", render: (r) => (r.startDate ? formatDate(r.startDate) : "—") },
            { key: "endDate", label: "Ends", render: (r) => (r.endDate ? formatDate(r.endDate) : "—") },
          ]}
          fields={[
            { key: "academicYearId", label: "Academic year", type: "select", options: yearOptions, required: true, createOnly: true },
            { key: "name", label: "Term Name", required: true },
            { key: "weight", label: "Weight", type: "number", min: 0, max: 100, cols: 6, helperText: "Defaults to 1. Equal weights count terms equally." },
            { key: "sortOrder", label: "Order", type: "number", integer: true, min: 0, cols: 6 },
            { key: "startDate", label: "Start date", type: "date", cols: 6 },
            { key: "endDate", label: "End date", type: "date", cols: 6 },
          ]}
          onCreate={canCreateTerm ? (payload) => run(() => examinationsService.createExamTerm(payload, institutionId), "Exam term created.") : undefined}
          onUpdate={canUpdateTerm ? (id, payload) => run(() => examinationsService.updateExamTerm(id, payload, institutionId), "Exam term updated.") : undefined}
          onDelete={canDeleteTerm ? (id) => run(() => examinationsService.deleteExamTerm(id, institutionId), "Exam term moved to recycle bin.") : undefined}
        />
      )}

      {tab === TAB_SCALES && (
        <GradingScalesSection
          scales={scales}
          loading={loading}
          canCreate={can("grading_scales", "create")}
          canUpdate={can("grading_scales", "update")}
          canDelete={can("grading_scales", "delete")}
          institutionId={institutionId}
          onReload={() => void load()}
        />
      )}

      <ConfirmDialog
        open={!!confirmPublish}
        title="Publish Exam"
        message={
          confirmPublish
            ? `Publish "${confirmPublish.name}"? Its results become visible, and the grading scale can no longer be changed. You can unlock it later to make corrections.`
            : ""
        }
        confirmLabel="Publish"
        onConfirm={async () => {
          if (confirmPublish) await run(() => examinationsService.publishExam(confirmPublish.id), "Exam published.");
          setConfirmPublish(null);
        }}
        onCancel={() => setConfirmPublish(null)}
      />

      <ExamPapersDialog
        exam={papersFor}
        subjects={subjects}
        canCreate={can("exam_subjects", "create")}
        canUpdate={can("exam_subjects", "update")}
        canDelete={can("exam_subjects", "delete")}
        sections={sections}
        canEnterMarks={can("exam_results", "update")}
        onClose={() => setPapersFor(null)}
      />

      <RetakeDialog
        exam={retakeFor}
        terms={terms}
        yearName={yearName}
        onClose={() => setRetakeFor(null)}
        onCreate={async (payload) => {
          if (!retakeFor) return false;
          const ok = await run(() => examinationsService.createRetakeExam(retakeFor.id, payload), "Retake exam created.");
          if (ok) setRetakeFor(null);
          return ok;
        }}
      />
    </Box>
  );
}

interface RetakeDialogProps {
  exam: Exam | null;
  terms: ExamTerm[];
  yearName: Record<string, string>;
  onClose: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
}

/** Creates a retake, improvement or supplementary sitting from a published exam. */
function RetakeDialog({ exam, terms, yearName, onClose, onCreate }: RetakeDialogProps) {
  const [examType, setExamType] = useState<string>("RETAKE");
  const [name, setName] = useState("");
  const [examTermId, setExamTermId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form whenever a new exam is chosen
      setExamType("RETAKE");
      setName(`${exam.name} (Retake)`);
      setExamTermId("");
    }
  }, [exam]);

  const sameYearTerms = terms.filter((t) => {
    const original = terms.find((o) => o.id === exam?.examTermId);
    return original ? t.academicYearId === original.academicYearId : true;
  });

  const handleCreate = async () => {
    setSaving(true);
    await onCreate({ examType, name: name.trim(), ...(examTermId ? { examTermId } : {}) });
    setSaving(false);
  };

  return (
    <Dialog open={!!exam} onClose={() => { if (!saving) onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create retake exam</DialogTitle>
      <DialogContent sx={{ pt: "16px !important", display: "grid", gap: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          A second sitting of {exam?.name}. It uses the same class and grading scale; add its subjects afterwards.
        </Typography>
        <TextField select label="Type" value={examType} onChange={(e) => setExamType(e.target.value)} disabled={saving} fullWidth>
          {RETAKE_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </TextField>
        <TextField label="Exam Name *" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} fullWidth />
        <TextField
          select
          label="Term"
          value={examTermId}
          onChange={(e) => setExamTermId(e.target.value)}
          disabled={saving}
          helperText="Leave empty to stay in the original term. Only terms in the same academic year are listed."
          fullWidth
        >
          <MenuItem value="">Same term as the original</MenuItem>
          {sameYearTerms.map((term) => (
            <MenuItem key={term.id} value={term.id}>{`${term.name} (${yearName[term.academicYearId] ?? "—"})`}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={saving} onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={saving || !name.trim()}>
          {saving ? <CircularProgress size={16} color="inherit" /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
