"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
import TimetableWeekTable from "@/components/dashboard/TimetableWeekTable";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { shiftWeek, todayString, type TimetableGroup, type TimetableWeek } from "@/lib/timetableDocuments";
import { timetableService } from "@/services/timetable.service";

interface MySchedule {
  week: TimetableWeek;
  groups: TimetableGroup[];
}

/**
 * The signed-in person's own timetable, a week at a time: a student's, each
 * of a guardian's children's, or a teacher's. The server decides whose
 * timetables these are; this only shows them and moves between weeks.
 */
export default function MyTimetableManager() {
  const { showMessage } = useMessage();
  const [date, setDate] = useState(todayString());
  const [schedule, setSchedule] = useState<MySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(
    async (on: string) => {
      setLoading(true);
      const { data } = await apiHandler<MySchedule>(() => timetableService.getMySchedule(on), { showMessage, silent: true });
      setSchedule(data);
      setLoading(false);
    },
    [showMessage]
  );

  useEffect(() => {
    (async () => {
      await load(date);
    })();
  }, [date, load]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await timetableService.downloadMyPdf(date);
    } catch (error) {
      showMessage((error as Error).message || "The timetable could not be downloaded.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const groups = schedule?.groups ?? [];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Button aria-label="Previous week" startIcon={<ChevronLeft />} onClick={() => setDate((current) => shiftWeek(current, -1))}>
          Previous
        </Button>
        <Button onClick={() => setDate(todayString())}>This week</Button>
        <Button aria-label="Next week" endIcon={<ChevronRight />} onClick={() => setDate((current) => shiftWeek(current, 1))}>
          Next
        </Button>
        <Typography sx={{ flex: 1, fontWeight: 600 }}>
          {schedule ? `${formatDate(schedule.week.from)} to ${formatDate(schedule.week.to)}` : ""}
        </Typography>
        <Button
          variant="outlined"
          startIcon={downloading ? <CircularProgress size={16} /> : <PictureAsPdf />}
          onClick={downloadPdf}
          disabled={downloading || groups.length === 0}
        >
          Download PDF
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">There is no timetable to show yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{group.title}</Typography>
              {group.subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{group.subtitle}</Typography>
              )}
              <TimetableWeekTable group={group} />
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
