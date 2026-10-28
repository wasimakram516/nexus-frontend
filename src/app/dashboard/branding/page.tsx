"use client";

import { Box, Card, CardContent, CircularProgress, Container, Typography } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import InstitutionBrandingTab from "@/components/platform/InstitutionBrandingTab";
import { useAuth } from "@/contexts/AuthContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { platformService } from "@/services/platform.service";

/**
 * A school's administrator sets their own school's name, logo, theme and
 * colours here, with the same editor the platform console uses and the same
 * warnings about colours that are hard to read.
 */
export default function BrandingPage() {
  const { user } = useAuth();
  const { config, isLoading, refresh } = useRuntimeConfig();

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Branding</Typography>
        <Typography variant="body2" color="text.secondary">
          Your school&apos;s name, logo, theme and colours, as everyone at the school sees them.
        </Typography>
      </Box>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : user?.role !== "ADMIN" || !config ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: "center" }}>
              <LockOutlined sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Only a school administrator can change the branding</Typography>
            </CardContent>
          </Card>
        ) : (
          <InstitutionBrandingTab
            institutionId={config.institutionId}
            runtimeConfig={config as unknown as Record<string, unknown>}
            save={(payload) => platformService.updateMyBranding(payload)}
            onSaved={() => void refresh()}
          />
        )}
      </Container>
    </Box>
  );
}
