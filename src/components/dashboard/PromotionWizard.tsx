"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack, Close, NavigateNext, Warning } from "@mui/icons-material";
import type { AcademicYear } from "@/components/dashboard/AcademicYearsSection";
import type { NamedItem, PersonRecord } from "@/components/dashboard/PeopleTab";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { UserLite } from "@/lib/users";
import { academicsService } from "@/services/academics.service";
import { peopleService } from "@/services/people.service";

/** Sentinel value for "this class graduates/leaves" in the target-class select — the
 *  backend's `toClassId: null` can't be represented directly as a MUI Select value. */
const LEAVE_SENTINEL = "__LEAVE__";

type SectionItem = NamedItem & { classId?: string };
type OverrideAction = "PROMOTE" | "REPEAT" | "LEAVE";

const OVERRIDE_ACTIONS: OverrideAction[] = ["PROMOTE", "REPEAT", "LEAVE"];

/**
 * A student's enrollment record for one academic year, as returned by
 * `GET /people/student-enrollments`.
 *
 * GUESSED SHAPE — the backend half of the M2 Phase 3 contract (StudentEnrollment)
 * lands in a separate parallel agent run and wasn't available to check against
 * while this was written. Only `studentId`/`academicYearId`/`classId`/`sectionId`
 * are named in the frozen contract (as the POST body); the rest of this shape,
 * including whether the list endpoint returns these exact field names, is assumed
 * from the codebase's existing REST conventions. Verify once the real endpoint lands.
 */
interface EnrollmentLite {
  id: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId?: string;
  status: string;
}

interface ClassMappingState {
  /** "" = not chosen yet, LEAVE_SENTINEL = graduates/leaves, else a real class id. */
  toClassId: string;
  /** fromSectionId -> toSectionId. */
  sectionMapping: Record<string, string>;
}

interface StudentOverrideEntry {
  studentId: string;
  action: OverrideAction;
  toClassId?: string;
  toSectionId?: string;
}

interface ClassMappingPayload {
  fromClassId: string;
  toClassId: string | null;
  sectionMapping?: Array<{ fromSectionId: string; toSectionId: string }>;
}

/**
 * A single class's promotion outcome, as returned inside `perClassBreakdown`.
 *
 * GUESSED SHAPE — the contract only names the `perClassBreakdown` key itself,
 * not its row shape. Rendered defensively with fallbacks so an unexpected
 * shape degrades to "—" instead of crashing.
 */
interface PerClassBreakdownRow {
  classId?: string;
  className?: string;
  promoted?: number;
  repeated?: number;
  left?: number;
}

/**
 * A student blocking commit — their class has no mapping rule and no override.
 *
 * GUESSED SHAPE — only "lists students whose class has no mapping rule and no
 * override" is specified; the exact field names on each entry are assumed.
 */
interface PromotionConflict {
  studentId: string;
  studentName?: string;
  classId?: string;
  className?: string;
}

interface PromotionPreviewResult {
  totalStudents: number;
  byOutcome: { promoted: number; repeated: number; left: number };
  perClassBreakdown: PerClassBreakdownRow[];
  conflicts: PromotionConflict[];
}

interface PromotionCommitResult {
  promoted: number;
  repeated: number;
  left: number;
  skippedAlreadyProcessed: number;
}

interface PromotionWizardProps {
  open: boolean;
  onClose: () => void;
  campuses: NamedItem[];
  classes: NamedItem[];
  sections: SectionItem[];
  students: PersonRecord[];
  users: UserLite[];
  /** Superadmin-managing-another-institution context, forwarded to the
   *  academic-years lookup (mirrors the pattern used elsewhere in People/Academics). */
  institutionId?: string;
  /** Called after a successful commit — the parent should reload its lists and close. */
  onComplete: () => void;
}

/**
 * Bulk end-of-year promotion wizard — M2 Phase 3. Maps every class in a
 * source academic year to a class in a target academic year (or
 * "Graduates/Leaves"), previews the effect with no writes, then commits it.
 * A dedicated component (not ResourceSection) because a two-step
 * preview-then-commit flow with a conflict-blocking gate doesn't fit that
 * generic CRUD shape — same category of thing as AcademicYearsSection.
 */
