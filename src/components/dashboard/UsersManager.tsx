"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { PermissionAction, PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { authService } from "@/services/auth.service";
import { rolesService } from "@/services/roles.service";
import { usersService } from "@/services/users.service";

type OverrideEffect = "allow" | "deny";
type Overrides = Record<string, Partial<Record<PermissionAction, OverrideEffect>>>;
type PermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  institutionId?: string | null;
  roleId?: string | null;
  permissionOverrides?: Overrides | null;
  assignedRole?: { name: string } | null;
  createdAt: string;
}

interface PaginatedUsers {
  items: UserRow[];
  total: number;
}

interface Role {
  id: string;
  name: string;
  permissions: PermissionMap;
}

interface UsersManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

const ADMIN_CREATABLE_ROLES = ["STAFF", "STUDENT", "GUARDIAN"];
const SUPERADMIN_CREATABLE_ROLES = ["ADMIN", ...ADMIN_CREATABLE_ROLES];
const STATUSES = ["ACTIVE", "RESIGNED", "SUSPENDED"];
/** Roles that can be assigned a custom Role + overrides; ADMIN/SUPERADMIN always have full access. */
const CONFIGURABLE_ROLES = new Set(["STAFF", "STUDENT", "GUARDIAN"]);

const ALL_ACTIONS: PermissionAction[] = ["create", "read", "update", "delete"];
const ACTION_LABELS: Record<PermissionAction, string> = {
  create: "Create", read: "Read", update: "Update", delete: "Delete",
};
const ADMINISTRATIVE_LABEL = "Administrative";

/** Mirrors the backend's self-service defaults for STUDENT/GUARDIAN when no Role is assigned. */
const SELF_SERVICE_DEFAULTS: Record<string, PermissionMap> = {
  STUDENT: { attendance: { read: true } },
  GUARDIAN: { attendance: { read: true } },
};

