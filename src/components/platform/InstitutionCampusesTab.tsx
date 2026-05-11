"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { campusesService } from "@/services/campuses.service";
import { formatDate } from "@/lib/dateFormat";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface Campus {
  id: string;
  name: string;
  location?: string;
  studentStartTime?: string;
  studentEndTime?: string;
  staffStartTime?: string;
  staffEndTime?: string;
  lateThreshold?: number;
  earlyLeaveThreshold?: number;
  status?: string;
  createdAt: string;
}

interface PaginatedCampuses { items: Campus[]; total: number; }
interface Props { institutionId: string; }

const emptyForm = {
  name: "",
  location: "",
  studentStartTime: "08:00",
  studentEndTime: "14:00",
  staffStartTime: "07:30",
  staffEndTime: "15:00",
  lateThreshold: "15",
  earlyLeaveThreshold: "15",
};

export default function InstitutionCampusesTab({ institutionId }: Props) {
  const { showMessage } = useMessage();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campus | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Campus | null>(null);

  const load = useCallback(async () => {
    const { data } = await apiHandler<PaginatedCampuses>(
      () => campusesService.getAll({ limit: 100 }),
      { showMessage, silent: true }
    );
    setCampuses(data?.items ?? []);
    setLoading(false);
  }, [institutionId, showMessage]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Campus) => {
    setEditing(c);
    setForm({
      name: c.name,
      location: c.location ?? "",
      studentStartTime: c.studentStartTime ?? "08:00",
      studentEndTime: c.studentEndTime ?? "14:00",
      staffStartTime: c.staffStartTime ?? "07:30",
      staffEndTime: c.staffEndTime ?? "15:00",
      lateThreshold: String(c.lateThreshold ?? 15),
      earlyLeaveThreshold: String(c.earlyLeaveThreshold ?? 15),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      location: form.location,
      studentStartTime: form.studentStartTime,
      studentEndTime: form.studentEndTime,
      staffStartTime: form.staffStartTime,
      staffEndTime: form.staffEndTime,
      lateThreshold: Number(form.lateThreshold),
      earlyLeaveThreshold: Number(form.earlyLeaveThreshold),
      institutionId,
    };
    if (editing) {
      await apiHandler(() => campusesService.update(editing.id, payload), { showMessage, successMessage: "Campus updated." });
    } else {
      await apiHandler(() => campusesService.create(payload), { showMessage, successMessage: "Campus created." });
    }
    setDialogOpen(false);
    setSaving(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await apiHandler(
      () => campusesService.delete(confirmDelete.id, "Deleted by superadmin"),
      { showMessage, successMessage: `"${confirmDelete.name}" moved to recycle bin.` }
    );
    setConfirmDelete(null);
    load();
  };

  const f = (key: keyof typeof emptyForm, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Campuses</Typography>
          <Typography variant="body2" color="text.secondary">
            {campuses.length} campus{campuses.length !== 1 ? "es" : ""} registered for this institution.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Campus</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : campuses.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>No campuses yet.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add First Campus</Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {campuses.map((campus) => (
            <Card key={campus.id} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>
                      {campus.name.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{campus.name}</Typography>
                      {campus.status && (
                        <Chip label={campus.status} size="small" color={campus.status === "ACTIVE" ? "success" : "default"} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {campus.location || "No location"} Â· Students {campus.studentStartTime}â€“{campus.studentEndTime} Â· Staff {campus.staffStartTime}â€“{campus.staffEndTime}
                      {" Â· Added "}{formatDate(campus.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(campus)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirmDelete(campus)}><Delete fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Campus"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? It will be moved to the recycle bin and can be restored later.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Campus" : "New Campus"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Campus Name *" value={form.name} onChange={(e) => f("name", e.target.value)} required fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Location" value={form.location} onChange={(e) => f("location", e.target.value)} fullWidth placeholder="e.g. 123 Main Street, Lahore" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Student Hours
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Start Time" type="time" value={form.studentStartTime} onChange={(e) => f("studentStartTime", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="End Time" type="time" value={form.studentEndTime} onChange={(e) => f("studentEndTime", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Staff Hours
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Start Time" type="time" value={form.staffStartTime} onChange={(e) => f("staffStartTime", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="End Time" type="time" value={form.staffEndTime} onChange={(e) => f("staffEndTime", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Late Threshold (mins)" type="number" value={form.lateThreshold} onChange={(e) => f("lateThreshold", e.target.value)} fullWidth helperText="Minutes after start time before marked late." />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Early Leave Threshold (mins)" type="number" value={form.earlyLeaveThreshold} onChange={(e) => f("earlyLeaveThreshold", e.target.value)} fullWidth helperText="Minutes before end time to flag early leave." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create Campus"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

