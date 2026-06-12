"use client";

import { Box, Container, Typography } from "@mui/material";
import CampusesManager from "@/components/dashboard/CampusesManager";

export default function CampusesPage() {
  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Campuses</Typography>
        <Typography variant="body2" color="text.secondary">
          Campuses, operating hours, attendance thresholds and user assignments.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <CampusesManager />
      </Container>
    </Box>
  );
}
