"use client";

import { useState } from "react";
import { Box, CircularProgress, IconButton, Popover, Typography } from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import { usersService } from "@/services/users.service";
import { formatDateTimeLong } from "@/lib/dateFormat";

interface ResolvedUser {
  name: string;
  email: string;
}

interface Props {
  createdById?: string | null;
  createdAt?: string | null;
  updatedById?: string | null;
  updatedAt?: string | null;
}

function describeActor(id: string | null | undefined, resolved: ResolvedUser | undefined, loading: boolean) {
  if (!id) return "System";
  if (loading) return "Loading…";
  if (resolved) return `${resolved.name} (${resolved.email})`;
  // Falls back to a truncated id when the actor can't be resolved — e.g. a
  // user from another institution, or a deleted account. Still meaningful
  // for cross-referencing against the Activity log.
  return `${id.slice(0, 8)}…`;
}

/**
 * Drop-in "who/when" info button for any record's detail view (decision
 * #34). Resolves createdBy/updatedBy ids to a name/email on first open via
 * GET /users/resolve, rather than eagerly on every list row.
 */
export default function RecordMetadataPopover({ createdById, createdAt, updatedById, updatedAt }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState<Record<string, ResolvedUser>>({});

  const open = Boolean(anchorEl);

  const handleOpen = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);

    const idsToResolve = Array.from(
      new Set([createdById, updatedById].filter((id): id is string => Boolean(id))),
    ).filter((id) => !(id in resolved));

    if (idsToResolve.length === 0) return;

    setLoading(true);
    try {
      const res = await usersService.resolve(idsToResolve);
      const data = (res.data?.data ?? {}) as Record<string, ResolvedUser>;
      setResolved((prev) => ({ ...prev, ...data }));
    } catch {
      // Non-critical display data — silently fall back to showing raw ids.
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen} aria-label="Record details">
        <InfoOutlined fontSize="small" />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 2, minWidth: 260 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Record Details</Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Created by</Typography>
                <Typography variant="body2">{describeActor(createdById, resolved[createdById ?? ""], false)}</Typography>
                {createdAt && (
                  <Typography variant="caption" color="text.secondary">{formatDateTimeLong(createdAt)}</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Last updated by</Typography>
                <Typography variant="body2">{describeActor(updatedById, resolved[updatedById ?? ""], false)}</Typography>
                {updatedAt && (
                  <Typography variant="caption" color="text.secondary">{formatDateTimeLong(updatedAt)}</Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}
