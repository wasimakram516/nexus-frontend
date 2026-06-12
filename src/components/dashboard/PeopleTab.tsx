"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  AutoFixHigh,
  Delete,
  Edit,
  Link as LinkIcon,
  NavigateNext,
  Search,
  TrendingUp,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { UserLite } from "@/lib/users";
import { authService } from "@/services/auth.service";
import { peopleService } from "@/services/people.service";

export type PersonKind = "students" | "teachers" | "guardians";

export interface PersonRecord {
  id: string;
  userId: string;
  campusId: string;
  // student fields
  regNo?: string;
  dob?: string;
  gender?: string;
  cnic?: string;
  classId?: string | null;
  sectionId?: string | null;
  religion?: string;
  admissionDate?: string;
  prevSchool?: string;
  reference?: string;
  /** Guardian links embedded on student rows. */
  guardians?: Array<{ id: string; guardianId: string }>;
  // guardian fields
  relation?: string;
  /** Student links embedded on guardian rows. */
  students?: Array<{ id: string; studentId: string }>;
  createdAt: string;
}

export interface NamedItem {
  id: string;
  name: string;
}

interface PeopleTabProps {
  kind: PersonKind;
  rows: PersonRecord[];
  loading: boolean;
  users: UserLite[];
  campuses: NamedItem[];
  classes: NamedItem[];
  sections: (NamedItem & { classId?: string })[];
  students: PersonRecord[];
  guardians: PersonRecord[];
  onReload: () => void;
  /** Set when a superadmin manages another institution — forwarded to account registration. */
  institutionId?: string;
  /** When false the tab is read-only (no create/edit/delete/actions). */
  canManage?: boolean;
}

const KIND_CONFIG: Record<PersonKind, { singular: string; role: string }> = {
  students: { singular: "Student", role: "STUDENT" },
  teachers: { singular: "Teacher", role: "TEACHER" },
  guardians: { singular: "Guardian", role: "GUARDIAN" },
};

const GENDERS = ["MALE", "FEMALE", "OTHER"];
const RELIGIONS = ["ISLAM", "CHRISTIANITY", "HINDUISM", "OTHER"];
const RELATIONS = ["FATHER", "MOTHER", "UNCLE", "AUNT", "OTHER"];

const emptyProfile = {
  regNo: "",
  dob: "",
  gender: "",
  cnic: "",
  classId: "",
  sectionId: "",
  campusId: "",
  religion: "",
  admissionDate: new Date().toISOString().slice(0, 10),
  prevSchool: "",
  reference: "",
  relation: "",
};

const emptyAccount = { name: "", email: "", password: "" };

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%";
  const values = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

/** Small uppercase section label used to group dialog fields. */
function FieldGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, display: "block" }}
    >
      {children}
    </Typography>
  );
}

