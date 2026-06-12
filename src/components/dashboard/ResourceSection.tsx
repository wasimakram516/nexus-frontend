"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export interface Option {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "select" | "textarea" | "json" | "boolean";
  options?: Option[];
  required?: boolean;
  cols?: 6 | 12;
  helperText?: string;
  /** Excluded from the edit dialog when false-able resources only support create. */
  createOnly?: boolean;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface ResourceSectionProps<T extends { id: string }> {
  title: string;
  /** Singular form for buttons/dialogs; defaults to title minus trailing "s". */
  singular?: string;
  subtitle?: string;
  rows: T[];
  loading: boolean;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  createLabel?: string;
  emptyMessage?: string;
  onCreate?: (payload: Record<string, unknown>) => Promise<boolean>;
  onUpdate?: (id: string, payload: Record<string, unknown>) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  /** Converts a row into dialog form values; defaults to stringifying matching keys. */
  rowToForm?: (row: T) => Record<string, string>;
  deleteMessage?: (row: T) => string;
  /** Extra per-row action buttons rendered before edit/delete. */
  renderRowActions?: (row: T) => React.ReactNode;
}

function defaultRowToForm<T extends { id: string }>(row: T, fields: FieldDef[]) {
  const form: Record<string, string> = {};
  for (const field of fields) {
    const raw = (row as Record<string, unknown>)[field.key];
    if (raw === null || raw === undefined) {
      form[field.key] = "";
    } else if (field.type === "date") {
      form[field.key] = String(raw).slice(0, 10);
    } else if (field.type === "json") {
      form[field.key] = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    } else {
      form[field.key] = String(raw);
    }
  }
  return form;
}

function buildPayload(form: Record<string, string>, fields: FieldDef[]) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = form[field.key] ?? "";
    if (value === "") {
      continue;
    }
    if (field.type === "number") {
      payload[field.key] = Number(value);
    } else if (field.type === "boolean") {
      payload[field.key] = value === "true";
    } else if (field.type === "json") {
      payload[field.key] = JSON.parse(value);
    } else {
      payload[field.key] = value;
    }
  }
  return payload;
}

export default function ResourceSection<T extends { id: string }>({
  title,
  singular,
  subtitle,
  rows,
  loading,
  columns,
  fields,
  createLabel,
  emptyMessage,
  onCreate,
  onUpdate,
  onDelete,
  rowToForm,
  deleteMessage,
  renderRowActions,
}: ResourceSectionProps<T>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);

  const singularLabel = singular ?? title.replace(/s$/, "");

  const emptyForm = () =>
    fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = "";
      return acc;
    }, {});

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setForm(rowToForm ? rowToForm(row) : defaultRowToForm(row, fields));
    setFormError(null);
    setDialogOpen(true);
  };

  const dialogFields = editing ? fields.filter((f) => !f.createOnly) : fields;

  const missingRequired = dialogFields.some((f) => f.required && !form[f.key]);

  const handleSave = async () => {
    setFormError(null);
    let payload: Record<string, unknown>;
    try {
      payload = buildPayload(form, dialogFields);
    } catch {
      setFormError("Invalid JSON in one of the fields. Please fix it and try again.");
      return;
    }
    setSaving(true);
    const ok = editing
      ? await onUpdate?.(editing.id, payload)
      : await onCreate?.(payload);
    setSaving(false);
    if (ok) setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await onDelete?.(confirmDelete.id);
    setConfirmDelete(null);
  };

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const hasActions = Boolean(onUpdate || onDelete || renderRowActions);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        {onCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            {createLabel ?? `Add ${singularLabel}`}
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: onCreate ? 2 : 0 }}>
              {emptyMessage ?? `No ${title.toLowerCase()} yet.`}
            </Typography>
            {onCreate && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                {createLabel ?? `Add ${singularLabel}`}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{col.label}</TableCell>
                ))}
                {hasActions && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ whiteSpace: "nowrap" }}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {renderRowActions?.(row)}
                      {onUpdate && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(row)}><Delete fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${singularLabel}`}
        message={
          confirmDelete
            ? deleteMessage?.(confirmDelete) ??
              "Are you sure? This record will be moved to the recycle bin."
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? `Edit ${singularLabel}` : createLabel ?? `New ${singularLabel}`}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            {dialogFields.map((field) => (
              <Grid key={field.key} size={{ xs: 12, sm: field.cols ?? 12 }}>
                <TextField
                  label={field.required ? `${field.label} *` : field.label}
                  value={form[field.key] ?? ""}
                  onChange={(e) => setField(field.key, e.target.value)}
                  select={field.type === "select" || field.type === "boolean"}
                  type={
                    field.type === "number" || field.type === "date" || field.type === "time"
                      ? field.type
                      : "text"
                  }
                  multiline={field.type === "textarea" || field.type === "json"}
                  minRows={field.type === "textarea" || field.type === "json" ? 3 : undefined}
                  fullWidth
                  helperText={field.helperText}
                  slotProps={{
                    inputLabel:
                      field.type === "date" || field.type === "time" ? { shrink: true } : undefined,
                  }}
                >
                  {field.type === "select" &&
                    (field.options ?? []).map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  {field.type === "boolean" && [
                    <MenuItem key="true" value="true">Yes</MenuItem>,
                    <MenuItem key="false" value="false">No</MenuItem>,
                  ]}
                </TextField>
              </Grid>
            ))}
            {formError && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="error">{formError}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || missingRequired}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
