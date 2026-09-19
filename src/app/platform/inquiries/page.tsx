"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Card, Chip, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Table, TableBody, TableCell, TableHead,
  TablePagination, TableRow, TextField, Typography,
} from "@mui/material";
import Archive from "@mui/icons-material/Archive";
import Delete from "@mui/icons-material/Delete";
import MarkEmailRead from "@mui/icons-material/MarkEmailRead";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDateTime } from "@/lib/dateFormat";
import { contactInquiriesService } from "@/services/contact.service";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PlatformBreadcrumbs from "@/components/shared/PlatformBreadcrumbs";

type InquiryStatus = "NEW" | "READ" | "ARCHIVED";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  organisation: string | null;
  inquiryType: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

interface InquiryList {
  items: Inquiry[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLOR: Record<InquiryStatus, "primary" | "default" | "warning"> = {
  NEW: "primary",
  READ: "default",
  ARCHIVED: "warning",
};

/** Superadmin inbox for public contact form submissions. */
export default function InquiriesPage() {
  const { showMessage } = useMessage();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [status, setStatus] = useState<"" | InquiryStatus>("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Inquiry | null>(null);

  const load = useCallback(async () => {
    const { data } = await apiHandler<InquiryList>(
      () =>
        contactInquiriesService.getAll({
          page: page + 1,
          limit: rowsPerPage,
          ...(status ? { status } : {}),
        }),
      { showMessage, silent: true },
    );
    setItems(data?.items ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  }, [page, rowsPerPage, status, showMessage]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const changeStatus = async (inquiry: Inquiry, next: InquiryStatus, quiet = false) => {
    const { success } = await apiHandler(
      () => contactInquiriesService.updateStatus(inquiry.id, next),
      { showMessage, successMessage: `Marked as ${next.toLowerCase()}.`, silent: quiet },
    );
    if (success) {
      setSelected((cur) => (cur && cur.id === inquiry.id ? { ...cur, status: next } : cur));
      await load();
    }
    return success;
  };

  const openInquiry = (inquiry: Inquiry) => {
    setSelected(inquiry);
    if (inquiry.status === "NEW") void changeStatus(inquiry, "READ", true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { success } = await apiHandler(
      () => contactInquiriesService.remove(confirmDelete.id),
      { showMessage, successMessage: "Inquiry deleted." },
    );
    if (success && selected?.id === confirmDelete.id) setSelected(null);
    setConfirmDelete(null);
    await load();
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <PlatformBreadcrumbs crumbs={[{ label: "Platform", href: "/platform" }, { label: "Inquiries" }]} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Inquiries</Typography>
        <Typography variant="body2" color="text.secondary">
          Messages sent through the public Contact page.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value as "" | InquiryStatus); setPage(0); }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="NEW">New</MenuItem>
            <MenuItem value="READ">Read</MenuItem>
            <MenuItem value="ARCHIVED">Archived</MenuItem>
          </TextField>
        </Box>

        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "background.default" }}>
                  <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Received</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No inquiries found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: item.status === "NEW" ? 700 : 500 }}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.email}</Typography>
                    </TableCell>
                    <TableCell>{item.inquiryType}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" color="text.secondary" noWrap>{item.message}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDateTime(item.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.status} size="small" color={STATUS_COLOR[item.status]} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button size="small" onClick={() => openInquiry(item)}>Open</Button>
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
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          />
        </Card>
      </Container>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        {selected && (
          <>
            <DialogTitle>
              {selected.inquiryType}
              <Typography variant="body2" color="text.secondary">
                {selected.name} ({selected.email}){selected.organisation ? ` - ${selected.organisation}` : ""}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" color="text.secondary">{formatDateTime(selected.createdAt)}</Typography>
              <Typography sx={{ mt: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{selected.message}</Typography>
            </DialogContent>
            <DialogActions>
              {selected.status !== "READ" && (
                <Button startIcon={<MarkEmailRead />} onClick={() => changeStatus(selected, "READ")}>
                  Mark as read
                </Button>
              )}
              {selected.status !== "ARCHIVED" && (
                <Button startIcon={<Archive />} onClick={() => changeStatus(selected, "ARCHIVED")}>
                  Archive
                </Button>
              )}
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Inquiry"
        message={`Delete the inquiry from "${confirmDelete?.name}"? It will be removed from the inbox.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
