"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, GroupAdd, PersonRemove } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { fetchAllUsers, UserLite } from "@/lib/users";
import { campusesService } from "@/services/campuses.service";

interface Campus {
  id: string;
  institutionId?: string;
  name: string;
  location?: string;
  studentStartTime?: string;
  studentEndTime?: string;
  staffStartTime?: string;
  staffEndTime?: string;
  lateThreshold?: number;
  earlyLeaveThreshold?: number;
  createdAt: string;
}

interface CampusUser {
  id: string;
  userId: string;
  campusId: string;
  user?: { id: string; name: string; email: string; role: string };
}

interface CampusesManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

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

export default function CampusesManager({ institutionId }: CampusesManagerProps) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { showMessage } = useMessage();

  const targetInstitutionId = institutionId ?? user?.institutionId ?? undefined;

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campus | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Campus | null>(null);

  // Manage-users dialog state
  const [manageCampus, setManageCampus] = useState<Campus | null>(null);
  const [campusUsers, setCampusUsers] = useState<CampusUser[]>([]);
  const [campusUsersLoading, setCampusUsersLoading] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    const { data } = await apiHandler<{ items: Campus[] }>(
      () => campusesService.getAll({ limit: 100 }),
      { showMessage, silent: true }
    );
    const all = data?.items ?? [];
    setCampuses(
      institutionId ? all.filter((c) => c.institutionId === institutionId) : all
    );
    setLoading(false);
  }, [showMessage, institutionId]);

  useEffect(() => {
    load();
    fetchAllUsers()
      .then((all) =>
        setUsers(
          institutionId ? all.filter((u) => u.institutionId === institutionId) : all
        )
      )
      .catch(() => setUsers([]));
  }, [load, institutionId]);

  const userMap = useMemo(
    () => users.reduce<Record<string, UserLite>>((acc, u) => ((acc[u.id] = u), acc), {}),
    [users]
  );

  const f = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (campus: Campus) => {
    setEditing(campus);
    setForm({
      name: campus.name,
      location: campus.location ?? "",
      studentStartTime: campus.studentStartTime ?? "08:00",
      studentEndTime: campus.studentEndTime ?? "14:00",
      staffStartTime: campus.staffStartTime ?? "07:30",
      staffEndTime: campus.staffEndTime ?? "15:00",
      lateThreshold: String(campus.lateThreshold ?? 15),
      earlyLeaveThreshold: String(campus.earlyLeaveThreshold ?? 15),
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
      institutionId: targetInstitutionId,
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
      () => campusesService.delete(confirmDelete.id, "Deleted from campus management"),
      { showMessage, successMessage: `"${confirmDelete.name}" moved to recycle bin.` }
    );
    setConfirmDelete(null);
    load();
  };

  const loadCampusUsers = useCallback(
    async (campusId: string) => {
      setCampusUsersLoading(true);
      const { data } = await apiHandler<CampusUser[]>(
        () => campusesService.getCampusUsers(campusId),
        { showMessage, silent: true }
      );
      setCampusUsers(Array.isArray(data) ? data : []);
      setCampusUsersLoading(false);
    },
    [showMessage]
  );

  const openManage = (campus: Campus) => {
    setManageCampus(campus);
    setAssignUserId("");
    loadCampusUsers(campus.id);
  };

  const handleAssign = async () => {
    if (!manageCampus || !assignUserId) return;
    setAssigning(true);
    const { success } = await apiHandler(
      () => campusesService.assignUser({ userId: assignUserId, campusId: manageCampus.id }),
      { showMessage, successMessage: "User assigned to campus." }
    );
    setAssigning(false);
    if (success) {
      setAssignUserId("");
      loadCampusUsers(manageCampus.id);
    }
  };

  const handleRemoveUser = async (userId: string, userName?: string) => {
    if (!manageCampus) return;
    const ok = await confirm({
      title: "Remove from Campus",
      message: `Remove ${userName ?? "this user"} from "${manageCampus.name}"? They lose access to this campus's records until reassigned.`,
      confirmLabel: "Remove",
      confirmColor: "error",
    });
    if (!ok) return;
    await apiHandler(
      () => campusesService.removeUser({ userId, campusId: manageCampus.id }),
      { showMessage, successMessage: "User removed from campus." }
    );
    loadCampusUsers(manageCampus.id);
  };

  const assignedIds = new Set(campusUsers.map((cu) => cu.userId));
  // Campus assignment governs ADMIN/ACCOUNTANT access (and staff attendance rosters).
  const assignableUsers = users.filter(
    (u) => !assignedIds.has(u.id) && u.role !== "SUPERADMIN"
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {campuses.length} campus{campuses.length !== 1 ? "es" : ""} registered.
        </Typography>
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
              <CardContent sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>
                      {campus.name.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{campus.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {campus.location || "No location"} · Students {campus.studentStartTime}–{campus.studentEndTime} · Staff {campus.staffStartTime}–{campus.staffEndTime}
                      {" · Added "}{formatDate(campus.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Manage Users"><IconButton size="small" onClick={() => openManage(campus)}><GroupAdd fontSize="small" /></IconButton></Tooltip>
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

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Campus" : "New Campus"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Campus Name *" value={form.name} onChange={(e) => f("name", e.target.value)} required fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Location *" value={form.location} onChange={(e) => f("location", e.target.value)} fullWidth placeholder="e.g. 123 Main Street, Lahore" />
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
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.location}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create Campus"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage users dialog */}
      <Dialog open={!!manageCampus} onClose={() => setManageCampus(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Users — {manageCampus?.name}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
            Assignments here drive admin/accountant access and the staff attendance roster.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
            <TextField
              select size="small" label="Assign user" value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)} fullWidth
            >
              {assignableUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.role})</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleAssign} disabled={!assignUserId || assigning} sx={{ flexShrink: 0 }}>
              {assigning ? <CircularProgress size={16} color="inherit" /> : "Assign"}
            </Button>
          </Box>

          <Divider sx={{ mb: 1 }} />

          {campusUsersLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
          ) : campusUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No users assigned to this campus yet.
            </Typography>
          ) : (
            <List dense>
              {campusUsers.map((cu) => {
                const u = cu.user ?? userMap[cu.userId];
                return (
                  <ListItem
                    key={cu.userId}
                    secondaryAction={
                      <Tooltip title="Remove from campus">
                        <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveUser(cu.userId, u?.name)}>
                          <PersonRemove fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={u?.name ?? cu.userId}
                      secondary={u ? `${u.email}` : undefined}
                    />
                    {u?.role && <Chip label={u.role} size="small" sx={{ mr: 4 }} />}
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setManageCampus(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
