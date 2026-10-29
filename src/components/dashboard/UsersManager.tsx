"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
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
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Search from "@mui/icons-material/Search";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import UserAccountDialog, { AccountRole, AccountUser } from "@/components/dashboard/UserAccountDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomFieldForm } from "@/hooks/useCustomFieldForm";
import { useMessage } from "@/contexts/MessageContext";
import { PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { countStoredOverrides } from "@/lib/permissionOverrides";
import { rolesService } from "@/services/roles.service";
import { usersService } from "@/services/users.service";

interface UserRow extends AccountUser {
  institutionId?: string | null;
  assignedRole?: { name: string } | null;
  customFields?: Record<string, unknown>;
  createdAt: string;
}

interface PaginatedUsers {
  items: UserRow[];
  total: number;
}

interface UsersManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

const ADMIN_CREATABLE_ROLES = ["STAFF", "STUDENT", "GUARDIAN"];
const SUPERADMIN_CREATABLE_ROLES = ["ADMIN", ...ADMIN_CREATABLE_ROLES];

/** Roles that can be assigned a custom Role + overrides; ADMIN/SUPERADMIN always have full access. */
const CONFIGURABLE_ROLES = new Set(["STAFF", "STUDENT", "GUARDIAN"]);

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
  // Gated under ModuleKey.PEOPLE server-side (users has no dedicated module
  // key — see custom-field-entity.util.ts) — only wired into the admin edit
  // dialog here, not the self-service /users/me profile, since the backend's
  // UpdateProfileDto never accepted customFields at all (only
  // UpdateUserAccessDto/updateUserRole does).
  const custom = useCustomFieldForm("user", institutionId);

  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AccountRole[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogFeature[]>([]);
  // Fetched from GET /roles/module-catalog (single source of truth) instead
  // of a hand-typed label map — see InstitutionEntitlementsTab.tsx for the
  // same fix and why it matters.
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({});

  /** "new" opens the create form; a row opens that account for editing. */
  const [dialog, setDialog] = useState<"new" | UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const accountTypes = isSuperadminScope ? SUPERADMIN_CREATABLE_ROLES : ADMIN_CREATABLE_ROLES;
  const canManageCredentials = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN";

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
    (async () => {
      await load();
    })();
  }, [load]);

  // Roles + catalog for the access editor. Fetched independently of runtime
  // config: this component also renders in the superadmin platform console,
  // which is outside RuntimeConfigProvider.
  useEffect(() => {
    const loadAccessData = async () => {
      const [rolesRes, catalogRes, moduleCatalogRes] = await Promise.all([
        apiHandler<AccountRole[]>(() => rolesService.list(institutionId), { showMessage, silent: true }),
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

  const openEdit = (row: UserRow) => {
    setDialog(row);
    void custom.load("update", row.customFields ?? {});
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
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialog("new")}>
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
                    const rowOverrideCount = countStoredOverrides(row.permissionOverrides ?? {});
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.name}
                          {row.id === currentUser?.id && <Chip label="You" size="tiny" sx={{ ml: 1 }} />}
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
                                size="tiny"
                                variant="outlined"
                              />
                              {rowOverrideCount > 0 && (
                                <Chip
                                  label={`${rowOverrideCount} override${rowOverrideCount !== 1 ? "s" : ""}`}
                                  size="tiny"
                                  color="secondary"
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
                          <Tooltip title={locked ? "This account cannot be edited here" : "Edit account, role & permissions"}>
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

      {dialog && (
        <UserAccountDialog
          key={dialog === "new" ? "new" : dialog.id}
          user={dialog === "new" ? null : dialog}
          institutionId={institutionId}
          accountTypes={accountTypes}
          roles={roles}
          catalog={catalog}
          moduleLabels={moduleLabels}
          canManageCredentials={canManageCredentials}
          custom={custom}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}
    </>
  );
}
