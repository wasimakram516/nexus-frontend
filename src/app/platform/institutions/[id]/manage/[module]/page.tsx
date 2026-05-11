"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box, Card, CardContent, CircularProgress, Container, Typography,
} from "@mui/material";
import {
  AccountBalance, AccountTree, AssignmentTurnedIn, AutoStories,
  Description, Forum, Group, ManageAccounts, QueryStats, School,
} from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import PlatformBreadcrumbs from "@/components/shared/PlatformBreadcrumbs";
import InstitutionCampusesTab from "@/components/platform/InstitutionCampusesTab";

const MODULE_META: Record<string, { label: string; description: string; icon: React.JSX.Element; accent: string }> = {
  campuses:     { label: "Campuses",     description: "Manage campuses, operating hours, and attendance thresholds.", icon: <AccountTree sx={{ fontSize: 40 }} />,       accent: "#10b981" },
  people:       { label: "People",       description: "Manage students, teachers, and guardians.",                    icon: <Group sx={{ fontSize: 40 }} />,             accent: "#3b82f6" },
  academics:    { label: "Academics",    description: "Levels, classes, sections, subjects, and teacher assignments.",icon: <School sx={{ fontSize: 40 }} />,            accent: "#8b5cf6" },
  attendance:   { label: "Attendance",   description: "Daily attendance records, leave management, and reports.",    icon: <AssignmentTurnedIn sx={{ fontSize: 40 }} />, accent: "#f59e0b" },
  finance:      { label: "Finance",      description: "Fees, vouchers, salaries, payroll, and payments.",            icon: <AccountBalance sx={{ fontSize: 40 }} />,    accent: "#ef4444" },
  users:        { label: "Users",        description: "Staff user accounts, roles, and campus assignments.",         icon: <ManageAccounts sx={{ fontSize: 40 }} />,    accent: "#06b6d4" },
  reports:      { label: "Reports",      description: "Analytics, insights, trends, and data exports.",              icon: <QueryStats sx={{ fontSize: 40 }} />,        accent: "#64748b" },
  examinations: { label: "Examinations", description: "Exam scheduling, grading, and result sheets.",               icon: <AutoStories sx={{ fontSize: 40 }} />,       accent: "#d946ef" },
  documents:    { label: "Documents",    description: "Institution documents, templates, and file management.",      icon: <Description sx={{ fontSize: 40 }} />,       accent: "#0ea5e9" },
  realtime:     { label: "Real-time",    description: "Live notifications, socket events, and activity feeds.",      icon: <Forum sx={{ fontSize: 40 }} />,             accent: "#22c55e" },
};

const IMPLEMENTED = new Set(["campuses"]);

export default function ModulePage() {
  const { id: slugOrId, module } = useParams<{ id: string; module: string }>();
  const { showMessage } = useMessage();
  const [institution, setInstitution] = useState<Record<string, unknown> | null>(null);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const meta = MODULE_META[module] ?? { label: module, description: "", icon: null, accent: "#64748b" };
  const slug = (institution?.slug as string) || slugOrId;

  useEffect(() => {
    apiHandler(() => platformService.getInstitution(slugOrId), { showMessage, silent: true }).then(({ data }) => {
      const inst = data as Record<string, unknown>;
      setInstitution(inst);
      setInstitutionId(String(inst?.id ?? ""));
      setLoading(false);
    });
  }, [slugOrId]);

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <PlatformBreadcrumbs crumbs={[
          { label: "Institutions", href: "/platform/institutions" },
          { label: institution?.name as string ?? slugOrId, href: `/platform/institutions/${slug}` },
          { label: "Manage", href: `/platform/institutions/${slug}/manage` },
          { label: meta.label },
        ]} />

        {IMPLEMENTED.has(module) ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{meta.label}</Typography>
              <Typography variant="body2" color="text.secondary">{meta.description}</Typography>
            </Box>
            {module === "campuses" && <InstitutionCampusesTab institutionId={institutionId} />}
          </>
        ) : (
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ py: 8, textAlign: "center" }}>
              <Box sx={{
                width: 72, height: 72, borderRadius: 3, mx: "auto", mb: 3,
                backgroundColor: meta.accent + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: meta.accent,
              }}>
                {meta.icon}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{meta.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{meta.description}</Typography>
              <Typography variant="caption" color="text.disabled">
                This module is coming soon and will be available in a future update.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
