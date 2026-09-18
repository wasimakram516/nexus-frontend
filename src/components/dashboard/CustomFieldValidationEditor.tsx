"use client";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

interface ValidationRules {
  allowedFormats?: string[];
  maxBytes?: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const BYTES_PER_MB = 1024 * 1024;

/** Serializes rules, dropping unset keys so an empty configuration is omitted from the payload entirely. */
function serialize(rules: ValidationRules): string {
  const cleaned: ValidationRules = {};
  if (rules.allowedFormats?.length) cleaned.allowedFormats = rules.allowedFormats;
  if (typeof rules.maxBytes === "number" && Number.isFinite(rules.maxBytes)) cleaned.maxBytes = rules.maxBytes;
  return Object.keys(cleaned).length ? JSON.stringify(cleaned) : "";
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
      <Typography component="legend">File / image rules</Typography>
      <Typography variant="body2" color="text.secondary">
        Only applies to File and Image fields; ignored for other input types.
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
