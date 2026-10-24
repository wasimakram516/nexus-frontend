"use client";

import { useState } from "react";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";

export interface Charge {
  label: string;
  amount: string;
}

export const MAX_CHARGES = 10;

/** Lines that have anything typed in them; a completely blank row is ignored. */
export function filledCharges(charges: Charge[]): Charge[] {
  return charges.filter((charge) => charge.label.trim() || charge.amount.trim());
}

/** The first filled line that cannot be saved: it needs a label and an amount above zero with at most two decimals. */
export function invalidCharge(charges: Charge[]): Charge | undefined {
  return filledCharges(charges).find(
    (charge) =>
      !charge.label.trim() ||
      !Number.isFinite(Number(charge.amount)) ||
      Number(charge.amount) <= 0 ||
      Math.round(Number(charge.amount) * 100) / 100 !== Number(charge.amount),
  );
}

export const CHARGE_PROBLEM = "Each one-time charge needs a label and an amount above zero with at most two decimals.";

/** The charges as the server expects them. */
export function chargesPayload(charges: Charge[]): Array<{ label: string; amount: number }> {
  return filledCharges(charges).map((charge) => ({ label: charge.label.trim(), amount: Number(charge.amount) }));
}

/** Reads a JSON array of `{ label, amount }` back into editable lines; anything else is no charges. */
export function parseCharges(value: string): Charge[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => {
      const item = row as { label?: unknown; amount?: unknown };
      return { label: String(item.label ?? ""), amount: String(item.amount ?? "") };
    });
  } catch {
    return [];
  }
}

interface OneTimeChargesEditorProps {
  charges: Charge[];
  onChange: (charges: Charge[]) => void;
  disabled: boolean;
  /** The sentence under the heading, which differs between one voucher and a whole run. */
  hint: string;
}

/**
 * Extra lines added to a voucher once, such as an admission fee or exam fee.
 * Shared by the month-wide generation dialog and the single voucher form.
 */
export default function OneTimeChargesEditor({ charges, onChange, disabled, hint }: OneTimeChargesEditorProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>One-time charges</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{hint}</Typography>
      {charges.map((charge, index) => (
        <Box key={index} sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "center" }}>
          <TextField
            label="Label"
            size="small"
            value={charge.label}
            disabled={disabled}
            onChange={(e) => onChange(charges.map((c, i) => (i === index ? { ...c, label: e.target.value } : c)))}
            sx={{ flex: 2 }}
            slotProps={{ htmlInput: { "aria-label": `Charge label ${index + 1}`, maxLength: 60 } }}
          />
          <TextField
            label="Amount"
            size="small"
            type="number"
            value={charge.amount}
            disabled={disabled}
            onChange={(e) => onChange(charges.map((c, i) => (i === index ? { ...c, amount: e.target.value } : c)))}
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { "aria-label": `Charge amount ${index + 1}`, min: 0, step: 0.01 } }}
          />
          <IconButton aria-label={`Remove charge ${index + 1}`} disabled={disabled} onClick={() => onChange(charges.filter((_, i) => i !== index))}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<Add />} disabled={disabled || charges.length >= MAX_CHARGES} onClick={() => onChange([...charges, { label: "", amount: "" }])}>
        Add charge
      </Button>
      {invalidCharge(charges) && (
        <Typography role="alert" variant="body2" color="error" sx={{ mt: 1 }}>{CHARGE_PROBLEM}</Typography>
      )}
    </Box>
  );
}

interface OneTimeChargesFieldProps {
  /** The form value: a JSON array of charges, or empty. */
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

/**
 * The single voucher form's version of the editor. It keeps the charges as
 * lines and hands the form a JSON array, or a value that cannot be submitted
 * while a line is incomplete. An empty list is sent as `[]` so that editing a
 * voucher can remove the charges it had.
 */
export function OneTimeChargesField({ value, onChange, disabled }: OneTimeChargesFieldProps) {
  const [charges, setCharges] = useState<Charge[]>(() => parseCharges(value));
  const update = (next: Charge[]) => {
    setCharges(next);
    onChange(invalidCharge(next) ? "incomplete" : JSON.stringify(chargesPayload(next)));
  };
  return (
    <OneTimeChargesEditor
      charges={charges}
      onChange={update}
      disabled={disabled}
      hint="Added to this voucher only, such as an admission fee or exam fee. Editing the voucher keeps them unless you change them here."
    />
  );
}