const ROLE_COLORS: Record<string, "primary" | "secondary" | "info" | "warning" | "default"> = {
  ADMIN: "primary",
  STAFF: "info",
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogFeature[]>([]);
  // Fetched from GET /roles/module-catalog (single source of truth) instead
  // of a hand-typed label map — see InstitutionEntitlementsTab.tsx for the
  // same fix and why it matters.
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ role: "", status: "", roleId: "" });
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

  // Roles + catalog for the access editor. Fetched independently of runtime
  // config: this component also renders in the superadmin platform console,
  // which is outside RuntimeConfigProvider.
  useEffect(() => {
    const loadAccessData = async () => {
      const [rolesRes, catalogRes, moduleCatalogRes] = await Promise.all([
        apiHandler<Role[]>(() => rolesService.list(institutionId), { showMessage, silent: true }),
        apiHandler<PermissionCatalogFeature[]>(() => rolesService.getCatalog(), { showMessage, silent: true }),
        apiHandler<Array<{ key: string; label: string }>>(
          () => rolesService.getModuleCatalog(),
          { showMessage, silent: true }
        ),
      ]);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setCatalog(Array.isArray(catalogRes.data) ? catalogRes.data : []);
      setModuleLabels(
        Object.fromEntries((moduleCatalogRes.data ?? []).map((m) => [m.key, m.label]))
      );
    };
    loadAccessData();
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
      setCreateForm({ name: "", email: "", password: "", role: "STAFF" });
      load();
    }
  };

  const openEdit = (row: UserRow) => {
    setEditing(row);
    setEditForm({
      role: row.role,
      status: row.status,
      roleId: row.roleId ?? "",
    });
    setOverrides(row.permissionOverrides ?? {});
  };

  const handleEdit = async () => {
    if (!editing) return;
    setEditSaving(true);

    const isConfigurable = CONFIGURABLE_ROLES.has(editForm.role);
    const cleanedOverrides: Overrides = {};
    for (const [featureKey, entry] of Object.entries(overrides)) {
      const cleaned: Overrides[string] = {};
      for (const action of ALL_ACTIONS) {
        if (entry[action]) cleaned[action] = entry[action];
      }
      if (Object.keys(cleaned).length > 0) cleanedOverrides[featureKey] = cleaned;
    }

    const payload: Record<string, unknown> = {
      role: editForm.role,
      status: editForm.status,
    };
    if (isConfigurable) {
      payload.roleId = editForm.roleId || null;
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

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === editForm.roleId) ?? null,
    [roles, editForm.roleId]
  );

  const groupedCatalog = useMemo(() => {
    const byModule = new Map<string, PermissionCatalogFeature[]>();
    for (const feature of catalog) {
      const key = feature.module ?? ADMINISTRATIVE_LABEL;
      const list = byModule.get(key) ?? [];
      list.push(feature);
      byModule.set(key, list);
    }
    return Array.from(byModule.entries());
  }, [catalog]);

  /** Base permission for a feature/action: selected role if set, else self-service defaults. */
  const baseFor = (featureKey: string, action: PermissionAction): boolean => {
    if (selectedRole) {
      return Boolean(selectedRole.permissions?.[featureKey]?.[action]);
    }
    return Boolean(SELF_SERVICE_DEFAULTS[editForm.role]?.[featureKey]?.[action]);
  };

  /** Cycles a cell: inherit -> allow -> deny -> inherit. */
  const cycleOverride = (featureKey: string, action: PermissionAction) => {
    setOverrides((prev) => {
      const entry = { ...(prev[featureKey] ?? {}) };
      const current = entry[action];
      if (current === undefined) entry[action] = "allow";
      else if (current === "allow") entry[action] = "deny";
      else delete entry[action];
      const next = { ...prev, [featureKey]: entry };
      if (Object.keys(entry).length === 0) delete next[featureKey];
      return next;
    });
  };

  const effectiveFor = (featureKey: string, action: PermissionAction) => {
    const override = overrides[featureKey]?.[action];
    if (override) return override === "allow";
    return baseFor(featureKey, action);
  };

  const overrideCount = Object.values(overrides).reduce(
    (count, entry) => count + Object.values(entry).filter(Boolean).length,
    0
  );

  const renderPermissionCell = (featureKey: string, action: PermissionAction) => {
    const override = overrides[featureKey]?.[action];
    const base = baseFor(featureKey, action);
    const effective = effectiveFor(featureKey, action);

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
          onClick={() => cycleOverride(featureKey, action)}
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

  const editingIsConfigurable = CONFIGURABLE_ROLES.has(editForm.role);

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

      <DataTableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Access</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
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
                          (count, entry) => count + Object.values(entry).filter(Boolean).length,
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
                          {CONFIGURABLE_ROLES.has(row.role) ? (
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              <Chip
                                label={row.assignedRole?.name ?? "No role (no access)"}
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
      </DataTableCard>

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
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="md" fullWidth>
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

            {editingIsConfigurable ? (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Permissions</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Base access comes from the assigned role (or self-service defaults for students/guardians —
                    a STAFF user with no role has zero access). Click a cell to override it: inherit → allow → deny.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    label="Role (base)"
                    value={editForm.roleId}
                    onChange={(e) => setEditForm((p) => ({ ...p, roleId: e.target.value }))}
                    fullWidth
                    helperText={roles.length === 0 ? "No roles yet — create them on the Roles page." : undefined}
                  >
                    <MenuItem value="">No role (self-service defaults only)</MenuItem>
                    {roles.map((r) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {groupedCatalog.map(([moduleKey, features]) => (
                    <Box key={moduleKey} sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>
                        {moduleLabels[moduleKey] ?? moduleKey}
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Feature</TableHeaderCell>
                            {ALL_ACTIONS.map((action) => (
                              <TableHeaderCell key={action} align="center">{ACTION_LABELS[action]}</TableHeaderCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {features.map((feature) => (
                            <TableRow key={feature.key}>
                              <TableCell>{feature.label}</TableCell>
                              {ALL_ACTIONS.map((action) => (
                                <TableCell key={action} align="center">
                                  {feature.actions.includes(action)
                                    ? renderPermissionCell(feature.key, action)
                                    : <Typography variant="caption" color="text.disabled">—</Typography>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ))}
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
                  Admin-level accounts always have full institution access — roles do not apply.
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
