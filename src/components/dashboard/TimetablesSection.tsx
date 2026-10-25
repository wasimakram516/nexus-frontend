"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
import TimetableWeekTable from "@/components/dashboard/TimetableWeekTable";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import {
  DAY_NAMES,
  shiftWeek,
  todayString,
  type TimetableGroup,
  type TimetableWeek,
  type Weekday,
} from "@/lib/timetableDocuments";
import { timetableService } from "@/services/timetable.service";

type ViewKind = "CAMPUS" | "CLASS" | "TEACHER";

const WEEKDAYS = Object.keys(DAY_NAMES) as Weekday[];

interface Named {
  id: string;
  name: string;
}

interface TimetablesSectionProps {
  campuses: Named[];
  levels: (Named & { campusId?: string })[];
  classes: (Named & { levelId?: string })[];
  teachers: { id: string; campusId: string }[];
  teacherName: (teacherId: string) => string;
}

/**
 * Read-only timetables for looking at the school in different ways: a whole
 * campus, one class with its sections side by side, or one teacher. Filters
 * narrow what is shown, and the PDF follows the chosen campus, class or teacher.
 */
export default function TimetablesSection({ campuses, levels, classes, teachers, teacherName }: TimetablesSectionProps) {
  const { showMessage } = useMessage();
  const [view, setView] = useState<ViewKind>("CAMPUS");
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? "");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(todayString());
  const [day, setDay] = useState<Weekday | "">("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [groups, setGroups] = useState<TimetableGroup[]>([]);
  const [week, setWeek] = useState<TimetableWeek | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const classesOfCampus = useMemo(
    () => classes.filter((item) => levels.find((level) => level.id === item.levelId)?.campusId === campusId),
    [classes, levels, campusId]
  );
  const teachersOfCampus = useMemo(() => teachers.filter((teacher) => teacher.campusId === campusId), [teachers, campusId]);

  /** What is being asked for, or null until the choice is complete. */
  const request = useMemo(() => {
    if (view === "CAMPUS" && campusId) return () => timetableService.getCampusSchedule(campusId, date);
    if (view === "CLASS" && classId) return () => timetableService.getClassSchedule(classId, date);
    if (view === "TEACHER" && teacherId) return () => timetableService.getTeacherSchedule(teacherId, date);
    return null;
  }, [view, campusId, classId, teacherId, date]);

  const load = useCallback(async () => {
    if (!request) {
      setGroups([]);
      setWeek(null);
      return;
    }
    setLoading(true);
    const { data } = await apiHandler<{ week: TimetableWeek; groups?: TimetableGroup[]; group?: TimetableGroup }>(request, {
      showMessage,
      silent: true,
    });
    setGroups(data ? (data.groups ?? (data.group ? [data.group] : [])) : []);
    setWeek(data?.week ?? null);
    setLoading(false);
  }, [request, showMessage]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const changeCampus = (id: string) => {
    setCampusId(id);
    setClassId("");
    setTeacherId("");
    setTeacherFilter("");
  };

  /** The filters are applied here, so changing one needs no new request. */
  const shown = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          entries: group.entries.filter((entry) => (!day || entry.dayOfWeek === day) && (!teacherFilter || entry.staffProfileId === teacherFilter)),
        }))
        .filter((group) => !teacherFilter || group.entries.length > 0),
    [groups, day, teacherFilter]
  );

  const download = async () => {
    setDownloading(true);
    try {
      if (view === "CAMPUS") await timetableService.downloadCampusPdf(campusId, date);
      else if (view === "CLASS") await timetableService.downloadClassPdf(classId, date);
      else await timetableService.downloadTeacherPdf(teacherId, date);
    } catch (error) {
      showMessage((error as Error).message || "The timetable could not be downloaded.", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Timetables</Typography>
        <Typography variant="body2" color="text.secondary">
          Look at the school&apos;s timetable as a whole campus, one class or one teacher, a week at a time, with cover applied.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField select size="small" label="View" value={view} onChange={(e) => setView(e.target.value as ViewKind)} sx={{ minWidth: 170 }}>
          <MenuItem value="CAMPUS">Whole campus</MenuItem>
          <MenuItem value="CLASS">A class</MenuItem>
          <MenuItem value="TEACHER">A teacher</MenuItem>
        </TextField>
        <TextField select size="small" label="Campus" value={campusId} onChange={(e) => changeCampus(e.target.value)} sx={{ minWidth: 200 }}>
          {campuses.map((campus) => (
            <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
          ))}
        </TextField>
        {view === "CLASS" && (
          <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 200 }}>
            {classesOfCampus.map((item) => (
              <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
            ))}
          </TextField>
        )}
        {view === "TEACHER" && (
          <TextField select size="small" label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} sx={{ minWidth: 220 }}>
            {teachersOfCampus.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>{teacherName(teacher.id)}</MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <Button aria-label="Previous week" startIcon={<ChevronLeft />} onClick={() => setDate((current) => shiftWeek(current, -1))}>Previous</Button>
        <Button onClick={() => setDate(todayString())}>This week</Button>
        <Button aria-label="Next week" endIcon={<ChevronRight />} onClick={() => setDate((current) => shiftWeek(current, 1))}>Next</Button>
        <Typography sx={{ fontWeight: 600 }}>{week ? `${formatDate(week.from)} to ${formatDate(week.to)}` : ""}</Typography>
        <Box sx={{ flex: 1 }} />
        <TextField select size="small" label="Day" value={day} onChange={(e) => setDay(e.target.value as Weekday | "")} sx={{ minWidth: 140 }}>
          <MenuItem value="">All days</MenuItem>
          {WEEKDAYS.map((weekday) => (
            <MenuItem key={weekday} value={weekday}>{DAY_NAMES[weekday]}</MenuItem>
          ))}
        </TextField>
        {view !== "TEACHER" && (
          <TextField select size="small" label="Only periods of" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">Every teacher</MenuItem>
            {teachersOfCampus.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>{teacherName(teacher.id)}</MenuItem>
            ))}
          </TextField>
        )}
        <Button
          variant="outlined"
          startIcon={downloading ? <CircularProgress size={16} /> : <PictureAsPdf />}
          onClick={download}
          disabled={!request || downloading || groups.length === 0}
        >
          Download PDF
        </Button>
      </Box>

      {!request ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              {view === "CLASS" ? "Pick a class to see its sections." : "Pick a teacher to see their week."}
            </Typography>
          </CardContent>
        </Card>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">There are no periods to show.</Typography>
          </CardContent>
        </Card>
      ) : (
        shown.map((group) => (
          <Card key={`${group.kind}-${group.id}`} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{group.title}</Typography>
              <TimetableWeekTable group={group} onlyDay={day || undefined} />
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
