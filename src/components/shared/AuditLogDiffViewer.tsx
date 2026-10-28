"use client";

import { useState } from "react";
import {
  alpha, Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import { formatDateTimeLong } from "@/lib/dateFormat";
import { buildDiffRows, formatAuditValue } from "@/lib/auditDiff";

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

function Cell({ value }: { value: unknown }) {
  const { text, title } = formatAuditValue(value);
  const node = <span>{text}</span>;
  return title ? <Tooltip title={title}>{node}</Tooltip> : node;
}

/**
 * Side-by-side before/after viewer for a single audit log row (decision
 * #37). Handles the three shapes a snapshot can take: both sides present
 * (an update/restore), only `after` (a create), only `before` (a hard
 * delete — the row no longer exists), or neither (bulk operations and
 * models the auto-audit extension doesn't cover yet, e.g. User/Campus).
 */
export default function AuditLogDiffViewer({ log, onClose }: Props) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  if (!log) return null;

  const hasBefore = !!log.before;
  const hasAfter = !!log.after;
  const allRows = buildDiffRows(log.before, log.after);
  const unchangedCount = allRows.filter((r) => !r.changed).length;
  const rows = showUnchanged ? allRows : allRows.filter((r) => r.changed);
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
          <>
            {unchangedCount > 0 && (
              <Button size="small" onClick={() => setShowUnchanged((v) => !v)} sx={{ mb: 1 }}>
                {showUnchanged ? "Hide unchanged fields" : `Show ${unchangedCount} unchanged fields`}
              </Button>
            )}
            {rows.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                No readable field changed in this entry.
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
                      sx={row.changed ? { backgroundColor: (t) => alpha(t.palette.warning.main, 0.14) } : undefined}
                    >
                      <TableCell sx={{ fontSize: 13, fontWeight: row.changed ? 600 : 400 }}>
                        {row.label}
                        {row.changed && (
                          <Chip label="changed" size="tiny" color="warning" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, wordBreak: "break-word" }}>
                        {hasBefore ? <Cell value={row.before} /> : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, wordBreak: "break-word" }}>
                        {hasAfter ? <Cell value={row.after} /> : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
