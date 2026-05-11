"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, ArrowForward, Search } from "@mui/icons-material";
import { formatDate } from "@/lib/dateFormat";
import { useRouter } from "next/navigation";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";

interface Institution {
  id: string;
  name: string;
  slug: string;
  status: string;
  deploymentMode: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryDomain?: string;
  createdAt: string;
}

const statusColor: Record<string, "success" | "error" | "warning" | "default"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  SUSPENDED: "warning",
};

const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"];

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { showMessage } = useMessage();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const params = statusFilter !== "ALL" ? { status: statusFilter } : {};
      const { data } = await apiHandler<Institution[]>(
        () => platformService.getInstitutions(params),
        { showMessage, silent: true }
      );
      setInstitutions(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, [showMessage, statusFilter]);

  const filtered = institutions.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.slug.toLowerCase().includes(search.toLowerCase()) ||
    i.contactEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "background.paper" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Institutions</Typography>
          <Typography variant="body2" color="text.secondary">{institutions.length} institution{institutions.length !== 1 ? "s" : ""} registered on the platform.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => router.push("/platform/institutions/new")}>
          New Institution
        </Button>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search by name, slug or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              },
            }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            label="Status"
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "background.default" }}>
                <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Deployment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No institutions found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inst) => (
                  <TableRow
                    key={inst.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/platform/institutions/${inst.slug}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>
                            {inst.name.charAt(0).toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace" }}>{inst.slug}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{inst.deploymentMode?.replace(/_/g, " ")}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{inst.contactEmail ?? "â€”"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={inst.status} color={statusColor[inst.status] ?? "default"} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(inst.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View institution">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); router.push(`/platform/institutions/${inst.slug}`); }}>
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </Container>
    </Box>
  );
}

