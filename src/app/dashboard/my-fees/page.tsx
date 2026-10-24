"use client";

import { Box, Card, CardContent, CircularProgress, Container, Typography } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import MyFeesManager from "@/components/dashboard/MyFeesManager";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";

/**
 * Students and guardians see their own fees here. They hold no finance
 * permissions, so only the module being enabled gates the page; the server
 * returns only their own (or their children's) fees.
 */
export default function MyFeesPage() {
  const { isLoading, isModuleEnabled } = useRuntimeConfig();

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Fees</Typography>
        <Typography variant="body2" color="text.secondary">
          Vouchers, payments and what is still to pay.
        </Typography>
      </Box>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : !isModuleEnabled("FINANCE") ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: "center" }}>
              <LockOutlined sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Fees are not available</Typography>
              <Typography variant="body2" color="text.secondary">
                Your institution has not turned on fees.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <MyFeesManager />
        )}
      </Container>
    </Box>
  );
}
