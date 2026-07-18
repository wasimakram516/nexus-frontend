"use client";

import { Box, Container, Typography } from "@mui/material";
import AuditLogActivity from "@/components/shared/AuditLogActivity";
import PermissionGate from "@/components/dashboard/PermissionGate";

export default function ActivityPage() {
  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Activity</Typography>
        <Typography variant="body2" color="text.secondary">
          Who did what, when — every tracked create, update, delete, restore, and login for your institution.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PermissionGate feature="audit_logs" action="read">
          <AuditLogActivity />
        </PermissionGate>
      </Container>
    </Box>
  );
}
