"use client";

import { Box, Card, CardContent, CircularProgress, Container, Typography } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import MyTimetableManager from "@/components/dashboard/MyTimetableManager";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";

/**
 * Students, guardians and teachers see their own timetable here. They hold no
 * timetable permissions, so only the module being enabled gates the page; the
 * server returns only their own (or their wards') timetables.
 */
export default function MyTimetablePage() {
  const { isLoading, isModuleEnabled } = useRuntimeConfig();

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Timetable</Typography>
        <Typography variant="body2" color="text.secondary">
          Your week, with any cover arranged for it.
        </Typography>
      </Box>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : !isModuleEnabled("TIMETABLE") ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: "center" }}>
              <LockOutlined sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>The timetable is not available</Typography>
              <Typography variant="body2" color="text.secondary">
                Your institution has not turned on the timetable.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <MyTimetableManager />
        )}
      </Container>
    </Box>
  );
}
