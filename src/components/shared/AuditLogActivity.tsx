"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box, Chip, CircularProgress, InputAdornment, MenuItem, Table, TableBody,
  TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import AuditLogDiffViewer, { AuditLogDiffTarget } from "@/components/shared/AuditLogDiffViewer";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { auditLogsService } from "@/services/auditLogs.service";
import { formatDateTime, formatDateTimeLong } from "@/lib/dateFormat";

interface AuditLog extends AuditLogDiffTarget {
  user?: { name: string; email: string; role: string } | null;
  institution?: { name: string; slug: string } | null;
}

interface PaginatedResponse {
  items: AuditLog[];
  total: number;
}

const ACTION_COLORS: Record<string, "default" | "success" | "error" | "warning" | "info" | "primary"> = {
  CREATED: "success",
  UPDATED: "info",
  DELETED: "error",
  RESTORED: "primary",
  AUTH_LOGIN_FAILED: "error",
  AUTH_LOGIN: "success",
  AUTH_LOGOUT: "default",
};

function actionColor(action: string) {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key];
  }
  return "default";
}

interface Props {
  /** Superadmin platform console sees a cross-institution column; the dashboard doesn't need it (already scoped). */
  showInstitutionColumn?: boolean;
}

/**
 * Institution-scoped Activity page (decision #33): server-paginated,
 * filterable audit log list with a before/after diff viewer per row.
 * Shared between the superadmin platform console (/platform/audit-logs,
 * every institution) and the dashboard (/dashboard/activity, the caller's
 * own institution — the backend enforces that scoping regardless of what
 * this component sends).
 */
export default function AuditLogActivity({ showInstitutionColumn = false }: Props) {
  const { showMessage } = useMessage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiHandler<PaginatedResponse>(
      () =>
        auditLogsService.getAll({
          page: page + 1,
          limit,
          ...(search && { search }),
          ...(action && { action }),
          ...(entity && { entity }),
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
        }),
      { showMessage, silent: true }
    );
    setLogs(data?.items ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  }, [page, limit, search, action, entity, fromDate, toDate, showMessage]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced free-text search, same pattern as UsersManager.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const resetPageAnd = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const columnCount = showInstitutionColumn ? 5 : 4;

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search action, entity, user..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 240 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <TextField
          size="small"
          label="Entity"
          placeholder="e.g. Student"
          value={entity}
          onChange={(e) => resetPageAnd(setEntity)(e.target.value)}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          select
          label="Action"
          value={action}
          onChange={(e) => resetPageAnd(setAction)(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All actions</MenuItem>
          <MenuItem value="CREATED">Created</MenuItem>
          <MenuItem value="UPDATED">Updated</MenuItem>
          <MenuItem value="DELETED">Deleted</MenuItem>
          <MenuItem value="RESTORED">Restored</MenuItem>
          <MenuItem value="AUTH_LOGIN">Login</MenuItem>
          <MenuItem value="AUTH_LOGIN_FAILED">Login failed</MenuItem>
          <MenuItem value="AUTH_LOGOUT">Logout</MenuItem>
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From"
          value={fromDate}
          onChange={(e) => resetPageAnd(setFromDate)(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={toDate}
          onChange={(e) => resetPageAnd(setToDate)(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 150 }}
        />
      </Box>

      <DataTableCard>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableHeaderCell sx={{ width: 200 }}>Action</TableHeaderCell>
                  <TableHeaderCell>Entity</TableHeaderCell>
                  {showInstitutionColumn && <TableHeaderCell>Institution</TableHeaderCell>}
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Timestamp</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">No activity found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : logs.map((log) => (
                  <TableRow key={log.id} hover onClick={() => setSelectedLog(log)} sx={{ cursor: "pointer" }}>
                    <TableCell>
                      <Chip
                        label={log.action.replace(/_/g, " ")}
                        color={actionColor(log.action)}
                        size="small"
                        sx={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.entity}</Typography>
                      {log.entityId && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", display: "block" }}>
                          {log.entityId.slice(0, 8)}…
                        </Typography>
                      )}
                    </TableCell>
                    {showInstitutionColumn && (
                      <TableCell>
                        {log.institution ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.institution.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{log.institution.slug}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">Platform</Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {log.user ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{log.user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{log.user.email}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">System</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatDateTimeLong(log.createdAt)} placement="left">
                        <Box>
                          <Typography variant="body2">{formatDateTime(log.createdAt)}</Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={limit}
              onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </DataTableCard>

      <AuditLogDiffViewer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
}
