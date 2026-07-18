"use client";

import { Box, Container, Typography } from "@mui/material";
import RolesManager from "@/components/dashboard/RolesManager";

export default function RolesPage() {
  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Roles</Typography>
        <Typography variant="body2" color="text.secondary">
          Custom roles define what staff, students, and guardians can create, read, update, or delete.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <RolesManager />
      </Container>
    </Box>
  );
}
