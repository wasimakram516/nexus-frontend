"use client";

import { Box, Container, Typography } from "@mui/material";
import AcademicsManager from "@/components/dashboard/AcademicsManager";
import ModuleGate from "@/components/dashboard/ModuleGate";

export default function AcademicsPage() {
  return (
    <ModuleGate module="ACADEMICS">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Academics</Typography>
          <Typography variant="body2" color="text.secondary">
            Structure your institution into levels, classes, sections and subjects.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <AcademicsManager />
        </Container>
      </Box>
    </ModuleGate>
  );
}
