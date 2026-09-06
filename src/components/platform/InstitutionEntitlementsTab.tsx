"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid,
  Switch, Typography,
} from "@mui/material";
import { CheckCircle, Cancel, Edit } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import { rolesService } from "@/services/roles.service";

interface ModuleCatalogEntry {
  key: string;
  label: string;
  description: string;
}

interface Props {
  institutionId: string;
  runtimeConfig: Record<string, unknown> | null;
  onSaved?: () => void;
}

export default function InstitutionEntitlementsTab({ institutionId, runtimeConfig, onSaved }: Props) {
  const { showMessage } = useMessage();
  const entitlements = runtimeConfig?.modules as Record<string, { enabled: boolean }> | null;
  const isEnabled = (m: string) => entitlements?.[m]?.enabled === true;

  // Fetched from the backend (single source of truth, GET /roles/module-catalog)
  // instead of a hand-typed list — a new ModuleKey shows up here automatically,
  // the exact gap that let Timetable/Notices go missing from this screen after
  // being added to the enum without every frontend list being updated too.
  const [catalog, setCatalog] = useState<ModuleCatalogEntry[]>([]);
  useEffect(() => {
    apiHandler<ModuleCatalogEntry[]>(() => rolesService.getModuleCatalog(), {
      showMessage,
      silent: true,
    }).then(({ data }) => setCatalog(data ?? []));
  }, [showMessage]);

  const enabledCount = catalog.filter((m) => isEnabled(m.key)).length;

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setDraft(Object.fromEntries(catalog.map((m) => [m.key, isEnabled(m.key)])));
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        platformService.updateEntitlements(institutionId, {
          entitlements: catalog.map((m) => ({
            moduleKey: m.key,
            isEnabled: draft[m.key] ?? false,
          })),
        }),
      { showMessage, successMessage: "Module entitlements saved." }
    );
    setSaving(false);
    if (success) {
      setEditOpen(false);
      onSaved?.();
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Module Entitlements</Typography>
          <Typography variant="body2" color="text.secondary">{enabledCount} of {catalog.length} modules enabled.</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<Edit />} onClick={openEdit} sx={{ flexShrink: 0 }}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={2}>
        {catalog.map((mod) => {
          const enabled = isEnabled(mod.key);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.key}>
              <Card sx={{ border: "1px solid", borderColor: enabled ? "primary.main" : "divider", opacity: enabled ? 1 : 0.6 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{mod.label}</Typography>
                        <Chip
                          label={enabled ? "Enabled" : "Disabled"}
                          color={enabled ? "success" : "default"}
                          size="small"
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                    </Box>
                    {enabled
                      ? <CheckCircle sx={{ color: "success.main", fontSize: 18, flexShrink: 0 }} />
                      : <Cancel sx={{ color: "text.disabled", fontSize: 18, flexShrink: 0 }} />
                    }
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit entitlements dialog */}
      <Dialog open={editOpen} onClose={() => (saving ? undefined : setEditOpen(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Module Entitlements</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Toggle which modules this institution can access. Disabling a module locks it out of the institution&apos;s dashboard immediately.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {catalog.map((mod) => (
              <Box
                key={mod.key}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{mod.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                </Box>
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={
                    <Switch
                      checked={draft[mod.key] ?? false}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [mod.key]: e.target.checked }))}
                    />
                  }
                  label=""
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
