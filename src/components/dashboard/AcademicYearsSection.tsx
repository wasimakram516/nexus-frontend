"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, EditCalendar } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { academicsService } from "@/services/academics.service";

export interface AcademicYearCampusOverride {
  id?: string;
  campusId: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  campusOverrides: AcademicYearCampusOverride[];
  createdAt: string;
}

interface CampusItem {
  id: string;
  name: string;
}

interface AcademicYearsSectionProps {
  academicYears: AcademicYear[];
  campuses: CampusItem[];
  loading: boolean;
  canManage: boolean;
  /** Set only in the platform console (superadmin managing another
   *  institution) — forwarded to every academicsService call so they route
   *  through the `/platform/institutions/:id/academic-years` mirror. */
  institutionId?: string;
  onReload: () => void;
}

interface YearFormState {
  name: string;
  startDate: string;
  endDate: string;
}

interface OverrideFormEntry {
  enabled: boolean;
  startDate: string;
  endDate: string;
}

const emptyYearForm: YearFormState = { name: "", startDate: "", endDate: "" };

/**
 * Builds the per-campus override form seed for an academic year: every
 * campus gets an entry, pre-checked and pre-filled when an override already
 * exists for it.
 *
 * @param {AcademicYear} year - The academic year being edited.
 * @param {CampusItem[]} campuses - Every campus in scope.
 * @returns {Record<string, OverrideFormEntry>} Form state keyed by campus id.
 */
function buildOverrideForm(
  year: AcademicYear,
  campuses: CampusItem[]
): Record<string, OverrideFormEntry> {
  const form: Record<string, OverrideFormEntry> = {};
  for (const campus of campuses) {
    const existing = year.campusOverrides.find((o) => o.campusId === campus.id);
    form[campus.id] = {
      enabled: Boolean(existing),
      startDate: existing?.startDate ? String(existing.startDate).slice(0, 10) : "",
      endDate: existing?.endDate ? String(existing.endDate).slice(0, 10) : "",
    };
  }
  return form;
}

/**
 * Academic Years — Phase 1 of the M2 People & Academic backbone. A
 * dedicated section (not the generic ResourceSection) because it needs a
 * "Current" indicator, a "Set Current" row action, and a nested
 * per-campus date-override editor that ResourceSection can't express.
 * Extracted the same way TeachingAssignmentsSection was: it owns its own
 * dialogs and calls academicsService directly via apiHandler, receiving
 * only data + a coarse-grained canManage flag + onReload from the parent.
 */
