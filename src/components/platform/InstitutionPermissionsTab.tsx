"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";

interface Template { id: string; name: string; description?: string; permissions: Record<string, unknown>; }
interface Props { institutionId: string; }

const MODULE_LABELS: Record<string, string> = {
  ACADEMICS: "Academics", ATTENDANCE: "Attendance", FINANCE: "Finance",
  PEOPLE: "People", REPORTING: "Reporting", EXAMINATIONS: "Examinations",
  DOCUMENTS: "Documents", REALTIME: "Real-time",
};

export default function InstitutionPermissionsTab({ institutionId }: Props) {
  const { showMessage } = useMessage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiHandler<Template[]>(
      () => platformService.getPermissionTemplates(institutionId),
      { showMessage, silent: true }
    ).then(({ data }) => {
      setTemplates(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [institutionId]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Permission Templates</Typography>
        <Typography variant="body2" color="text.secondary">
          {templates.length} template{templates.length !== 1 ? "s" : ""} defined for this institution. Use the Edit wizard to create or modify templates.
        </Typography>
      </Box>

      {templates.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">No permission templates yet. Click Edit to set them up.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {templates.map((t) => {
            const grantedModules = Object.keys(t.permissions ?? {});
            return (
              <Card key={t.id} sx={{ border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ px: 3, py: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.name}</Typography>
                  {t.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{t.description}</Typography>
                  )}
                  {grantedModules.length > 0 ? (
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
                      Access to: {grantedModules.map((m) => MODULE_LABELS[m] ?? m).join(", ")}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>No module access defined.</Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
