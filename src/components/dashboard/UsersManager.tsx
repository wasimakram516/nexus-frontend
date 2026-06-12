"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Search } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { authService } from "@/services/auth.service";
import { platformService } from "@/services/platform.service";
import { usersService } from "@/services/users.service";

type OverrideEffect = "allow" | "deny";
type Overrides = Record<string, { view?: OverrideEffect; manage?: OverrideEffect }>;

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  institutionId?: string | null;
  permissionTemplateId?: string | null;
  permissionOverrides?: Overrides | null;
  permissionTemplate?: { name: string } | null;
  createdAt: string;
}

interface PaginatedUsers {
  items: UserRow[];
  total: number;
}

interface Template {
  id: string;
  name: string;
  permissions: Record<string, { view?: boolean; manage?: boolean }>;
}

interface UsersManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

const ADMIN_CREATABLE_ROLES = ["TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT"];
const SUPERADMIN_CREATABLE_ROLES = ["ADMIN", ...ADMIN_CREATABLE_ROLES];
const STATUSES = ["ACTIVE", "RESIGNED", "SUSPENDED"];
const STAFF_ROLES = new Set(ADMIN_CREATABLE_ROLES);

const MODULES = ["PEOPLE", "ACADEMICS", "ATTENDANCE", "FINANCE", "REPORTING", "EXAMINATIONS", "DOCUMENTS", "REALTIME"];
const MODULE_LABELS: Record<string, string> = {
  PEOPLE: "People", ACADEMICS: "Academics", ATTENDANCE: "Attendance", FINANCE: "Finance",
  REPORTING: "Reporting", EXAMINATIONS: "Examinations", DOCUMENTS: "Documents", REALTIME: "Real-time",
};

/** Mirrors the backend role defaults used when no template is assigned. */
const ROLE_DEFAULT_PERMISSIONS: Record<string, Record<string, { view?: boolean; manage?: boolean }>> = {
  TEACHER: { ATTENDANCE: { view: true } },
  STUDENT: { ATTENDANCE: { view: true } },
  GUARDIAN: { ATTENDANCE: { view: true } },
  ACCOUNTANT: { FINANCE: { view: true, manage: true }, ATTENDANCE: { view: true } },
};

const ROLE_COLORS: Record<string, "primary" | "secondary" | "info" | "warning" | "default"> = {
  ADMIN: "primary",
  TEACHER: "info",
  ACCOUNTANT: "warning",
};

const STATUS_COLORS: Record<string, "success" | "error" | "default"> = {
  ACTIVE: "success",
  SUSPENDED: "error",
  RESIGNED: "default",
};

