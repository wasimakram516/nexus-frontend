"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ArrowBack,
  AssignmentInd,
  GridView,
  Layers,
  MenuBook,
  Workspaces,
} from "@mui/icons-material";
import CampusRequiredNotice from "@/components/dashboard/CampusRequiredNotice";
import ResourceSection from "@/components/dashboard/ResourceSection";
import TeachingAssignmentsSection, { TeachingAssignment } from "@/components/dashboard/TeachingAssignmentsSection";
import { useMessage } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { fetchAllUsers, UserLite } from "@/lib/users";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { peopleService } from "@/services/people.service";

interface AcademicItem {
  id: string;
  name: string;
  institutionId?: string;
  campusId?: string;
  levelId?: string;
  classId?: string;
  createdAt: string;
}

interface TeacherItem {
  id: string;
  userId: string;
  campusId: string;
}

interface AcademicsManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

export default function AcademicsManager({ institutionId }: AcademicsManagerProps) {
  const { showMessage } = useMessage();
  const runtime = useOptionalRuntimeConfig();
  // Platform console (institutionId set) is superadmin — always full access.
  const canManage = institutionId ? true : (runtime?.can("ACADEMICS", "manage") ?? true);

  // null = hub of structure cards; otherwise the open section.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [campuses, setCampuses] = useState<AcademicItem[]>([]);
  const [levels, setLevels] = useState<AcademicItem[]>([]);
  const [classes, setClasses] = useState<AcademicItem[]>([]);
  const [sections, setSections] = useState<AcademicItem[]>([]);
  const [subjects, setSubjects] = useState<AcademicItem[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);

  const load = useCallback(async () => {
    const [campusesRes, levelsRes, classesRes, sectionsRes, subjectsRes, assignmentsRes, teachersRes] = await Promise.all([
      apiHandler<{ items: AcademicItem[] }>(() => campusesService.getAll({ limit: 100 }), { showMessage, silent: true }),
      apiHandler<AcademicItem[]>(() => academicsService.getLevels(), { showMessage, silent: true }),
      apiHandler<AcademicItem[]>(() => academicsService.getClasses(), { showMessage, silent: true }),
      apiHandler<AcademicItem[]>(() => academicsService.getSections(), { showMessage, silent: true }),
      apiHandler<AcademicItem[]>(() => academicsService.getSubjects(), { showMessage, silent: true }),
      apiHandler<TeachingAssignment[]>(() => peopleService.getTeacherSubjects(), { showMessage, silent: true }),
      apiHandler<TeacherItem[]>(() => peopleService.getTeachers(), { showMessage, silent: true }),
    ]);

    const allCampuses = campusesRes.data?.items ?? [];
    const scopedCampuses = institutionId
      ? allCampuses.filter((c) => c.institutionId === institutionId)
      : allCampuses;
    const campusIds = new Set(scopedCampuses.map((c) => c.id));

    const scopedLevels = (levelsRes.data ?? []).filter(
      (l) => !institutionId || (l.campusId && campusIds.has(l.campusId))
    );
    const levelIds = new Set(scopedLevels.map((l) => l.id));

    const scopedClasses = (classesRes.data ?? []).filter(
      (c) => !institutionId || (c.levelId && levelIds.has(c.levelId))
    );
    const classIds = new Set(scopedClasses.map((c) => c.id));

    setCampuses(scopedCampuses);
    setLevels(scopedLevels);
    setClasses(scopedClasses);
    setSections((sectionsRes.data ?? []).filter((s) => !institutionId || (s.classId && classIds.has(s.classId))));
    setSubjects((subjectsRes.data ?? []).filter((s) => !institutionId || (s.classId && classIds.has(s.classId))));
    setAssignments(
      (assignmentsRes.data ?? []).filter((a) => !institutionId || campusIds.has(a.campusId))
    );
    setTeachers(
      (teachersRes.data ?? []).filter((t) => !institutionId || campusIds.has(t.campusId))
    );

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

  const campusName = useMemo(
    () => campuses.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [campuses]
  );
  const levelName = useMemo(
    () => levels.reduce<Record<string, string>>((acc, l) => ((acc[l.id] = l.name), acc), {}),
    [levels]
  );
  const className = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [classes]
  );
  const userMap = useMemo(
    () => users.reduce<Record<string, UserLite>>((acc, u) => ((acc[u.id] = u), acc), {}),
    [users]
  );
  const teacherName = useCallback(
    (teacherId: string) => {
      const teacher = teachers.find((t) => t.id === teacherId);
      return (teacher && userMap[teacher.userId]?.name) ?? "—";
    },
    [teachers, userMap]
  );

  const campusOptions = campuses.map((c) => ({ value: c.id, label: c.name }));
  const levelOptions = levels.map((l) => ({
    value: l.id,
    label: `${l.name}${l.campusId && campusName[l.campusId] ? ` — ${campusName[l.campusId]}` : ""}`,
  }));
  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.name}${c.levelId && levelName[c.levelId] ? ` — ${levelName[c.levelId]}` : ""}`,
  }));

  const crud = (
    create: (p: Record<string, unknown>) => Promise<unknown>,
    update: (id: string, p: Record<string, unknown>) => Promise<unknown>,
    remove: (id: string) => Promise<unknown>,
    label: string
  ) => (canManage ? {
    onCreate: async (payload: Record<string, unknown>) => {
      const { success } = await apiHandler(() => create(payload) as never, { showMessage, successMessage: `${label} created.` });
      if (success) load();
      return success;
    },
    onUpdate: async (id: string, payload: Record<string, unknown>) => {
      const { success } = await apiHandler(() => update(id, payload) as never, { showMessage, successMessage: `${label} updated.` });
      if (success) load();
      return success;
    },
    onDelete: async (id: string) => {
      const { success } = await apiHandler(() => remove(id) as never, { showMessage, successMessage: `${label} moved to recycle bin.` });
      if (success) load();
      return success;
    },
  } : {});

  const sectionDefs = [
    {
      key: "levels",
      label: "Levels",
      parent: "Campus",
      description: "Groupings like Primary, Secondary or O-Levels.",
      icon: <Layers />,
      count: levels.length,
    },
    {
      key: "classes",
      label: "Classes",
      parent: "Level",
      description: "Grade 1, Grade 2 — classes inside a level.",
      icon: <Workspaces />,
      count: classes.length,
    },
    {
      key: "sections",
      label: "Sections",
      parent: "Class",
      description: "A, B, Blue, Green — splits of a class.",
      icon: <GridView />,
      count: sections.length,
    },
    {
      key: "subjects",
      label: "Subjects",
      parent: "Class",
      description: "What each class is taught.",
      icon: <MenuBook />,
      count: subjects.length,
    },
    {
      key: "assignments",
      label: "Teaching Assignments",
      parent: "Section",
      description: "Which teacher takes which subject per section.",
      icon: <AssignmentInd />,
      count: assignments.length,
    },
  ];

  if (!loading && campuses.length === 0) {
    return (
      <CampusRequiredNotice
        moduleLabel="academic"
        ctaHref={institutionId ? undefined : "/dashboard/campuses"}
      />
    );
  }

  if (!activeKey) {
    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your structure flows top-down: <strong>Campus → Level → Class → Sections & Subjects</strong>,
          then assign teachers per section. Set them up in that order.
        </Typography>
        <Grid container spacing={2}>
          {sectionDefs.map((section) => (
            <Grid key={section.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
                }}
              >
                <CardActionArea onClick={() => setActiveKey(section.key)} sx={{ height: "100%", alignItems: "stretch" }}>
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
                          label={section.count}
                          size="small"
                          color={section.count > 0 ? "primary" : "default"}
                          variant={section.count > 0 ? "filled" : "outlined"}
                        />
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{section.label}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                      inside a {section.parent.toLowerCase()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1, mt: 0.5 }}>
                      {section.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  }

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        color="inherit"
        onClick={() => setActiveKey(null)}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        All Academics
      </Button>

      {activeKey === "levels" && (
        <ResourceSection
          title="Levels"
          subtitle="Top-level groupings like Primary, Secondary or O-Levels."
          rows={levels}
          loading={loading}
          columns={[
            { key: "name", label: "Name" },
            { key: "campusId", label: "Campus", render: (r) => campusName[r.campusId ?? ""] ?? "—" },
            { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
          ]}
          fields={[
            { key: "name", label: "Level Name", required: true },
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true },
          ]}
          {...crud(academicsService.createLevel, academicsService.updateLevel, academicsService.deleteLevel, "Level")}
        />
      )}

      {activeKey === "classes" && (
        <ResourceSection
          title="Classes"
          singular="Class"
          subtitle="Classes within a level, e.g. Grade 1, Grade 2."
          rows={classes}
          loading={loading}
          columns={[
            { key: "name", label: "Name" },
            { key: "levelId", label: "Level", render: (r) => levelName[r.levelId ?? ""] ?? "—" },
            { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
          ]}
          fields={[
            { key: "name", label: "Class Name", required: true },
            { key: "levelId", label: "Level", type: "select", options: levelOptions, required: true },
          ]}
          {...crud(academicsService.createClass, academicsService.updateClass, academicsService.deleteClass, "Class")}
        />
      )}

      {activeKey === "sections" && (
        <ResourceSection
          title="Sections"
          subtitle="Sections within a class, e.g. A, B, Blue, Green."
          rows={sections}
          loading={loading}
          columns={[
            { key: "name", label: "Name" },
            { key: "classId", label: "Class", render: (r) => className[r.classId ?? ""] ?? "—" },
            { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
          ]}
          fields={[
            { key: "name", label: "Section Name", required: true },
            { key: "classId", label: "Class", type: "select", options: classOptions, required: true },
          ]}
          {...crud(academicsService.createSection, academicsService.updateSection, academicsService.deleteSection, "Section")}
        />
      )}

      {activeKey === "assignments" && (
        <TeachingAssignmentsSection
          assignments={assignments}
          loading={loading}
          teachers={teachers}
          teacherName={teacherName}
          campuses={campuses}
          levels={levels}
          classes={classes}
          sections={sections}
          subjects={subjects}
          canManage={canManage}
          onReload={load}
        />
      )}

      {activeKey === "subjects" && (
        <ResourceSection
          title="Subjects"
          subtitle="Subjects taught in each class."
          rows={subjects}
          loading={loading}
          columns={[
            { key: "name", label: "Name" },
            { key: "classId", label: "Class", render: (r) => className[r.classId ?? ""] ?? "—" },
            { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
          ]}
          fields={[
            { key: "name", label: "Subject Name", required: true },
            { key: "classId", label: "Class", type: "select", options: classOptions, required: true },
          ]}
          {...crud(academicsService.createSubject, academicsService.updateSubject, academicsService.deleteSubject, "Subject")}
        />
      )}
    </>
  );
}
