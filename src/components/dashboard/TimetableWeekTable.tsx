"use client";

import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { formatClockRange, formatDate } from "@/lib/dateFormat";
import { buildGrid, cellLines, DAY_NAMES, type TimetableGroup, type Weekday } from "@/lib/timetableDocuments";

interface TimetableWeekTableProps {
  group: TimetableGroup;
  /** Show one day's column only. */
  onlyDay?: Weekday;
}

/**
 * One timetable as a table: a column per day with its date, a row per time
 * slot. A period taken by a substitute on that date says so.
 */
export default function TimetableWeekTable({ group, onlyDay }: TimetableWeekTableProps) {
  const grid = buildGrid(group.entries, onlyDay);
  const forTeacher = group.kind === "TEACHER";

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" aria-label={`Timetable for ${group.title}`} sx={{ minWidth: 640, "& td, & th": { border: "1px solid", borderColor: "divider" } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: "12%" }}>Period</TableCell>
            {grid.days.map((day) => (
              <TableCell key={day} align="center" sx={{ fontWeight: 700 }}>
                {DAY_NAMES[day]}
                {grid.dates.has(day) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {formatDate(grid.dates.get(day) as string)}
                  </Typography>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {grid.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={grid.days.length + 1} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">There are no periods in this timetable yet.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            grid.rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {row.label}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {formatClockRange(row.startTime, row.endTime)}
                  </Typography>
                </TableCell>
                {grid.days.map((day) => (
                  <TableCell key={day} align="center" sx={{ verticalAlign: "top" }}>
                    {(row.cells.get(day) ?? []).map((entry) => {
                      const lines = cellLines(entry, forTeacher);
                      return (
                        <Box key={entry.id} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{lines[0]}</Typography>
                          {lines.slice(1).map((line) => (
                            <Typography key={line} variant="caption" color="text.secondary" sx={{ display: "block" }}>{line}</Typography>
                          ))}
                          {(entry.isCovered || entry.isCoverDuty) && (
                            <Chip size="small" color="warning" label={entry.isCoverDuty ? "Cover duty" : "Cover"} sx={{ mt: 0.5, height: 18, fontSize: 11 }} />
                          )}
                        </Box>
                      );
                    })}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
