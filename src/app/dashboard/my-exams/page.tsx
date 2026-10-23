"use client";

import { Box, Card, CardContent, CircularProgress, Container, Typography } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import MyExamsManager from "@/components/dashboard/MyExamsManager";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";

/**
 * Students and guardians see their own exams here. They hold no exam
 * permissions, so only the module being enabled gates the page; the server
 * returns only their own (or their wards') exams.
 */
export default function MyExamsPage() {
  const { isLoading, isModuleEnabled } = useRuntimeConfig();

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Exams</Typography>
        <Typography variant="body2" color="text.secondary">
          Datesheets, admit cards and results.
        </Typography>
      </Box>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : !isModuleEnabled("EXAMINATIONS") ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: "center" }}>
              <LockOutlined sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Exams are not available</Typography>
              <Typography variant="body2" color="text.secondary">
                Your institution has not turned on exams.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <MyExamsManager />
        )}
      </Container>
    </Box>
  );
}
