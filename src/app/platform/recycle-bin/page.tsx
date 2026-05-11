"use client";

import { useEffect, useState } from "react";
import {
  Box, Button, Card, Chip, CircularProgress, Container,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { Delete, RestoreFromTrash } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { recycleBinService } from "@/services/recycleBin.service";
import { formatDateTime } from "@/lib/dateFormat";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface RecycleItem {
  entity: string;
  id: string;
  label: string;
  subtitle: string | null;
  institutionId: string | null;
  deletedAt: string;
  deletedBy: string | null;
  deleteReason: string | null;
  deletedByUser?: { name: string; email: string } | null;
  metadata: Record<string, unknown>;
}

interface RecycleBinResponse {
  items: RecycleItem[];
  total: number;
}

export default function RecycleBinPage() {
  const { showMessage } = useMessage();
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRestore, setConfirmRestore] = useState<RecycleItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RecycleItem | null>(null);

  const load = async () => {
    const { data } = await apiHandler<RecycleBinResponse>(
      () => recycleBinService.getAll(),
      { showMessage, silent: true }
    );
    setItems(data?.items ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async () => {
    if (!confirmRestore) return;
    await apiHandler(() => recycleBinService.restore(confirmRestore.entity, confirmRestore.id), { showMessage, successMessage: "Record restored." });
    setConfirmRestore(null);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await apiHandler(() => recycleBinService.permanentDelete(confirmDelete.entity, confirmDelete.id), { showMessage, successMessage: "Record permanently deleted." });
    setConfirmDelete(null);
    load();
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Recycle Bin</Typography>
        <Typography variant="body2" color="text.secondary">
          Soft-deleted records. Restore or permanently delete them.
        </Typography>
      </Box>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "background.default" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Record</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Deleted By</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Deleted At</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Recycle bin is empty.</Typography>
                    </TableCell>
                  </TableRow>
                ) : items.map((item) => (
                  <TableRow key={`${item.entity}-${item.id}`} hover>
                    <TableCell>
                      <Chip label={item.entity} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>
                      {item.subtitle && (
                        <Typography variant="caption" color="text.secondary">{item.subtitle}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.deletedByUser ? (
                        <Box>
                          <Typography variant="body2">{item.deletedByUser.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.deletedByUser.email}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">System</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(item.deletedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{item.deleteReason ?? "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button size="small" startIcon={<RestoreFromTrash />} onClick={() => setConfirmRestore(item)}>
                          Restore
                        </Button>
                        <Button size="small" color="error" startIcon={<Delete />} onClick={() => setConfirmDelete(item)}>
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Container>

      <ConfirmDialog
        open={!!confirmRestore}
        title="Restore Record"
        message={`Restore "${confirmRestore?.label}" (${confirmRestore?.entity})? It will be available again in its original location.`}
        confirmLabel="Restore"
        confirmColor="success"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Permanently Delete"
        message={`Permanently delete "${confirmDelete?.label}" (${confirmDelete?.entity})? This cannot be undone — the record will be gone forever.`}
        confirmLabel="Delete Forever"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
