"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, IconButton, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PermissionMatrixEditor, { PermissionMatrixValue } from "@/components/dashboard/PermissionMatrixEditor";
import { useMessage } from "@/contexts/MessageContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { rolesService } from "@/services/roles.service";

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: PermissionMatrixValue;
}

interface RolesManagerProps {
  /** When set (superadmin platform console), roles are managed for this institution. */
  institutionId?: string;
}

function countGrants(permissions: PermissionMatrixValue) {
  return Object.values(permissions).reduce(
    (sum, entry) => sum + Object.values(entry).filter(Boolean).length,
    0
  );
}

export default function RolesManager({ institutionId }: RolesManagerProps) {
  const { showMessage } = useMessage();
  const { config } = useRuntimeConfig();
  const catalog = config?.permissionCatalog ?? [];

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [permissions, setPermissions] = useState<PermissionMatrixValue>({});

  const load = async () => {
    setLoading(true);
    const { data } = await apiHandler<Role[]>(() => rolesService.list(institutionId), {
      showMessage,
      silent: true,
    });
    setRoles(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setPermissions({});
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description ?? "" });
    setPermissions(role.permissions ?? {});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { name: form.name, description: form.description, permissions };
    if (editing) {
      await apiHandler(() => rolesService.update(editing.id, payload, institutionId), {
        showMessage,
        successMessage: "Role updated.",
      });
    } else {
      await apiHandler(() => rolesService.create(payload, institutionId), {
        showMessage,
        successMessage: "Role created.",
      });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await apiHandler(() => rolesService.remove(confirmDelete.id, institutionId), {
      showMessage,
      successMessage: "Role moved to recycle bin.",
    });
    setConfirmDelete(null);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Roles</Typography>
          <Typography variant="body2" color="text.secondary">
            Define what each role can create, read, update, or delete. Assign roles to STAFF, STUDENT, or
            GUARDIAN users from the Users page — per-user overrides can still fine-tune an individual account.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Role</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : roles.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>No roles yet.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create First Role</Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {roles.map((role) => (
            <Card key={role.id} sx={{ border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{role.name}</Typography>
                  {role.description && <Typography variant="caption" color="text.secondary">{role.description}</Typography>}
                  <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                    {countGrants(role.permissions)} permission{countGrants(role.permissions) !== 1 ? "s" : ""} granted
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(role)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setConfirmDelete(role)}><Delete fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Role"
        message={`Delete "${confirmDelete?.name}"? Users assigned to it will have no access until reassigned.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Role" : "New Role"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Role Name *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              placeholder="e.g. Front Desk, Exam Officer, Campus Admin"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              fullWidth
              placeholder="Brief description of this role..."
            />
            <Divider />
            <PermissionMatrixEditor catalog={catalog} value={permissions} onChange={setPermissions} disabled={saving} />
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
