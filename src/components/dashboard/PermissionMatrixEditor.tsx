"use client";

import { useMemo } from "react";
import { Box, Checkbox, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import { ModuleKey, PermissionAction, PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";

export type PermissionMatrixValue = Record<string, Partial<Record<PermissionAction, boolean>>>;

const ACTION_LABELS: Record<PermissionAction, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
};

const ALL_ACTIONS: PermissionAction[] = ["create", "read", "update", "delete"];

const MODULE_LABELS: Record<ModuleKey, string> = {
  ACADEMICS: "Academics",
  ATTENDANCE: "Attendance",
  FINANCE: "Finance",
  PEOPLE: "People",
  REPORTING: "Reporting",
  EXAMINATIONS: "Examinations",
  DOCUMENTS: "Documents",
  REALTIME: "Real-time",
  TIMETABLE: "Timetable",
  NOTICES: "Notices",
};

const ADMINISTRATIVE_LABEL = "Administrative";

interface PermissionMatrixEditorProps {
  catalog: PermissionCatalogFeature[];
  value: PermissionMatrixValue;
  onChange: (next: PermissionMatrixValue) => void;
  /** Disables all inputs (e.g. while saving). */
  disabled?: boolean;
}

/**
 * Checkbox grid over the shared feature x action permission catalog,
 * grouped by module — the "select all" behaviors on a group header let an
 * admin grant a whole module (e.g. Finance) in one click instead of ticking
 * every feature individually.
 */
export default function PermissionMatrixEditor({ catalog, value, onChange, disabled }: PermissionMatrixEditorProps) {
  const groups = useMemo(() => {
    const byModule = new Map<string, PermissionCatalogFeature[]>();
    for (const feature of catalog) {
      const key = feature.module ?? ADMINISTRATIVE_LABEL;
      const list = byModule.get(key) ?? [];
      list.push(feature);
      byModule.set(key, list);
    }
    return Array.from(byModule.entries());
  }, [catalog]);

  const isChecked = (featureKey: string, action: PermissionAction) => Boolean(value[featureKey]?.[action]);

  const toggle = (featureKey: string, action: PermissionAction) => {
    const current = { ...(value[featureKey] ?? {}) };
    current[action] = !current[action];
    onChange({ ...value, [featureKey]: current });
  };

  const toggleColumnForGroup = (features: PermissionCatalogFeature[], action: PermissionAction) => {
    const applicable = features.filter((f) => f.actions.includes(action));
    const allChecked = applicable.every((f) => isChecked(f.key, action));
    const next = { ...value };
    for (const feature of applicable) {
      next[feature.key] = { ...(next[feature.key] ?? {}), [action]: !allChecked };
    }
    onChange(next);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {groups.map(([moduleKey, features]) => (
        <Box key={moduleKey}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {MODULE_LABELS[moduleKey as ModuleKey] ?? moduleKey}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Feature</TableHeaderCell>
                {ALL_ACTIONS.map((action) => (
                  <TableHeaderCell key={action} align="center">
                    <Box
                      component="span"
                      onClick={() => !disabled && toggleColumnForGroup(features, action)}
                      sx={{ cursor: disabled ? "default" : "pointer", userSelect: "none" }}
                      title="Toggle this action for every feature below"
                    >
                      {ACTION_LABELS[action]}
                    </Box>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.key} hover>
                  <TableCell>{feature.label}</TableCell>
                  {ALL_ACTIONS.map((action) => (
                    <TableCell key={action} align="center">
                      {feature.actions.includes(action) ? (
                        <Checkbox
                          size="small"
                          disabled={disabled}
                          checked={isChecked(feature.key, action)}
                          onChange={() => toggle(feature.key, action)}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ))}
    </Box>
  );
}