export default function UsersManager({ institutionId }: UsersManagerProps) {
  const { user: currentUser } = useAuth();
  const { showMessage } = useMessage();
  const isSuperadminScope = Boolean(institutionId);

  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "TEACHER" });
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ role: "", status: "", permissionTemplateId: "" });
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editSaving, setEditSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const creatableRoles = isSuperadminScope ? SUPERADMIN_CREATABLE_ROLES : ADMIN_CREATABLE_ROLES;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiHandler<PaginatedUsers>(
      () =>
        usersService.getAll({
          page: page + 1,
          limit,
          ...(search && { search }),
          ...(institutionId && { institutionId }),
        }),
      { showMessage, silent: true }
    );
    setRows(data?.items ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  }, [institutionId, page, limit, search, showMessage]);

  useEffect(() => {
    load();
  }, [load]);

  // Permission templates for the access editor
  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await apiHandler<Template[]>(
        () =>
          institutionId
            ? platformService.getPermissionTemplates(institutionId)
            : platformService.getMyPermissionTemplates(),
        { showMessage, silent: true }
      );
      setTemplates(Array.isArray(data) ? data : []);
    };
    loadTemplates();
  }, [institutionId, showMessage]);

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const handleCreate = async () => {
    setCreating(true);
    const { success } = await apiHandler(
      () =>
        authService.register({
          ...createForm,
          ...(institutionId && { institutionId }),
        }),
      { showMessage, successMessage: "User account created." }
    );
    setCreating(false);
    if (success) {
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "TEACHER" });
      load();
    }
  };

  const openEdit = (row: UserRow) => {
    setEditing(row);
    setEditForm({
      role: row.role,
      status: row.status,
      permissionTemplateId: row.permissionTemplateId ?? "",
    });
    setOverrides(row.permissionOverrides ?? {});
  };

  const handleEdit = async () => {
    if (!editing) return;
    setEditSaving(true);

    const isStaff = STAFF_ROLES.has(editForm.role);
    const cleanedOverrides: Overrides = {};
    for (const [moduleKey, entry] of Object.entries(overrides)) {
      const cleaned: Overrides[string] = {};
      if (entry.view) cleaned.view = entry.view;
      if (entry.manage) cleaned.manage = entry.manage;
      if (cleaned.view || cleaned.manage) cleanedOverrides[moduleKey] = cleaned;
    }

    const payload: Record<string, unknown> = {
      role: editForm.role,
      status: editForm.status,
    };
    if (isStaff) {
      payload.permissionTemplateId = editForm.permissionTemplateId || null;
      payload.permissionOverrides =
        Object.keys(cleanedOverrides).length > 0 ? cleanedOverrides : null;
    }

    const { success } = await apiHandler(
      () => usersService.updateUser(editing.id, payload),
      { showMessage, successMessage: "User updated." }
    );
    setEditSaving(false);
    if (success) {
      setEditing(null);
      load();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await apiHandler(() => usersService.deleteUser(confirmDelete.id), {
      showMessage,
      successMessage: "User moved to recycle bin.",
    });
    setConfirmDelete(null);
    load();
  };

  const isProtected = (row: UserRow) => {
    if (row.id === currentUser?.id || row.role === "SUPERADMIN") return true;
    // Institution admins cannot touch other admin-level accounts; superadmins can.
    return !isSuperadminScope && row.role === "ADMIN";
  };

  // --- Access editor helpers -------------------------------------------------

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === editForm.permissionTemplateId) ?? null,
    [templates, editForm.permissionTemplateId]
  );

  /** Base permission for a module/action: template if selected, else role defaults. */
  const baseFor = (moduleKey: string, action: "view" | "manage"): boolean => {
    if (selectedTemplate) {
      return Boolean(selectedTemplate.permissions?.[moduleKey]?.[action]);
    }
    return Boolean(ROLE_DEFAULT_PERMISSIONS[editForm.role]?.[moduleKey]?.[action]);
  };

  /** Cycles a cell: inherit → allow → deny → inherit. */
  const cycleOverride = (moduleKey: string, action: "view" | "manage") => {
    setOverrides((prev) => {
      const entry = { ...(prev[moduleKey] ?? {}) };
      const current = entry[action];
      if (current === undefined) entry[action] = "allow";
      else if (current === "allow") entry[action] = "deny";
      else delete entry[action];
      const next = { ...prev, [moduleKey]: entry };
      if (!entry.view && !entry.manage) delete next[moduleKey];
      return next;
    });
  };

  const effectiveFor = (moduleKey: string, action: "view" | "manage") => {
    const override = overrides[moduleKey]?.[action];
    if (override) return override === "allow";
    return baseFor(moduleKey, action);
  };

  const overrideCount = Object.values(overrides).reduce(
    (count, entry) => count + (entry.view ? 1 : 0) + (entry.manage ? 1 : 0),
    0
  );

  const renderPermissionCell = (moduleKey: string, action: "view" | "manage") => {
    const override = overrides[moduleKey]?.[action];
    const base = baseFor(moduleKey, action);
    const effective = effectiveFor(moduleKey, action);

    return (
      <Tooltip
        title={
          override
            ? `Override: ${override}. Click to ${override === "allow" ? "deny" : "reset to inherited"}.`
            : `Inherited: ${base ? "allowed" : "denied"}. Click to override.`
        }
      >
        <Chip
          label={override ? (override === "allow" ? "Allow" : "Deny") : base ? "On" : "Off"}
          size="small"
          onClick={() => cycleOverride(moduleKey, action)}
          color={override ? (override === "allow" ? "success" : "error") : "default"}
          variant={override ? "filled" : "outlined"}
          sx={{
            minWidth: 56,
            fontWeight: override ? 700 : 400,
            opacity: !override && !effective ? 0.55 : 1,
            cursor: "pointer",
          }}
        />
      </Tooltip>
    );
  };

  const editingIsStaff = STAFF_ROLES.has(editForm.role);

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </Box>

      <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Access</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 6 }}>
                      <Typography color="text.secondary">No users found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const locked = isProtected(row);
                    const rowOverrideCount = row.permissionOverrides
                      ? Object.values(row.permissionOverrides).reduce(
                          (count, entry) => count + (entry.view ? 1 : 0) + (entry.manage ? 1 : 0),
                          0
                        )
                      : 0;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.name}
                          {row.id === currentUser?.id && <Chip label="You" size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <Chip label={row.role} size="small" color={ROLE_COLORS[row.role] ?? "default"} />
                        </TableCell>
                        <TableCell>
                          {STAFF_ROLES.has(row.role) ? (
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              <Chip
                                label={row.permissionTemplate?.name ?? "Role defaults"}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: 10 }}
                              />
                              {rowOverrideCount > 0 && (
                                <Chip
                                  label={`${rowOverrideCount} override${rowOverrideCount !== 1 ? "s" : ""}`}
                                  size="small"
                                  color="secondary"
                                  sx={{ height: 20, fontSize: 10 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">Full access</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small" color={STATUS_COLORS[row.status] ?? "default"} />
                        </TableCell>
                        <TableCell>{formatDate(row.createdAt)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title={locked ? "This account cannot be edited here" : "Edit access & permissions"}>
                            <span>
                              <IconButton size="small" disabled={locked} onClick={() => openEdit(row)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={locked ? "" : "Delete"}>
                            <span>
                              <IconButton size="small" color="error" disabled={locked} onClick={() => setConfirmDelete(row)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={limit}
              onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? The account will be moved to the recycle bin.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New User Account</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Full Name *" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} fullWidth slotProps={{ htmlInput: { autoComplete: "off", name: "new-user-name" } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Email *" type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} fullWidth slotProps={{ htmlInput: { autoComplete: "off", name: "new-user-email" } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Password *" type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} fullWidth helperText="At least 8 characters." slotProps={{ htmlInput: { autoComplete: "new-password", name: "new-user-password" } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Role *" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} fullWidth>
                {creatableRoles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createForm.name || !createForm.email || createForm.password.length < 8}
          >
            {creating ? <CircularProgress size={16} color="inherit" /> : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit access & permissions dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Access — {editing?.name}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6 }}>
              <TextField select label="Role" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))} fullWidth>
                {creatableRoles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField select label="Status" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} fullWidth>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>

            {editingIsStaff ? (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Permissions</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Base access comes from the template (or role defaults). Click a cell to override it:
                    inherit → allow → deny.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    label="Permission Template (base)"
                    value={editForm.permissionTemplateId}
                    onChange={(e) => setEditForm((p) => ({ ...p, permissionTemplateId: e.target.value }))}
                    fullWidth
                    helperText={templates.length === 0 ? "No templates yet — create them in the Permissions tab." : undefined}
                  >
                    <MenuItem value="">Role defaults (no template)</MenuItem>
                    {templates.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>View</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Manage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {MODULES.map((moduleKey) => (
                        <TableRow key={moduleKey}>
                          <TableCell>{MODULE_LABELS[moduleKey]}</TableCell>
                          <TableCell align="center">{renderPermissionCell(moduleKey, "view")}</TableCell>
                          <TableCell align="center">{renderPermissionCell(moduleKey, "manage")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {overrideCount > 0 && (
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="secondary">
                        {overrideCount} override{overrideCount !== 1 ? "s" : ""} applied on top of the base.
                      </Typography>
                      <Button size="small" onClick={() => setOverrides({})}>Clear overrides</Button>
                    </Box>
                  )}
                </Grid>
              </>
            ) : (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  Admin-level accounts always have full institution access — permission templates do not apply.
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editSaving}>
            {editSaving ? <CircularProgress size={16} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
