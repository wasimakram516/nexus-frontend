"use client";

import { Box, Container, Typography } from "@mui/material";
import ModuleGate from "@/components/dashboard/ModuleGate";
import NoticesManager from "@/components/dashboard/NoticesManager";

export default function NoticesPage() {
  return (
    <ModuleGate module="NOTICES">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Notices</Typography>
          <Typography variant="body2" color="text.secondary">
            Announcements targeted by campus, class, section, or role.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <NoticesManager />
        </Container>
      </Box>
    </ModuleGate>
  );
}
