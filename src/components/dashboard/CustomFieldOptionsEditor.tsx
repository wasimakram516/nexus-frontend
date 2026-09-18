"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

interface Choice { label: string; value: string }
interface Props { value: string; onChange: (value: string) => void; disabled: boolean }

/** Edits labeled choice values without exposing serialized configuration to administrators. */
export default function CustomFieldOptionsEditor({ value, onChange, disabled }: Props) {
  const options: Choice[] = value ? JSON.parse(value) as Choice[] : [];
  /** Updates one choice while preserving the stable values of the other choices. */
  const update = (index: number, key: keyof Choice, nextValue: string): void => {
    onChange(JSON.stringify(options.map((option, current) => current === index ? { ...option, [key]: nextValue } : option)));
  };
  return <Box component="fieldset" disabled={disabled} sx={{ border: 0, p: 0, m: 0 }}>
    <Typography component="legend">Choices</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Required for select, multiple select, radio and checkbox fields. Keep saved values stable when renaming labels.</Typography>
    {options.map((option, index) => <Box key={index} sx={{ display: "flex", gap: 1, mb: 1, alignItems: "center" }}>
      <TextField label={`Choice ${index + 1} label`} value={option.label} onChange={(event) => update(index, "label", event.target.value)} fullWidth />
      <TextField label={`Choice ${index + 1} value`} value={option.value} onChange={(event) => update(index, "value", event.target.value)} fullWidth />
      <Button aria-label={`Remove choice ${index + 1}`} onClick={() => onChange(JSON.stringify(options.filter((_, current) => current !== index)))}>Remove</Button>
    </Box>)}
    <Button onClick={() => onChange(JSON.stringify([...options, { label: "", value: "" }]))}>Add choice</Button>
  </Box>;
}
