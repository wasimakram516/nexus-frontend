"use client";

import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { LockOutlined, VisibilityOff } from "@mui/icons-material";
import { ModuleKey, useRuntimeConfig } from "@/contexts/RuntimeConfigContext";

interface ModuleGateProps {
  module: ModuleKey;
  children: React.ReactNode;
}

/**
 * Renders children only when the institution has the module enabled AND the
 * current user has at least view permission for it.
 */
export default function ModuleGate({ module, children }: ModuleGateProps) {
  const { isLoading, isModuleEnabled, can } = useRuntimeConfig();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isModuleEnabled(module)) {
    return (
      <Box sx={{ p: 4 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <LockOutlined sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Module not enabled</Typography>
            <Typography variant="body2" color="text.secondary">
              The {module.toLowerCase()} module is not part of your institution&apos;s plan.
              Contact your administrator or Nexus support to enable it.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!can(module, "view")) {
    return (
      <Box sx={{ p: 4 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <VisibilityOff sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>No access</Typography>
            <Typography variant="body2" color="text.secondary">
              You don&apos;t have permission to view the {module.toLowerCase()} module.
              Ask your administrator to grant you access.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
