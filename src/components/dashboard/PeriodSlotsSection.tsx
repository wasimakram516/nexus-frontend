"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { timetableService } from "@/services/timetable.service";

/** Matches the backend's `DayOfWeek` enum (M3 design doc § 5.2) — no frontend equivalent existed yet. */
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/** Monday-first, matching the grid's column order. */
export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/** Short column headers for the weekly grid. */
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export interface PeriodSlot {
  id: string;
  campusId: string;
  classId: string;
  sectionId: string;
  subjectId?: string | null;
  staffProfileId?: string | null;
  name: string;
  periodNumber: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface NamedItem {
  id: string;
  name: string;
}

interface TeacherItem {
  id: string;
  userId: string;
  campusId: string;
}

interface PeriodSlotsSectionProps {
  classes: (NamedItem & { levelId?: string })[];
  levels: (NamedItem & { campusId?: string })[];
  sections: (NamedItem & { classId?: string })[];
  subjects: (NamedItem & { classId?: string })[];
  teachers: TeacherItem[];
  teacherName: (teacherId: string) => string;
  canManage: boolean;
  onReload: () => void;
}

interface SlotFormState {
  name: string;
  periodNumber: string;
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
  subjectId: string;
  staffProfileId: string;
}

/** A fresh, empty slot form, optionally pre-filled from the grid cell that was clicked. */
function emptySlotForm(prefill?: { periodNumber?: number; dayOfWeek?: DayOfWeek }): SlotFormState {
  return {
    name: "",
    periodNumber: prefill?.periodNumber !== undefined ? String(prefill.periodNumber) : "",
    dayOfWeek: prefill?.dayOfWeek ?? "",
    startTime: "",
    endTime: "",
    subjectId: "",
    staffProfileId: "",
  };
}

/**
 * Timetable M1 (Period Slots) — a dedicated section (not ResourceSection,
 * which can't express a weekly grid) for building a section's weekly-
 * recurring schedule template: named periods with a time range, optional
 * subject, and optional teacher. This is explicitly NOT the drag-drop
 * builder UX (M3 design doc § scope note) — a plain table where clicking a
 * cell opens a create/edit dialog is the full scope of this milestone.
 *
 * Structured the same way AcademicYearsSection and TeachingAssignmentsSection
 * were: it owns its own dialogs and calls timetableService directly via
 * apiHandler, receiving only the shared academics lookups + a coarse-grained
 * canManage flag + onReload from AcademicsManager's hub.
 */
export default function PeriodSlotsSection({
  classes,
  levels,
  sections,
  subjects,
  teachers,
  teacherName,
  canManage,
  onReload,
}: PeriodSlotsSectionProps) {
  const { showMessage } = useMessage();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [weekSlots, setWeekSlots] = useState<PeriodSlot[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PeriodSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SlotFormState>(emptySlotForm());
  const [confirmDelete, setConfirmDelete] = useState<PeriodSlot | null>(null);

  /** Loads the full weekly grid for one section. */
  const loadWeek = useCallback(
    async (sectionId: string) => {
      setLoadingWeek(true);
      const { data } = await apiHandler<PeriodSlot[]>(
        () => timetableService.getSectionWeek(sectionId),
        { showMessage, silent: true }
      );
      setWeekSlots(Array.isArray(data) ? data : []);
      setLoadingWeek(false);
    },
    [showMessage]
  );

  useEffect(() => {
    if (selectedSectionId) {
      loadWeek(selectedSectionId);
    } else {
      setWeekSlots([]);
    }
  }, [selectedSectionId, loadWeek]);

  const sectionsForClass = useMemo(
    () => sections.filter((s) => s.classId === selectedClassId),
    [sections, selectedClassId]
  );
  const subjectsForClass = useMemo(
    () => subjects.filter((s) => s.classId === selectedClassId),
    [subjects, selectedClassId]
  );

  /** Campus of a class resolves through its level (AcademicClass has no direct campusId). */
  const campusOfClass = useCallback(
    (classId: string): string | undefined => {
      const cls = classes.find((c) => c.id === classId);
      const level = levels.find((l) => l.id === cls?.levelId);
      return level?.campusId;
    },
    [classes, levels]
  );
  const selectedCampusId = selectedClassId ? campusOfClass(selectedClassId) : undefined;
  const teachersForCampus = useMemo(
    () => teachers.filter((t) => !selectedCampusId || t.campusId === selectedCampusId),
    [teachers, selectedCampusId]
  );

  const subjectName = useMemo(
    () => subjects.reduce<Record<string, string>>((acc, s) => ((acc[s.id] = s.name), acc), {}),
    [subjects]
  );

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSectionId("");
  };

  /** Unique period numbers present in the loaded week, sorted ascending — the grid's rows. */
  const periodNumbers = useMemo(() => {
    const nums = new Set(weekSlots.map((s) => s.periodNumber));
    return Array.from(nums).sort((a, b) => a - b);
  }, [weekSlots]);

  const slotFor = useCallback(
    (periodNumber: number, day: DayOfWeek) =>
      weekSlots.find((s) => s.periodNumber === periodNumber && s.dayOfWeek === day),
    [weekSlots]
  );

  const openCreate = (prefill?: { periodNumber?: number; dayOfWeek?: DayOfWeek }) => {
    setEditing(null);
    setForm(emptySlotForm(prefill));
    setDialogOpen(true);
  };

  const openEdit = (slot: PeriodSlot) => {
    setEditing(slot);
    setForm({
      name: slot.name,
      periodNumber: String(slot.periodNumber),
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: slot.subjectId ?? "",
      staffProfileId: slot.staffProfileId ?? "",
    });
    setDialogOpen(true);
  };

  /** Clicking a grid cell edits its slot if one exists, or opens a pre-filled create dialog. */
  const handleCellClick = (periodNumber: number, day: DayOfWeek) => {
    if (!canManage) return;
    const slot = slotFor(periodNumber, day);
    if (slot) openEdit(slot);
    else openCreate({ periodNumber, dayOfWeek: day });
  };

  const formValid = Boolean(
    form.name.trim() &&
      form.periodNumber &&
      Number(form.periodNumber) > 0 &&
      form.dayOfWeek &&
      form.startTime &&
      form.endTime
  );

  const handleSave = async () => {
    if (!selectedClassId || !selectedSectionId) return;

    // subjectId/staffProfileId always sent (as null when cleared) — an
    // omitted key on PATCH means "leave unchanged" (same convention as
    // NoticesManager's scope fields), so clearing either on edit requires
    // an explicit null, not omission.
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      periodNumber: Number(form.periodNumber),
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      subjectId: form.subjectId || null,
      staffProfileId: form.staffProfileId || null,
    };
    // classId/sectionId are only meaningful on create — this grid is always
    // scoped to one already-selected section, so editing never reassigns them.
    if (!editing) {
      payload.classId = selectedClassId;
      payload.sectionId = selectedSectionId;
    }

    setSaving(true);
    const { success } = editing
      ? await apiHandler(() => timetableService.updatePeriodSlot(editing.id, payload), {
          showMessage,
          successMessage: "Period slot updated.",
        })
      : await apiHandler(() => timetableService.createPeriodSlot(payload), {
          showMessage,
          successMessage: "Period slot created.",
        });
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      loadWeek(selectedSectionId);
      onReload();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { success } = await apiHandler(
      () => timetableService.deletePeriodSlot(confirmDelete.id),
      { showMessage, successMessage: "Period slot moved to recycle bin." }
    );
    setConfirmDelete(null);
    if (success) {
      loadWeek(selectedSectionId);
      onReload();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Period Slots</Typography>
        <Typography variant="body2" color="text.secondary">
          A section&apos;s weekly-recurring schedule template — named periods with a time range,
          optional subject and teacher. Pick a class and section to view or edit its week.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            label="Class"
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Select a class</MenuItem>
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            label="Section"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            fullWidth
            disabled={!selectedClassId}
            helperText={
              selectedClassId && sectionsForClass.length === 0
                ? "Create a section for this class first."
                : undefined
            }
          >
            <MenuItem value="">Select a section</MenuItem>
            {sectionsForClass.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {!selectedSectionId ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              Pick a class and section above to view its weekly schedule.
            </Typography>
          </CardContent>
        </Card>
      ) : loadingWeek ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : periodNumbers.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: canManage ? 2 : 0 }}>
              No period slots yet for this section.
            </Typography>
            {canManage && (
              <Button variant="contained" startIcon={<Add />} onClick={() => openCreate()}>
                Add First Period Slot
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {canManage && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
              <Button variant="outlined" startIcon={<Add />} onClick={() => openCreate()}>
                Add Period Slot
              </Button>
            </Box>
          )}
          <DataTableCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Period</TableHeaderCell>
                  {DAYS_OF_WEEK.map((day) => (
                    <TableHeaderCell key={day} align="center">{DAY_LABELS[day]}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {periodNumbers.map((periodNumber) => (
                  <TableRow key={periodNumber} hover>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      Period {periodNumber}
                    </TableCell>
                    {DAYS_OF_WEEK.map((day) => {
                      const slot = slotFor(periodNumber, day);
                      return (
                        <TableCell
                          key={day}
                          align="center"
                          data-testid={slot ? `slot-cell-${periodNumber}-${day}` : `empty-cell-${periodNumber}-${day}`}
                          sx={{ p: 0.5, verticalAlign: "top", minWidth: 120 }}
                        >
                          {slot ? (
                            // Not role="button" — it wraps a real <button> (the delete
                            // action below), and nesting interactive roles is an ARIA
                            // anti-pattern. Click-to-edit still works via onClick; the
                            // delete IconButton remains independently keyboard-reachable.
                            <Box
                              onClick={() => handleCellClick(periodNumber, day)}
                              sx={{
                                position: "relative",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                p: 1,
                                textAlign: "left",
                                cursor: canManage ? "pointer" : "default",
                                "&:hover": canManage
                                  ? { borderColor: "primary.main", backgroundColor: "action.hover" }
                                  : undefined,
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600, pr: canManage ? 3 : 0 }}>
                                {slot.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                {slot.startTime}–{slot.endTime}
                              </Typography>
                              {slot.subjectId && (
                                <Typography variant="caption" sx={{ display: "block" }}>
                                  {subjectName[slot.subjectId] ?? "—"}
                                </Typography>
                              )}
                              {slot.staffProfileId && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  {teacherName(slot.staffProfileId)}
                                </Typography>
                              )}
                              {canManage && (
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    aria-label={`Delete ${slot.name}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete(slot);
                                    }}
                                    sx={{ position: "absolute", top: 2, right: 2 }}
                                  >
                                    <Delete fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          ) : canManage ? (
                            <Tooltip title="Add">
                              <IconButton
                                size="small"
                                aria-label={`Add period ${periodNumber} slot for ${day}`}
                                onClick={() => handleCellClick(periodNumber, day)}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableCard>
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Period Slot"
        message={
          confirmDelete
            ? `Are you sure you want to delete "${confirmDelete.name}" (${DAY_LABELS[confirmDelete.dayOfWeek]}, Period ${confirmDelete.periodNumber})? This record will be moved to the recycle bin.`
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Edit Period Slot" : "New Period Slot"}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Name *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
                placeholder="e.g. Period 1"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Period Number *"
                type="number"
                value={form.periodNumber}
                onChange={(e) => setForm((p) => ({ ...p, periodNumber: e.target.value }))}
                fullWidth
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                select
                label="Day of Week *"
                value={form.dayOfWeek}
                onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value as DayOfWeek }))}
                fullWidth
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day} value={day}>{day.charAt(0) + day.slice(1).toLowerCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Start Time *"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="End Time *"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                label="Subject"
                value={form.subjectId}
                onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
                fullWidth
                helperText={
                  subjectsForClass.length === 0 ? "No subjects for this class yet." : "Optional — leave blank for recess/assembly."
                }
              >
                <MenuItem value="">None</MenuItem>
                {subjectsForClass.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                label="Teacher"
                value={form.staffProfileId}
                onChange={(e) => setForm((p) => ({ ...p, staffProfileId: e.target.value }))}
                fullWidth
                helperText={
                  teachersForCampus.length === 0
                    ? "No teachers on this class's campus yet."
                    : "Optional — only teachers from the class's campus are listed."
                }
              >
                <MenuItem value="">None</MenuItem>
                {teachersForCampus.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{teacherName(t.id)}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !formValid}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
