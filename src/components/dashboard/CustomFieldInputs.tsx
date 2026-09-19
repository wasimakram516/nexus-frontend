"use client";

import { useEffect, useRef, useState } from "react";
import AttachFile from "@mui/icons-material/AttachFile";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { CustomFieldDefinition } from "@/services/customFields.service";
import { uploadFile, type UploadResult } from "@/lib/upload";

interface Props {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (fieldKey: string, value: unknown) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}

/** Derives a short display label for an uploaded value — mirrors NoticesManager's attachmentLabel. */
function uploadLabel(upload: UploadResult): string {
  const segments = upload.publicId.split("/");
  const base = segments[segments.length - 1] || upload.publicId;
  return `${base}.${upload.format}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * One FILE/IMAGE field: uploads through the existing shared /upload
 * endpoint (same `uploadFile()`/`UploadResult` contract Notices' attachments
 * use — see NoticesManager.tsx) and stores the full UploadResult object as
 * the field's value, matching what entity-custom-fields.service.ts and
 * custom-field-validation.util.ts now expect for these input types.
 */
function UploadFieldInput({ definition, value, onChange, disabled, onBusyChange }: {
  definition: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const statusId = `custom-field-upload-status-${definition.id}`;
  const current = value && typeof value === "object" ? (value as UploadResult) : null;
  const externalUrl = typeof value === "string" ? value : null;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    onBusyChange(true);
    setProgress(0);
    try {
      const result = await uploadFile(file, {
        subfolder: definition.inputType === "IMAGE" ? "images" : "documents",
        onProgress: setProgress,
      });
      if (mounted.current) onChange(result);
    } catch (uploadErr) {
      setError((uploadErr as Error).message || `Failed to upload "${file.name}".`);
    } finally {
      setUploading(false);
      onBusyChange(false);
      setProgress(0);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 0.5 }}>
      <Typography variant="body2" component="label" htmlFor={`${statusId}-input`}>
        {definition.label}{definition.isRequired ? " *" : ""}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {current ? (
          <Chip
            icon={<AttachFile fontSize="small" />}
            component="a"
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            label={`${uploadLabel(current)} · ${formatBytes(current.bytes)}`}
            onDelete={disabled ? undefined : () => onChange(null)}
            deleteIcon={<span aria-label={`Remove ${definition.label}`} role="button">&times;</span>}
          />
        ) : externalUrl ? (
          <Chip component="a" href={externalUrl} target="_blank" rel="noopener noreferrer" clickable
            label={externalUrl} onDelete={disabled ? undefined : () => onChange(null)}
            deleteIcon={<span aria-label={`Remove ${definition.label}`} role="button">&times;</span>} />
        ) : (
          <Typography variant="body2" color="text.secondary">No file selected.</Typography>
        )}
        <Button
          size="small"
          variant="outlined"
          component="label"
          startIcon={uploading ? <CircularProgress size={14} /> : <AttachFile fontSize="small" />}
          disabled={disabled || uploading}
          aria-describedby={statusId}
        >
          {current || externalUrl ? "Replace" : "Upload"}
          <input
            id={`${statusId}-input`}
            ref={inputRef}
            type="file"
            hidden
            accept={definition.inputType === "IMAGE" ? "image/*" : undefined}
            onChange={handleSelect}
            aria-label={`${definition.label} file`}
          />
        </Button>
      </Box>
      {uploading && (
        <Box sx={{ width: "100%", maxWidth: 240 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label={`Uploading ${definition.label}`}
          />
        </Box>
      )}
      <Typography id={statusId} role="status" variant="caption" color="text.secondary" sx={{ minHeight: "1em" }}>
        {uploading ? `Uploading… ${progress}%` : definition.helpText || ""}
      </Typography>
      {error && (
        <Typography role="alert" variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
}

/** Renders typed custom values using the same value contract as the API. */
export default function CustomFieldInputs({ definitions, values, onChange, disabled = false, onBusyChange }: Props) {
  const pendingUploads = useRef(new Set<string>());
  if (!definitions.length) return null;
  return <Box role="group" aria-label="Additional information" sx={{ display: "grid", gap: 2 }}>
    <Typography variant="subtitle2">Additional information</Typography>
    {definitions.map((definition) => {
      const value = values[definition.fieldKey];
      if (definition.inputType === "FILE" || definition.inputType === "IMAGE") {
        return (
          <UploadFieldInput
            key={definition.id}
            definition={definition}
            value={value}
            onChange={(next) => onChange(definition.fieldKey, next)}
            disabled={disabled}
            onBusyChange={(busy) => {
              const wasBusy = pendingUploads.current.size > 0;
              if (busy) pendingUploads.current.add(definition.id);
              else pendingUploads.current.delete(definition.id);
              const isBusy = pendingUploads.current.size > 0;
              if (wasBusy !== isBusy) onBusyChange?.(isBusy);
            }}
          />
        );
      }
      const multiple = definition.inputType === "MULTI_SELECT" || definition.inputType === "CHECKBOX";
      const boolean = definition.inputType === "BOOLEAN";
      const select = multiple || boolean || definition.inputType === "SELECT" || definition.inputType === "RADIO";
      const type = definition.inputType === "NUMBER" ? "number" : definition.inputType === "DATE" ? "date" : definition.inputType === "DATETIME" ? "datetime-local" : definition.inputType === "EMAIL" ? "email" : definition.inputType === "PHONE" ? "tel" : definition.inputType === "URL" ? "url" : "text";
      return <TextField key={definition.id} label={definition.label} required={definition.isRequired}
        placeholder={definition.placeholder} helperText={definition.helpText} disabled={disabled}
        value={multiple ? Array.isArray(value) ? value : [] : value ?? ""}
        fullWidth select={select} type={type} multiline={definition.inputType === "TEXTAREA"}
        minRows={definition.inputType === "TEXTAREA" ? 3 : undefined}
        slotProps={{
          select: { multiple },
          inputLabel: type === "date" || type === "datetime-local" ? { shrink: true } : undefined,
          htmlInput: { "aria-required": definition.isRequired || undefined },
        }}
        onChange={(event) => {
          const next: unknown = event.target.value;
          onChange(definition.fieldKey, next === "" ? null : multiple ? next : boolean ? next === "true" : type === "number" ? Number(next) : next);
        }}>
        {select && !multiple && !definition.isRequired && <MenuItem value="">None</MenuItem>}
        {boolean ? [<MenuItem key="true" value="true">Yes</MenuItem>, <MenuItem key="false" value="false">No</MenuItem>] : select ? (definition.options ?? []).map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>) : null}
      </TextField>;
    })}
  </Box>;
}
