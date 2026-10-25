"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { parseSettingObject } from "@/lib/settings";
import { platformService } from "@/services/platform.service";

export const DEFAULT_DUE_DAY = 10;
export const DEFAULT_CURRENCY = "Rs.";
const MAX_INSTRUCTIONS = 2000;
const MAX_CONTACT = 200;
const MAX_CURRENCY = 10;

/** The due day's problem, or null when it is a whole number from 1 to 28. */
export function dueDayError(value: string): string | null {
  const number = Number(value);
  return value.trim() !== "" && Number.isInteger(number) && number >= 1 && number <= 28 ? null : "Enter a whole number from 1 to 28.";
}

interface FinanceSettingsCardProps {
  institutionId: string;
  /** The raw `finance` setting from the institution's runtime config. */
  setting: unknown;
  onSaved?: () => void;
}

/**
 * How fee vouchers are issued and printed: the day of the month they fall
 * due, the currency written beside amounts, and the instructions and contact
 * line printed on every voucher.
 */
export default function FinanceSettingsCard({ institutionId, setting, onSaved }: FinanceSettingsCardProps) {
  const { showMessage } = useMessage();
  const stored = parseSettingObject(setting);
  const dueDay = typeof stored?.dueDayOfMonth === "number" ? stored.dueDayOfMonth : DEFAULT_DUE_DAY;
  const currency = typeof stored?.currencyLabel === "string" && stored.currencyLabel.trim() ? stored.currencyLabel : DEFAULT_CURRENCY;
  const instructions = typeof stored?.voucherInstructions === "string" ? stored.voucherInstructions : "";
  const contact = typeof stored?.voucherContact === "string" ? stored.voucherContact : "";
  const autoFines = stored?.autoCalculateFines === true;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftDay, setDraftDay] = useState(String(dueDay));
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [draftInstructions, setDraftInstructions] = useState(instructions);
  const [draftContact, setDraftContact] = useState(contact);
  const [draftAutoFines, setDraftAutoFines] = useState(autoFines);

  const openEdit = () => {
    setDraftDay(String(dueDay));
    setDraftCurrency(currency);
    setDraftInstructions(instructions);
    setDraftContact(contact);
    setDraftAutoFines(autoFines);
    setOpen(true);
  };

  const dayError = dueDayError(draftDay);
  const currencyError = draftCurrency.trim() === "" ? "Enter a currency label, such as Rs." : null;
  const canSave = !dayError && !currencyError && !saving;

  const handleSave = async () => {
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        platformService.updateSettings(institutionId, {
          settings: [
            {
              key: "finance",
              value: {
                dueDayOfMonth: Number(draftDay),
                currencyLabel: draftCurrency.trim(),
                voucherInstructions: draftInstructions.trim(),
                voucherContact: draftContact.trim(),
                autoCalculateFines: draftAutoFines,
              },
              description: "How fee vouchers are issued and printed.",
            },
          ],
        }),
      { showMessage, successMessage: "Voucher settings saved" },
    );
    setSaving(false);
    if (success) {
      setOpen(false);
      onSaved?.();
    }
  };

  const instructionLines = instructions.split(/\r?\n/).filter((line) => line.trim());

  return (
    <>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Fee vouchers</Typography>
            <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openEdit} aria-label="Edit voucher settings">Edit</Button>
          </Box>
          <Typography variant="body2">{`Due on day ${dueDay} of the month · Amounts shown as ${currency}`}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {instructionLines.length > 0
              ? `${instructionLines.length} instruction${instructionLines.length === 1 ? "" : "s"} printed on every voucher`
              : "No instructions are printed on vouchers yet."}
            {contact ? ` · Footer: ${contact}` : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {autoFines ? "Attendance fines are calculated automatically on the 1st of each month." : "Attendance fines are calculated only when someone presses Calculate fines."}
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => (saving ? undefined : setOpen(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit voucher settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label="Due day of the month"
              type="number"
              size="small"
              fullWidth
              value={draftDay}
              onChange={(e) => setDraftDay(e.target.value)}
              error={Boolean(dayError)}
              helperText={dayError ?? "Vouchers are due on this day unless a different date is chosen when generating them. 1 to 28."}
              slotProps={{ htmlInput: { min: 1, max: 28, step: 1 } }}
            />
            <TextField
              label="Currency label"
              size="small"
              fullWidth
              value={draftCurrency}
              onChange={(e) => setDraftCurrency(e.target.value)}
              error={Boolean(currencyError)}
              helperText={currencyError ?? "Written beside amounts on printed vouchers, such as Rs. or SAR."}
              slotProps={{ htmlInput: { maxLength: MAX_CURRENCY } }}
            />
            <TextField
              label="Instructions on the voucher"
              size="small"
              fullWidth
              multiline
              minRows={5}
              value={draftInstructions}
              onChange={(e) => setDraftInstructions(e.target.value)}
              helperText={`One instruction per line, such as how to pay and what a late payment costs. ${draftInstructions.length}/${MAX_INSTRUCTIONS}`}
              slotProps={{ htmlInput: { maxLength: MAX_INSTRUCTIONS } }}
            />
            <FormControlLabel
              control={<Switch checked={draftAutoFines} onChange={(e) => setDraftAutoFines(e.target.checked)} />}
              label="Calculate attendance fines automatically"
              slotProps={{ typography: { variant: "body2" } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
              On the 1st of each month, last month&apos;s fines are calculated for every campus. It never changes a fine entered by hand, a paid fine, or a month whose vouchers are already issued, so it is best left on when vouchers are generated after the month ends.
            </Typography>
            <TextField
              label="Footer line"
              size="small"
              fullWidth
              value={draftContact}
              onChange={(e) => setDraftContact(e.target.value)}
              helperText="Printed at the bottom of every voucher, such as an email and phone number for queries."
              slotProps={{ htmlInput: { maxLength: MAX_CONTACT } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
