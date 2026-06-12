"use client";

import { Box, Container, Typography } from "@mui/material";
import UsersManager from "@/components/dashboard/UsersManager";

export default function UsersPage() {
  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Users</Typography>
        <Typography variant="body2" color="text.secondary">
          User accounts, roles and access in your institution.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <UsersManager />
      </Container>
    </Box>
  );
}
