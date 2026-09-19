"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

interface ValidationRules {
  [key: string]: unknown;
  allowedFormats?: string[];
  maxBytes?: number;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const BYTES_PER_MB = 1024 * 1024;

/** Serializes rules, dropping unset keys so an empty configuration is omitted from the payload entirely. */
function serialize(rules: ValidationRules): string {
  const cleaned: ValidationRules = { ...rules };
  if (!rules.allowedFormats?.length) delete cleaned.allowedFormats;
  for (const key of ["maxBytes", "min", "max", "minLength", "maxLength"] as const) {
    if (typeof cleaned[key] !== "number" || !Number.isFinite(cleaned[key])) delete cleaned[key];
  }
  return JSON.stringify(cleaned);
}

/**
 * Edits `validation.allowedFormats`/`validation.maxBytes` — the FILE/IMAGE
 * upload metadata rules `custom-field-validation.util.ts` already enforces
 * at write time (`isValidUploadValue` callers), but which previously had no
 * builder-UI control. Shown for every field regardless of input type,
 * matching the existing "Choices" editor's precedent of always rendering
 * and letting the backend ignore rules that don't apply to the selected
 * input type.
 */
export default function CustomFieldValidationEditor({ value, onChange, disabled }: Props) {
  const rules: ValidationRules = value ? (JSON.parse(value) as ValidationRules) : {};
  const formatsText = (rules.allowedFormats ?? []).join(", ");
  const maxMb = typeof rules.maxBytes === "number" ? String(rules.maxBytes / BYTES_PER_MB) : "";

  return (
    <Box component="fieldset" disabled={disabled} sx={{ border: 0, p: 0, m: 0, display: "grid", gap: 1.5 }}>
      <Typography component="legend">Validation rules</Typography>
      {([ ["min", "Minimum number"], ["max", "Maximum number"], ["minLength", "Minimum text length"], ["maxLength", "Maximum text length"] ] as const).map(([key, label]) => (
        <TextField key={key} label={label} type="number" disabled={disabled} value={rules[key] ?? ""}
          slotProps={{ htmlInput: { ...(key.endsWith("Length") ? { min: 0, step: 1 } : { step: "any" }) } }}
          onChange={(event) => onChange(serialize({ ...rules, [key]: event.target.value === "" ? undefined : Number(event.target.value) }))} />
      ))}
      <Typography variant="body2" color="text.secondary">
        Number and text limits apply to their matching field types. File limits below apply to uploaded files and images; when a format or size limit is set, external URLs are rejected because they carry no metadata to check.
      </Typography>
      <TextField
        label="Allowed formats"
        placeholder="pdf, jpg, png"
        helperText="Comma-separated file extensions. Leave empty to allow any format."
        fullWidth
        disabled={disabled}
        value={formatsText}
        onChange={(event) => {
          const formats = event.target.value
            .split(",")
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
          onChange(serialize({ ...rules, allowedFormats: formats }));
        }}
      />
      <TextField
        label="Max file size (MB)"
        type="number"
        helperText="Leave empty for no size limit."
        fullWidth
        disabled={disabled}
        value={maxMb}
        slotProps={{ htmlInput: { min: 0, step: "any" } }}
        onChange={(event) => {
          const raw = event.target.value;
          const parsed = raw === "" ? undefined : Number(raw) * BYTES_PER_MB;
          onChange(serialize({ ...rules, maxBytes: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined }));
        }}
      />
    </Box>
  );
}
