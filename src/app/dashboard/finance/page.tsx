"use client";

import { Box, Container, Typography } from "@mui/material";
import FinanceManager from "@/components/dashboard/FinanceManager";
import ModuleGate from "@/components/dashboard/ModuleGate";

export default function FinancePage() {
  return (
    <ModuleGate module="FINANCE">
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Finance</Typography>
          <Typography variant="body2" color="text.secondary">
            Payroll, fee structures, vouchers and payments.
          </Typography>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <FinanceManager />
        </Container>
      </Box>
    </ModuleGate>
  );
}