export default function AcademicYearsSection({
  academicYears,
  campuses,
  loading,
  canManage,
  institutionId,
  onReload,
}: AcademicYearsSectionProps) {
  const { showMessage } = useMessage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<YearFormState>(emptyYearForm);
  const [confirmDelete, setConfirmDelete] = useState<AcademicYear | null>(null);

  const [overridesDialogOpen, setOverridesDialogOpen] = useState(false);
  const [overridesFor, setOverridesFor] = useState<AcademicYear | null>(null);
  const [overridesSaving, setOverridesSaving] = useState(false);
  const [overrideForm, setOverrideForm] = useState<Record<string, OverrideFormEntry>>({});

  const openCreate = () => {
    setEditing(null);
    setForm(emptyYearForm);
    setDialogOpen(true);
  };

  const openEdit = (year: AcademicYear) => {
    setEditing(year);
    setForm({
      name: year.name,
      startDate: year.startDate.slice(0, 10),
      endDate: year.endDate.slice(0, 10),
    });
    setDialogOpen(true);
  };

  const formValid = Boolean(form.name && form.startDate && form.endDate);

  const handleSave = async () => {
    const payload = { name: form.name, startDate: form.startDate, endDate: form.endDate };
    setSaving(true);
    const { success } = editing
      ? await apiHandler(() => academicsService.updateAcademicYear(editing.id, payload, institutionId), {
          showMessage,
          successMessage: "Academic year updated.",
        })
      : await apiHandler(() => academicsService.createAcademicYear(payload, institutionId), {
          showMessage,
          successMessage: "Academic year created.",
        });
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      onReload();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { success } = await apiHandler(
      () => academicsService.deleteAcademicYear(confirmDelete.id, institutionId),
      { showMessage, successMessage: "Academic year moved to recycle bin." }
    );
    if (success) onReload();
    setConfirmDelete(null);
  };

  const handleSetCurrent = async (year: AcademicYear) => {
    const { success } = await apiHandler(() => academicsService.setCurrentAcademicYear(year.id, institutionId), {
      showMessage,
      successMessage: `"${year.name}" is now the current academic year.`,
    });
    if (success) onReload();
  };

  const openOverrides = (year: AcademicYear) => {
    setOverridesFor(year);
    setOverrideForm(buildOverrideForm(year, campuses));
    setOverridesDialogOpen(true);
  };

  const setOverrideEntry = (campusId: string, patch: Partial<OverrideFormEntry>) =>
    setOverrideForm((prev) => ({
      ...prev,
      [campusId]: { ...(prev[campusId] ?? { enabled: false, startDate: "", endDate: "" }), ...patch },
    }));

  const handleSaveOverrides = async () => {
    if (!overridesFor) return;
    const campusOverrides = campuses
      .filter((c) => overrideForm[c.id]?.enabled)
      .map((c) => {
        const entry = overrideForm[c.id];
        const override: Record<string, unknown> = { campusId: c.id };
        if (entry.startDate) override.startDate = entry.startDate;
        if (entry.endDate) override.endDate = entry.endDate;
        return override;
      });

    setOverridesSaving(true);
    const { success } = await apiHandler(
      () => academicsService.updateAcademicYear(overridesFor.id, { campusOverrides }, institutionId),
      { showMessage, successMessage: "Campus overrides updated." }
    );
    setOverridesSaving(false);
    if (success) {
      setOverridesDialogOpen(false);
      onReload();
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Academic Years</Typography>
          <Typography variant="body2" color="text.secondary">
            Sessions like 2026-27, with optional per-campus dates. Exactly one year is marked current at a time.
          </Typography>
        </Box>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Academic Year
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : academicYears.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: canManage ? 2 : 0 }}>
              No academic years yet.
            </Typography>
            {canManage && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                Add First Academic Year
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <DataTableCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Start Date</TableHeaderCell>
                <TableHeaderCell>End Date</TableHeaderCell>
                <TableHeaderCell>Current</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                {canManage && <TableHeaderCell align="right">Actions</TableHeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {academicYears.map((year) => (
                <TableRow key={year.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{year.name}</TableCell>
                  <TableCell>{formatDate(year.startDate)}</TableCell>
                  <TableCell>{formatDate(year.endDate)}</TableCell>
                  <TableCell>
                    {year.isCurrent && <Chip label="Current" color="primary" size="small" />}
                  </TableCell>
                  <TableCell>{formatDate(year.createdAt)}</TableCell>
                  {canManage && (
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Manage Campus Overrides">
                        <IconButton size="small" onClick={() => openOverrides(year)}>
                          <EditCalendar fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!year.isCurrent && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSetCurrent(year)}
                          sx={{ mx: 0.5 }}
                        >
                          Set Current
                        </Button>
                      )}
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(year)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setConfirmDelete(year)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableCard>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Academic Year"
        message={
          confirmDelete
            ? `Are you sure you want to delete "${confirmDelete.name}"? This record will be moved to the recycle bin.`
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Edit Academic Year" : "New Academic Year"}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Name *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                fullWidth
                placeholder="e.g. 2026-27"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Start Date *"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="End Date *"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
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

      <Dialog
        open={overridesDialogOpen}
        onClose={overridesSaving ? undefined : () => setOverridesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Campus Overrides{overridesFor ? ` — ${overridesFor.name}` : ""}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Check a campus to give it different start/end dates. Leave it unchecked to use the
            institution-wide dates above.
          </Typography>
          {campuses.length === 0 ? (
            <Typography color="text.secondary">No campuses to override yet.</Typography>
          ) : (
            campuses.map((campus) => {
              const entry = overrideForm[campus.id] ?? { enabled: false, startDate: "", endDate: "" };
              return (
                <Box key={campus.id} sx={{ mb: 2, pb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={entry.enabled}
                        onChange={(e) => setOverrideEntry(campus.id, { enabled: e.target.checked })}
                      />
                    }
                    label={campus.name}
                  />
                  {entry.enabled && (
                    <Grid container spacing={2} sx={{ pl: 4 }}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Start Date"
                          type="date"
                          size="small"
                          fullWidth
                          value={entry.startDate}
                          onChange={(e) => setOverrideEntry(campus.id, { startDate: e.target.value })}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="End Date"
                          type="date"
                          size="small"
                          fullWidth
                          value={entry.endDate}
                          onChange={(e) => setOverrideEntry(campus.id, { endDate: e.target.value })}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Box>
              );
            })
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOverridesDialogOpen(false)} disabled={overridesSaving}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOverrides} disabled={overridesSaving}>
            {overridesSaving ? <CircularProgress size={16} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
