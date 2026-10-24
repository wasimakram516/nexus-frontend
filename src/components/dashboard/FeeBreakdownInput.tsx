"use client";

import { useState } from "react";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";

interface Line {
  label: string;
  amount: string;
}

/** Reads the stored `{ "tuition": 5000 }` JSON back into editable lines. */
export function parseBreakdown(value: string): Line[] {
  if (!value.trim()) return [{ label: "", amount: "" }];
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const lines = Object.entries(parsed as Record<string, unknown>).map(([label, amount]) => ({
        label,
        amount: String(amount),
      }));
      if (lines.length > 0) return lines;
    }
  } catch {
    // Fall through to a single empty line.
  }
  return [{ label: "", amount: "" }];
}

/**
 * The first problem with the lines, or null when they make a valid fee
 * breakdown: every line needs a label and an amount above zero with at most
 * two decimals, and a label can appear only once.
 */
export function breakdownProblem(lines: Line[]): string | null {
  const filled = lines.filter((line) => line.label.trim() || line.amount.trim());
  if (filled.length === 0) return "Add at least one fee line.";
  const seen = new Set<string>();
  for (const line of filled) {
    const label = line.label.trim();
    const amount = Number(line.amount);
    if (!label) return "Every line needs a name, such as Tuition.";
    if (!line.amount.trim() || !Number.isFinite(amount) || amount <= 0) return `Enter an amount above zero for ${label}.`;
    if (Math.round(amount * 100) / 100 !== amount) return `${label} can have at most two decimals.`;
    if (seen.has(label.toLowerCase())) return `${label} is listed twice. Combine them into one line.`;
    seen.add(label.toLowerCase());
  }
  return null;
}

/** The JSON the server stores, or "" while the lines are incomplete. */
export function breakdownToJson(lines: Line[]): string {
  if (breakdownProblem(lines)) return "";
  const entries = lines
    .filter((line) => line.label.trim())
    .map((line) => [line.label.trim(), Number(line.amount)] as const);
  return JSON.stringify(Object.fromEntries(entries));
}

interface FeeBreakdownInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

/**
 * Fee lines as a small table (name and amount per row) with a running total,
 * instead of hand-typed JSON. It hands the form valid JSON, or an empty value
 * while the lines are incomplete so the form cannot be submitted.
 */
export default function FeeBreakdownInput({ value, onChange, disabled }: FeeBreakdownInputProps) {
  const [lines, setLines] = useState<Line[]>(() => parseBreakdown(value));
  const [touched, setTouched] = useState(false);

  const update = (next: Line[]) => {
    setLines(next);
    setTouched(true);
    onChange(breakdownToJson(next));
  };

  const problem = breakdownProblem(lines);
  const total = lines.reduce((sum, line) => sum + (Number(line.amount) > 0 ? Number(line.amount) : 0), 0);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Fee lines *</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        One line for each charge in the monthly fee, such as Tuition or Transport.
      </Typography>
      {lines.map((line, index) => (
        <Box key={index} sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "center" }}>
          <TextField
            label="Name"
            size="small"
            value={line.label}
            disabled={disabled}
            onChange={(e) => update(lines.map((row, i) => (i === index ? { ...row, label: e.target.value } : row)))}
            sx={{ flex: 2 }}
            slotProps={{ htmlInput: { "aria-label": `Fee name ${index + 1}`, maxLength: 60 } }}
          />
          <TextField
            label="Amount"
            size="small"
            type="number"
            value={line.amount}
            disabled={disabled}
            onChange={(e) => update(lines.map((row, i) => (i === index ? { ...row, amount: e.target.value } : row)))}
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { "aria-label": `Fee amount ${index + 1}`, min: 0, step: 0.01 } }}
          />
          <IconButton
            aria-label={`Remove fee line ${index + 1}`}
            disabled={disabled || lines.length === 1}
            onClick={() => update(lines.filter((_, i) => i !== index))}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button size="small" startIcon={<Add />} disabled={disabled || lines.length >= 20} onClick={() => update([...lines, { label: "", amount: "" }])}>
          Add line
        </Button>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{`Total ${total.toFixed(2)}`}</Typography>
      </Box>
      {touched && problem && (
        <Typography role="alert" variant="body2" color="error" sx={{ mt: 1 }}>{problem}</Typography>
      )}
    </Box>
  );
}
