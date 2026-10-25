"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { DAY_NAMES, type Weekday } from "@/lib/timetableDocuments";
import { timetableService } from "@/services/timetable.service";

const WEEK: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface Source {
  id: string;
  dayOfWeek: Weekday;
}

interface Skipped {
  sourceId: string;
  name: string;
  dayOfWeek: Weekday;
  reason: string;
}

interface DuplicatePeriodsDialogProps {
  /** The periods to copy; null keeps the dialog closed. */
  sources: Source[] | null;
  /** What is being copied, for the title: "Period 1" or "Monday". */
  subject: string;
  onClose: () => void;
  /** Called after copies were made, so the grid can reload. */
  onDone: () => void;
}

/**
 * Pick the days to copy one period, or a whole day's periods, onto. The server
 * makes every copy it can and reports the ones it could not (the day already
 * has that period, a teacher or room is busy), so a few clashes never lose the
 * rest of the work.
 */
export default function DuplicatePeriodsDialog({ sources, subject, onClose, onDone }: DuplicatePeriodsDialogProps) {
  const { showMessage } = useMessage();
  const [days, setDays] = useState<Weekday[]>([]);
  const [saving, setSaving] = useState(false);
  const [skipped, setSkipped] = useState<Skipped[] | null>(null);

  useEffect(() => {
    if (sources) {
      (async () => {
        setDays([]);
        setSkipped(null);
      })();
    }
  }, [sources]);

  if (!sources) return null;
  const sourceDays = new Set(sources.map((source) => source.dayOfWeek));
  /** A day is pointless to copy onto only when every period is already on it. */
  const isOwnDay = (day: Weekday) => sourceDays.size === 1 && sourceDays.has(day);
  const toggle = (day: Weekday) => setDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));

  const copy = async () => {
    setSaving(true);
    const { data, success } = await apiHandler<{ created: number; skipped: Skipped[] }>(
      () => timetableService.duplicatePeriodSlots(sources.map((source) => source.id), days),
      { showMessage }
    );
    setSaving(false);
    if (!success || !data) return;
    if (data.created > 0) onDone();
    if (data.skipped.length > 0) setSkipped(data.skipped);
    else onClose();
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{skipped ? "Some copies were skipped" : `Copy ${subject} to other days`}</DialogTitle>
      <DialogContent>
        {skipped ? (
          <Box>
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              The rest were copied. These could not be:
            </Alert>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {skipped.map((entry) => (
                <li key={`${entry.sourceId}-${entry.dayOfWeek}`}>
                  <Typography variant="body2">
                    <strong>{entry.name}</strong> on {DAY_NAMES[entry.dayOfWeek]}: {entry.reason}
                  </Typography>
                </li>
              ))}
            </Box>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Each copy keeps the time, subject, teacher and room. A day that already has that period number, or where the teacher or room is busy, is skipped and listed.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {WEEK.map((day) => (
                <FormControlLabel
                  key={day}
                  disabled={isOwnDay(day) || saving}
                  control={<Checkbox checked={days.includes(day)} onChange={() => toggle(day)} />}
                  label={DAY_NAMES[day]}
                />
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {skipped ? (
          <Button variant="contained" onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="contained" onClick={copy} disabled={saving || days.length === 0}>
              {saving ? <CircularProgress size={16} color="inherit" /> : "Copy"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