export default function PromotionWizard({
  open,
  onClose,
  campuses,
  classes,
  sections,
  students,
  users,
  institutionId,
  onComplete,
}: PromotionWizardProps) {
  const { showMessage } = useMessage();

  const [step, setStep] = useState(0);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [campusId, setCampusId] = useState("");
  const [sourceYearId, setSourceYearId] = useState("");
  const [targetYearId, setTargetYearId] = useState("");

  const [loadingSourceClasses, setLoadingSourceClasses] = useState(false);
  const [sourceEnrollments, setSourceEnrollments] = useState<EnrollmentLite[]>([]);
  const [classMappings, setClassMappings] = useState<Record<string, ClassMappingState>>({});

  const [overrides, setOverrides] = useState<StudentOverrideEntry[]>([]);
  const [newOverrideStudentId, setNewOverrideStudentId] = useState("");
  const [newOverrideAction, setNewOverrideAction] = useState<OverrideAction>("REPEAT");
  const [newOverrideClassId, setNewOverrideClassId] = useState("");
  const [newOverrideSectionId, setNewOverrideSectionId] = useState("");

  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<PromotionPreviewResult | null>(null);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<PromotionCommitResult | null>(null);

  const wasOpen = useRef(false);

  // Reset all wizard state each time the dialog is (re-)opened.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(0);
      setCampusId(campuses.length === 1 ? campuses[0].id : "");
      setSourceYearId("");
      setTargetYearId("");
      setSourceEnrollments([]);
      setClassMappings({});
      setOverrides([]);
      setNewOverrideStudentId("");
      setNewOverrideAction("REPEAT");
      setNewOverrideClassId("");
      setNewOverrideSectionId("");
      setPreview(null);
      setCommitResult(null);
    }
    wasOpen.current = open;
  }, [open, campuses]);

  // Load academic years once the dialog opens.
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingYears(true);
      const { data } = await apiHandler<AcademicYear[]>(
        () => academicsService.getAcademicYears(institutionId) as never,
        { showMessage, silent: true }
      );
      setLoadingYears(false);
      const years = data ?? [];
      setAcademicYears(years);
      setSourceYearId((prev) => prev || years.find((y) => y.isCurrent)?.id || "");
    })();
  }, [open, institutionId, showMessage]);

  // Discover which classes actually had active students in the source year —
  // that's the mapping table's row set, not the institution's full class list.
  useEffect(() => {
    if (!open || !campusId || !sourceYearId) return;
    let cancelled = false;
    (async () => {
      setLoadingSourceClasses(true);
      const { data } = await apiHandler<EnrollmentLite[]>(
        () =>
          peopleService.getStudentEnrollments({
            campusId,
            academicYearId: sourceYearId,
            status: "ACTIVE",
          }) as never,
        { showMessage, silent: true }
      );
      if (!cancelled) {
        setSourceEnrollments(data ?? []);
        setLoadingSourceClasses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, campusId, sourceYearId, showMessage]);

  const classNameById = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [classes]
  );
  const userNameById = useMemo(
    () => users.reduce<Record<string, string>>((acc, u) => ((acc[u.id] = u.name), acc), {}),
    [users]
  );

  /**
   * Distinct classes present among the source year's active enrollments, in
   * class-list order. Guarded on campusId/sourceYearId (not just on
   * sourceEnrollments being cleared) so a still-in-flight fetch for a
   * combination that's just been changed away from never flashes stale rows.
   */
  const sourceClasses = useMemo(() => {
    if (!campusId || !sourceYearId) return [];
    const ids = new Set(sourceEnrollments.map((e) => e.classId));
    return classes.filter((c) => ids.has(c.id));
  }, [campusId, sourceYearId, sourceEnrollments, classes]);

  /** Distinct sections enrolled under one source class. */
  const sourceSectionsForClass = (classId: string) => {
    const ids = new Set(
      sourceEnrollments.filter((e) => e.classId === classId && e.sectionId).map((e) => e.sectionId as string)
    );
    return sections.filter((s) => ids.has(s.id));
  };

  const getMapping = (classId: string): ClassMappingState =>
    classMappings[classId] ?? { toClassId: "", sectionMapping: {} };

  // Any change to the setup invalidates a previously generated preview —
  // force the admin to re-run it before Next unlocks again. Cleared inline
  // by each mutator below rather than via a watching effect.
  const setMappingTarget = (fromClassId: string, toClassId: string) => {
    setClassMappings((prev) => ({
      ...prev,
      [fromClassId]: { toClassId, sectionMapping: {} },
    }));
    setPreview(null);
  };

  const setMappingSection = (fromClassId: string, fromSectionId: string, toSectionId: string) => {
    setClassMappings((prev) => ({
      ...prev,
      [fromClassId]: {
        toClassId: prev[fromClassId]?.toClassId ?? "",
        sectionMapping: { ...(prev[fromClassId]?.sectionMapping ?? {}), [fromSectionId]: toSectionId },
      },
    }));
    setPreview(null);
  };

  const studentsInScope = useMemo(() => {
    const enrolledIds = new Set(sourceEnrollments.map((e) => e.studentId));
    return students.filter((s) => s.campusId === campusId && enrolledIds.has(s.id));
  }, [students, sourceEnrollments, campusId]);

  const studentLabel = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return "Student";
    const name = userNameById[student.userId] ?? "Student";
    return student.regNo ? `${name} (${student.regNo})` : name;
  };

  const addOverride = () => {
    if (!newOverrideStudentId) return;
    setOverrides((prev) => [
      ...prev.filter((o) => o.studentId !== newOverrideStudentId),
      {
        studentId: newOverrideStudentId,
        action: newOverrideAction,
        ...(newOverrideAction !== "LEAVE" && newOverrideClassId && { toClassId: newOverrideClassId }),
        ...(newOverrideAction !== "LEAVE" && newOverrideSectionId && { toSectionId: newOverrideSectionId }),
      },
    ]);
    setNewOverrideStudentId("");
    setNewOverrideAction("REPEAT");
    setNewOverrideClassId("");
    setNewOverrideSectionId("");
    setPreview(null);
  };

  const removeOverride = (studentId: string) => {
    setOverrides((prev) => prev.filter((o) => o.studentId !== studentId));
    setPreview(null);
  };

  /**
   * Builds the `classMappings` array for the preview/commit request body —
   * classes with no rule chosen yet are omitted (they surface as conflicts
   * unless every affected student has an explicit override).
   *
   * @returns {ClassMappingPayload[]} One entry per source class with a chosen target.
   */
  const buildClassMappingsPayload = (): ClassMappingPayload[] =>
    sourceClasses.reduce<ClassMappingPayload[]>((acc, sc) => {
      const state = getMapping(sc.id);
      if (!state.toClassId) return acc;
      const toClassId = state.toClassId === LEAVE_SENTINEL ? null : state.toClassId;
      const sectionEntries = Object.entries(state.sectionMapping)
        .filter(([, toSectionId]) => Boolean(toSectionId))
        .map(([fromSectionId, toSectionId]) => ({ fromSectionId, toSectionId }));
      acc.push({
        fromClassId: sc.id,
        toClassId,
        ...(sectionEntries.length > 0 && { sectionMapping: sectionEntries }),
      });
      return acc;
    }, []);

  const buildPayload = () => ({
    campusId,
    sourceAcademicYearId: sourceYearId,
    targetAcademicYearId: targetYearId,
    classMappings: buildClassMappingsPayload(),
    ...(overrides.length > 0 && {
      studentOverrides: overrides.map((o) => ({
        studentId: o.studentId,
        action: o.action,
        ...(o.toClassId && { toClassId: o.toClassId }),
        ...(o.toSectionId && { toSectionId: o.toSectionId }),
      })),
    }),
  });

  const setupValid = Boolean(campusId && sourceYearId && targetYearId && sourceYearId !== targetYearId);

  const handlePreview = async () => {
    setPreviewing(true);
    const { data, success } = await apiHandler<PromotionPreviewResult>(
      () => peopleService.previewPromotion(buildPayload()) as never,
      { showMessage, silent: true }
    );
    setPreviewing(false);
    if (success && data) setPreview(data);
  };

  const canProceedToCommit = Boolean(preview && preview.conflicts.length === 0);

  const handleCommit = async () => {
    setCommitting(true);
    const { data, success } = await apiHandler<PromotionCommitResult>(
      () => peopleService.commitPromotion(buildPayload()) as never,
      { showMessage, successMessage: "Promotion committed." }
    );
    setCommitting(false);
    if (success && data) setCommitResult(data);
  };

  const handleClose = () => {
    if (previewing || committing) return;
    onClose();
  };

  const conflictName = (c: PromotionConflict) => c.studentName ?? studentLabel(c.studentId) ?? c.studentId;
  const conflictClassName = (c: PromotionConflict) =>
    c.className ?? (c.classId ? classNameById[c.classId] : undefined) ?? "—";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Promote Students
        <IconButton size="small" onClick={handleClose} disabled={previewing || committing}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={step}>
          <Step completed={step > 0}><StepLabel>Setup &amp; Preview</StepLabel></Step>
          <Step><StepLabel>Commit</StepLabel></Step>
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: "16px !important" }}>
        {step === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select label="Campus" required value={campusId}
                  onChange={(e) => { setCampusId(e.target.value); setPreview(null); }} fullWidth
                >
                  {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select label="From Academic Year" required value={sourceYearId}
                  onChange={(e) => { setSourceYearId(e.target.value); setPreview(null); }} fullWidth
                  disabled={loadingYears}
                >
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (Current)" : ""}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select label="To Academic Year" required value={targetYearId}
                  onChange={(e) => { setTargetYearId(e.target.value); setPreview(null); }} fullWidth
                  disabled={loadingYears}
                  error={Boolean(targetYearId) && targetYearId === sourceYearId}
                  helperText={
                    Boolean(targetYearId) && targetYearId === sourceYearId
                      ? "Pick a different year than the source."
                      : undefined
                  }
                >
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (Current)" : ""}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {campusId && sourceYearId && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Class Mapping
                </Typography>
                {loadingSourceClasses ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={24} /></Box>
                ) : sourceClasses.length === 0 ? (
                  <Alert severity="info">No active students found in this campus for the selected year.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>From Class</TableCell>
                        <TableCell>Promotes To</TableCell>
                        <TableCell>Section Mapping</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sourceClasses.map((sc) => {
                        const mapping = getMapping(sc.id);
                        const sourceSections = sourceSectionsForClass(sc.id);
                        const targetSections = sections.filter((s) => s.classId === mapping.toClassId);
                        const showSectionMapping =
                          mapping.toClassId &&
                          mapping.toClassId !== LEAVE_SENTINEL &&
                          sourceSections.length > 0;
                        return (
                          <TableRow key={sc.id} sx={{ verticalAlign: "top" }}>
                            <TableCell sx={{ fontWeight: 600, pt: 1.5 }}>{sc.name}</TableCell>
                            <TableCell sx={{ pt: 1 }}>
                              <TextField
                                select size="small" label="Promotes To" value={mapping.toClassId}
                                onChange={(e) => setMappingTarget(sc.id, e.target.value)}
                                sx={{ minWidth: 200 }}
                              >
                                <MenuItem value="">— Not set —</MenuItem>
                                <MenuItem value={LEAVE_SENTINEL}>Graduates / Leaves</MenuItem>
                                {classes.filter((c) => c.id !== sc.id).map((c) => (
                                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell sx={{ pt: 1 }}>
                              {!showSectionMapping ? (
                                <Typography variant="caption" color="text.disabled">
                                  {mapping.toClassId ? "No section changes" : "Choose a target class first"}
                                </Typography>
                              ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                  {sourceSections.map((s) => (
                                    <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Typography variant="caption" sx={{ minWidth: 50 }}>{s.name}</Typography>
                                      <TextField
                                        select size="small" label="To Section" value={mapping.sectionMapping[s.id] ?? ""}
                                        onChange={(e) => setMappingSection(sc.id, s.id, e.target.value)}
                                        sx={{ minWidth: 140 }}
                                      >
                                        <MenuItem value="">— Same/unset —</MenuItem>
                                        {targetSections.map((ts) => (
                                          <MenuItem key={ts.id} value={ts.id}>{ts.name}</MenuItem>
                                        ))}
                                      </TextField>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {campusId && sourceYearId && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Exceptions (optional)
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1.5 }}>
                  Override the class rule above for individual students — repeaters, early leavers, or
                  a student going to a different class than the rest of theirs.
                </Typography>

                {overrides.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                    {overrides.map((o) => (
                      <Chip
                        key={o.studentId}
                        label={`${studentLabel(o.studentId)} — ${o.action}${o.toClassId ? ` → ${classNameById[o.toClassId] ?? o.toClassId}` : ""}`}
                        onDelete={() => removeOverride(o.studentId)}
                      />
                    ))}
                  </Box>
                )}

                <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Autocomplete
                      size="small"
                      options={studentsInScope}
                      getOptionLabel={(s) => studentLabel(s.id)}
                      value={studentsInScope.find((s) => s.id === newOverrideStudentId) ?? null}
                      onChange={(_, value) => setNewOverrideStudentId(value?.id ?? "")}
                      renderInput={(params) => <TextField {...params} label="Student" />}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2.5 }}>
                    <TextField
                      select size="small" label="Action" fullWidth value={newOverrideAction}
                      onChange={(e) => setNewOverrideAction(e.target.value as OverrideAction)}
                    >
                      {OVERRIDE_ACTIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                    </TextField>
                  </Grid>
                  {newOverrideAction !== "LEAVE" && (
                    <>
                      <Grid size={{ xs: 6, sm: 2.5 }}>
                        <TextField
                          select size="small" label="To Class" fullWidth value={newOverrideClassId}
                          onChange={(e) => { setNewOverrideClassId(e.target.value); setNewOverrideSectionId(""); }}
                        >
                          <MenuItem value="">—</MenuItem>
                          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          select size="small" label="To Section" fullWidth value={newOverrideSectionId}
                          onChange={(e) => setNewOverrideSectionId(e.target.value)}
                          disabled={!newOverrideClassId}
                        >
                          <MenuItem value="">—</MenuItem>
                          {sections.filter((s) => s.classId === newOverrideClassId).map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </>
                  )}
                  <Grid size={{ xs: 6, sm: 1 }}>
                    <Button variant="outlined" fullWidth disabled={!newOverrideStudentId} onClick={addOverride}>
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Divider />

            <Box>
              <Button
                variant="outlined"
                onClick={handlePreview}
                disabled={!setupValid || previewing || sourceClasses.length === 0}
                startIcon={previewing ? <CircularProgress size={16} /> : undefined}
              >
                {previewing ? "Generating Preview..." : "Preview"}
              </Button>

              {preview && (
                <Box sx={{ mt: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Chip label={`Total: ${preview.totalStudents}`} />
                    <Chip color="success" label={`Promoted: ${preview.byOutcome.promoted}`} />
                    <Chip color="warning" label={`Repeated: ${preview.byOutcome.repeated}`} />
                    <Chip color="default" label={`Left: ${preview.byOutcome.left}`} />
                  </Box>

                  {preview.perClassBreakdown.length > 0 && (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Class</TableCell>
                          <TableCell align="right">Promoted</TableCell>
                          <TableCell align="right">Repeated</TableCell>
                          <TableCell align="right">Left</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.perClassBreakdown.map((row, i) => (
                          <TableRow key={row.classId ?? i}>
                            <TableCell>
                              {row.className ?? (row.classId ? classNameById[row.classId] : undefined) ?? "—"}
                            </TableCell>
                            <TableCell align="right">{row.promoted ?? "—"}</TableCell>
                            <TableCell align="right">{row.repeated ?? "—"}</TableCell>
                            <TableCell align="right">{row.left ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {preview.conflicts.length > 0 && (
                    <Alert severity="warning" icon={<Warning fontSize="small" />}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {preview.conflicts.length} student{preview.conflicts.length !== 1 ? "s" : ""} need
                        {preview.conflicts.length === 1 ? "s" : ""} a class mapping or an exception before you can commit:
                      </Typography>
                      {preview.conflicts.map((c, i) => (
                        <Typography key={c.studentId ?? i} variant="caption" sx={{ display: "block" }}>
                          {conflictName(c)} — {conflictClassName(c)}
                        </Typography>
                      ))}
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {!commitResult ? (
              <>
                <Alert severity="info">
                  Review the numbers below, then confirm to execute this promotion. Re-running a
                  partially-failed commit is safe — already-processed students are skipped.
                </Alert>
                {preview && (
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Chip label={`Total: ${preview.totalStudents}`} />
                    <Chip color="success" label={`Promoted: ${preview.byOutcome.promoted}`} />
                    <Chip color="warning" label={`Repeated: ${preview.byOutcome.repeated}`} />
                    <Chip color="default" label={`Left: ${preview.byOutcome.left}`} />
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="success">
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Promotion committed.</Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1 }}>
                  <Chip color="success" label={`Promoted: ${commitResult.promoted}`} />
                  <Chip color="warning" label={`Repeated: ${commitResult.repeated}`} />
                  <Chip color="default" label={`Left: ${commitResult.left}`} />
                  {commitResult.skippedAlreadyProcessed > 0 && (
                    <Chip label={`Already processed: ${commitResult.skippedAlreadyProcessed}`} />
                  )}
                </Box>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={previewing || committing}>
          {commitResult ? "Close" : "Cancel"}
        </Button>
        <Box sx={{ flex: 1 }} />
        {step === 1 && !commitResult && (
          <Button startIcon={<ArrowBack />} onClick={() => setStep(0)} disabled={committing}>
            Back
          </Button>
        )}
        {step === 0 && (
          <Button
            variant="contained"
            endIcon={<NavigateNext />}
            onClick={() => setStep(1)}
            disabled={!canProceedToCommit}
          >
            Next
          </Button>
        )}
        {step === 1 && !commitResult && (
          <Button variant="contained" onClick={handleCommit} disabled={committing}>
            {committing ? <CircularProgress size={16} color="inherit" /> : "Confirm & Commit"}
          </Button>
        )}
        {step === 1 && commitResult && (
          <Button variant="contained" onClick={onComplete}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
