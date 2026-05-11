"use client";

import { useEffect, useState } from "react";
import {
  Box, Card, Chip, CircularProgress, Container,
  InputAdornment, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { auditLogsService } from "@/services/auditLogs.service";
import { formatDateTime, formatDateTimeLong } from "@/lib/dateFormat";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: { name: string; email: string; role: string };
  institution?: { name: string; slug: string };
}

interface PaginatedResponse {
  items: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, "default" | "success" | "error" | "warning" | "info" | "primary"> = {
  AUTH_LOGIN:              "success",
  AUTH_LOGOUT:             "default",
  AUTH_REFRESH:            "default",
  SUPERADMIN_BOOTSTRAPPED: "warning",
  PLAN_UPDATED:            "info",
  PLAN_CREATED:            "primary",
  INSTITUTION_CREATED:     "primary",
  INSTITUTION_UPDATED:     "info",
  INSTITUTION_DELETED:     "error",
};

function actionColor(action: string) {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key];
  }
  return "default";
}

export default function AuditLogsPage() {
  const { showMessage } = useMessage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await apiHandler<PaginatedResponse>(
        () => auditLogsService.getAll({ limit: 100 }),
        { showMessage, silent: true }
      );
      setLogs(data?.items ?? []);
      setLoading(false);
    };
    load();
  }, [showMessage]);

  const filtered = logs.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.institution?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Audit Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Platform-wide activity trail · {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search action, entity, user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            },
          }}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "background.default" }}>
                  <TableCell sx={{ fontWeight: 700, width: 200 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">No audit logs found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((log) => (
                  <TableRow key={log.id} hover>
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
          )}
        </Card>
      </Container>
    </Box>
  );
}
