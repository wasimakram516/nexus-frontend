"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Card, CardActionArea, CardContent, Chip, CircularProgress,
  Container, Divider, Grid, Typography,
} from "@mui/material";
import {
  AccountBalance, AccountTree, ArrowForwardIos, AssignmentTurnedIn,
  AutoStories, Block, CheckCircle, Description, Forum,
  Group, ManageAccounts, QueryStats, School, Tune,
} from "@mui/icons-material";
import PlatformBreadcrumbs from "@/components/shared/PlatformBreadcrumbs";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import { campusesService } from "@/services/campuses.service";

interface ModuleDef {
  key: string | null;
  label: string;
  description: string;
  icon: React.JSX.Element;
  accent: string;
  route: string;
}

const MODULE_DEFS: ModuleDef[] = [
  { key: null,           label: "Campuses",    description: "Manage campuses, hours, and thresholds.",     icon: <AccountTree />,       accent: "#10b981", route: "campuses" },
  { key: "PEOPLE",       label: "People",      description: "Students, teachers, and guardians.",           icon: <Group />,             accent: "#3b82f6", route: "people" },
  { key: "ACADEMICS",    label: "Academics",   description: "Levels, classes, sections, and subjects.",     icon: <School />,            accent: "#8b5cf6", route: "academics" },
  { key: "ATTENDANCE",   label: "Attendance",  description: "Daily attendance records and summaries.",      icon: <AssignmentTurnedIn />, accent: "#f59e0b", route: "attendance" },
  { key: "FINANCE",      label: "Finance",     description: "Fees, vouchers, salaries, and payments.",      icon: <AccountBalance />,    accent: "#ef4444", route: "finance" },
  { key: null,           label: "Users",       description: "Staff accounts and role assignments.",         icon: <ManageAccounts />,    accent: "#06b6d4", route: "users" },
  { key: null,           label: "Custom Fields", description: "Institution-specific fields on records.",    icon: <Tune />,              accent: "#a855f7", route: "custom-fields" },
  { key: "REPORTING",    label: "Reports",     description: "Analytics, trends, and data exports.",         icon: <QueryStats />,        accent: "#64748b", route: "reports" },
  { key: "EXAMINATIONS", label: "Examinations",description: "Exams, results, and grade sheets.",            icon: <AutoStories />,       accent: "#d946ef", route: "examinations" },
  { key: "DOCUMENTS",    label: "Documents",   description: "Institution documents and templates.",         icon: <Description />,       accent: "#0ea5e9", route: "documents" },
  { key: "REALTIME",     label: "Real-time",   description: "Live notifications and socket events.",        icon: <Forum />,             accent: "#22c55e", route: "realtime" },
];

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  ACTIVE: "success", TRIAL: "info" as "default", SUSPENDED: "warning", INACTIVE: "default",
};