export default function PeopleTab({
  kind,
  rows,
  loading,
  users,
  campuses,
  classes,
  sections,
  students,
  guardians,
  onReload,
  institutionId,
  canManage = true,
}: PeopleTabProps) {
  const { showMessage } = useMessage();
  const confirm = useConfirm();
  const cfg = KIND_CONFIG[kind];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PersonRecord | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState(emptyAccount);
  const [profile, setProfile] = useState(emptyProfile);
  const [confirmDelete, setConfirmDelete] = useState<PersonRecord | null>(null);

  // List filters
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Student create — guardians attached inline (step 3)
  type PendingGuardian =
    | { mode: "existing"; guardianId: string }
    | { mode: "new"; name: string; email: string; relation: string; password: string };
  const [pendingGuardians, setPendingGuardians] = useState<PendingGuardian[]>([]);
  const [newGuardian, setNewGuardian] = useState({ name: "", email: "", relation: "FATHER" });

  // Guardian create — students linked inline
  const [linkStudentIds, setLinkStudentIds] = useState<string[]>([]);

  // Guardian "manage students" dialog
  const [manageRowId, setManageRowId] = useState<string | null>(null);
  const [manageStudentId, setManageStudentId] = useState("");
  const [manageLinking, setManageLinking] = useState(false);

  // Secondary action dialogs (promote / link guardian / assign subject)
  const [actionRow, setActionRow] = useState<PersonRecord | null>(null);
  const [actionForm, setActionForm] = useState<Record<string, string>>({});
  const [actionSaving, setActionSaving] = useState(false);

  const userMap = useMemo(
    () => users.reduce<Record<string, UserLite>>((acc, u) => ((acc[u.id] = u), acc), {}),
    [users]
  );
  const campusMap = useMemo(
    () => campuses.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [campuses]
  );
  const classMap = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [classes]
  );

  const linkedUserIds = useMemo(() => new Set(rows.map((r) => r.userId)), [rows]);
  const availableUsers = useMemo(
    () => users.filter((u) => u.role === cfg.role && !linkedUserIds.has(u.id)),
    [users, cfg.role, linkedUserIds]
  );

  const guardianLabel = (guardianId: string) => {
    const guardian = guardians.find((g) => g.id === guardianId);
    return (guardian && userMap[guardian.userId]?.name) ?? "Guardian";
  };
  const studentLabel = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return "Student";
    const name = userMap[student.userId]?.name ?? "Student";
    return student.regNo ? `${name} (${student.regNo})` : name;
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (campusFilter && row.campusId !== campusFilter) return false;
      if (kind === "students" && classFilter && row.classId !== classFilter) return false;
      if (query) {
        const u = userMap[row.userId];
        const haystack = [u?.name, u?.email, row.regNo, row.cnic, row.relation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, search, campusFilter, classFilter, kind, userMap]);

  const filtersActive = Boolean(search.trim() || campusFilter || classFilter);

  const clearFilters = () => {
    setSearch("");
    setCampusFilter("");
    setClassFilter("");
  };

  const setP = (key: keyof typeof emptyProfile, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));
  const setA = (key: keyof typeof emptyAccount, value: string) =>
    setAccount((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setAccount(emptyAccount);
    setProfile({ ...emptyProfile, campusId: campuses.length === 1 ? campuses[0].id : "" });
    setPendingGuardians([]);
    setNewGuardian({ name: "", email: "", relation: "FATHER" });
    setLinkStudentIds([]);
    setActiveStep(0);
    setAttempted(false);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (row: PersonRecord) => {
    setEditing(row);
    setProfile({
      regNo: row.regNo ?? "",
      dob: row.dob?.slice(0, 10) ?? "",
      gender: row.gender ?? "",
      cnic: row.cnic ?? "",
      classId: row.classId ?? "",
      sectionId: row.sectionId ?? "",
      campusId: row.campusId ?? "",
      religion: row.religion ?? "",
      admissionDate: row.admissionDate?.slice(0, 10) ?? "",
      prevSchool: row.prevSchool ?? "",
      reference: row.reference ?? "",
      relation: row.relation ?? "",
    });
    setActiveStep(1);
    setAttempted(false);
    setDialogOpen(true);
  };

  const buildProfilePayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = { campusId: profile.campusId };
    if (kind === "students") {
      Object.assign(payload, {
        regNo: profile.regNo,
        dob: profile.dob,
        gender: profile.gender,
        admissionDate: profile.admissionDate,
        ...(profile.cnic && { cnic: profile.cnic }),
        ...(profile.classId && { classId: profile.classId }),
        ...(profile.sectionId && { sectionId: profile.sectionId }),
        ...(profile.religion && { religion: profile.religion }),
        ...(profile.prevSchool && { prevSchool: profile.prevSchool }),
        ...(profile.reference && { reference: profile.reference }),
      });
    } else if (kind === "teachers") {
      Object.assign(payload, {
        gender: profile.gender,
        ...(profile.cnic && { cnic: profile.cnic }),
      });
    } else {
      Object.assign(payload, { relation: profile.relation });
    }
    return payload;
  };

  const emailLooksValid = /.+@.+\..+/.test(account.email);

  // Typing the email of an unlinked same-role account links it instead of
  // creating a new one — accounts and profiles are separate records.
  const matchedUser = useMemo(
    () =>
      availableUsers.find(
        (u) => u.email.toLowerCase() === account.email.trim().toLowerCase()
      ) ?? null,
    [availableUsers, account.email]
  );

  const accountValid = matchedUser
    ? true
    : Boolean(account.name && emailLooksValid && account.password.length >= 8);

  const profileValid =
    Boolean(profile.campusId) &&
    (kind === "students"
      ? Boolean(profile.regNo && profile.dob && profile.gender && profile.admissionDate)
      : kind === "teachers"
        ? Boolean(profile.gender)
        : Boolean(profile.relation));

  const goToProfile = () => {
    setAttempted(true);
    if (!accountValid) return;
    setAttempted(false);
    setActiveStep(1);
  };

  const goToGuardians = () => {
    setAttempted(true);
    if (!profileValid) return;
    setAttempted(false);
    setActiveStep(2);
  };

  const handleSave = async () => {
    setAttempted(true);
    if (!profileValid) return;
    setSaving(true);

    if (editing) {
      const update =
        kind === "students"
          ? peopleService.updateStudent
          : kind === "teachers"
            ? peopleService.updateTeacher
            : peopleService.updateGuardian;
      const { success } = await apiHandler(() => update(editing.id, buildProfilePayload()), {
        showMessage,
        successMessage: `${cfg.singular} updated.`,
      });
      setSaving(false);
      if (success) {
        setDialogOpen(false);
        onReload();
      }
      return;
    }

    let userId = matchedUser?.id ?? "";
    if (!matchedUser) {
      const { data, success } = await apiHandler(
        () =>
          authService.register({
            name: account.name,
            email: account.email,
            password: account.password,
            role: cfg.role,
            ...(institutionId && { institutionId }),
          }),
        { showMessage, silent: true }
      );
      if (!success || !data) {
        setSaving(false);
        return;
      }
      userId = (data as { id: string }).id;
    }

    const create =
      kind === "students"
        ? peopleService.createStudent
        : kind === "teachers"
          ? peopleService.createTeacher
          : peopleService.createGuardian;

    const { data: created, success } = await apiHandler<{ id: string }>(
      () => create({ userId, ...buildProfilePayload() }) as never,
      { showMessage, successMessage: `${cfg.singular} created.` }
    );
    if (!success || !created) {
      setSaving(false);
      return;
    }

    // Chain relationship links so nobody has to do a second "linking" pass.
    if (kind === "students" && pendingGuardians.length > 0) {
      for (const pending of pendingGuardians) {
        let guardianId = pending.mode === "existing" ? pending.guardianId : "";
        if (pending.mode === "new") {
          const { data: regData, success: regOk } = await apiHandler(
            () =>
              authService.register({
                name: pending.name,
                email: pending.email,
                password: pending.password,
                role: "GUARDIAN",
                ...(institutionId && { institutionId }),
              }),
            { showMessage, silent: true }
          );
          if (!regOk || !regData) continue;
          const { data: guardianData, success: guardianOk } = await apiHandler<{ id: string }>(
            () =>
              peopleService.createGuardian({
                userId: (regData as { id: string }).id,
                campusId: profile.campusId,
                relation: pending.relation,
              }) as never,
            { showMessage, silent: true }
          );
          if (!guardianOk || !guardianData) continue;
          guardianId = guardianData.id;
        }
        if (guardianId) {
          await apiHandler(
            () => peopleService.linkGuardianToStudent({ studentId: created.id, guardianId }),
            { showMessage, silent: true }
          );
        }
      }
      showMessage("Guardians linked.", "success");
    }

    if (kind === "guardians" && linkStudentIds.length > 0) {
      for (const studentId of linkStudentIds) {
        await apiHandler(
          () => peopleService.linkGuardianToStudent({ studentId, guardianId: created.id }),
          { showMessage, silent: true }
        );
      }
      showMessage(`Linked to ${linkStudentIds.length} student${linkStudentIds.length !== 1 ? "s" : ""}.`, "success");
    }

    setSaving(false);
    setDialogOpen(false);
    onReload();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const remove =
      kind === "students"
        ? peopleService.deleteStudent
        : kind === "teachers"
          ? peopleService.deleteTeacher
          : peopleService.deleteGuardian;
    await apiHandler(() => remove(confirmDelete.id), {
      showMessage,
      successMessage: `${cfg.singular} moved to recycle bin.`,
    });
    setConfirmDelete(null);
    onReload();
  };

  const openAction = (row: PersonRecord) => {
    setActionRow(row);
    setActionForm({
      newClassId: "",
      newSectionId: "",
      promotionDate: new Date().toISOString().slice(0, 10),
      promotionReason: "",
    });
  };

  const setAF = (key: string, value: string) => setActionForm((prev) => ({ ...prev, [key]: value }));

  const handleAction = async () => {
    if (!actionRow) return;
    setActionSaving(true);
    await apiHandler(
      () =>
        peopleService.recordStudentPromotion({
          studentId: actionRow.id,
          ...(actionRow.classId && { previousClassId: actionRow.classId }),
          ...(actionRow.sectionId && { previousSectionId: actionRow.sectionId }),
          ...(actionForm.newClassId && { newClassId: actionForm.newClassId }),
          ...(actionForm.newSectionId && { newSectionId: actionForm.newSectionId }),
          promotionDate: actionForm.promotionDate,
          ...(actionForm.promotionReason && { promotionReason: actionForm.promotionReason }),
        }),
      { showMessage, successMessage: "Promotion recorded." }
    );
    setActionSaving(false);
    setActionRow(null);
    onReload();
  };

  const actionValid = Boolean(actionForm.promotionDate);

  // --- Guardian ↔ students management -----------------------------------

  const manageRow = rows.find((r) => r.id === manageRowId) ?? null;
  const manageLinks = manageRow?.students ?? [];
  const manageLinkedStudentIds = new Set(manageLinks.map((l) => l.studentId));
  const manageableStudents = students.filter((s) => !manageLinkedStudentIds.has(s.id));

  const openManage = (row: PersonRecord) => {
    setManageRowId(row.id);
    setManageStudentId("");
  };

  const handleManageLink = async () => {
    if (!manageRowId || !manageStudentId) return;
    setManageLinking(true);
    const { success } = await apiHandler(
      () => peopleService.linkGuardianToStudent({ studentId: manageStudentId, guardianId: manageRowId }),
      { showMessage, successMessage: "Student linked." }
    );
    setManageLinking(false);
    if (success) {
      setManageStudentId("");
      onReload();
    }
  };

  const handleUnlink = async (link: { id: string; studentId: string }) => {
    const ok = await confirm({
      title: "Unlink Student",
      message: `Remove the link between ${userMap[manageRow?.userId ?? ""]?.name ?? "this guardian"} and ${studentLabel(link.studentId)}?`,
      confirmLabel: "Unlink",
      confirmColor: "error",
    });
    if (!ok) return;
    const { success } = await apiHandler(() => peopleService.unlinkGuardian(link.id), {
      showMessage,
      successMessage: "Student unlinked.",
    });
    if (success) onReload();
  };

  const sectionsForClass = (classId: string) =>
    sections.filter((s) => !s.classId || s.classId === classId);

  const accountSummary = matchedUser
    ? `${matchedUser.name} · ${matchedUser.email} (linking existing account)`
    : `${account.name || "New account"} · ${account.email || "no email"} (new ${cfg.role.toLowerCase()} account)`;

  const err = (condition: boolean) => attempted && condition;

  // ---------------------------------------------------------------- rendering

  const renderAccountStep = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <FieldGroupLabel>Sign-in account</FieldGroupLabel>
        <Typography variant="caption" color="text.disabled">
          Every {cfg.singular.toLowerCase()} signs in with an email. If that email already has an
          unlinked {cfg.role.toLowerCase()} account, we link it — otherwise a new account is created.
        </Typography>
      </Box>

      {!matchedUser && (
        <TextField
          label="Full Name"
          required
          autoFocus
          value={account.name}
          onChange={(e) => setA("name", e.target.value)}
          error={err(!account.name)}
          helperText={err(!account.name) ? "Name is required." : " "}
          fullWidth
          slotProps={{ htmlInput: { autoComplete: "off", name: "person-full-name" } }}
        />
      )}

      <Autocomplete
        freeSolo
        options={availableUsers}
        getOptionLabel={(option) => (typeof option === "string" ? option : option.email)}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">{option.email} · unlinked account</Typography>
            </Box>
          </li>
        )}
        inputValue={account.email}
        onInputChange={(_, value) => setA("email", value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Email Address"
            type="email"
            required
            slotProps={{
              ...params.slotProps,
              htmlInput: { ...params.slotProps.htmlInput, autoComplete: "off", name: "person-email" },
            }}
            error={err(!emailLooksValid)}
            helperText={
              err(!emailLooksValid)
                ? "Enter a valid email — it's used to sign in."
                : availableUsers.length > 0
                  ? `Tip: ${availableUsers.length} unlinked ${cfg.role.toLowerCase()} account${availableUsers.length !== 1 ? "s" : ""} exist — pick one from the suggestions to link instead.`
                  : "Used to sign in."
            }
          />
        )}
      />

      {matchedUser ? (
        <Alert severity="success" sx={{ py: 0.5 }}>
          <Typography variant="body2">
            Existing account found: <strong>{matchedUser.name}</strong>. The new{" "}
            {cfg.singular.toLowerCase()} profile will be linked to it — no new account or password needed.
          </Typography>
        </Alert>
      ) : (
        <>
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            value={account.password}
            onChange={(e) => setA("password", e.target.value)}
            error={err(account.password.length < 8)}
            helperText={
              err(account.password.length < 8)
                ? "At least 8 characters."
                : "At least 8 characters. Use Generate for a strong one and share it securely."
            }
            fullWidth
            slotProps={{
              htmlInput: { autoComplete: "new-password", name: "person-new-password" },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Generate strong password">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setA("password", generatePassword());
                          setShowPassword(true);
                        }}
                      >
                        <AutoFixHigh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" edge="end" onClick={() => setShowPassword((p) => !p)}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </>
      )}
    </Box>
  );

  const renderProfileStep = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {!editing && accountSummary && (
        <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
          <Typography variant="caption">{accountSummary}</Typography>
        </Alert>
      )}

      <Grid container spacing={2.5}>
        {kind === "students" && (
          <>
            <Grid size={{ xs: 12 }}>
              <FieldGroupLabel>Enrollment</FieldGroupLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Campus" required value={profile.campusId}
                onChange={(e) => setP("campusId", e.target.value)} fullWidth
                error={err(!profile.campusId)}
                helperText={err(!profile.campusId) ? "Campus is required." : undefined}
              >
                {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Registration No" required value={profile.regNo}
                onChange={(e) => setP("regNo", e.target.value)} fullWidth
                error={err(!profile.regNo)}
                helperText={err(!profile.regNo) ? "Registration number is required." : undefined}
                placeholder="e.g. STD-0042"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Admission Date" type="date" required value={profile.admissionDate}
                onChange={(e) => setP("admissionDate", e.target.value)} fullWidth
                error={err(!profile.admissionDate)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Class" value={profile.classId} onChange={(e) => { setP("classId", e.target.value); setP("sectionId", ""); }} fullWidth>
                <MenuItem value="">—</MenuItem>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select label="Section" value={profile.sectionId} onChange={(e) => setP("sectionId", e.target.value)} fullWidth disabled={!profile.classId}>
                <MenuItem value="">—</MenuItem>
                {sectionsForClass(profile.classId).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FieldGroupLabel>Identity</FieldGroupLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Date of Birth" type="date" required value={profile.dob}
                onChange={(e) => setP("dob", e.target.value)} fullWidth
                error={err(!profile.dob)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                select label="Gender" required value={profile.gender}
                onChange={(e) => setP("gender", e.target.value)} fullWidth
                error={err(!profile.gender)}
              >
                {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField select label="Religion" value={profile.religion} onChange={(e) => setP("religion", e.target.value)} fullWidth>
                <MenuItem value="">—</MenuItem>
                {RELIGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="CNIC / B-Form" value={profile.cnic} onChange={(e) => setP("cnic", e.target.value)} fullWidth placeholder="00000-0000000-0" />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FieldGroupLabel>Background (optional)</FieldGroupLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Previous School" value={profile.prevSchool} onChange={(e) => setP("prevSchool", e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Reference" value={profile.reference} onChange={(e) => setP("reference", e.target.value)} fullWidth placeholder="Who referred this admission?" />
            </Grid>
          </>
        )}

        {kind === "teachers" && (
          <>
            <Grid size={{ xs: 12 }}>
              <FieldGroupLabel>Placement</FieldGroupLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Campus" required value={profile.campusId}
                onChange={(e) => setP("campusId", e.target.value)} fullWidth
                error={err(!profile.campusId)}
                helperText={err(!profile.campusId) ? "Campus is required." : undefined}
              >
                {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FieldGroupLabel>Identity</FieldGroupLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Gender" required value={profile.gender}
                onChange={(e) => setP("gender", e.target.value)} fullWidth
                error={err(!profile.gender)}
              >
                {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="CNIC" value={profile.cnic} onChange={(e) => setP("cnic", e.target.value)} fullWidth placeholder="00000-0000000-0" />
            </Grid>
          </>
        )}

        {kind === "guardians" && (
          <>
            <Grid size={{ xs: 12 }}>
              <FieldGroupLabel>Details</FieldGroupLabel>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Campus" required value={profile.campusId}
                onChange={(e) => setP("campusId", e.target.value)} fullWidth
                error={err(!profile.campusId)}
                helperText={err(!profile.campusId) ? "Campus is required." : undefined}
              >
                {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select label="Relation to Student" required value={profile.relation}
                onChange={(e) => setP("relation", e.target.value)} fullWidth
                error={err(!profile.relation)}
              >
                {RELATIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            {!editing && (
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={students}
                  getOptionLabel={(s) => studentLabel(s.id)}
                  value={students.filter((s) => linkStudentIds.includes(s.id))}
                  onChange={(_, value) => setLinkStudentIds(value.map((s) => s.id))}
                  noOptionsText="No students yet — you can link later from the table."
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Link to students (optional)"
                      helperText="Attach this guardian to their children right away."
                    />
                  )}
                />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );

  const renderGuardiansStep = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <FieldGroupLabel>Guardians (optional)</FieldGroupLabel>
        <Typography variant="caption" color="text.disabled">
          Attach parents or guardians now — link existing ones or create new guardian accounts inline.
          You can always manage links later from the Guardians table.
        </Typography>
      </Box>

      {pendingGuardians.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {pendingGuardians.map((pending, index) => (
            <Alert
              key={index}
              severity={pending.mode === "existing" ? "info" : "success"}
              icon={false}
              onClose={() => setPendingGuardians((prev) => prev.filter((_, i) => i !== index))}
              sx={{ py: 0.25 }}
            >
              <Typography variant="caption">
                {pending.mode === "existing"
                  ? `Link: ${guardianLabel(pending.guardianId)}`
                  : `New guardian: ${pending.name} · ${pending.email} (${pending.relation}) — password auto-generated: ${pending.password}`}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      <Autocomplete
        options={guardians.filter(
          (g) => !pendingGuardians.some((p) => p.mode === "existing" && p.guardianId === g.id)
        )}
        getOptionLabel={(g) => `${userMap[g.userId]?.name ?? "Guardian"} (${userMap[g.userId]?.email ?? "—"})`}
        value={null}
        onChange={(_, value) => {
          if (value) {
            setPendingGuardians((prev) => [...prev, { mode: "existing", guardianId: value.id }]);
          }
        }}
        noOptionsText="No existing guardians found."
        renderInput={(params) => (
          <TextField {...params} label="Link an existing guardian" />
        )}
      />

      <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, p: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1.5 }}>
          Or create a new guardian
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              size="small" label="Name" value={newGuardian.name}
              onChange={(e) => setNewGuardian((p) => ({ ...p, name: e.target.value }))}
              fullWidth slotProps={{ htmlInput: { autoComplete: "off", name: "inline-guardian-name" } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              size="small" label="Email" type="email" value={newGuardian.email}
              onChange={(e) => setNewGuardian((p) => ({ ...p, email: e.target.value }))}
              fullWidth slotProps={{ htmlInput: { autoComplete: "off", name: "inline-guardian-email" } }}
            />
          </Grid>
          <Grid size={{ xs: 8, sm: 2.5 }}>
            <TextField
              select size="small" label="Relation" value={newGuardian.relation}
              onChange={(e) => setNewGuardian((p) => ({ ...p, relation: e.target.value }))} fullWidth
            >
              {RELATIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, sm: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ height: "100%" }}
              disabled={!newGuardian.name || !/.+@.+\..+/.test(newGuardian.email)}
              onClick={() => {
                setPendingGuardians((prev) => [
                  ...prev,
                  { mode: "new", ...newGuardian, password: generatePassword() },
                ]);
                setNewGuardian({ name: "", email: "", relation: "FATHER" });
              }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
          A sign-in account with a generated password is created for each new guardian — note it down to share.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filtersActive
            ? `${filteredRows.length} of ${rows.length} shown.`
            : `${rows.length} ${kind === "students" ? "student" : kind === "teachers" ? "teacher" : "guardian"}${rows.length !== 1 ? "s" : ""} registered.`}
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add {cfg.singular}
          </Button>
        )}
      </Box>

      {/* Search & filters */}
      {rows.length > 0 && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder={
              kind === "students"
                ? "Search name, email, reg no, CNIC..."
                : "Search name, email, CNIC..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Campus"
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All Campuses</MenuItem>
            {campuses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          {kind === "students" && (
            <TextField
              select
              size="small"
              label="Class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}
          {filtersActive && (
            <Button size="small" onClick={clearFilters} sx={{ color: "text.secondary" }}>
              Clear
            </Button>
          )}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: canManage ? 2 : 0 }}>No {kind} yet.</Typography>
            {canManage && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add First {cfg.singular}</Button>
            )}
          </CardContent>
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No {kind} match your search or filters.
            </Typography>
            <Button variant="outlined" onClick={clearFilters}>Clear Filters</Button>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                {kind === "students" && <TableCell sx={{ fontWeight: 700 }}>Reg No</TableCell>}
                {kind === "students" && <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>}
                {kind === "students" && <TableCell sx={{ fontWeight: 700 }}>Guardians</TableCell>}
                {kind !== "guardians" && <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>}
                {kind === "guardians" && <TableCell sx={{ fontWeight: 700 }}>Relation</TableCell>}
                {kind === "guardians" && <TableCell sx={{ fontWeight: 700 }}>Students</TableCell>}
                <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Added</TableCell>
                {canManage && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => {
                const u = userMap[row.userId];
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u?.name ?? "—"}</TableCell>
                    <TableCell>{u?.email ?? "—"}</TableCell>
                    {kind === "students" && <TableCell>{row.regNo ?? "—"}</TableCell>}
                    {kind === "students" && (
                      <TableCell>{row.classId ? classMap[row.classId] ?? "—" : "—"}</TableCell>
                    )}
                    {kind === "students" && (
                      <TableCell>
                        {(row.guardians ?? []).length === 0
                          ? "—"
                          : (row.guardians ?? [])
                              .slice(0, 2)
                              .map((l) => guardianLabel(l.guardianId))
                              .join(", ") +
                            ((row.guardians ?? []).length > 2 ? ` +${(row.guardians ?? []).length - 2}` : "")}
                      </TableCell>
                    )}
                    {kind !== "guardians" && (
                      <TableCell>{row.gender ? <Chip label={row.gender} size="small" /> : "—"}</TableCell>
                    )}
                    {kind === "guardians" && (
                      <TableCell>{row.relation ? <Chip label={row.relation} size="small" /> : "—"}</TableCell>
                    )}
                    {kind === "guardians" && (
                      <TableCell>
                        {(row.students ?? []).length === 0
                          ? "—"
                          : (row.students ?? [])
                              .slice(0, 2)
                              .map((l) => studentLabel(l.studentId))
                              .join(", ") +
                            ((row.students ?? []).length > 2 ? ` +${(row.students ?? []).length - 2}` : "")}
                      </TableCell>
                    )}
                    <TableCell>{campusMap[row.campusId] ?? "—"}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    {canManage && (
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {kind === "students" && (
                          <Tooltip title="Promote Student">
                            <IconButton size="small" onClick={() => openAction(row)}><TrendingUp fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {kind === "guardians" && (
                          <Tooltip title="Manage Students">
                            <IconButton size="small" onClick={() => openManage(row)}><LinkIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(row)}><Delete fontSize="small" /></IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete ${cfg.singular}`}
        message={`Are you sure you want to delete "${userMap[confirmDelete?.userId ?? ""]?.name ?? "this record"}"? It will be moved to the recycle bin.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={saving ? undefined : () => setDialogOpen(false)}
        maxWidth={kind === "students" ? "md" : "sm"}
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: editing ? undefined : 1 }}>
          {editing ? `Edit ${cfg.singular}` : `New ${cfg.singular}`}
          {editing && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
              {userMap[editing.userId]?.name} · {userMap[editing.userId]?.email}
            </Typography>
          )}
        </DialogTitle>

        {!editing && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Stepper activeStep={activeStep}>
              <Step completed={activeStep > 0}><StepLabel>Account</StepLabel></Step>
              <Step completed={activeStep > 1}><StepLabel>{cfg.singular} Profile</StepLabel></Step>
              {kind === "students" && (
                <Step><StepLabel>Guardians</StepLabel></Step>
              )}
            </Stepper>
          </Box>
        )}

        <DialogContent sx={{ pt: "16px !important" }}>
          {editing
            ? renderProfileStep()
            : activeStep === 0
              ? renderAccountStep()
              : activeStep === 1
                ? renderProfileStep()
                : renderGuardiansStep()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {!editing && activeStep > 0 && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => { setAttempted(false); setActiveStep(activeStep - 1); }}
              disabled={saving}
            >
              Back
            </Button>
          )}
          {!editing && activeStep === 0 ? (
            <Button variant="contained" endIcon={<NavigateNext />} onClick={goToProfile}>
              Continue
            </Button>
          ) : !editing && kind === "students" && activeStep === 1 ? (
            <Button variant="contained" endIcon={<NavigateNext />} onClick={goToGuardians}>
              Continue
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving
                ? <CircularProgress size={16} color="inherit" />
                : editing
                  ? "Save Changes"
                  : kind === "students" && pendingGuardians.length > 0
                    ? `Create Student + ${pendingGuardians.length} Guardian Link${pendingGuardians.length !== 1 ? "s" : ""}`
                    : `Create ${cfg.singular}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Promote dialog (students) */}
      <Dialog open={!!actionRow} onClose={() => setActionRow(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Promote Student
          {actionRow && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
              {userMap[actionRow.userId]?.name ?? cfg.singular}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField select label="New Class" value={actionForm.newClassId ?? ""} onChange={(e) => { setAF("newClassId", e.target.value); setAF("newSectionId", ""); }} fullWidth>
                <MenuItem value="">—</MenuItem>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="New Section" value={actionForm.newSectionId ?? ""} onChange={(e) => setAF("newSectionId", e.target.value)} fullWidth disabled={!actionForm.newClassId}>
                <MenuItem value="">—</MenuItem>
                {sectionsForClass(actionForm.newClassId ?? "").map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Promotion Date *" type="date" value={actionForm.promotionDate ?? ""} onChange={(e) => setAF("promotionDate", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Reason" value={actionForm.promotionReason ?? ""} onChange={(e) => setAF("promotionReason", e.target.value)} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setActionRow(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAction} disabled={actionSaving || !actionValid}>
            {actionSaving ? <CircularProgress size={16} color="inherit" /> : "Promote Student"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage students dialog (guardians) */}
      <Dialog open={!!manageRow} onClose={() => setManageRowId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Manage Students
          {manageRow && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 400 }}>
              {userMap[manageRow.userId]?.name} · {manageRow.relation ?? "Guardian"}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
            <Autocomplete
              fullWidth
              size="small"
              options={manageableStudents}
              getOptionLabel={(s) => studentLabel(s.id)}
              value={manageableStudents.find((s) => s.id === manageStudentId) ?? null}
              onChange={(_, value) => setManageStudentId(value?.id ?? "")}
              noOptionsText="No more students to link."
              renderInput={(params) => <TextField {...params} label="Link a student" />}
            />
            <Button
              variant="contained"
              onClick={handleManageLink}
              disabled={!manageStudentId || manageLinking}
              sx={{ flexShrink: 0 }}
            >
              {manageLinking ? <CircularProgress size={16} color="inherit" /> : "Link"}
            </Button>
          </Box>

          {manageLinks.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No students linked yet.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {manageLinks.map((link) => (
                <Box
                  key={link.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {studentLabel(link.studentId)}
                  </Typography>
                  <Tooltip title="Unlink">
                    <IconButton size="small" color="error" onClick={() => handleUnlink(link)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setManageRowId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
