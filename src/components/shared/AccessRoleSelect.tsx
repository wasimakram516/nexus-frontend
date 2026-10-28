"use client";

import { MenuItem, TextField } from "@mui/material";

export interface AccessRoleOption {
  id: string;
  name: string;
}

interface Props {
  roles: AccessRoleOption[];
  value: string;
  onChange: (roleId: string) => void;
  /** Staff have no access at all until given a role, so it is worth saying so. */
  isStaff?: boolean;
}

/**
 * Picks the institution-defined role that gives a new account its permissions.
 * Shown wherever an account is created, so access is decided up front instead
 * of by a separate trip to the Users page.
 */
export default function AccessRoleSelect({ roles, value, onChange, isStaff }: Props) {
  const emptyHelp = isStaff
    ? "Without a role, this person cannot open anything until one is assigned."
    : "Without a role, students and guardians only see their own records.";

  return (
    <TextField
      select
      label="Access role"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      helperText={
        roles.length === 0
          ? "No roles yet. Create them on the Roles page, then assign one here or from Users."
          : value
            ? "Decides what this person can open and do. Changeable later from Users."
            : emptyHelp
      }
    >
      <MenuItem value="">No role</MenuItem>
      {roles.map((r) => (
        <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
      ))}
    </TextField>
  );
}
