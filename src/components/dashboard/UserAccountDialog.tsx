"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AccessRoleSelect from "@/components/shared/AccessRoleSelect";
import CustomFieldInputs from "@/components/dashboard/CustomFieldInputs";
import UserPermissionGrid from "@/components/dashboard/UserPermissionGrid";
import { useMessage } from "@/contexts/MessageContext";
import type { PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";
import type { useCustomFieldForm } from "@/hooks/useCustomFieldForm";
import { apiHandler } from "@/lib/apiHandler";
import { cleanOverrides, type PermissionMap, type PermissionOverrides } from "@/lib/permissionOverrides";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  roleId?: string | null;
  permissionOverrides?: PermissionOverrides | null;
}

export interface AccountRole {
  id: string;
  name: string;
  permissions: PermissionMap;
}

interface Props {
  /** The account being edited, or null to create a new one. */
  user: AccountUser | null;
  institutionId?: string;
  /** Account types the current person is allowed to hand out. */
  accountTypes: string[];
  roles: AccountRole[];
  catalog: PermissionCatalogFeature[];
  moduleLabels: Record<string, string>;
  /** Only administrators may change someone's email or password. */
  canManageCredentials: boolean;
  custom: ReturnType<typeof useCustomFieldForm>;
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES = ["ACTIVE", "RESIGNED", "SUSPENDED"];
/** Account types that take an access role; admin-level accounts already have full access. */
const CONFIGURABLE_TYPES = new Set(["STAFF", "STUDENT", "GUARDIAN"]);
/** Mirrors the backend's self-service defaults for students and guardians who have no role. */
const SELF_SERVICE_DEFAULTS: Record<string, PermissionMap> = {
  STUDENT: { attendance: { read: true } },
  GUARDIAN: { attendance: { read: true } },
};
const MIN_PASSWORD_LENGTH = 8;

/**
 * One dialog for creating and editing an account. Details holds who the person
 * is and how they sign in; Access holds their role and any permissions changed
 * from it. Mount it with a `key` per account so each opening starts fresh.
 */
export default function UserAccountDialog({
  user, institutionId, accountTypes, roles, catalog, moduleLabels, canManageCredentials, custom, onClose, onSaved,
}: Props) {
  const { showMessage } = useMessage();
  const isEdit = Boolean(user);
  const [tab, setTab] = useState<"details" | "access">("details");
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "STAFF",
    status: user?.status ?? "ACTIVE",
    roleId: user?.roleId ?? "",
  });
  const [overrides, setOverrides] = useState<PermissionOverrides>(user?.permissionOverrides ?? {});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const configurable = CONFIGURABLE_TYPES.has(form.role);
  const base = useMemo<PermissionMap>(
    () => roles.find((role) => role.id === form.roleId)?.permissions ?? SELF_SERVICE_DEFAULTS[form.role] ?? {},
    [roles, form.roleId, form.role],
  );

  const passwordTooShort = form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH;
  const customValid = !isEdit || (!custom.loading && !custom.error && !custom.missingRequired);
  const detailsValid =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    (isEdit ? !passwordTooShort : form.password.length >= MIN_PASSWORD_LENGTH);

  const save = async () => {
    setSaving(true);
    const changes = cleanOverrides(base, overrides);
    const hasChanges = Object.keys(changes).length > 0;

    if (!user) {
      const created = await apiHandler<{ id: string }>(
        () =>
          authService.register({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            ...(form.roleId && configurable && { roleId: form.roleId }),
            ...(institutionId && { institutionId }),
          }),
        { showMessage, successMessage: "User account created." },
      );
      // Registration has no field for personal permission changes, so they follow as an update.
      if (created.success && created.data?.id && configurable && hasChanges) {
        await apiHandler(
          () => usersService.updateUser(created.data!.id, { permissionOverrides: changes }),
          { showMessage },
        );
      }
      setSaving(false);
      if (created.success) onSaved();
      return;
    }

    const payload: Record<string, unknown> = {
      role: form.role,
      status: form.status,
      customFields: custom.values,
      ...(form.name !== user.name && { name: form.name }),
      ...(canManageCredentials && form.email !== user.email && { email: form.email }),
      ...(canManageCredentials && form.password && { password: form.password }),
    };
    if (configurable) {
      payload.roleId = form.roleId || null;
      payload.permissionOverrides = hasChanges ? changes : null;
    }
    const { success } = await apiHandler(() => usersService.updateUser(user.id, payload), {
      showMessage,
      successMessage: "User updated.",
    });
    setSaving(false);
    if (success) onSaved();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{user ? `Edit account: ${user.name}` : "New user account"}</DialogTitle>
      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="details" label="Details" />
        <Tab value="access" label="Access" />
      </Tabs>
      <DialogContent sx={{ pt: "20px !important", minHeight: 360 }}>
        {tab === "details" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Full Name *" value={form.name} onChange={(e) => set("name", e.target.value)} fullWidth
              slotProps={{ htmlInput: { autoComplete: "off", name: "account-name" } }}
            />
            <TextField
              label="Email *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} fullWidth
              disabled={isEdit && !canManageCredentials}
              helperText={isEdit && !canManageCredentials ? "Only an administrator can change an email." : undefined}
              slotProps={{ htmlInput: { autoComplete: "off", name: "account-email" } }}
            />
            {(!isEdit || canManageCredentials) && (
              <TextField
                label={isEdit ? "New password" : "Password *"} type="password" value={form.password}
                onChange={(e) => set("password", e.target.value)} fullWidth
                error={passwordTooShort}
                helperText={
                  isEdit
                    ? "Leave blank to keep the current password. A new one signs the person out everywhere and they choose their own at next sign-in."
                    : "At least 8 characters. The person is asked to choose their own at first sign-in."
                }
                slotProps={{ htmlInput: { autoComplete: "new-password", name: "account-password" } }}
              />
            )}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField select label="Account type *" value={form.role} onChange={(e) => set("role", e.target.value)} fullWidth>
                {accountTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </TextField>
              {isEdit && (
                <TextField select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} fullWidth>
                  {STATUSES.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                </TextField>
              )}
            </Box>
            {isEdit && (
              <>
                {custom.loading && <Typography role="status">Loading additional fields…</Typography>}
                {custom.error && <Typography role="alert" color="error">{custom.error}</Typography>}
                <CustomFieldInputs
                  definitions={custom.definitions} onBusyChange={custom.setUploading}
                  values={custom.values}
                  disabled={saving || custom.loading}
                  onChange={(key, value) => custom.setValues((previous) => ({ ...previous, [key]: value }))}
                />
              </>
            )}
          </Box>
        ) : configurable ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <AccessRoleSelect
              roles={roles}
              value={form.roleId}
              onChange={(roleId) => set("roleId", roleId)}
              isStaff={form.role === "STAFF"}
            />
            <UserPermissionGrid
              catalog={catalog}
              moduleLabels={moduleLabels}
              base={base}
              overrides={overrides}
              onChange={setOverrides}
              disabled={saving}
            />
          </Box>
        ) : (
          <Alert severity="info">Admin-level accounts always have full access, so there is no role or permission to set.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving || !detailsValid || !customValid}>
          {saving ? <CircularProgress size={16} color="inherit" /> : isEdit ? "Save Changes" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
