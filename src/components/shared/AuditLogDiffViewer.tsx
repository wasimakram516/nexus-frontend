"use client";

import {
  Box, Chip, Dialog, DialogContent, DialogTitle, IconButton, Table,
  TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { formatDateTimeLong } from "@/lib/dateFormat";

export interface AuditLogDiffTarget {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

interface Props {
  log: AuditLogDiffTarget | null;
  onClose: () => void;
}

function formatCellValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

interface DiffRow {
  key: string;
  before: unknown;
  after: unknown;
  changed: boolean;
}

function buildDiffRows(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffRow[] {
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  return Array.from(keys)
    .sort()
    .map((key) => {
      const beforeValue = before?.[key];
      const afterValue = after?.[key];
      return {
        key,
        before: beforeValue,
        after: afterValue,
        changed: JSON.stringify(beforeValue) !== JSON.stringify(afterValue),
      };
    });
}

/**
 * Side-by-side before/after viewer for a single audit log row (decision
 * #37). Handles the three shapes a snapshot can take: both sides present
 * (an update/restore), only `after` (a create), only `before` (a hard
 * delete — the row no longer exists), or neither (bulk operations and
 * models the auto-audit extension doesn't cover yet, e.g. User/Campus).
 */
export default function AuditLogDiffViewer({ log, onClose }: Props) {
  if (!log) return null;

  const hasBefore = !!log.before;
  const hasAfter = !!log.after;
  const rows = buildDiffRows(log.before, log.after);
  const truncated =
    (log.before && "truncated" in log.before) ||
    (log.after && "truncated" in log.after);

  return (
    <Dialog open={!!log} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {log.action.replace(/_/g, " ")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {log.entity}
            {log.entityId ? ` · ${log.entityId}` : ""} · {formatDateTimeLong(log.createdAt)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!hasBefore && !hasAfter ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            No before/after snapshot is available for this entry. Bulk operations and a few
            models with their own audit logging don&apos;t capture snapshots yet.
          </Typography>
        ) : truncated ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            This snapshot was too large to store and was omitted.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Field</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{hasBefore ? "Before" : "—"}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{hasAfter ? "After" : "—"}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.key}
                  sx={row.changed ? { backgroundColor: "warning.main", opacity: 0.9 } : undefined}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {row.key}
                    {row.changed && (
                      <Chip label="changed" size="small" color="warning" sx={{ ml: 1, height: 16, fontSize: 9 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
                    {hasBefore ? formatCellValue(row.before) : "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>
                    {hasAfter ? formatCellValue(row.after) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
