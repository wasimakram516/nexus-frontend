"use client";

import { useState } from "react";
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import Star from "@mui/icons-material/Star";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTableCard from "@/components/shared/DataTableCard";
import TableHeaderCell from "@/components/shared/TableHeaderCell";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import {
  bandsToForm,
  bandsToPayload,
  describeBand,
  emptyBand,
  GradeBandForm,
  GradeBandRecord,
  validateBands,
} from "@/lib/gradeBands";
import { examinationsService } from "@/services/examinations.service";

export interface GradingScale {
  id: string;
  name: string;
  description?: string | null;
  isCurrent: boolean;
  bands: GradeBandRecord[];
}

interface GradingScalesSectionProps {
  scales: GradingScale[];
  loading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** Set only in the platform console; routes calls through the platform mirror. */
  institutionId?: string;
  onReload: () => void;
}

const defaultBands = (): GradeBandForm[] => [
  { grade: "A", minPercentage: "80", maxPercentage: "100", remarks: "" },
  { grade: "B", minPercentage: "60", maxPercentage: "79.99", remarks: "" },
  { grade: "F", minPercentage: "0", maxPercentage: "59.99", remarks: "Fail" },
];

/**
 * Grading scales: named sets of percentage bands, with one marked current
 * for the institution. New exams pin the current scale when they are
 * created, so changing which scale is current never alters existing exams.
 */
export default function GradingScalesSection({
  scales,
  loading,
  canCreate,
  canUpdate,
  canDelete,
  institutionId,
  onReload,
}: GradingScalesSectionProps) {
  const { showMessage } = useMessage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GradingScale | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bands, setBands] = useState<GradeBandForm[]>(defaultBands);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GradingScale | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setBands(defaultBands());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (scale: GradingScale) => {
    setEditing(scale);
    setName(scale.name);
    setDescription(scale.description ?? "");
    setBands(bandsToForm(scale.bands));
    setFormError(null);
    setDialogOpen(true);
  };

  const updateBand = (index: number, patch: Partial<GradeBandForm>) => {
    setBands((current) => current.map((band, i) => (i === index ? { ...band, ...patch } : band)));
    setFormError(null);
  };

  const handleSave = async () => {
    const problem = !name.trim() ? "Enter a name for the scale." : validateBands(bands);
    if (problem) {
      setFormError(problem);
      return;
    }
    const payload = {
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      bands: bandsToPayload(bands),
    };
    setSaving(true);
    const { success } = await apiHandler(
      () =>
        (editing
          ? examinationsService.updateGradingScale(editing.id, payload, institutionId)
          : examinationsService.createGradingScale(payload, institutionId)) as never,
      { showMessage, successMessage: editing ? "Grading scale updated." : "Grading scale created." },
    );
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      onReload();
    }
  };

  const handleSetCurrent = async (scale: GradingScale) => {
    const { success } = await apiHandler(
      () => examinationsService.setCurrentGradingScale(scale.id, institutionId) as never,
      { showMessage, successMessage: `${scale.name} is now the current grading scale.` },
    );
    if (success) onReload();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { success } = await apiHandler(
      () => examinationsService.deleteGradingScale(confirmDelete.id, institutionId) as never,
      { showMessage, successMessage: "Grading scale moved to recycle bin." },
    );
    setConfirmDelete(null);
    if (success) onReload();
  };

  const hasActions = canUpdate || canDelete;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Grading Scales</Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage bands that turn marks into grades. New exams use the current scale.
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Grading Scale</Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : scales.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ mb: canCreate ? 2 : 0 }}>
              No grading scales yet. Create one before adding exams.
            </Typography>
            {canCreate && (
              <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Grading Scale</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <DataTableCard>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Bands</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                {hasActions && <TableHeaderCell align="right">Actions</TableHeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {scales.map((scale) => (
                <TableRow key={scale.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{scale.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {[...scale.bands]
                        .sort((a, b) => Number(b.minPercentage) - Number(a.minPercentage))
                        .map((band) => (
                          <Chip key={band.id ?? band.grade} size="small" variant="outlined" label={describeBand(band)} />
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {scale.isCurrent ? <Chip size="small" color="primary" label="Current" /> : "—"}
                  </TableCell>
                  {hasActions && (
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {canUpdate && !scale.isCurrent && (
                        <Tooltip title="Make current">
                          <IconButton aria-label="Make current" size="small" onClick={() => handleSetCurrent(scale)}>
                            <Star fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canUpdate && (
                        <Tooltip title="Edit">
                          <IconButton aria-label="Edit" size="small" onClick={() => openEdit(scale)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title={scale.isCurrent ? "Switch the current scale before deleting this one" : "Delete"}>
                          <span>
                            <IconButton
                              aria-label="Delete"
                              size="small"
                              color="error"
                              disabled={scale.isCurrent}
                              onClick={() => setConfirmDelete(scale)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
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
        title="Delete Grading Scale"
        message={
          confirmDelete
            ? `Move "${confirmDelete.name}" to the recycle bin? Exams that already use it keep their grades.`
            : ""
        }
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={dialogOpen} onClose={() => { if (!saving) setDialogOpen(false); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Grading Scale" : "New Grading Scale"}</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name *"
                value={name}
                disabled={saving}
                onChange={(e) => { setName(e.target.value); setFormError(null); }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Description"
                value={description}
                disabled={saving}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Grade bands</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                Ranges must not overlap. A percentage that falls in a gap is shown as ungraded.
              </Typography>
              {bands.map((band, index) => (
                <Grid container spacing={1.5} key={index} sx={{ mb: 1.5, alignItems: "center" }}>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                      label="Grade"
                      value={band.grade}
                      disabled={saving}
                      onChange={(e) => updateBand(index, { grade: e.target.value })}
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { "aria-label": `Grade ${index + 1}` } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      label="From %"
                      type="number"
                      value={band.minPercentage}
                      disabled={saving}
                      onChange={(e) => updateBand(index, { minPercentage: e.target.value })}
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, "aria-label": `From percent ${index + 1}` } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      label="To %"
                      type="number"
                      value={band.maxPercentage}
                      disabled={saving}
                      onChange={(e) => updateBand(index, { maxPercentage: e.target.value })}
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, "aria-label": `To percent ${index + 1}` } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 10, sm: 5 }}>
                    <TextField
                      label="Remarks"
                      value={band.remarks}
                      disabled={saving}
                      onChange={(e) => updateBand(index, { remarks: e.target.value })}
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { "aria-label": `Remarks ${index + 1}` } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 2, sm: 1 }}>
                    <Tooltip title="Remove band">
                      <span>
                        <IconButton
                          aria-label={`Remove band ${index + 1}`}
                          size="small"
                          disabled={saving || bands.length === 1}
                          onClick={() => { setBands((current) => current.filter((_, i) => i !== index)); setFormError(null); }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                </Grid>
              ))}
              <Button size="small" startIcon={<Add />} disabled={saving} onClick={() => setBands((current) => [...current, emptyBand()])}>
                Add band
              </Button>
            </Grid>
            {formError && (
              <Grid size={{ xs: 12 }}>
                <Typography role="alert" variant="body2" color="error">{formError}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={16} color="inherit" /> : editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
