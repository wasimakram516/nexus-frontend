"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { ArrowBack, FamilyRestroom, Person, SchoolOutlined } from "@mui/icons-material";
import CampusRequiredNotice from "@/components/dashboard/CampusRequiredNotice";
import PeopleTab, { NamedItem, PersonKind, PersonRecord } from "@/components/dashboard/PeopleTab";
import { useMessage } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { fetchAllUsers, UserLite } from "@/lib/users";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { peopleService } from "@/services/people.service";

type SectionItem = NamedItem & { classId?: string };
type CampusItem = NamedItem & { institutionId?: string };
type LevelItem = NamedItem & { campusId?: string; levelId?: string };

interface PeopleManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

export default function PeopleManager({ institutionId }: PeopleManagerProps) {
  const { showMessage } = useMessage();
  const runtime = useOptionalRuntimeConfig();
  // Platform console (institutionId set) is superadmin — always full access.
  const canManage = institutionId ? true : (runtime?.can("PEOPLE", "manage") ?? true);

  // null = hub of person-type cards; otherwise the open section.
  const [activeKind, setActiveKind] = useState<PersonKind | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<PersonRecord[]>([]);
  const [teachers, setTeachers] = useState<PersonRecord[]>([]);
  const [guardians, setGuardians] = useState<PersonRecord[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [classes, setClasses] = useState<LevelItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);

  const load = useCallback(async () => {
    const [studentsRes, teachersRes, guardiansRes, campusesRes] = await Promise.all([
      apiHandler<PersonRecord[]>(() => peopleService.getStudents(), { showMessage, silent: true }),
      apiHandler<PersonRecord[]>(() => peopleService.getTeachers(), { showMessage, silent: true }),
      apiHandler<PersonRecord[]>(() => peopleService.getGuardians(), { showMessage, silent: true }),
      apiHandler<{ items: CampusItem[] }>(() => campusesService.getAll({ limit: 100 }), { showMessage, silent: true }),
    ]);

    const allCampuses = campusesRes.data?.items ?? [];
    const scopedCampuses = institutionId
      ? allCampuses.filter((c) => c.institutionId === institutionId)
      : allCampuses;
    const campusIds = new Set(scopedCampuses.map((c) => c.id));
    const inScope = (rows: PersonRecord[] | null) =>
      (rows ?? []).filter((r) => !institutionId || campusIds.has(r.campusId));

    setCampuses(scopedCampuses);
    setStudents(inScope(studentsRes.data));
    setTeachers(inScope(teachersRes.data));
    setGuardians(inScope(guardiansRes.data));

    try {
      const allUsers = await fetchAllUsers();
      setUsers(institutionId ? allUsers.filter((u) => u.institutionId === institutionId) : allUsers);
    } catch {
      setUsers([]);
    }

    setLoading(false);
  }, [showMessage, institutionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Academics data only powers class/section/subject pickers — soft-fail if disabled.
  useEffect(() => {
    const loadAcademics = async () => {
      const [levelsRes, classesRes, sectionsRes] = await Promise.all([
        apiHandler<LevelItem[]>(() => academicsService.getLevels(), { showMessage, silent: true }),
        apiHandler<LevelItem[]>(() => academicsService.getClasses(), { showMessage, silent: true }),
        apiHandler<SectionItem[]>(() => academicsService.getSections(), { showMessage, silent: true }),
      ]);

      let scopedClasses = classesRes.data ?? [];
      if (institutionId) {
        const scopedCampusIds = new Set(campuses.map((c) => c.id));
        const scopedLevelIds = new Set(
          (levelsRes.data ?? []).filter((l) => l.campusId && scopedCampusIds.has(l.campusId)).map((l) => l.id)
        );
        scopedClasses = scopedClasses.filter((c) => c.levelId && scopedLevelIds.has(c.levelId));
      }
      const classIds = new Set(scopedClasses.map((c) => c.id));

      setClasses(scopedClasses);
      setSections((sectionsRes.data ?? []).filter((s) => !institutionId || (s.classId && classIds.has(s.classId))));
    };
    loadAcademics();
  }, [showMessage, institutionId, campuses]);

  const personSections = [
    {
      kind: "students" as const,
      label: "Students",
      description: "Enrollment records linked to classes, sections and guardians.",
      icon: <SchoolOutlined />,
      rows: students,
    },
    {
      kind: "teachers" as const,
      label: "Teachers",
      description: "Teaching staff and their subject assignments.",
      icon: <Person />,
      rows: teachers,
    },
    {
      kind: "guardians" as const,
      label: "Guardians",
      description: "Parents and guardians linked to students.",
      icon: <FamilyRestroom />,
      rows: guardians,
    },
  ];

  if (!loading && campuses.length === 0) {
    return (
      <CampusRequiredNotice
        moduleLabel="people"
        ctaHref={institutionId ? undefined : "/dashboard/campuses"}
      />
    );
  }

  const active = personSections.find((s) => s.kind === activeKind) ?? null;

  if (active) {
    return (
      <>
        <Button
          startIcon={<ArrowBack />}
          color="inherit"
          onClick={() => setActiveKind(null)}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          All People
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{active.label}</Typography>
        <PeopleTab
          key={active.kind}
          kind={active.kind}
          rows={active.rows}
          loading={loading}
          users={users}
          campuses={campuses}
          classes={classes}
          sections={sections}
          students={students}
          guardians={guardians}
          onReload={load}
          institutionId={institutionId}
          canManage={canManage}
        />
      </>
    );
  }

  return (
    <Grid container spacing={2}>
      {personSections.map((section) => (
        <Grid key={section.kind} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
              transition: "box-shadow 0.15s, transform 0.15s",
              "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
            }}
          >
            <CardActionArea onClick={() => setActiveKind(section.kind)} sx={{ height: "100%", alignItems: "stretch" }}>
              <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      backgroundColor: "action.hover",
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {section.icon}
                  </Box>
                  {loading ? (
                    <Skeleton width={32} height={24} />
                  ) : (
                    <Chip
                      label={section.rows.length}
                      size="small"
                      color={section.rows.length > 0 ? "primary" : "default"}
                      variant={section.rows.length > 0 ? "filled" : "outlined"}
                    />
                  )}
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{section.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  {section.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
