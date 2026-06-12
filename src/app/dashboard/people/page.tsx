"use client";

import { Box, Container, Typography } from "@mui/material";
import ModuleGate from "@/components/dashboard/ModuleGate";
import PeopleManager from "@/components/dashboard/PeopleManager";

export default function PeoplePage() {
  return (
    <ModuleGate module="PEOPLE">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>People</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage students, teachers and guardians across your campuses.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <PeopleManager />
        </Container>
      </Box>
    </ModuleGate>
  );
}
