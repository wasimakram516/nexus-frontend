"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  AccountBalance,
  Business,
  EventAvailable,
  EventBusy,
  Groups,
  HourglassBottom,
  SchoolOutlined,
  SupervisorAccount,
  Person,
  Today,
} from "@mui/icons-material";
import OnboardingChecklist, { OnboardingStep } from "@/components/dashboard/OnboardingChecklist";
import { useAuth } from "@/contexts/AuthContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { academicsService } from "@/services/academics.service";
import { attendanceService } from "@/services/attendance.service";
import { campusesService } from "@/services/campuses.service";
import { peopleService } from "@/services/people.service";

interface AttendanceSummary {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  halfDayCount: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  halfDay?: boolean;
}

interface Stats {
  students: number | null;
  teachers: number | null;
  guardians: number | null;
  campuses: number | null;
  classes: number | null;
}

const STATUS_COLORS: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
  PRESENT: "success",
  ABSENT: "error",
  LATE: "warning",
  LEAVE: "info",
};

const formatTime = (value?: string | null) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { config, isLoading: configLoading, isModuleEnabled, can } = useRuntimeConfig();
  const { showMessage } = useMessage();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({ students: null, teachers: null, guardians: null, campuses: null, classes: null });
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "ADMIN";
  const isPersonal = !!user && !["ADMIN", "SUPERADMIN"].includes(user.role);

  useEffect(() => {
    if (configLoading || !user) return;

    const load = async () => {
      const tasks: Promise<void>[] = [];

      if (isAdmin && isModuleEnabled("PEOPLE")) {
        tasks.push(
          (async () => {
            const [students, teachers, guardians] = await Promise.all([
              apiHandler<unknown[]>(() => peopleService.getStudents(), { showMessage, silent: true }),
              apiHandler<unknown[]>(() => peopleService.getTeachers(), { showMessage, silent: true }),
              apiHandler<unknown[]>(() => peopleService.getGuardians(), { showMessage, silent: true }),
            ]);
            setStats((prev) => ({
              ...prev,
              students: students.data?.length ?? 0,
              teachers: teachers.data?.length ?? 0,
              guardians: guardians.data?.length ?? 0,
            }));
          })()
        );
      }

      if (isAdmin) {
        tasks.push(
          (async () => {
            const { data } = await apiHandler<{ items: unknown[]; total: number }>(
              () => campusesService.getAll({ limit: 100 }),
              { showMessage, silent: true }
            );
            setStats((prev) => ({ ...prev, campuses: data?.total ?? data?.items?.length ?? 0 }));
          })()
        );
        if (isModuleEnabled("ACADEMICS")) {
          tasks.push(
            (async () => {
              const { data } = await apiHandler<unknown[]>(
                () => academicsService.getClasses(),
                { showMessage, silent: true }
              );
              setStats((prev) => ({ ...prev, classes: data?.length ?? 0 }));
            })()
          );
        }
        if (isModuleEnabled("ATTENDANCE")) {
          tasks.push(
            (async () => {
              const today = new Date().toISOString().slice(0, 10);
              const { data } = await apiHandler<AttendanceSummary>(
                () => attendanceService.getSummary({ date: today }),
                { showMessage, silent: true }
              );
              setSummary(data);
            })()
          );
        }
      }

      // Personal roles: load this month's own attendance (backend self-scopes).
      if (isPersonal && isModuleEnabled("ATTENDANCE")) {
        tasks.push(
          (async () => {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
              .toISOString()
              .slice(0, 10);
            const { data } = await apiHandler<AttendanceRecord[]>(
              () => attendanceService.getAll({ dateFrom: monthStart, dateTo: now.toISOString().slice(0, 10) }),
              { showMessage, silent: true }
            );
            setMyAttendance(Array.isArray(data) ? data : []);
          })()
        );
      }

      await Promise.all(tasks);
      setLoading(false);
    };

    load();
  }, [configLoading, user, isAdmin, isPersonal, isModuleEnabled, showMessage]);

  const onboardingSteps: OnboardingStep[] = isAdmin
    ? ([
        {
          key: "campus",
          label: "Create your first campus",
          description: "Campuses hold students, staff, classes and finance — everything starts here.",
          done: (stats.campuses ?? 0) > 0,
          href: "/dashboard/campuses",
          required: true,
        },
        isModuleEnabled("ACADEMICS") && {
          key: "academics",
          label: "Set up academics",
          description: "Add levels, classes, sections and subjects.",
          done: (stats.classes ?? 0) > 0,
          href: "/dashboard/academics",
        },
        isModuleEnabled("PEOPLE") && {
          key: "people",
          label: "Add students & teachers",
          description: "Register people and their accounts.",
          done: (stats.students ?? 0) + (stats.teachers ?? 0) > 0,
          href: "/dashboard/people",
        },
        isModuleEnabled("ATTENDANCE") && {
          key: "attendance",
          label: "Start tracking attendance",
          description: "Check people in or mark leave for today.",
          done: (summary?.totalRecords ?? 0) > 0,
          href: "/dashboard/attendance",
        },
      ].filter(Boolean) as OnboardingStep[])
    : [];

  const statCards = [
    { label: "Students", value: stats.students, icon: <SchoolOutlined />, show: isAdmin && isModuleEnabled("PEOPLE"), href: "/dashboard/people" },
    { label: "Teachers", value: stats.teachers, icon: <Person />, show: isAdmin && isModuleEnabled("PEOPLE"), href: "/dashboard/people" },
    { label: "Guardians", value: stats.guardians, icon: <SupervisorAccount />, show: isAdmin && isModuleEnabled("PEOPLE"), href: "/dashboard/people" },
    { label: "Campuses", value: stats.campuses, icon: <Business />, show: isAdmin, href: "/dashboard/campuses" },
  ].filter((c) => c.show);

  const attendanceCards = summary
    ? [
        { label: "Present", value: summary.presentCount, icon: <EventAvailable />, color: "success.main" },
        { label: "Absent", value: summary.absentCount, icon: <EventBusy />, color: "error.main" },
        { label: "Late", value: summary.lateCount, icon: <HourglassBottom />, color: "warning.main" },
        { label: "On Leave", value: summary.leaveCount, icon: <Today />, color: "info.main" },
      ]
    : [];

  const quickLinks = [
    { label: "People", description: "Students, teachers & guardians", icon: <Groups />, href: "/dashboard/people", module: "PEOPLE" as const },
    { label: "Academics", description: "Levels, classes, sections & subjects", icon: <SchoolOutlined />, href: "/dashboard/academics", module: "ACADEMICS" as const },
    { label: "Attendance", description: "Daily check-ins, leaves & reports", icon: <Today />, href: "/dashboard/attendance", module: "ATTENDANCE" as const },
    { label: "Finance", description: "Salaries, fees, vouchers & payments", icon: <AccountBalance />, href: "/dashboard/finance", module: "FINANCE" as const },
  ].filter((l) => isModuleEnabled(l.module) && can(l.module, "view"));

  const myPresent = myAttendance.filter((r) => r.status === "PRESENT").length;
  const myAbsent = myAttendance.filter((r) => r.status === "ABSENT").length;
  const myLate = myAttendance.filter((r) => r.status === "LATE").length;
  const myLeave = myAttendance.filter((r) => r.status === "LEAVE").length;

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {config?.branding?.displayName ?? "Your institution"} at a glance.
          </Typography>
        </Box>
        {config?.subscription && (
          <Chip
            label={`${config.subscription.planName ?? "Plan"} · ${config.subscription.status}`}
            color={config.subscription.status === "ACTIVE" || config.subscription.status === "TRIAL" ? "success" : "warning"}
          />
        )}
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Onboarding for admins */}
        {isAdmin && !loading && <OnboardingChecklist steps={onboardingSteps} />}

        {/* Personal view for staff / students / guardians */}
        {isPersonal && (
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ width: 52, height: 52, backgroundColor: "primary.main", fontWeight: 800, fontSize: 20 }}>
                    {user?.name?.charAt(0) ?? "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{user?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                    <Chip label={user?.role} size="small" sx={{ mt: 0.5, height: 20, fontSize: 10 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {isModuleEnabled("ATTENDANCE") && (
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                      My Attendance — {new Date().toLocaleString("en", { month: "long" })}
                    </Typography>

                    {loading ? (
                      <Skeleton height={80} />
                    ) : myAttendance.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No attendance records yet this month.
                      </Typography>
                    ) : (
                      <>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                          <Chip label={`Present ${myPresent}`} color="success" size="small" />
                          <Chip label={`Absent ${myAbsent}`} color="error" size="small" />
                          <Chip label={`Late ${myLate}`} color="warning" size="small" />
                          <Chip label={`Leave ${myLeave}`} color="info" size="small" />
                        </Box>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Check In</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Check Out</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {myAttendance.slice(0, 7).map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>{formatDate(record.date)}</TableCell>
                                <TableCell>{formatTime(record.checkIn)}</TableCell>
                                <TableCell>{formatTime(record.checkOut)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={record.halfDay ? `${record.status} · HALF` : record.status}
                                    size="small"
                                    color={STATUS_COLORS[record.status] ?? "default"}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Stats */}
        {statCards.length > 0 && (
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {statCards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ border: "1px solid", borderColor: "divider" }}>
                  <CardActionArea onClick={() => router.push(card.href)}>
                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: "primary.main", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {card.icon}
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {loading || card.value === null ? <Skeleton width={48} /> : card.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Today's attendance (admin) */}
        {isAdmin && attendanceCards.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Today&apos;s Attendance</Typography>
            <Grid container spacing={2.5}>
              {attendanceCards.map((card) => (
                <Grid key={card.label} size={{ xs: 6, sm: 6, md: 3 }}>
                  <Card sx={{ border: "1px solid", borderColor: "divider" }}>
                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ color: card.color, display: "flex" }}>{card.icon}</Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{card.value}</Typography>
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Quick links */}
        {quickLinks.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Modules</Typography>
            <Grid container spacing={2.5}>
              {quickLinks.map((link) => (
                <Grid key={link.label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
                    <CardActionArea onClick={() => router.push(link.href)} sx={{ height: "100%" }}>
                      <CardContent>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: "primary.main", mb: 1.5 }}>
                          {link.icon}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{link.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{link.description}</Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
