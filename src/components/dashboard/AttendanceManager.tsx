"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccessTime,
  ArrowBack,
  Checklist,
  Edit,
  FactCheck,
  Login,
  Logout,
  MoreTime,
  Search,
} from "@mui/icons-material";
import CampusRequiredNotice from "@/components/dashboard/CampusRequiredNotice";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { fetchAllUsers, UserLite } from "@/lib/users";
import { attendanceService } from "@/services/attendance.service";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { peopleService } from "@/services/people.service";

interface AttendanceRecord {
  id: string;
  userId: string;
  role: string;
  campusId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  halfDay?: boolean;
  remarks?: string | null;
}

interface Campus {
  id: string;
  name: string;
  institutionId?: string;
}

interface StudentItem {
  id: string;
  userId: string;
  campusId: string;
  regNo?: string;
  classId?: string | null;
  sectionId?: string | null;
}

interface TeacherItem {
  id: string;
  userId: string;
  campusId: string;
}

interface CampusUserItem {
  userId: string;
  user?: { id: string; name: string; email: string; role: string };
}

interface NamedItem {
  id: string;
  name: string;
  classId?: string;
}

interface RosterRow {
  userId: string;
  name: string;
  meta: string;
  role: string;
}

interface BulkResult {
  marked: number;
  skipped: Array<{ userId: string; reason: string }>;
}

interface AttendanceManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

const STATUS_COLORS: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
  PRESENT: "success",
  ABSENT: "error",
  LATE: "warning",
  LEAVE: "info",
};

const MARK_ACTIONS: Array<{ status: string; label: string; short: string; color: "success" | "error" | "warning" | "info" }> = [
  { status: "PRESENT", label: "Present", short: "P", color: "success" },
  { status: "ABSENT", label: "Absent", short: "A", color: "error" },
  { status: "LATE", label: "Late", short: "L", color: "warning" },
  { status: "LEAVE", label: "Leave", short: "Lv", color: "info" },
];

const STAFF_ROLES = ["TEACHER", "ADMIN", "ACCOUNTANT"];

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

