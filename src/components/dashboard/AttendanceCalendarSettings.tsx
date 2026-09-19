"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ResourceSection from "./ResourceSection";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { attendanceCalendarService as calendar, WORKING_DAYS, type WorkingDay, type ClosureDate } from "@/services/attendanceCalendar.service";
import { platformService } from "@/services/platform.service";

interface CampusOption { id: string; name: string; timezone?: string | null; institution?: { timezone: string } | null }
interface Props { institutionId?: string; campuses: CampusOption[] }

/** Configures the existing working-calendar and closure APIs in tenant and platform contexts. */
export default function AttendanceCalendarSettings({ institutionId, campuses }: Props) {
  const { user } = useAuth();
  const runtime = useOptionalRuntimeConfig();
  const { showMessage } = useMessage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [days, setDays] = useState<WorkingDay[]>([]);
  const [closures, setClosures] = useState<ClosureDate[]>([]);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState("");
  const can = (action: "create" | "read" | "update" | "delete") => Boolean(institutionId || user?.role === "ADMIN" || runtime?.can?.("attendance_calendar", action));

  /** Loads all data before allowing edits; failures leave the form blocked and retryable. */
  const load = async () => {
    setOpen(true); setLoading(true); setError(false);
    try {
      const [working, dates, institution] = await Promise.all([
        calendar.getWorkingDays(institutionId), calendar.getClosures(institutionId),
        institutionId ? platformService.getInstitution(institutionId) : Promise.resolve(null),
      ]);
      setDays(working.data.data?.workingDays ?? []);
      setConfigured(Boolean(working.data.data));
      setClosures(dates.data.data);
      setTimezone(institution?.data.data?.timezone ?? "");
    } catch { setError(true); }
    finally { setLoading(false); }
  };

  /** Saves explicitly selected days; no implicit working-day default is introduced. */
  const saveDays = async () => {
    if (!days.length || loading || error) return;
    setSaving(true);
    const { success } = await apiHandler(() => calendar.saveWorkingDays(days, institutionId), { showMessage, successMessage: "Working days saved." });
    if (success) setConfigured(true);
    setSaving(false);
  };

  /** Refreshes only closure records, preserving any unsaved working-day selection. */
  const saveClosure = async (mutation: () => Promise<unknown>) => {
    try {
      await mutation();
      setClosures((await calendar.getClosures(institutionId)).data.data);
      showMessage("Calendar updated.", "success");
      return true;
    } catch { showMessage("Calendar could not be updated. Reload to check its current state before retrying.", "error"); return false; }
  };

  /** The existing institution timezone write is restricted to the platform administrator. */
  const saveTimezone = async () => {
    if (!institutionId || !timezone.trim()) return;
    setSaving(true);
    await apiHandler(() => platformService.updateInstitution(institutionId, { timezone: timezone.trim() }), { showMessage, successMessage: "Institution timezone saved." });
    setSaving(false);
  };

  if (!can("read")) return null;
  return <>
    <Button onClick={() => void load()} sx={{ mb: 2 }}>Attendance calendar settings</Button>
    <Dialog open={open} onClose={() => { if (!saving) setOpen(false); }} fullWidth maxWidth="md">
      <DialogTitle>Attendance calendar</DialogTitle>
      <DialogContent>
        {loading && <Typography role="status">Loading calendar…</Typography>}
        {error && <Alert severity="error" action={<Button onClick={() => void load()}>Retry</Button>}>Calendar could not be loaded.</Alert>}
        {!loading && !error && <>
          {!configured && <Alert severity="warning">Working days are not configured. Automatic absences are paused until you save a calendar.</Alert>}
          <Box component="fieldset" disabled={!can("update") || saving} sx={{ border: 0, p: 0, my: 2 }}>
            <Typography component="legend">Working days</Typography>
            {WORKING_DAYS.map((day) => <FormControlLabel key={day} label={day} control={<Checkbox checked={days.includes(day)} onChange={(_, checked) => setDays((previous) => checked ? [...previous, day] : previous.filter((entry) => entry !== day))} />} />)}
            {can("update") && <Button disabled={!days.length || saving} onClick={() => void saveDays()}>Save working days</Button>}
          </Box>
          {institutionId && <Box sx={{ display: "flex", gap: 2, my: 2 }}>
            <TextField label="Institution timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} helperText="IANA zone, for example Asia/Karachi. Campuses may override this." disabled={saving} />
            <Button disabled={saving || !timezone.trim()} onClick={() => void saveTimezone()}>Save timezone</Button>
          </Box>}
          {campuses.length > 0 && <Box sx={{ my: 2 }} data-testid="applicable-timezones">
            <Typography variant="subtitle2">Applicable timezones</Typography>
            {campuses.map((campus) => <Typography key={campus.id} variant="body2">
              {campus.name}: {campus.timezone ?? campus.institution?.timezone ?? "institution default"}{campus.timezone ? " (campus override)" : ""}
            </Typography>)}
            <Typography variant="caption" color="text.secondary">Working days and closures are evaluated in these zones. Edit a campus override under Campuses.</Typography>
          </Box>}
          <ResourceSection title="Closure dates" singular="Closure date" rows={closures} loading={false}
            columns={[{ key: "date", label: "Date", render: (row) => row.date.slice(0, 10) }, { key: "label", label: "Label" }, { key: "campusId", label: "Campus", render: (row) => campuses.find((campus) => campus.id === row.campusId)?.name ?? (row.campusId ? "Campus" : "All campuses") }]}
            fields={[{ key: "date", label: "Closure date", type: "date", required: true }, { key: "label", label: "Closure label", required: true }, { key: "campusId", label: "Campus", type: "select", options: [{ value: "", label: "All campuses" }, ...campuses.map((campus) => ({ value: campus.id, label: campus.name }))] }]}
            onCreate={can("create") ? (payload) => saveClosure(() => calendar.createClosure(payload, institutionId)) : undefined}
            onUpdate={can("update") ? (id, payload) => saveClosure(() => calendar.updateClosure(id, { ...payload, campusId: payload.campusId ?? null }, institutionId)) : undefined}
            onDelete={can("delete") ? (id) => saveClosure(() => calendar.deleteClosure(id, institutionId)) : undefined} />
        </>}
      </DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setOpen(false)}>Close</Button></DialogActions>
    </Dialog>
  </>;
}
