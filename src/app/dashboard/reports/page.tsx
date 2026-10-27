"use client";

import { Box, Container, Typography } from "@mui/material";
import ReportsManager from "@/components/dashboard/ReportsManager";
import ModuleGate from "@/components/dashboard/ModuleGate";

export default function ReportsPage() {
  return (
    <ModuleGate module="REPORTING">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Compare campuses, and see attendance and fees, with every report available as a spreadsheet or a PDF.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <ReportsManager />
        </Container>
      </Box>
    </ModuleGate>
  );
}