const formatTime = (value?: string | null) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function AttendanceManager({ institutionId }: AttendanceManagerProps) {
  const { user: authUser } = useAuth();
  const confirm = useConfirm();
  const { showMessage } = useMessage();
  const runtime = useOptionalRuntimeConfig();
  // Platform console (institutionId set) is superadmin — always full access.
  const canManage = institutionId ? true : (runtime?.can("ATTENDANCE", "manage") ?? true);

  // ---- hub navigation ----
  const [activeView, setActiveView] = useState<"register" | "timeclock" | null>(null);

  // ---- shared state ----
  const [date, setDate] = useState(today());
  const [campusId, setCampusId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(true);

  // ---- register state ----
  const [mode, setMode] = useState<"students" | "staff">("students");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchRemarks, setBatchRemarks] = useState("");
  const [marking, setMarking] = useState(false);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [campusUsers, setCampusUsers] = useState<CampusUserItem[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [classes, setClasses] = useState<NamedItem[]>([]);
  const [sections, setSections] = useState<NamedItem[]>([]);

  // ---- time clock state ----
  const [punchOpen, setPunchOpen] = useState(false);
  const [punchForm, setPunchForm] = useState({ userId: "", inTime: "", outTime: "" });
  const [punchSaving, setPunchSaving] = useState(false);

  // ---- correction dialog ----
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    status: "",
    halfDay: "",
    remarks: "",
    checkInTime: "",
    checkOutTime: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // ---- personal mode ----
  const [selfSaving, setSelfSaving] = useState<"in" | "out" | null>(null);

  const userMap = useMemo(
    () => users.reduce<Record<string, UserLite>>((acc, u) => ((acc[u.id] = u), acc), {}),
    [users]
  );
  const classMap = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [classes]
  );
  const sectionMap = useMemo(
    () => sections.reduce<Record<string, string>>((acc, s) => ((acc[s.id] = s.name), acc), {}),
    [sections]
  );
  const recordByUser = useMemo(
    () => records.reduce<Record<string, AttendanceRecord>>((acc, r) => ((acc[r.userId] = r), acc), {}),
    [records]
  );

  // ---- static loads ----
  useEffect(() => {
    const loadStatic = async () => {
      // Personal mode needs no reference data — the backend self-scopes records
      // and the campuses endpoint sits behind the academics permission anyway.
      if (!canManage) {
        setStaticLoading(false);
        return;
      }

      const { data } = await apiHandler<{ items: Campus[] }>(
        () => campusesService.getAll({ limit: 100 }),
        { showMessage, silent: true }
      );
      const allCampuses = data?.items ?? [];
      const scoped = institutionId
        ? allCampuses.filter((c) => c.institutionId === institutionId)
        : allCampuses;
      setCampuses(scoped);
      setCampusId((prev) => prev || (scoped[0]?.id ?? ""));

      if (canManage) {
        const [studentsRes, teachersRes, classesRes, sectionsRes] = await Promise.all([
          apiHandler<StudentItem[]>(() => peopleService.getStudents(), { showMessage, silent: true }),
          apiHandler<TeacherItem[]>(() => peopleService.getTeachers(), { showMessage, silent: true }),
          apiHandler<NamedItem[]>(() => academicsService.getClasses(), { showMessage, silent: true }),
          apiHandler<NamedItem[]>(() => academicsService.getSections(), { showMessage, silent: true }),
        ]);
        const campusIds = new Set(scoped.map((c) => c.id));
        setStudents((studentsRes.data ?? []).filter((s) => campusIds.has(s.campusId)));
        setTeachers((teachersRes.data ?? []).filter((t) => campusIds.has(t.campusId)));
        setClasses(classesRes.data ?? []);
        setSections(sectionsRes.data ?? []);
        try {
          const allUsers = await fetchAllUsers();
          setUsers(institutionId ? allUsers.filter((u) => u.institutionId === institutionId) : allUsers);
        } catch {
          setUsers([]);
        }
      }
      setStaticLoading(false);
    };
    loadStatic();
  }, [showMessage, institutionId, canManage]);

  // Admin/accountant campus membership comes from UserCampus assignments.
  useEffect(() => {
    if (!canManage || !campusId) return;
    apiHandler<CampusUserItem[]>(
      () => campusesService.getCampusUsers(campusId),
      { showMessage, silent: true }
    ).then(({ data }) => setCampusUsers(Array.isArray(data) ? data : []));
  }, [canManage, campusId, showMessage]);

  // ---- records for the selected date ----
  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    const params: Record<string, string> = canManage
      ? { ...(campusId && { campusId }), date }
      : { date };
    const { data } = await apiHandler<AttendanceRecord[]>(
      () => attendanceService.getAll(params),
      { showMessage, silent: true }
    );
    setRecords(Array.isArray(data) ? data : []);
    setRecordsLoading(false);
  }, [canManage, campusId, date, showMessage]);

  useEffect(() => {
    if (canManage && !campusId) return;
    loadRecords();
  }, [loadRecords, canManage, campusId]);

  // ---- rosters ----
  const studentRoster: RosterRow[] = useMemo(
    () =>
      students
        .filter((s) => s.campusId === campusId)
        .map((s) => ({
          userId: s.userId,
          name: userMap[s.userId]?.name ?? s.regNo ?? "Student",
          meta: [
            s.regNo,
            s.classId ? classMap[s.classId] : null,
            s.sectionId ? sectionMap[s.sectionId] : null,
          ]
            .filter(Boolean)
            .join(" · "),
          role: "STUDENT",
        })),
    [students, campusId, userMap, classMap, sectionMap]
  );

  const staffRoster: RosterRow[] = useMemo(() => {
    const staff = new Map<string, RosterRow>();
    for (const teacher of teachers) {
      if (teacher.campusId !== campusId) continue;
      staff.set(teacher.userId, {
        userId: teacher.userId,
        name: userMap[teacher.userId]?.name ?? userMap[teacher.userId]?.email ?? "Teacher",
        meta: "Teacher",
        role: "TEACHER",
      });
    }
    for (const cu of campusUsers) {
      const role = cu.user?.role;
      if (role !== "ADMIN" && role !== "ACCOUNTANT") continue;
      staff.set(cu.userId, {
        userId: cu.userId,
        name: cu.user?.name ?? userMap[cu.userId]?.name ?? "Staff",
        meta: role === "ADMIN" ? "Admin" : "Accountant",
        role,
      });
    }
    return [...staff.values()];
  }, [teachers, campusUsers, campusId, userMap]);

  const combinedRoster: RosterRow[] = useMemo(
    () => [...staffRoster, ...studentRoster],
    [staffRoster, studentRoster]
  );

  const registerRoster: RosterRow[] = useMemo(() => {
    if (mode === "students") {
      return studentRoster.filter((row) => {
        const student = students.find((s) => s.userId === row.userId);
        if (classFilter && student?.classId !== classFilter) return false;
        if (sectionFilter && student?.sectionId !== sectionFilter) return false;
        return true;
      });
    }
    return staffRoster.filter((row) => !roleFilter || row.role === roleFilter);
  }, [mode, studentRoster, staffRoster, students, classFilter, sectionFilter, roleFilter]);

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return registerRoster;
    return registerRoster.filter((row) =>
      `${row.name} ${row.meta}`.toLowerCase().includes(query)
    );
  }, [registerRoster, search]);

  const summary = useMemo(() => {
    const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, UNMARKED: 0 };
    for (const row of registerRoster) {
      const record = recordByUser[row.userId];
      if (!record) counts.UNMARKED += 1;
      else counts[record.status as keyof typeof counts] = (counts[record.status as keyof typeof counts] ?? 0) + 1;
    }
    return counts;
  }, [registerRoster, recordByUser]);

  // Punch log for the day (records with actual times). Guardians are not
  // attendance subjects — legacy guardian rows are hidden here.
  const punchRecords = useMemo(
    () =>
      records
        .filter((r) => (r.checkIn || r.checkOut) && r.role !== "GUARDIAN")
        .sort((a, b) => (b.checkIn ?? "").localeCompare(a.checkIn ?? "")),
    [records]
  );

  const nameOf = useCallback(
    (userId: string) =>
      combinedRoster.find((row) => row.userId === userId)?.name ??
      userMap[userId]?.name ??
      "—",
    [combinedRoster, userMap]
  );

  // ---- selection ----
  const visibleIds = filteredRoster.map((row) => row.userId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectUnmarked = () => {
    setSelected(new Set(filteredRoster.filter((row) => !recordByUser[row.userId]).map((row) => row.userId)));
  };

  // ---- marking ----
  const mark = async (userIds: string[], status: string, remarks?: string) => {
    if (userIds.length === 0 || !campusId) return;

    const overwriting = userIds.filter((id) => {
      const record = recordByUser[id];
      return record && record.status !== status;
    });
    if (status === "ABSENT" && overwriting.length > 0) {
      const ok = await confirm({
        title: "Overwrite Marked Records",
        message: `${overwriting.length} of the selected ${userIds.length} already have a status for ${formatDate(date)}. Mark them ABSENT anyway? Check-in/out times are kept.`,
        confirmLabel: "Mark Absent",
        confirmColor: "warning",
      });
      if (!ok) return;
    }

    setMarking(true);
    const { data, success } = await apiHandler<BulkResult>(
      () =>
        attendanceService.bulkMark({
          campusId,
          date,
          entries: userIds.map((userId) => ({
            userId,
            status,
            ...(remarks ? { remarks } : {}),
          })),
        }),
      { showMessage, silent: true }
    );
    setMarking(false);

    if (success && data) {
      const skippedNote = data.skipped.length > 0 ? ` · ${data.skipped.length} skipped` : "";
      showMessage(`${data.marked} marked ${status.toLowerCase()}${skippedNote}.`, data.skipped.length > 0 ? "warning" : "success");
      setSelected(new Set());
      setBatchRemarks("");
      loadRecords();
    }
  };

  // ---- punches ----
  const submitPunch = async () => {
    if (!punchForm.userId || (!punchForm.inTime && !punchForm.outTime)) return;
    setPunchSaving(true);
    let ok = true;
    if (punchForm.inTime) {
      const { success } = await apiHandler(
        () =>
          attendanceService.checkIn({
            userId: punchForm.userId,
            date,
            checkIn: new Date(`${date}T${punchForm.inTime}`).toISOString(),
          }),
        { showMessage, silent: true }
      );
      ok = success;
    }
    if (punchForm.outTime) {
      const { success } = await apiHandler(
        () =>
          attendanceService.checkOut({
            userId: punchForm.userId,
            date,
            checkOut: new Date(`${date}T${punchForm.outTime}`).toISOString(),
          }),
        { showMessage, silent: true }
      );
      ok = ok && success;
    }
    setPunchSaving(false);
    if (ok) {
      showMessage("Punch recorded — status computed from campus hours.", "success");
      setPunchOpen(false);
      setPunchForm({ userId: "", inTime: "", outTime: "" });
      loadRecords();
    }
  };

  const punchOutNow = async (record: AttendanceRecord) => {
    await apiHandler(
      () =>
        attendanceService.checkOut({
          userId: record.userId,
          date,
          checkOut: new Date(`${date}T${nowTime()}`).toISOString(),
        }),
      { showMessage, successMessage: "Checked out." }
    );
    loadRecords();
  };

  const handleSelfPunch = async (kind: "in" | "out") => {
    if (!authUser) return;
    setSelfSaving(kind);
    const timestamp = new Date(`${today()}T${nowTime()}`).toISOString();
    if (kind === "in") {
      await apiHandler(
        () => attendanceService.checkIn({ userId: authUser.id, date: today(), checkIn: timestamp }),
        { showMessage, successMessage: "Checked in." }
      );
    } else {
      await apiHandler(
        () => attendanceService.checkOut({ userId: authUser.id, date: today(), checkOut: timestamp }),
        { showMessage, successMessage: "Checked out." }
      );
    }
    setSelfSaving(null);
    loadRecords();
  };

  // ---- corrections ----
  const toLocalTime = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const openEdit = (record: AttendanceRecord) => {
    setEditing(record);
    setEditForm({
      status: record.status,
      halfDay: record.halfDay ? "true" : "false",
      remarks: record.remarks ?? "",
      checkInTime: toLocalTime(record.checkIn),
      checkOutTime: toLocalTime(record.checkOut),
    });
  };

  const handleEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    const day = editing.date.slice(0, 10);
    const originalIn = toLocalTime(editing.checkIn);
    const originalOut = toLocalTime(editing.checkOut);

    await apiHandler(
      () =>
        attendanceService.update(editing.id, {
          status: editForm.status,
          halfDay: editForm.halfDay === "true",
          ...(editForm.remarks && { remarks: editForm.remarks }),
          // Only send times the admin actually changed — a changed check-out
          // makes the backend recompute half-day from campus thresholds.
          ...(editForm.checkInTime && editForm.checkInTime !== originalIn
            ? { checkIn: new Date(`${day}T${editForm.checkInTime}`).toISOString() }
            : {}),
          ...(editForm.checkOutTime && editForm.checkOutTime !== originalOut
            ? { checkOut: new Date(`${day}T${editForm.checkOutTime}`).toISOString() }
            : {}),
        }),
      { showMessage, successMessage: "Attendance updated." }
    );
    setEditSaving(false);
    setEditing(null);
    loadRecords();
  };

  // ============================== RENDER ==============================

  if (!staticLoading && canManage && campuses.length === 0) {
    return (
      <CampusRequiredNotice
        moduleLabel="attendance"
        ctaHref={institutionId ? undefined : "/dashboard/campuses"}
      />
    );
  }

  // ---------- personal mode ----------
  if (!canManage) {
    const myRecords = records
      .filter((r) => r.userId === authUser?.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const canPunch = authUser?.role !== "GUARDIAN";

    return (
      <>
        {canPunch && (
          <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={selfSaving === "in" ? <CircularProgress size={16} color="inherit" /> : <Login />}
              disabled={selfSaving !== null}
              onClick={() => handleSelfPunch("in")}
            >
              Check In Now
            </Button>
            <Button
              variant="outlined"
              startIcon={selfSaving === "out" ? <CircularProgress size={16} color="inherit" /> : <Logout />}
              disabled={selfSaving !== null}
              onClick={() => handleSelfPunch("out")}
            >
              Check Out Now
            </Button>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            size="small" type="date" label="Date" value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 170 }}
          />
        </Box>

        {recordsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : myRecords.length === 0 ? (
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">No attendance record for this date.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{formatTime(record.checkIn)}</TableCell>
                    <TableCell>{formatTime(record.checkOut)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.halfDay ? `${record.status} · HALF` : record.status}
                        size="small"
                        color={STATUS_COLORS[record.status] ?? "default"}
                      />
                    </TableCell>
                    <TableCell>{record.remarks ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </>
    );
  }

  // ---------- HUB ----------
  if (!activeView) {
    const markedToday = records.length;
    const punchedToday = punchRecords.length;
    const hubCards = [
      {
        key: "register" as const,
        label: "Daily Register",
        description: "Roll-call marking: pick a class or staff group and set Present / Absent / Late / Leave in bulk.",
        icon: <FactCheck />,
        chip: recordsLoading ? null : `${markedToday} marked today`,
      },
      {
        key: "timeclock" as const,
        label: "Time Clock",
        description: "Check-in / check-out punches. Late and half-day are computed automatically from campus hours.",
        icon: <AccessTime />,
        chip: recordsLoading ? null : `${punchedToday} punches today`,
      },
    ];

    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Two ways to record attendance: <strong>Register</strong> for roll-call status marking,{" "}
          <strong>Time Clock</strong> for real check-in/out times. They share the same records.
        </Typography>
        <Grid container spacing={2}>
          {hubCards.map((card) => (
            <Grid key={card.key} size={{ xs: 12, sm: 6 }}>
              <Card
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
                }}
              >
                <CardActionArea onClick={() => setActiveView(card.key)} sx={{ height: "100%", alignItems: "stretch" }}>
                  <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          backgroundColor: "action.hover",
                          color: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {card.icon}
                      </Box>
                      {card.chip === null ? (
                        <Skeleton width={90} height={24} />
                      ) : (
                        <Chip label={card.chip} size="small" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{card.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  }

  const backButton = (
    <Button
      startIcon={<ArrowBack />}
      color="inherit"
      onClick={() => { setActiveView(null); setSelected(new Set()); }}
      sx={{ mb: 2, color: "text.secondary" }}
    >
      Attendance
    </Button>
  );

  // ---------- TIME CLOCK ----------
  if (activeView === "timeclock") {
    return (
      <>
        {backButton}

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small" type="date" label="Date" value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 170 }}
          />
          <TextField
            select size="small" label="Campus" value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <Box sx={{ flex: 1 }} />
          {/* Superadmins have no campus membership — no self punch in platform scope. */}
          {!institutionId && (
            <>
              <Button
                variant="contained"
                startIcon={selfSaving === "in" ? <CircularProgress size={16} color="inherit" /> : <Login />}
                disabled={selfSaving !== null}
                onClick={() => handleSelfPunch("in")}
              >
                My Check-In
              </Button>
              <Button
                variant="outlined"
                startIcon={selfSaving === "out" ? <CircularProgress size={16} color="inherit" /> : <Logout />}
                disabled={selfSaving !== null}
                onClick={() => handleSelfPunch("out")}
              >
                My Check-Out
              </Button>
            </>
          )}
          <Button variant="outlined" startIcon={<MoreTime />} onClick={() => setPunchOpen(true)}>
            Record Punch
          </Button>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 2 }}>
          Late is decided automatically against campus start time + threshold; half-day against end time − threshold.
        </Typography>

        {recordsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : punchRecords.length === 0 ? (
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No punches recorded for {formatDate(date)}.
              </Typography>
              <Button variant="contained" startIcon={<MoreTime />} onClick={() => setPunchOpen(true)}>
                Record First Punch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {punchRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{nameOf(record.userId)}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{record.role}</Typography>
                    </TableCell>
                    <TableCell>{formatTime(record.checkIn)}</TableCell>
                    <TableCell>{formatTime(record.checkOut)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.halfDay ? `${record.status} · HALF` : record.status}
                        size="small"
                        color={STATUS_COLORS[record.status] ?? "default"}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {record.remarks ?? "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {record.checkIn && !record.checkOut && (
                        <Tooltip title="Check out now">
                          <IconButton size="small" onClick={() => punchOutNow(record)}>
                            <Logout fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Correct times / status">
                        <IconButton size="small" onClick={() => openEdit(record)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Record punch dialog */}
        <Dialog open={punchOpen} onClose={punchSaving ? undefined : () => setPunchOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Record Punch — {formatDate(date)}</DialogTitle>
          <DialogContent sx={{ pt: "16px !important" }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={combinedRoster}
                  getOptionLabel={(row) => `${row.name}${row.meta ? ` (${row.meta})` : ""}`}
                  value={combinedRoster.find((row) => row.userId === punchForm.userId) ?? null}
                  onChange={(_, value) => setPunchForm((p) => ({ ...p, userId: value?.userId ?? "" }))}
                  noOptionsText="No one found in this campus."
                  renderInput={(params) => <TextField {...params} label="Person *" />}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="time" label="Check-In" value={punchForm.inTime}
                  onChange={(e) => setPunchForm((p) => ({ ...p, inTime: e.target.value }))}
                  fullWidth slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Late auto-computed."
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="time" label="Check-Out" value={punchForm.outTime}
                  onChange={(e) => setPunchForm((p) => ({ ...p, outTime: e.target.value }))}
                  fullWidth slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Half-day auto-computed."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setPunchOpen(false)} disabled={punchSaving}>Cancel</Button>
            <Button
              variant="contained"
              onClick={submitPunch}
              disabled={punchSaving || !punchForm.userId || (!punchForm.inTime && !punchForm.outTime)}
            >
              {punchSaving ? <CircularProgress size={16} color="inherit" /> : "Record"}
            </Button>
          </DialogActions>
        </Dialog>

        {renderEditDialog()}
      </>
    );
  }

  // ---------- DAILY REGISTER ----------
  return (
    <>
      {backButton}

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small" type="date" label="Date" value={date}
          onChange={(e) => { setDate(e.target.value); setSelected(new Set()); }}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 170 }}
        />
        <TextField
          select size="small" label="Campus" value={campusId}
          onChange={(e) => { setCampusId(e.target.value); setSelected(new Set()); setClassFilter(""); setSectionFilter(""); }}
          sx={{ minWidth: 180 }}
        >
          {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, value) => {
            if (value) {
              setMode(value);
              setSelected(new Set());
              setSearch("");
            }
          }}
        >
          <ToggleButton value="students">Students</ToggleButton>
          <ToggleButton value="staff">Staff</ToggleButton>
        </ToggleButtonGroup>

        {mode === "students" ? (
          <>
            <TextField select size="small" label="Class" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(""); }} sx={{ minWidth: 140 }}>
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} sx={{ minWidth: 140 }} disabled={!classFilter}>
              <MenuItem value="">All Sections</MenuItem>
              {sections.filter((s) => s.classId === classFilter).map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </>
        ) : (
          <TextField select size="small" label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="">All Staff</MenuItem>
            {STAFF_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
        )}

        <TextField
          size="small"
          placeholder="Search name or reg no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            },
          }}
        />
      </Box>

      {/* Summary */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Chip label={`Present ${summary.PRESENT}`} color="success" size="small" variant={summary.PRESENT ? "filled" : "outlined"} />
        <Chip label={`Absent ${summary.ABSENT}`} color="error" size="small" variant={summary.ABSENT ? "filled" : "outlined"} />
        <Chip label={`Late ${summary.LATE}`} color="warning" size="small" variant={summary.LATE ? "filled" : "outlined"} />
        <Chip label={`Leave ${summary.LEAVE}`} color="info" size="small" variant={summary.LEAVE ? "filled" : "outlined"} />
        <Chip label={`Not marked ${summary.UNMARKED}`} size="small" variant="outlined" />
        {summary.UNMARKED > 0 && (
          <Button size="small" startIcon={<Checklist />} onClick={selectUnmarked}>
            Select unmarked
          </Button>
        )}
      </Box>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <Card sx={{ border: "1px solid", borderColor: "primary.main", mb: 2 }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 }, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {selected.size} selected — mark as:
            </Typography>
            {MARK_ACTIONS.map((action) => (
              <Button
                key={action.status}
                size="small"
                variant="contained"
                color={action.color}
                disabled={marking}
                onClick={() => mark([...selected], action.status, batchRemarks || undefined)}
              >
                {action.label}
              </Button>
            ))}
            <TextField
              size="small"
              placeholder="Remarks (optional)"
              value={batchRemarks}
              onChange={(e) => setBatchRemarks(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            {marking && <CircularProgress size={18} />}
            <Box sx={{ flex: 1 }} />
            <Button size="small" color="inherit" onClick={() => setSelected(new Set())} sx={{ color: "text.secondary" }}>
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Roster */}
      {staticLoading || recordsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : filteredRoster.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              {registerRoster.length === 0
                ? mode === "students"
                  ? "No students in this campus yet — add them under People."
                  : "No staff in this campus yet. Teachers appear automatically; assign admins/accountants to the campus under Campuses → Manage Users."
                : "No one matches your search or filters."}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && visibleIds.some((id) => selected.has(id))}
                    onChange={toggleAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{mode === "students" ? "Reg · Class" : "Role"}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>In</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Out</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Mark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoster.map((row) => {
                const record = recordByUser[row.userId];
                return (
                  <TableRow key={row.userId} hover selected={selected.has(row.userId)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selected.has(row.userId)}
                        onChange={() => toggleOne(row.userId)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{row.meta || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      {record ? (
                        <Chip
                          label={record.halfDay ? `${record.status} · HALF` : record.status}
                          size="small"
                          color={STATUS_COLORS[record.status] ?? "default"}
                        />
                      ) : (
                        <Chip label="Not marked" size="small" variant="outlined" sx={{ opacity: 0.6 }} />
                      )}
                    </TableCell>
                    <TableCell>{formatTime(record?.checkIn)}</TableCell>
                    <TableCell>{formatTime(record?.checkOut)}</TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {record?.remarks ?? "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {MARK_ACTIONS.map((action) => (
                        <Tooltip key={action.status} title={`Mark ${action.label}`}>
                          <span>
                            <Button
                              size="small"
                              color={action.color}
                              variant={record?.status === action.status ? "contained" : "text"}
                              disabled={marking}
                              onClick={() => mark([row.userId], action.status)}
                              sx={{ minWidth: 34, px: 0.5, fontWeight: 700 }}
                            >
                              {action.short}
                            </Button>
                          </span>
                        </Tooltip>
                      ))}
                      <Tooltip title={record ? "Correct times / remarks" : "No record yet — mark a status first"}>
                        <span>
                          <IconButton size="small" disabled={!record} onClick={() => record && openEdit(record)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {renderEditDialog()}
    </>
  );

  // ---- shared correction dialog ----
  function renderEditDialog() {
    return (
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Attendance
          {editing && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
              {nameOf(editing.userId)} · {formatDate(editing.date)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6 }}>
              <TextField select label="Status" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} fullWidth>
                {MARK_ACTIONS.map((action) => (
                  <MenuItem key={action.status} value={action.status}>{action.label.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField select label="Half Day" value={editForm.halfDay} onChange={(e) => setEditForm((p) => ({ ...p, halfDay: e.target.value }))} fullWidth>
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                type="time" label="Check-In Time" value={editForm.checkInTime}
                onChange={(e) => setEditForm((p) => ({ ...p, checkInTime: e.target.value }))}
                fullWidth slotProps={{ inputLabel: { shrink: true } }}
                helperText="For missed punches."
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                type="time" label="Check-Out Time" value={editForm.checkOutTime}
                onChange={(e) => setEditForm((p) => ({ ...p, checkOutTime: e.target.value }))}
                fullWidth slotProps={{ inputLabel: { shrink: true } }}
                helperText="Changing this recomputes half-day."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Remarks" value={editForm.remarks} onChange={(e) => setEditForm((p) => ({ ...p, remarks: e.target.value }))} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={editSaving}>
            {editSaving ? <CircularProgress size={16} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
