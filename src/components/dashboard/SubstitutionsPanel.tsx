"use client";

import { useCallback, useEffect, useState } from "react";
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
import Add from "@mui/icons-material/Add";
import Close from "@mui/icons-material/Close";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { addDays, DAY_NAMES, shortDate, todayString, weekdayOf, type Weekday } from "@/lib/timetableDocuments";
import { timetableService } from "@/services/timetable.service";

/** How far ahead the panel looks for arranged cover. */
const LOOK_AHEAD_DAYS = 28;

interface SlotLike {
  id: string;
  name: string;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
  staffProfileId?: string | null;
}

interface Substitution {
  id: string;
  date: string;
  reason: string | null;
  substituteName: string;
  originalName: string | null;
  periodName: string;
  subjectName: string | null;
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
}

interface SubstitutionsPanelProps {
  campusId: string;
  sectionId: string;
  weekSlots: SlotLike[];
  teachers: { id: string }[];
  teacherName: (teacherId: string) => string;
  canManage: boolean;
}

/**
 * Cover for one section: who is taking which period on which date, and a way
 * to arrange or cancel it. Cover is for a single date only; the weekly
 * template is not changed.
 */
export default function SubstitutionsPanel({ campusId, sectionId, weekSlots, teachers, teacherName, canManage }: SubstitutionsPanelProps) {
  const { showMessage } = useMessage();
  const [items, setItems] = useState<Substitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periodSlotId, setPeriodSlotId] = useState("");
  const [date, setDate] = useState("");
  const [substituteId, setSubstituteId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<Substitution | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = todayString();
    const { data } = await apiHandler<Substitution[]>(
      () => timetableService.getSubstitutions({ campusId, sectionId, from, to: addDays(from, LOOK_AHEAD_DAYS) }),
      { showMessage, silent: true }
    );
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [campusId, sectionId, showMessage]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const slot = weekSlots.find((s) => s.id === periodSlotId);
  const dateMismatch = Boolean(slot && date && weekdayOf(date) !== slot.dayOfWeek);
  const substitutes = teachers.filter((t) => t.id !== slot?.staffProfileId);
  const valid = Boolean(periodSlotId && date && substituteId && !dateMismatch);

  const openCreate = () => {
    setPeriodSlotId("");
    setDate("");
    setSubstituteId("");
    setReason("");
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        timetableService.createSubstitution({
          periodSlotId,
          date,
          substituteStaffProfileId: substituteId,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      { showMessage, successMessage: "Cover arranged." }
    );
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      void load();
    }
  };

  const cancel = async () => {
    if (!confirmCancel) return;
    const { success } = await apiHandler(() => timetableService.cancelSubstitution(confirmCancel.id), {
      showMessage,
      successMessage: "Cover cancelled.",
    });
    setConfirmCancel(null);
    if (success) void load();
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Cover</Typography>
            <Typography variant="body2" color="text.secondary">
              A substitute taking one period on one date, over the next four weeks. The weekly template does not change.
            </Typography>
          </Box>
          {canManage && (
            <Button variant="outlined" startIcon={<Add />} onClick={openCreate} disabled={weekSlots.length === 0}>
              Arrange Cover
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={24} /></Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>No cover is arranged for this section.</Typography>
        ) : (
          <Table size="small" aria-label="Arranged cover">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Usual teacher</TableCell>
                <TableCell>Covered by</TableCell>
                <TableCell>Reason</TableCell>
                {canManage && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{DAY_NAMES[item.dayOfWeek]} {shortDate(item.date)}</TableCell>
                  <TableCell>{item.subjectName ?? item.periodName} ({item.startTime}–{item.endTime})</TableCell>
                  <TableCell>{item.originalName ?? "—"}</TableCell>
                  <TableCell>{item.substituteName}</TableCell>
                  <TableCell>{item.reason ?? "—"}</TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <Tooltip title="Cancel cover">
                        <IconButton size="small" aria-label={`Cancel cover on ${shortDate(item.date)}`} onClick={() => setConfirmCancel(item)}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel Cover"
        message={confirmCancel ? `The period on ${shortDate(confirmCancel.date)} goes back to ${confirmCancel.originalName ?? "its usual teacher"}.` : ""}
        confirmLabel="Cancel Cover"
        confirmColor="error"
        onConfirm={cancel}
        onCancel={() => setConfirmCancel(null)}
      />

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Arrange Cover</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Period *" value={periodSlotId} onChange={(e) => setPeriodSlotId(e.target.value)} fullWidth>
                {weekSlots.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {DAY_NAMES[s.dayOfWeek]} · {s.name} ({s.startTime}–{s.endTime})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Date *"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
                error={dateMismatch}
                helperText={dateMismatch && slot ? `That date is not a ${DAY_NAMES[slot.dayOfWeek]}.` : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Covered by *" value={substituteId} onChange={(e) => setSubstituteId(e.target.value)} fullWidth>
                {substitutes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{teacherName(t.id)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !valid}>
            {saving ? <CircularProgress size={16} color="inherit" /> : "Arrange"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
