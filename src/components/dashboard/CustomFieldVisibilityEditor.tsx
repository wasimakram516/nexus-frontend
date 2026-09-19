"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

interface VisibilityRules {
  roles?: string[];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

/**
 * Roles a custom field definition's `visibilityRules.roles` allow-list can
 * reference — mirrors the backend `UserRole` enum
 * (`prisma/schema.prisma`, `isCustomFieldDefinitionVisibleToRole`).
 */
const ROLE_OPTIONS = [
  { value: "SUPERADMIN", label: "Superadmin" },
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
  { value: "STUDENT", label: "Student" },
  { value: "GUARDIAN", label: "Guardian" },
];

/**
 * Edits a custom field definition's role-based visibility rule. Selecting
 * no roles leaves the field visible to everyone (the current, unenforced
 * default for every pre-existing definition) — matches the backend's
 * "unset or empty means ungated" convention shared with `planKeys`.
 */
export default function CustomFieldVisibilityEditor({ value, onChange, disabled }: Props) {
  const rules: VisibilityRules = value ? (JSON.parse(value) as VisibilityRules) : {};
  const selectedRoles = Array.isArray(rules.roles) ? rules.roles : [];

  const update = (nextRoles: string[]): void => {
    onChange(JSON.stringify({ ...rules, roles: nextRoles }));
  };

  return (
    <Box component="fieldset" disabled={disabled} sx={{ border: 0, p: 0, m: 0 }}>
      <Typography component="legend">Visibility</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Restrict this field to specific roles. Leave empty to keep it visible to everyone.
      </Typography>
      <TextField
        select
        fullWidth
        label="Visible to roles"
        value={selectedRoles}
        disabled={disabled}
        slotProps={{
          select: {
            multiple: true,
            renderValue: (selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(selected as string[]).map((role) => (
                  <Chip key={role} label={ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role} size="small" />
                ))}
              </Box>
            ),
          },
        }}
        onChange={(event) => {
          const next = event.target.value;
          update(typeof next === "string" ? next.split(",").filter(Boolean) : next);
        }}
      >
        {ROLE_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
