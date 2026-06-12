"use client";

import { Box, Container, Typography } from "@mui/material";
import CustomFieldsManager from "@/components/dashboard/CustomFieldsManager";

export default function CustomFieldsPage() {
  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Custom Fields</Typography>
        <Typography variant="body2" color="text.secondary">
          Extend built-in records with your institution&apos;s own fields.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <CustomFieldsManager />
      </Container>
    </Box>
  );
}
