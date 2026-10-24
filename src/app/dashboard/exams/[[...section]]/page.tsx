"use client";

import { Box, Container, Typography } from "@mui/material";
import ExaminationsManager from "@/components/dashboard/ExaminationsManager";
import { ModuleBase } from "@/lib/urlSection";
import ModuleGate from "@/components/dashboard/ModuleGate";

export default function ExamsPage() {
  return (
    <ModuleGate module="EXAMINATIONS">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Exams</Typography>
          <Typography variant="body2" color="text.secondary">
            Grading scales, exam terms and exams, including retakes.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <ModuleBase path="/dashboard/exams">
            <ExaminationsManager />
          </ModuleBase>
        </Container>
      </Box>
    </ModuleGate>
  );
}
