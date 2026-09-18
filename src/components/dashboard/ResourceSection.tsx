"use client";

import { useRef, useState } from "react";
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
import { Add, Delete, Edit, Visibility } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import CustomFieldInputs from "@/components/dashboard/CustomFieldInputs";
import { useCustomFieldForm } from "@/hooks/useCustomFieldForm";

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
  min?: number;
  max?: number;
  integer?: boolean;
  renderInput?: (value: string, onChange: (value: string) => void, disabled: boolean) => React.ReactNode;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface ResourceSectionProps<T extends { id: string }> {
  idempotencyKeyField?: string;
  customFieldEntity?: string;
  institutionId?: string;
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
  /** Optional review step; editing any field discards the prepared payload. */
  previewCreate?: (payload: Record<string, unknown>) => Promise<React.ReactNode>;
  confirmCreateLabel?: string;
  onUpdate?: (id: string, payload: Record<string, unknown>) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  /** Converts a row into dialog form values; defaults to stringifying matching keys. */
  rowToForm?: (row: T) => Record<string, string>;
  deleteMessage?: (row: T) => string;
  /** Extra per-row action buttons rendered before edit/delete. */
  renderRowActions?: (row: T) => React.ReactNode;
}

/** Converts API record values into editable input strings. */
function defaultRowToForm<T extends { id: string }>(row: T, fields: FieldDef[]): Record<string, string> {
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

/** Builds a payload while enforcing the configured form constraints. */
function buildPayload(form: Record<string, string>, fields: FieldDef[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = form[field.key] ?? "";
    if (value === "") {
      if (field.required) throw new Error(`${field.label} is required.`);
      continue;
    }
    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number) || (field.integer && !Number.isInteger(number)) ||
        (field.min !== undefined && number < field.min) ||
        (field.max !== undefined && number > field.max)) {
        throw new Error(`${field.label} must be a valid ${field.integer ? "whole number" : "number"}${field.min !== undefined ? ` of at least ${field.min}` : ""}${field.max !== undefined ? ` and at most ${field.max}` : ""}.`);
      }
      payload[field.key] = number;
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

/** Renders resource records and their validated create/edit workflow. */
export default function ResourceSection<T extends { id: string }>({
  idempotencyKeyField,
  customFieldEntity,
  institutionId,
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
  previewCreate,
  confirmCreateLabel = "Confirm",
  onUpdate,
  onDelete,
  rowToForm,
  deleteMessage,
  renderRowActions,
}: ResourceSectionProps<T>): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [viewing, setViewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
  const [prepared, setPrepared] = useState<{ payload: Record<string, unknown>; content: React.ReactNode } | null>(null);
  const savingRef = useRef(false);
  const requestKeyRef = useRef<string | null>(null);
  const customForm = useCustomFieldForm(customFieldEntity, institutionId);
  const { definitions: customDefinitions, values: customValues, setValues: setCustomValues,
    loading: customLoading, error: customError } = customForm;

  const singularLabel = singular ?? title.replace(/s$/, "");

  /** Initializes only fields declared by the owning resource. */
  const emptyForm = (): Record<string, string> =>
    fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = "";
      return acc;
    }, {});

  /** Starts a fresh creation, without reusing an earlier preview. */
  const openCreate = (): void => {
    requestKeyRef.current = idempotencyKeyField ? crypto.randomUUID() : null;
    setViewing(false);
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setPrepared(null);
    setDialogOpen(true);
    void customForm.load("create");
  };

  /** Opens an existing record using its current API values. */
  const openEdit = (row: T, readOnly = false): void => {
    setViewing(readOnly);
    setEditing(row);
    setForm(rowToForm ? rowToForm(row) : defaultRowToForm(row, fields));
    setFormError(null);
    setPrepared(null);
    setDialogOpen(true);
    void customForm.load(readOnly ? "read" : "update", (row as T & { customFields?: Record<string, unknown> }).customFields);
  };

  const dialogFields = editing ? fields.filter((f) => !f.createOnly) : fields;

  const missingRequired = dialogFields.some((f) => f.required && !form[f.key]) || customForm.missingRequired;

  /** Previews once, then submits exactly the payload the user reviewed. */
  const handleSave = async (): Promise<void> => {
    if (viewing || savingRef.current || customLoading || customError || missingRequired) return;
    setFormError(null);
    savingRef.current = true;
    setSaving(true);
    try {
      const payload = prepared?.payload ?? { ...buildPayload(form, dialogFields), ...(customFieldEntity ? { customFields: customValues } : {}),
        ...(!editing && idempotencyKeyField ? { [idempotencyKeyField]: requestKeyRef.current } : {}) };
      if (!editing && previewCreate && !prepared) {
        const content = await previewCreate(payload);
        setPrepared({ payload, content });
        return;
      }
      const ok = editing
        ? await onUpdate?.(editing.id, payload)
        : await onCreate?.(payload);
      setPrepared(null);
      if (ok) setDialogOpen(false);
    } catch (error) {
      setPrepared(null);
      setFormError(error instanceof SyntaxError ? "Invalid JSON in one of the fields. Please fix it and try again." : error instanceof Error ? error.message : "Unable to save. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await onDelete?.(confirmDelete.id);
    setConfirmDelete(null);
  };

  /** Any input change invalidates the previously reviewed values. */
  const setField = (key: string, value: string): void => {
    setPrepared(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const hasActions = Boolean(onUpdate || onDelete || renderRowActions || customFieldEntity);

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
        <DataTableCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableHeaderCell key={col.key} sx={{ whiteSpace: "nowrap" }}>{col.label}</TableHeaderCell>
                ))}
                {hasActions && <TableHeaderCell align="right">Actions</TableHeaderCell>}
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
                      {customFieldEntity && <Tooltip title="View details"><IconButton aria-label="View details" size="small" onClick={() => openEdit(row, true)}><Visibility fontSize="small" /></IconButton></Tooltip>}
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
        </DataTableCard>
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

      <Dialog open={dialogOpen} onClose={() => { if (!savingRef.current) setDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {viewing ? `${singularLabel} details` : editing ? `Edit ${singularLabel}` : createLabel ?? `New ${singularLabel}`}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            {dialogFields.map((field) => (
              <Grid key={field.key} size={{ xs: 12, sm: field.cols ?? 12 }}>
                {field.renderInput ? field.renderInput(form[field.key] ?? "", (value) => setField(field.key, value), saving || viewing) : <TextField
                  label={field.required ? `${field.label} *` : field.label}
                  value={form[field.key] ?? ""}
                  disabled={saving || viewing}
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
                    htmlInput: { min: field.min, max: field.max, step: field.integer ? 1 : undefined },
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
                </TextField>}
              </Grid>
            ))}
            {customLoading && <Grid size={{ xs: 12 }}><Typography role="status">Loading additional fields...</Typography></Grid>}
            {customError && <Grid size={{ xs: 12 }}><Typography role="alert" color="error">{customError}</Typography></Grid>}
            {customDefinitions.length > 0 && <Grid size={{ xs: 12 }}><CustomFieldInputs definitions={customDefinitions} values={customValues} disabled={saving || viewing}
              onChange={(fieldKey, value) => { setPrepared(null); setCustomValues((current) => ({ ...current, [fieldKey]: value })); }} /></Grid>}
            {prepared && <Grid size={{ xs: 12 }}><Box aria-live="polite">{prepared.content}</Box></Grid>}
            {formError && (
              <Grid size={{ xs: 12 }}>
                <Typography role="alert" variant="body2" color="error">{formError}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>{viewing ? "Close" : "Cancel"}</Button>
          {!viewing && <Button variant="contained" onClick={handleSave} disabled={saving || missingRequired || customLoading || Boolean(customError)}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : previewCreate ? prepared ? confirmCreateLabel : "Preview" : "Create"}
          </Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
