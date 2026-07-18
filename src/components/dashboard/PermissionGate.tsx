"use client";

import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { VisibilityOff } from "@mui/icons-material";
import { PermissionAction, useRuntimeConfig } from "@/contexts/RuntimeConfigContext";

interface PermissionGateProps {
  feature: string;
  action: PermissionAction;
  children: React.ReactNode;
}

/**
 * Renders children only when the current user has the given feature/action
 * grant — the same check the backend's PermissionsGuard enforces, applied
 * here so a page doesn't render and then 403 on its first request.
 * ADMIN/SUPERADMIN always pass (see RuntimeConfigContext's can()).
 */
export default function PermissionGate({ feature, action, children }: PermissionGateProps) {
  const { isLoading, can } = useRuntimeConfig();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!can(feature, action)) {
    return (
      <Box sx={{ p: 4 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <VisibilityOff sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>No access</Typography>
            <Typography variant="body2" color="text.secondary">
              You don&apos;t have permission to view this page.
              Ask your administrator to grant you access.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
