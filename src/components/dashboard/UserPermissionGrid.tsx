"use client";

import { useMemo } from "react";
import { alpha, Box, Button, Checkbox, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import type { PermissionAction, PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";
import {
  countAllowed,
  countCustomized,
  isCustomized,
  isEffective,
  PERMISSION_ACTIONS,
  setPermission,
  setPermissionForFeatures,
  type PermissionMap,
  type PermissionOverrides,
} from "@/lib/permissionOverrides";

const ACTION_LABELS: Record<PermissionAction, string> = {
  create: "Create", read: "Read", update: "Update", delete: "Delete",
};
const ADMINISTRATIVE_LABEL = "Administrative";

interface Props {
  catalog: PermissionCatalogFeature[];
  moduleLabels: Record<string, string>;
  /** What the role (or the self-service defaults) gives before any personal change. */
  base: PermissionMap;
  overrides: PermissionOverrides;
  onChange: (next: PermissionOverrides) => void;
  disabled?: boolean;
}

/**
 * Ticks show what a person can do. They start from the role's grants, and any
 * tick the administrator changes is marked (green for added, red for removed)
 * so it is clear what differs from the role. Changing a tick back to what the
 * role gives removes the difference.
 */
export default function UserPermissionGrid({ catalog, moduleLabels, base, overrides, onChange, disabled }: Props) {
  const groups = useMemo(() => {
    const byModule = new Map<string, PermissionCatalogFeature[]>();
    for (const feature of catalog) {
      const key = feature.module ?? ADMINISTRATIVE_LABEL;
      byModule.set(key, [...(byModule.get(key) ?? []), feature]);
    }
    return Array.from(byModule.entries());
  }, [catalog]);

  const { allowed, total } = countAllowed(base, overrides, catalog);
  const customized = countCustomized(base, overrides);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary" data-testid="permission-summary">
          {allowed} of {total} permissions allowed
          {customized > 0 && ` · ${customized} changed from the role`}
        </Typography>
        <Button size="small" disabled={disabled || customized === 0} onClick={() => onChange({})}>
          Reset to role
        </Button>
      </Box>

      {groups.map(([moduleKey, features]) => {
        const moduleCount = countAllowed(base, overrides, features);
        const label = moduleLabels[moduleKey] ?? moduleKey;
        const everythingOn = moduleCount.allowed === moduleCount.total;
        return (
          <Box key={moduleKey}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {label}{" "}
                <Typography component="span" variant="caption" color="text.secondary">
                  {moduleCount.allowed}/{moduleCount.total}
                </Typography>
              </Typography>
              <Button
                size="small"
                disabled={disabled}
                aria-label={`${everythingOn ? "Clear" : "Select"} all ${label}`}
                onClick={() =>
                  onChange(
                    PERMISSION_ACTIONS.reduce(
                      (current, action) => setPermissionForFeatures(base, current, features, action, !everythingOn),
                      overrides,
                    ),
                  )
                }
              >
                {everythingOn ? "Clear all" : "Select all"}
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Feature</TableHeaderCell>
                  {PERMISSION_ACTIONS.map((action) => (
                    <TableHeaderCell key={action} align="center">{ACTION_LABELS[action]}</TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.key}>
                    <TableCell>{feature.label}</TableCell>
                    {PERMISSION_ACTIONS.map((action) => {
                      if (!feature.actions.includes(action)) {
                        return (
                          <TableCell key={action} align="center">
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          </TableCell>
                        );
                      }
                      const checked = isEffective(base, overrides, feature.key, action);
                      const changed = isCustomized(base, overrides, feature.key, action);
                      return (
                        <TableCell
                          key={action}
                          align="center"
                          sx={(theme) => ({
                            bgcolor: changed
                              ? alpha(checked ? theme.palette.success.main : theme.palette.error.main, 0.14)
                              : "transparent",
                          })}
                        >
                          <Checkbox
                            size="small"
                            disabled={disabled}
                            checked={checked}
                            color={changed ? (checked ? "success" : "error") : "primary"}
                            onChange={() => onChange(setPermission(base, overrides, feature.key, action, !checked))}
                            slotProps={{
                              input: {
                                "aria-label": `${feature.label} ${ACTION_LABELS[action]}${changed ? (checked ? " (added)" : " (removed)") : ""}`,
                              },
                            }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        );
      })}
    </Box>
  );
}
