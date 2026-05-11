"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Button, Chip, CircularProgress,
  Container, Divider, Tab, Tabs, Typography,
} from "@mui/material";
import {
  ArrowBack, ArrowForward, Brush,
  Edit, Extension, Lock, OpenInNew, Payment, Settings, Tune,
} from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import InstitutionOverviewTab from "@/components/platform/InstitutionOverviewTab";
import InstitutionBrandingTab from "@/components/platform/InstitutionBrandingTab";
import InstitutionEntitlementsTab from "@/components/platform/InstitutionEntitlementsTab";
import InstitutionSubscriptionTab from "@/components/platform/InstitutionSubscriptionTab";
import InstitutionSettingsTab from "@/components/platform/InstitutionSettingsTab";
import InstitutionPermissionsTab from "@/components/platform/InstitutionPermissionsTab";

const STATUS_COLOR: Record<string, "success" | "error" | "warning" | "default"> = {
  ACTIVE: "success", INACTIVE: "default", SUSPENDED: "warning",
};

const TABS = [
  { label: "Overview",     icon: <Settings fontSize="small" /> },
  { label: "Branding",     icon: <Brush fontSize="small" /> },
  { label: "Entitlements", icon: <Extension fontSize="small" /> },
  { label: "Subscription", icon: <Payment fontSize="small" /> },
  { label: "Settings",     icon: <Tune fontSize="small" /> },
  { label: "Permissions",  icon: <Lock fontSize="small" /> },
];

export default function InstitutionDetailPage() {
  // The URL segment is the slug (e.g. "taleem-ul-islam"), not the UUID.
  // After fetching, we extract institution.id (UUID) for all downstream API calls.
  const { id: slugOrId } = useParams<{ id: string }>();
  const router = useRouter();
  const { showMessage } = useMessage();
  const [tab, setTab] = useState(0);
  const [institution, setInstitution] = useState<Record<string, unknown> | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // UUID extracted from institution for API calls to endpoints that require UUID
  const institutionId = institution?.id as string | undefined;

  const refresh = async (uuid?: string) => {
    const resolvedId = uuid ?? institutionId ?? slugOrId;
    const [instRes, configRes] = await Promise.all([
      apiHandler(() => platformService.getInstitution(resolvedId), { showMessage, silent: true }),
      apiHandler(() => platformService.getRuntimeConfig(resolvedId), { showMessage, silent: true }),
    ]);
    setInstitution(instRes.data as Record<string, unknown>);
    setRuntimeConfig(configRes.data as Record<string, unknown>);
  };

  useEffect(() => {
    const load = async () => {
      const [instRes, configRes] = await Promise.all([
        apiHandler(() => platformService.getInstitution(slugOrId), { showMessage, silent: true }),
        apiHandler(() => platformService.getRuntimeConfig(slugOrId), { showMessage, silent: true }),
      ]);
      const inst = instRes.data as Record<string, unknown>;
      setInstitution(inst);
      setRuntimeConfig(configRes.data as Record<string, unknown>);
      setLoading(false);
    };
    load();
  }, [slugOrId, showMessage]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!institution || !institutionId) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">Institution not found.</Typography>
      </Box>
    );
  }

  const slug = institution.slug as string;

  return (
    <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Button startIcon={<ArrowBack />} color="inherit" size="small" onClick={() => router.push("/platform/institutions")} sx={{ color: "text.secondary", minWidth: 0, px: 1 }}>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Institutions</Box>
          </Button>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
            {slug}
          </Typography>
        </Box>

        {/* Institution identity */}
        <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
            <Box sx={{
              width: { xs: 40, sm: 44 }, height: { xs: 40, sm: 44 },
              borderRadius: 2, backgroundColor: "primary.main", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
                {(institution.name as string).charAt(0).toUpperCase()}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.5rem" } }}>
                  {institution.name as string}
                </Typography>
                <Chip label={institution.status as string} color={STATUS_COLOR[institution.status as string] ?? "default"} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {institution.deploymentMode as string} · {(institution.contactEmail as string) || "No email set"}
              </Typography>
            </Box>
          </Box>

          {/* Desktop actions */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, flexShrink: 0 }}>
            <Button variant="outlined" startIcon={<Edit />} size="small" onClick={() => router.push(`/platform/institutions/${slug}/edit`)}>
              Edit
            </Button>
            <Button variant="contained" endIcon={<ArrowForward />} size="small" onClick={() => router.push(`/platform/institutions/${slug}/manage`)}>
              Manage Institution
            </Button>
          </Box>
        </Box>

        {/* Mobile actions */}
        <Box sx={{ display: { xs: "flex", sm: "none" }, mt: 1.5, gap: 1 }}>
          <Button variant="outlined" startIcon={<Edit />} size="small" onClick={() => router.push(`/platform/institutions/${slug}/edit`)} fullWidth>
            Edit
          </Button>
          <Button variant="outlined" startIcon={<OpenInNew />} size="small" onClick={() => router.push(`/platform/institutions/${slug}/manage`)} fullWidth>
            Dashboard
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Container maxWidth="xl">
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            {TABS.map((t) => (
              <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start"
                sx={{ minHeight: 48, textTransform: "none", fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* Tab content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
          {tab === 0 && <InstitutionOverviewTab institution={institution} runtimeConfig={runtimeConfig} />}
          {tab === 1 && <InstitutionBrandingTab institutionId={institutionId} runtimeConfig={runtimeConfig} onSaved={() => refresh(institutionId)} />}
          {tab === 2 && <InstitutionEntitlementsTab institutionId={institutionId} runtimeConfig={runtimeConfig} onSaved={() => refresh(institutionId)} />}
          {tab === 3 && <InstitutionSubscriptionTab institutionId={institutionId} runtimeConfig={runtimeConfig} onSaved={() => refresh(institutionId)} />}
          {tab === 4 && <InstitutionSettingsTab institutionId={institutionId} runtimeConfig={runtimeConfig} onSaved={() => refresh(institutionId)} />}
          {tab === 5 && <InstitutionPermissionsTab institutionId={institutionId} />}
        </Container>
      </Box>
    </Box>
  );
}
