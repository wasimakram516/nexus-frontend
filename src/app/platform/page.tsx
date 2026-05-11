"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import {
  AccountTree,
  Add,
  CheckCircle,
  Layers,
  PauseCircle,
  TrendingUp,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";

interface Institution {
  id: string;
  name: string;
  slug: string;
  status: string;
  deploymentMode: string;
  contactEmail?: string;
  createdAt: string;
}

const statusColor: Record<string, "success" | "error" | "warning" | "default"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  SUSPENDED: "warning",
};

export default function PlatformOverviewPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data } = await apiHandler<Institution[]>(
        () => platformService.getInstitutions(),
        { showMessage, silent: true }
      );
      setInstitutions(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, [showMessage]);

  const stats = [
    { label: "Total Institutions", value: institutions.length, icon: <AccountTree />, color: "primary.main" },
    { label: "Active", value: institutions.filter((i) => i.status === "ACTIVE").length, icon: <CheckCircle />, color: "success.main" },
    { label: "Suspended", value: institutions.filter((i) => i.status === "SUSPENDED").length, icon: <PauseCircle />, color: "warning.main" },
    { label: "This Month", value: institutions.filter((i) => new Date(i.createdAt).getMonth() === new Date().getMonth()).length, icon: <TrendingUp />, color: "info.main" },
  ];

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "background.paper" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Platform Overview</Typography>
          <Typography variant="body2" color="text.secondary">Superadmin console â€” manage institutions, plans, and platform settings.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => router.push("/platform/institutions/new")}>
          New Institution
        </Button>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat) => (
            <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
              <Card sx={{ border: "1px solid", borderColor: "divider" }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: `${stat.color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, flexShrink: 0 }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    {loading ? <Skeleton width={40} height={32} /> : (
                      <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{stat.value}</Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent institutions */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Institutions</Typography>
          <Button size="small" startIcon={<Layers />} onClick={() => router.push("/platform/institutions")}>
            View All
          </Button>
        </Box>

        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          {loading ? (
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} height={60} />)}
            </Box>
          ) : institutions.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <AccountTree sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No institutions yet</Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>Create your first institution to get started.</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => router.push("/platform/institutions/new")}>
                Create Institution
              </Button>
            </Box>
          ) : (
            institutions.slice(0, 8).map((inst, i) => (
              <Box
                key={inst.id}
                onClick={() => router.push(`/platform/institutions/${inst.id}`)}
                sx={{
                  px: 3, py: 2,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: i < Math.min(institutions.length, 8) - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "action.hover" },
                  transition: "background 0.15s",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>
                      {inst.name.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{inst.slug} Â· {inst.deploymentMode?.replace("_", " ")}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip label={inst.status} color={statusColor[inst.status] ?? "default"} size="small" />
                </Box>
              </Box>
            ))
          )}
        </Card>
      </Container>
    </Box>
  );
}

