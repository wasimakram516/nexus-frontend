"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { peopleService } from "@/services/people.service";

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  sectionId?: string | null;
  campusId: string;
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

interface TeachingAssignmentsSectionProps {
  assignments: TeachingAssignment[];
  loading: boolean;
  teachers: TeacherItem[];
  teacherName: (teacherId: string) => string;
  campuses: NamedItem[];
  levels: (NamedItem & { campusId?: string })[];
  classes: (NamedItem & { levelId?: string })[];
  sections: (NamedItem & { classId?: string })[];
  subjects: (NamedItem & { classId?: string })[];
  canManage: boolean;
  onReload: () => void;
}

/**
 * Section-level teaching allocations: which teacher takes which subject in
 * which section. The future timetable module builds on these rows.
 */
export default function TeachingAssignmentsSection({
  assignments,
  loading,
  teachers,
  teacherName,
  campuses,
  levels,
  classes,
  sections,
  subjects,
  canManage,
  onReload,
}: TeachingAssignmentsSectionProps) {
  const confirm = useConfirm();
  const { showMessage } = useMessage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ classId: "", sectionId: "", subjectId: "", teacherId: "" });

  const campusName = useMemo(
    () => campuses.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [campuses]
  );
  const className = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [classes]
  );
  const sectionName = useMemo(
    () => sections.reduce<Record<string, string>>((acc, s) => ((acc[s.id] = s.name), acc), {}),
    [sections]
  );
  const subjectName = useMemo(
    () => subjects.reduce<Record<string, string>>((acc, s) => ((acc[s.id] = s.name), acc), {}),
    [subjects]
  );

  /** Campus of a class resolves through its level. */
  const campusOfClass = (classId: string): string | undefined => {
    const cls = classes.find((c) => c.id === classId);
    const level = levels.find((l) => l.id === cls?.levelId);
    return level?.campusId;
  };

  const selectedCampusId = form.classId ? campusOfClass(form.classId) : undefined;

  const sectionsForClass = sections.filter((s) => s.classId === form.classId);
  const subjectsForClass = subjects.filter((s) => s.classId === form.classId);
  const teachersForCampus = teachers.filter(
    (t) => !selectedCampusId || t.campusId === selectedCampusId
  );

  const openCreate = () => {
    setForm({ classId: "", sectionId: "", subjectId: "", teacherId: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const campusId = campusOfClass(form.classId);
    if (!campusId) {
      showMessage("Pick a class first.", "warning");
      return;
    }
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        peopleService.assignTeacherToSubject({
          teacherId: form.teacherId,
          classId: form.classId,
          subjectId: form.subjectId,
          sectionId: form.sectionId,
          campusId,
        }),
      { showMessage, successMessage: "Teacher assigned." }
    );
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      onReload();
    }
  };

  const handleRemove = async (assignment: TeachingAssignment) => {
    const ok = await confirm({
      title: "Remove Assignment",
      message: `Unassign ${teacherName(assignment.teacherId)} from ${subjectName[assignment.subjectId] ?? "this subject"} (${className[assignment.classId] ?? "class"}${assignment.sectionId ? ` — ${sectionName[assignment.sectionId] ?? "section"}` : ""})?`,
      confirmLabel: "Unassign",
      confirmColor: "error",
    });
    if (!ok) return;
    const { success } = await apiHandler(
      () => peopleService.removeTeacherSubject(assignment.id),
      { showMessage, successMessage: "Teacher unassigned." }
    );
    if (success) onReload();
  };

  const formValid = Boolean(form.classId && form.sectionId && form.subjectId && form.teacherId);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Teaching Assignments</Typography>
          <Typography variant="body2" color="text.secondary">
            Who teaches which subject in each section. One row per teacher, subject and section.
          </Typography>
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Assign Teacher
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : assignments.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: canManage ? 2 : 0 }}>
              No teaching assignments yet.
            </Typography>
            {canManage && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                Assign First Teacher
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned</TableCell>
                {canManage && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{teacherName(assignment.teacherId)}</TableCell>
                  <TableCell>{subjectName[assignment.subjectId] ?? "—"}</TableCell>
                  <TableCell>{className[assignment.classId] ?? "—"}</TableCell>
                  <TableCell>
                    {assignment.sectionId
                      ? sectionName[assignment.sectionId] ?? "—"
                      : <Chip label="All sections (legacy)" size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
                  </TableCell>
                  <TableCell>{campusName[assignment.campusId] ?? "—"}</TableCell>
                  <TableCell>{formatDate(assignment.createdAt)}</TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <Tooltip title="Unassign">
                        <IconButton size="small" color="error" onClick={() => handleRemove(assignment)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Teacher</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                select label="Class *" value={form.classId}
                onChange={(e) => setForm({ classId: e.target.value, sectionId: "", subjectId: "", teacherId: "" })}
                fullWidth
                helperText={form.classId && selectedCampusId ? `Campus: ${campusName[selectedCampusId] ?? "—"}` : undefined}
              >
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Section *" value={form.sectionId}
                onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
                fullWidth disabled={!form.classId}
                helperText={
                  form.classId && sectionsForClass.length === 0
                    ? "Create a section for this class first."
                    : undefined
                }
              >
                {sectionsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Subject *" value={form.subjectId}
                onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
                fullWidth disabled={!form.classId}
                helperText={
                  form.classId && subjectsForClass.length === 0
                    ? "Create a subject for this class first."
                    : undefined
                }
              >
                {subjectsForClass.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select label="Teacher *" value={form.teacherId}
                onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                fullWidth disabled={!form.classId}
                helperText={
                  form.classId && teachersForCampus.length === 0
                    ? "No teachers on this class's campus yet — add them under People."
                    : "Only teachers from the class's campus are listed."
                }
              >
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
            {saving ? <CircularProgress size={16} color="inherit" /> : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
