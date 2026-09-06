"use client";

import { useEffect, useState } from "react";
import { Badge, Box, IconButton, Popover, Tooltip, Typography } from "@mui/material";
import { NotificationsNone } from "@mui/icons-material";
import type { Notice } from "@/components/dashboard/NoticesManager";
import { useMessage } from "@/contexts/MessageContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { noticesService } from "@/services/notices.service";

/** Matches RecycleBinService's paginated-list envelope shape (§ 7.3 of the M3 design doc). */
interface NoticesForMeResponse {
  items: Notice[];
  total: number;
  page: number;
  limit: number;
}

const PREVIEW_LENGTH = 120;
/** A generous single page — enough to size the badge/dropdown without a "load more" this milestone. */
const FETCH_LIMIT = 20;

/**
 * Shortens a notice body to a preview length, appending an ellipsis when truncated.
 * @param {string} body - Full notice body text.
 * @returns {string} A short preview, safe to render inline.
 */
function previewBody(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > PREVIEW_LENGTH ? `${trimmed.slice(0, PREVIEW_LENGTH)}…` : trimmed;
}

/**
 * Persistent Notices indicator for the sidebar's bottom icon row (next to
 * AcademicYearSelector/ThemeToggle) — structurally modeled on
 * AcademicYearSelector: reads runtime config to check the module is
 * enabled, fetches getNoticesForMe() quietly in the background with
 * apiHandler's silent:true, and renders nothing when there's nothing
 * meaningful to show.
 *
 * "Unread" tracking is out of scope for M3 — the backend has no read-state
 * to resolve against — so the badge is simply the total count of notices
 * currently visible to this user, not an unread delta.
 */
export default function NoticeBell() {
  const { isModuleEnabled } = useRuntimeConfig();
  const { showMessage } = useMessage();
  const noticesEnabled = isModuleEnabled("NOTICES");

  const [notices, setNotices] = useState<Notice[]>([]);
  const [resolved, setResolved] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!noticesEnabled) return;
    let cancelled = false;

    (async () => {
      const { data } = await apiHandler<NoticesForMeResponse>(
        () => noticesService.getNoticesForMe({ page: 1, limit: FETCH_LIMIT }),
        { showMessage, silent: true }
      );
      if (cancelled) return;
      setNotices(data?.items ?? []);
      setResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [noticesEnabled, showMessage]);

  if (!noticesEnabled || !resolved || notices.length === 0) return null;

  return (
    <>
      <Tooltip title="Notices" placement="right">
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <Badge badgeContent={notices.length} color="error" max={99}>
            <NotificationsNone fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420, overflow: "auto" } } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Notices ({notices.length})
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {notices.map((notice, index) => (
              <Box
                key={notice.id}
                sx={{
                  pb: 1.5,
                  borderBottom: index < notices.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{notice.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {previewBody(notice.body)}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDate(notice.publishAt)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
