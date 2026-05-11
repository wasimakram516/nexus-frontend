"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Checkbox, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, Grid, IconButton, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface Template { id: string; name: string; description?: string; permissions: Record<string, unknown>; }

interface Props { institutionId: string; }

const MODULES = ["ACADEMICS", "ATTENDANCE", "FINANCE", "PEOPLE", "REPORTING", "EXAMINATIONS", "DOCUMENTS", "REALTIME"];
const MODULE_LABELS: Record<string, string> = {
  ACADEMICS: "Academics", ATTENDANCE: "Attendance", FINANCE: "Finance",
  PEOPLE: "People", REPORTING: "Reporting", EXAMINATIONS: "Examinations",
  DOCUMENTS: "Documents", REALTIME: "Real-time",
};

type ModulePerms = Record<string, { view: boolean; manage: boolean }>;

function permsToModulePerms(raw: Record<string, unknown>): ModulePerms {
  const result: ModulePerms = {};
  MODULES.forEach((m) => {
    const entry = raw[m] as { view?: boolean; manage?: boolean } | undefined;
    result[m] = { view: entry?.view ?? false, manage: entry?.manage ?? false };
  });
  return result;
}

function modulePermsToJson(mp: ModulePerms): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  MODULES.forEach((m) => {
    if (mp[m].view || mp[m].manage) result[m] = mp[m];
  });
  return result;
}

const emptyModulePerms = (): ModulePerms =>
  Object.fromEntries(MODULES.map((m) => [m, { view: false, manage: false }]));

export default function StepPermissions({ institutionId }: Props) {
  const { showMessage } = useMessage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [modulePerms, setModulePerms] = useState<ModulePerms>(emptyModulePerms());

  const load = async () => {
    const { data } = await apiHandler<Template[]>(
      () => platformService.getPermissionTemplates(institutionId),
      { showMessage, silent: true }
    );
    setTemplates(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setModulePerms(emptyModulePerms());
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description ?? "" });
    setModulePerms(permsToModulePerms(t.permissions ?? {}));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { name: form.name, description: form.description, permissions: modulePermsToJson(modulePerms) };
    if (editing) {
      await apiHandler(() => platformService.updatePermissionTemplate(institutionId, editing.id, payload), { showMessage, successMessage: "Template updated." });
    } else {
      await apiHandler(() => platformService.createPermissionTemplate(institutionId, payload), { showMessage, successMessage: "Template created." });
    }
    setDialogOpen(false);
    setSaving(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await apiHandler(() => platformService.deletePermissionTemplate(institutionId, confirmDelete.id), { showMessage, successMessage: "Template deleted." });
    setConfirmDelete(null);
    load();
  };

  const togglePerm = (mod: string, field: "view" | "manage") => {
    setModulePerms((p) => {
      const next = { ...p, [mod]: { ...p[mod], [field]: !p[mod][field] } };
      // manage implies view
      if (field === "manage" && next[mod].manage) next[mod].view = true;
      if (field === "view" && !next[mod].view) next[mod].manage = false;
      return next;
    });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Permission <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Templates</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Define reusable permission sets that can be assigned to staff roles. Each template controls which modules a role can view or manage.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Template</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>No permission templates yet.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create First Template</Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {templates.map((t) => {
            const grantedModules = Object.keys(t.permissions ?? {});
            return (
              <Card key={t.id} sx={{ border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.name}</Typography>
                    {t.description && <Typography variant="caption" color="text.secondary">{t.description}</Typography>}
                    {grantedModules.length > 0 && (
                      <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                        Access to: {grantedModules.map((m) => MODULE_LABELS[m] ?? m).join(", ")}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirmDelete(t)}><Delete fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Template"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Template" : "New Permission Template"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField label="Template Name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth placeholder="e.g. Class Teacher, Accountant" />
            <TextField label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} fullWidth placeholder="Brief description of this role..." />

            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Module Access</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                Select what each module allows. "Manage" includes full create/edit/delete access. "View" is read-only.
              </Typography>
              <Grid container spacing={1}>
                {MODULES.map((mod) => (
                  <Grid key={mod} size={{ xs: 12, sm: 6 }}>
                    <Card variant="outlined" sx={{ px: 1.5, py: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>{MODULE_LABELS[mod]}</Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <FormControlLabel
                          control={<Checkbox size="small" checked={modulePerms[mod]?.view ?? false} onChange={() => togglePerm(mod, "view")} />}
                          label={<Typography variant="caption">View</Typography>}
                          sx={{ mr: 0 }}
                        />
                        <FormControlLabel
                          control={<Checkbox size="small" checked={modulePerms[mod]?.manage ?? false} onChange={() => togglePerm(mod, "manage")} />}
                          label={<Typography variant="caption">Manage</Typography>}
                        />
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
