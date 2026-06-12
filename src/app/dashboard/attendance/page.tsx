"use client";

import { Box, Container, Typography } from "@mui/material";
import AttendanceManager from "@/components/dashboard/AttendanceManager";
import ModuleGate from "@/components/dashboard/ModuleGate";

export default function AttendancePage() {
  return (
    <ModuleGate module="ATTENDANCE">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Attendance</Typography>
          <Typography variant="body2" color="text.secondary">
            Daily check-ins, check-outs and leave across your campuses.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <AttendanceManager />
        </Container>
      </Box>
    </ModuleGate>
  );
}
