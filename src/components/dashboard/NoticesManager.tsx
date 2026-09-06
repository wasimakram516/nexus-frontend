"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  LinearProgress,
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, AttachFile, Delete, Edit } from "@mui/icons-material";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import { UserRole } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { uploadFile, UploadResult } from "@/lib/upload";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { noticesService } from "@/services/notices.service";

/** Notice attachments reuse UploadResult's shape 1:1 (see the M3 design doc, § 7.3). */
export type NoticeAttachment = UploadResult;

export interface Notice {
  id: string;
  institutionId: string;
  campusId?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  targetRole?: UserRole | null;
  title: string;
  body: string;
  attachments?: NoticeAttachment[] | null;
  publishAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NamedItem {
  id: string;
  name: string;
}

/** Campuses carry institutionId so the platform-console path can filter the
 *  cross-institution list GET /campuses returns for a SUPERADMIN caller down
 *  to just this institution's own campuses (see the load() comment below). */
interface CampusItem extends NamedItem {
  institutionId?: string;
}

/** AcademicClass has no direct campusId (only levelId) — see schema.prisma. */
interface LevelItem {
  id: string;
  campusId?: string;
}

interface ClassItem extends NamedItem {
  levelId?: string;
}

interface SectionItem extends NamedItem {
  classId?: string;
}

interface NoticeFormState {
  title: string;
  body: string;
  campusId: string;
  classId: string;
  sectionId: string;
  targetRole: UserRole | "";
  publishAt: string;
  expiresAt: string;
  attachments: NoticeAttachment[];
}

/** Roles a notice can target — SUPERADMIN is platform-level, not an institution audience. */
const TARGETABLE_ROLES: UserRole[] = ["ADMIN", "STAFF", "STUDENT", "GUARDIAN"];

/** Matches the backend's `@ArrayMaxSize(5)` on NoticeAttachmentDto (M3 design doc, § 7.3). */
const MAX_ATTACHMENTS = 5;

/** Page size for the read-only self-service feed (§ 7.3's /notices/for-me — paginated by design). */
const MY_NOTICES_PAGE_SIZE = 10;

interface NoticesForMeResponse {
  items: Notice[];
  total: number;
}

/**
 * Today's date as a `YYYY-MM-DD` string — the Publish Date field's default.
 * @returns {string} Today's local date in the shape `type="date"` inputs expect.
 */
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Builds a blank create-form state, defaulting Publish Date to today.
 * @returns {NoticeFormState} A fresh, empty form.
 */
function emptyForm(): NoticeFormState {
  return {
    title: "",
    body: "",
    campusId: "",
    classId: "",
    sectionId: "",
    targetRole: "",
    publishAt: todayDateString(),
    expiresAt: "",
    attachments: [],
  };
}

/**
 * Renders a human-readable audience summary from a notice's raw scope
 * fields, e.g. "Campus X, Class Y" or "Role: STAFF" or "All" when every
 * dimension is unset. Each set field narrows the audience independently
 * (M3 design doc § 5.4) — this is a pure function of the id-to-name lookup
 * maps built once per render, kept standalone so it's directly unit-testable
 * without rendering the table.
 *
 * @param {Pick<Notice, "campusId" | "classId" | "sectionId" | "targetRole">} scope - The notice's scope fields.
 * @param {Record<string, string>} campusNames - Campus id to name.
 * @param {Record<string, string>} classNames - Class id to name.
 * @param {Record<string, string>} sectionNames - Section id to name.
 * @returns {string} A readable audience summary, or "All" when unscoped.
 */
export function summarizeNoticeAudience(
  scope: Pick<Notice, "campusId" | "classId" | "sectionId" | "targetRole">,
  campusNames: Record<string, string>,
  classNames: Record<string, string>,
  sectionNames: Record<string, string>
): string {
  const parts: string[] = [];
  if (scope.campusId) parts.push(`Campus ${campusNames[scope.campusId] ?? "Unknown"}`);
  if (scope.classId) parts.push(`Class ${classNames[scope.classId] ?? "Unknown"}`);
  if (scope.sectionId) parts.push(`Section ${sectionNames[scope.sectionId] ?? "Unknown"}`);
  if (scope.targetRole) parts.push(`Role: ${scope.targetRole}`);
  return parts.length > 0 ? parts.join(", ") : "All";
}

/**
 * Formats a byte count as a short human-readable size (e.g. "482 KB").
 * @param {number} bytes - Raw byte count.
 * @returns {string} A short, rounded size string.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Derives a short display label for an uploaded attachment. UploadResult
 * carries no original filename, so this falls back to the last segment of
 * the Cloudinary-style public id plus its format.
 * @param {NoticeAttachment} attachment - The uploaded attachment.
 * @returns {string} A short label for the attachment chip.
 */
function attachmentLabel(attachment: NoticeAttachment): string {
  const segments = attachment.publicId.split("/");
  const base = segments[segments.length - 1] || attachment.publicId;
  return `${base}.${attachment.format}`;
}

/**
 * Notices UI for the Notices module (M3 — Scheduling & Communication).
 *
 * Renders one of two views depending on whether the caller can read the
 * admin resource (`notices.read` — always true for ADMIN/SUPERADMIN, and in
 * the platform console since `useOptionalRuntimeConfig()` returns null
 * there, treated as full access):
 *
 * - **Admin view** (has `notices.read`): the full management table with a
 *   computed, readable audience summary and a create/edit dialog covering
 *   title/body, the cascading campus → class → section audience pickers,
 *   an independent target-role narrowing, publish/expiry dates, and up to
 *   5 attachments uploaded through the shared /upload endpoint. Delete is
 *   soft, same ConfirmDialog + recycle-bin pattern as every other resource
 *   here.
 * - **Self-service view** (no `notices.read` — e.g. STUDENT/GUARDIAN, or a
 *   STAFF role without it): a read-only, paginated feed sourced from
 *   `GET /notices/for-me` instead — the audience-matched, publish-window-
 *   filtered list that endpoint was built for (§ 7.3 of the M3 design doc).
 *   Without this branch, a caller lacking `notices.read` would 403 against
 *   the admin list and see a misleading empty "No notices yet" state despite
 *   having real notices visible to them (NoticeBell already uses the right
 *   endpoint for its dropdown preview; this is the same fix applied to the
 *   full page).
 *
 * Accepts an optional `institutionId` (superadmin platform console managing
 * another institution, same convention as AcademicYearsSection/RolesManager)
 * — every notices.service call threads it through to route via the
 * `/platform/institutions/:id/notices` mirror instead of `/notices`.
 */
export default function NoticesManager({ institutionId }: { institutionId?: string }) {
  const { showMessage } = useMessage();
  const runtime = useOptionalRuntimeConfig();
  const canManage = runtime?.canManageModule("NOTICES") ?? true;
  const canViewAdminList = runtime?.can("notices", "read") ?? true;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [myNotices, setMyNotices] = useState<Notice[]>([]);
  const [myNoticesTotal, setMyNoticesTotal] = useState(0);
  const [myNoticesPage, setMyNoticesPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [form, setForm] = useState<NoticeFormState>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<Notice | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Loads notices plus the campus/class/section lookups the audience pickers
   * and summary need (admin view) — or just the caller's own audience-matched
   * page (self-service view), when they lack notices.read.
   */
  const load = useCallback(async () => {
    setLoading(true);

    if (!canViewAdminList) {
      const res = await apiHandler<NoticesForMeResponse>(
        () => noticesService.getNoticesForMe({ page: myNoticesPage, limit: MY_NOTICES_PAGE_SIZE }),
        { showMessage, silent: true }
      );
      setMyNotices(res.data?.items ?? []);
      setMyNoticesTotal(res.data?.total ?? 0);
      setLoading(false);
      return;
    }

    const [noticesRes, campusesRes, levelsRes, classesRes, sectionsRes] = await Promise.all([
      // includeExpired: true — this is the admin management list (unlike
      // /notices/for-me), so nothing should silently disappear from view.
      apiHandler<Notice[]>(() => noticesService.getNotices({ includeExpired: true }, institutionId), { showMessage, silent: true }),
      apiHandler<{ items: CampusItem[] }>(() => campusesService.getAll({ limit: 100 }), { showMessage, silent: true }),
      apiHandler<LevelItem[]>(() => academicsService.getLevels(), { showMessage, silent: true }),
      apiHandler<ClassItem[]>(() => academicsService.getClasses(), { showMessage, silent: true }),
      apiHandler<SectionItem[]>(() => academicsService.getSections(), { showMessage, silent: true }),
    ]);
    setNotices(Array.isArray(noticesRes.data) ? noticesRes.data : []);

    // GET /campuses (and the academics hierarchy endpoints below it) return
    // every institution's rows unfiltered for a SUPERADMIN caller — there's
    // no platform-console mirror for these, so on the platform-console path
    // (institutionId set) we filter client-side down the campus -> level ->
    // class -> section hierarchy, same convention as AcademicsManager.
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

    const scopedSections = (sectionsRes.data ?? []).filter(
      (s) => !institutionId || (s.classId && classIds.has(s.classId))
    );

    setCampuses(scopedCampuses);
    setLevels(scopedLevels);
    setClasses(scopedClasses);
    setSections(scopedSections);
    setLoading(false);
  }, [showMessage, institutionId, canViewAdminList, myNoticesPage]);

  useEffect(() => {
    load();
  }, [load]);

  const campusNameMap = useMemo(
    () => campuses.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [campuses]
  );
  const classNameMap = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = c.name), acc), {}),
    [classes]
  );
  const sectionNameMap = useMemo(
    () => sections.reduce<Record<string, string>>((acc, s) => ((acc[s.id] = s.name), acc), {}),
    [sections]
  );
  // Class -> Campus, walked through Level (AcademicClass has no direct
  // campusId) — what makes "Class filtered by Campus" possible below.
  const levelCampusMap = useMemo(
    () =>
      levels.reduce<Record<string, string>>((acc, l) => {
        if (l.campusId) acc[l.id] = l.campusId;
        return acc;
      }, {}),
    [levels]
  );
  const classCampusMap = useMemo(
    () =>
      classes.reduce<Record<string, string>>((acc, c) => {
        const campusId = c.levelId ? levelCampusMap[c.levelId] : undefined;
        if (campusId) acc[c.id] = campusId;
        return acc;
      }, {}),
    [classes, levelCampusMap]
  );

  /**
   * Classes available under a given campus — empty until a campus is chosen,
   * matching the disabled state of the Class select itself.
   * @param {string} campusId - Selected campus id, or "" for none yet.
   * @returns {ClassItem[]} Matching classes.
   */
  const classesForCampus = useCallback(
    (campusId: string) => (campusId ? classes.filter((c) => classCampusMap[c.id] === campusId) : []),
    [classes, classCampusMap]
  );

  /**
   * Sections available under a given class.
   * @param {string} classId - Selected class id, or "" for none yet.
   * @returns {SectionItem[]} Matching sections.
   */
  const sectionsForClass = useCallback(
    (classId: string) => (classId ? sections.filter((s) => s.classId === classId) : []),
    [sections]
  );

  /** Opens the dialog in create mode with a blank form. */
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setAttempted(false);
    setDialogOpen(true);
  };

  /**
   * Opens the dialog pre-filled for editing an existing notice. Derives a
   * display campusId from the class hierarchy when the notice only has
   * classId set — defensive, since this form always sets both together on
   * save, but guards against a notice created some other way.
   * @param {Notice} notice - The notice to edit.
   */
  const openEdit = (notice: Notice) => {
    setEditing(notice);
    const derivedCampusId = notice.campusId || (notice.classId ? classCampusMap[notice.classId] : undefined);
    setForm({
      title: notice.title,
      body: notice.body,
      campusId: derivedCampusId ?? "",
      classId: notice.classId ?? "",
      sectionId: notice.sectionId ?? "",
      targetRole: notice.targetRole ?? "",
      publishAt: notice.publishAt ? notice.publishAt.slice(0, 10) : todayDateString(),
      expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 10) : "",
      attachments: notice.attachments ?? [],
    });
    setAttempted(false);
    setDialogOpen(true);
  };

  /** Changing the Campus clears Class/Section — both narrow beneath it. */
  const handleCampusChange = (campusId: string) =>
    setForm((prev) => ({ ...prev, campusId, classId: "", sectionId: "" }));

  /** Changing the Class clears Section — Section narrows beneath it. */
  const handleClassChange = (classId: string) => setForm((prev) => ({ ...prev, classId, sectionId: "" }));

  const formValid = Boolean(form.title.trim() && form.body.trim());
  const err = (condition: boolean) => attempted && condition;

  /**
   * Uploads newly-picked files one at a time via the shared /upload
   * endpoint and appends the results to the attachments list, capping at
   * MAX_ATTACHMENTS and warning (not erroring) if some files were dropped.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The file input's change event.
   */
  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_ATTACHMENTS - form.attachments.length;
    if (remaining <= 0) {
      showMessage(`Up to ${MAX_ATTACHMENTS} attachments allowed per notice.`, "warning");
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > toUpload.length) {
      showMessage(`Only ${remaining} more attachment(s) can be added (max ${MAX_ATTACHMENTS}).`, "warning");
    }

    setUploading(true);
    for (const file of toUpload) {
      setUploadProgress(0);
      try {
        const result = await uploadFile(file, {
          subfolder: "documents",
          onProgress: (pct) => setUploadProgress(pct),
        });
        setForm((prev) => ({ ...prev, attachments: [...prev.attachments, result] }));
      } catch (uploadErr) {
        showMessage((uploadErr as Error).message ?? `Failed to upload "${file.name}".`, "error");
      }
    }
    setUploading(false);
    setUploadProgress(0);
  };

  /**
   * Removes one attachment from the form by index.
   * @param {number} index - Position of the attachment to drop.
   */
  const removeAttachment = (index: number) =>
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));

  /** Validates and saves the form, creating or updating the notice. */
  const handleSave = async () => {
    setAttempted(true);
    if (!formValid) return;

    // null (not undefined) for the clearable scope fields: the backend
    // treats an omitted key on PATCH as "leave unchanged," so clearing one
    // of these on edit (e.g. removing a notice's campus scope to make it
    // institution-wide) requires sending an explicit null, not omitting the
    // field. Safe on create too — createNotice treats null/undefined
    // identically via `??`.
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      body: form.body.trim(),
      publishAt: form.publishAt,
      campusId: form.campusId || null,
      classId: form.classId || null,
      sectionId: form.sectionId || null,
      targetRole: form.targetRole || null,
      expiresAt: form.expiresAt || null,
      attachments: form.attachments,
    };

    setSaving(true);
    const { success } = editing
      ? await apiHandler(() => noticesService.updateNotice(editing.id, payload, institutionId), {
          showMessage,
          successMessage: "Notice updated.",
        })
      : await apiHandler(() => noticesService.createNotice(payload, institutionId), {
          showMessage,
          successMessage: "Notice created.",
        });
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      load();
    }
  };

  /** Soft-deletes the confirmed notice — moved to recycle bin, same as every other resource. */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    await apiHandler(() => noticesService.deleteNotice(confirmDelete.id, institutionId), {
      showMessage,
      successMessage: `"${confirmDelete.title}" moved to recycle bin.`,
    });
    setConfirmDelete(null);
    load();
  };

  if (!canViewAdminList) {
    const pageCount = Math.ceil(myNoticesTotal / MY_NOTICES_PAGE_SIZE);
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {myNoticesTotal} notice{myNoticesTotal !== 1 ? "s" : ""}.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : myNotices.length === 0 ? (
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">No notices yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {myNotices.map((notice) => (
              <Card key={notice.id} sx={{ border: "1px solid", borderColor: "divider" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{notice.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(notice.publishAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap", mb: notice.attachments?.length ? 1.5 : 0 }}
                  >
                    {notice.body}
                  </Typography>
                  {notice.attachments && notice.attachments.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {notice.attachments.map((attachment, index) => (
                        <Chip
                          key={`${attachment.publicId}-${index}`}
                          icon={<AttachFile fontSize="small" />}
                          component="a"
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                          label={`${attachmentLabel(attachment)} · ${formatBytes(attachment.bytes)}`}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {pageCount > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination count={pageCount} page={myNoticesPage} onChange={(_e, page) => setMyNoticesPage(page)} />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {notices.length} notice{notices.length !== 1 ? "s" : ""}.
        </Typography>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Notice
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : notices.length === 0 ? (
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: canManage ? 2 : 0 }}>No notices yet.</Typography>
            {canManage && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                Add First Notice
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <DataTableCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Audience</TableHeaderCell>
                <TableHeaderCell>Publish Date</TableHeaderCell>
                <TableHeaderCell>Expires</TableHeaderCell>
                <TableHeaderCell>Attachments</TableHeaderCell>
                {canManage && <TableHeaderCell align="right">Actions</TableHeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{notice.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={summarizeNoticeAudience(notice, campusNameMap, classNameMap, sectionNameMap)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(notice.publishAt)}</TableCell>
                  <TableCell>{notice.expiresAt ? formatDate(notice.expiresAt) : "Never"}</TableCell>
                  <TableCell>
                    {notice.attachments && notice.attachments.length > 0 ? (
                      <Chip icon={<AttachFile fontSize="small" />} label={notice.attachments.length} size="small" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Edit">
                        <Button size="small" onClick={() => openEdit(notice)}>
                          <Edit fontSize="small" />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button size="small" color="error" onClick={() => setConfirmDelete(notice)}>
                          <Delete fontSize="small" />
                        </Button>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableCard>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Notice"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? It will be moved to the recycle bin and can be restored later.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={saving ? undefined : () => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Notice" : "New Notice"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Title *"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                fullWidth
                error={err(!form.title.trim())}
                helperText={err(!form.title.trim()) ? "Title is required." : undefined}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Body *"
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                fullWidth
                multiline
                minRows={4}
                error={err(!form.body.trim())}
                helperText={err(!form.body.trim()) ? "Body is required." : undefined}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Audience (leave all blank for everyone)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Campus" value={form.campusId} onChange={(e) => handleCampusChange(e.target.value)} fullWidth>
                <MenuItem value="">All Campuses</MenuItem>
                {campuses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Target Role"
                value={form.targetRole}
                onChange={(e) => setForm((p) => ({ ...p, targetRole: e.target.value as UserRole | "" }))}
                fullWidth
              >
                <MenuItem value="">All Roles</MenuItem>
                {TARGETABLE_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Class"
                value={form.classId}
                onChange={(e) => handleClassChange(e.target.value)}
                fullWidth
                disabled={!form.campusId}
                helperText={!form.campusId ? "Select a campus first." : undefined}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classesForCampus(form.campusId).map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Section"
                value={form.sectionId}
                onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
                fullWidth
                disabled={!form.classId}
                helperText={!form.classId ? "Select a class first." : undefined}
              >
                <MenuItem value="">All Sections</MenuItem>
                {sectionsForClass(form.classId).map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Visibility Window
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Publish Date"
                type="date"
                value={form.publishAt}
                onChange={(e) => setForm((p) => ({ ...p, publishAt: e.target.value }))}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Expires Date"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                fullWidth
                helperText="Leave blank to never expire."
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Attachments ({form.attachments.length}/{MAX_ATTACHMENTS})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {form.attachments.map((attachment, index) => (
                  <Chip
                    key={`${attachment.publicId}-${index}`}
                    label={`${attachmentLabel(attachment)} · ${formatBytes(attachment.bytes)}`}
                    onDelete={() => removeAttachment(index)}
                    size="small"
                  />
                ))}
              </Box>
              {uploading && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Uploading... {uploadProgress}%</Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1 }} />
                </Box>
              )}
              <Button
                size="small"
                startIcon={<AttachFile />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || form.attachments.length >= MAX_ATTACHMENTS}
                sx={{ mt: 1.5 }}
              >
                Add Attachment
              </Button>
              <input ref={fileInputRef} type="file" multiple hidden onChange={handleAttach} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || uploading}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create Notice"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