export default function InstitutionManagePage() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const router = useRouter();
  const { showMessage } = useMessage();
  const [institution, setInstitution] = useState<Record<string, unknown> | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<Record<string, unknown> | null>(null);
  const [campusCount, setCampusCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [instRes, configRes, campusRes] = await Promise.all([
        apiHandler(() => platformService.getInstitution(slugOrId), { showMessage, silent: true }),
        apiHandler(() => platformService.getRuntimeConfig(slugOrId), { showMessage, silent: true }),
        apiHandler(() => campusesService.getAll({ limit: 1 }), { showMessage, silent: true }),
      ]);
      setInstitution(instRes.data as Record<string, unknown>);
      setRuntimeConfig(configRes.data as Record<string, unknown>);
      setCampusCount((campusRes.data as { total?: number } | null)?.total ?? 0);
      setLoading(false);
    };
    load();
  }, [slugOrId]);

  const isModuleEnabled = (key: string | null): boolean => {
    if (!key) return true;
    const modules = runtimeConfig?.modules as Record<string, { enabled: boolean }> | undefined;
    return modules?.[key]?.enabled === true;
  };

  const enabledCount = MODULE_DEFS.filter((m) => m.key && isModuleEnabled(m.key)).length;
  const subscription = runtimeConfig?.subscription as Record<string, unknown> | null;
  const initials = (institution?.name as string ?? "?").charAt(0).toUpperCase();
  const slug = (institution?.slug as string) || slugOrId;

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!institution) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <Typography color="text.secondary">Institution not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <PlatformBreadcrumbs crumbs={[
          { label: "Institutions", href: "/platform/institutions" },
          { label: institution.name as string, href: `/platform/institutions/${slug}` },
          { label: "Manage" },
        ]} />

        {/* Institution banner */}
        <Card sx={{ border: "1px solid", borderColor: "divider", mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, flexWrap: "wrap" }}>
              <Box sx={{
                width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 },
                borderRadius: 2, backgroundColor: "primary.main", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: 18, sm: 22 } }}>{initials}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                    {institution.name as string}
                  </Typography>
                  <Chip
                    label={institution.status as string}
                    color={STATUS_COLOR[institution.status as string] ?? "default"}
                    size="small"
                  />
                  {!!subscription?.planName && (
                    <Chip label={String(subscription.planName)} variant="outlined" size="small" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                  {(institution.deploymentMode as string ?? "").replace(/_/g, " ")}
                  {institution.contactEmail ? ` · ${institution.contactEmail}` : ""}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

            {/* Stats */}
            <Box sx={{ display: "flex", gap: { xs: 2, sm: 4 }, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{campusCount}</Typography>
                <Typography variant="caption" color="text.secondary">Campuses</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{enabledCount}</Typography>
                <Typography variant="caption" color="text.secondary">Modules Enabled</Typography>
              </Box>
              {subscription && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, textTransform: "capitalize" }}>
                    {(subscription.status as string ?? "").toLowerCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Subscription</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Module grid */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, mb: { xs: 1.5, sm: 2 } }}>
          Modules
        </Typography>
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {MODULE_DEFS.map((mod) => {
            const enabled = isModuleEnabled(mod.key);
            return (
              <Grid key={mod.route} size={{ xs: 6, sm: 4, md: 4, lg: 3 }}>
                <Card sx={{
                  border: "1px solid",
                  borderColor: enabled ? "divider" : "divider",
                  height: "100%",
                  opacity: enabled ? 1 : 0.55,
                  transition: "box-shadow 0.15s, transform 0.15s",
                  "&:hover": enabled ? { boxShadow: 4, transform: "translateY(-2px)" } : {},
                }}>
                  <CardActionArea
                    disabled={!enabled}
                    onClick={() => router.push(`/platform/institutions/${slug}/manage/${mod.route}`)}
                    sx={{ height: "100%", alignItems: "flex-start" }}
                  >
                    <CardContent sx={{ p: { xs: 1.75, sm: 2.5 }, height: "100%", display: "flex", flexDirection: "column" }}>
                      {/* Icon + status */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: { xs: 1.25, sm: 1.5 } }}>
                        <Box sx={{
                          width: { xs: 36, sm: 42 }, height: { xs: 36, sm: 42 },
                          borderRadius: 2,
                          backgroundColor: mod.accent + "18",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: mod.accent, flexShrink: 0,
                          "& svg": { fontSize: { xs: "1.1rem", sm: "1.35rem" } },
                        }}>
                          {mod.icon}
                        </Box>
                        {enabled
                          ? <CheckCircle sx={{ color: "success.main", fontSize: { xs: 14, sm: 16 } }} />
                          : <Block sx={{ color: "text.disabled", fontSize: { xs: 14, sm: 16 } }} />
                        }
                      </Box>

                      {/* Label + desc */}
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                        {mod.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1.4, flex: 1 }}>
                        {mod.description}
                      </Typography>

                      {/* Arrow */}
                      {enabled && (
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: { xs: 0.5, sm: 1 } }}>
                          <ArrowForwardIos sx={{ fontSize: 11, color: "text.disabled" }} />
                        </Box>
                      )}
                      {!enabled && (
                        <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, fontSize: "0.65rem", display: { xs: "none", sm: "block" } }}>
                          Not enabled
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
