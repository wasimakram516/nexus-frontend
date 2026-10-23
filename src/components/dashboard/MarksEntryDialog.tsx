"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import {
  GridStudent,
  MarksRow,
  summarize,
  toEntries,
  toRows,
  validateRow,
} from "@/lib/marksEntry";
import { examinationsService } from "@/services/examinations.service";

export interface MarksPaper {
  id: string;
  subjectName: string;
  maxMarks: number;
  passingMarks: number;
}

export interface MarksExam {
  name: string;
  classId: string;
  status: "DRAFT" | "PUBLISHED";
  unlockedForEditing: boolean;
}

export interface ClassSection {
  id: string;
  name: string;
  classId?: string;
}

interface GridResponse {
  maxMarks: number;
  passingMarks: number;
  locked: boolean;
  students: GridStudent[];
}

interface MarksEntryDialogProps {
  paper: MarksPaper | null;
  exam: MarksExam;
  /** Every section in scope; narrowed to the exam's class here. */
  sections: ClassSection[];
  canEdit: boolean;
  onClose: () => void;
}

/**
 * The marks-entry grid for one paper and one section: a row per enrolled
 * student with marks, an absent tick and a remark. Marks are checked against
 * the paper's maximum as they are typed, only changed rows are sent, and the
 * grid is read-only while the exam is published and locked.
 */
export default function MarksEntryDialog({ paper, exam, sections, canEdit, onClose }: MarksEntryDialogProps) {
  const { showMessage } = useMessage();
  const classSections = useMemo(
    () => sections.filter((section) => section.classId === exam.classId),
    [sections, exam.classId],
  );
  const [sectionId, setSectionId] = useState("");
  const [rows, setRows] = useState<MarksRow[]>([]);
  const [originals, setOriginals] = useState<Map<string, MarksRow>>(new Map());
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const paperId = paper?.id;

  useEffect(() => {
    if (paperId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- start on the first section whenever a paper is opened
      setSectionId(classSections[0]?.id ?? "");
    }
  }, [paperId, classSections]);

  const load = useCallback(async () => {
    if (!paperId || !sectionId) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data } = await apiHandler<GridResponse>(
      () => examinationsService.getExamResults(paperId, sectionId),
      { showMessage },
    );
    const loaded = toRows(data?.students ?? []);
    setRows(loaded);
    setOriginals(new Map(loaded.map((row) => [row.studentId, row])));
    setLocked(data?.locked ?? false);
    setAttempted(false);
    setLoading(false);
  }, [paperId, sectionId, showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload the grid for the chosen paper and section
    void load();
  }, [load]);

  if (!paper) return <></>;

  const readOnly = !canEdit || locked;
  const maxMarks = paper.maxMarks;
  const errors = rows.map((row) => validateRow(row, maxMarks));
  const changed = toEntries(rows, originals);
  const summary = summarize(rows, paper.passingMarks);

  const update = (index: number, patch: Partial<MarksRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    setAttempted(true);
    if (errors.some(Boolean) || changed.length === 0) return;
    setSaving(true);
    const { success } = await apiHandler(
      () => examinationsService.saveExamResults(paper.id, { sectionId, entries: changed }) as never,
      { showMessage, successMessage: "Marks saved." },
    );
    setSaving(false);
    if (success) void load();
  };

  const focusNext = (index: number) => inputs.current[index + 1]?.focus();

  return (
    <Dialog open onClose={() => { if (!saving) onClose(); }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{`Marks: ${paper.subjectName}`}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {`${exam.name}. Out of ${paper.maxMarks}, passing at ${paper.passingMarks}.`}
        </Typography>

        {locked && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This exam is published and locked. Marks can be viewed but not changed until an admin unlocks the exam.
          </Alert>
        )}
        {!locked && !canEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>You can view these marks but not change them.</Alert>
        )}

        {classSections.length === 0 ? (
          <Alert severity="warning">This class has no sections yet. Create its sections under Academics first.</Alert>
        ) : (
          <>
            <TextField
              select
              label="Section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={saving}
              size="small"
              sx={{ minWidth: 220, mb: 2 }}
            >
              {classSections.map((section) => (
                <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
              ))}
            </TextField>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
            ) : rows.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No students are enrolled in this section for the exam&apos;s academic year.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Reg. no.</TableCell>
                    <TableCell sx={{ width: 140 }}>Marks</TableCell>
                    <TableCell align="center">Absent</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => {
                    const error = errors[index];
                    const failing =
                      !row.isAbsent && row.marks.trim() !== "" && !error && Number(row.marks) < paper.passingMarks;
                    return (
                      <TableRow key={row.studentId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                        <TableCell>{row.regNo}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.marks}
                            disabled={readOnly || saving || row.isAbsent}
                            onChange={(e) => update(index, { marks: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                focusNext(index);
                              }
                            }}
                            error={Boolean(error) && (attempted || row.marks !== "")}
                            helperText={error && (attempted || row.marks !== "") ? error : failing ? "Below passing" : undefined}
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                max: maxMarks,
                                step: 0.01,
                                "aria-label": `Marks for ${row.name}`,
                                ref: (element: HTMLInputElement | null) => {
                                  inputs.current[index] = element;
                                },
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={row.isAbsent}
                            disabled={readOnly || saving}
                            onChange={(e) => update(index, { isAbsent: e.target.checked, ...(e.target.checked ? { marks: "" } : {}) })}
                            slotProps={{ input: { "aria-label": `Absent: ${row.name}` } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.remarks}
                            disabled={readOnly || saving}
                            onChange={(e) => update(index, { remarks: e.target.value })}
                            fullWidth
                            slotProps={{ htmlInput: { maxLength: 500, "aria-label": `Remarks for ${row.name}` } }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {rows.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                <Chip size="small" label={`${summary.recorded} of ${summary.total} recorded`} />
                {summary.belowPassing > 0 && (
                  <Chip size="small" color="warning" label={`${summary.belowPassing} below passing`} />
                )}
                {!readOnly && changed.length > 0 && (
                  <Chip size="small" color="primary" label={`${changed.length} unsaved`} />
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={saving} onClick={onClose}>Close</Button>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading || changed.length === 0 || (attempted && errors.some(Boolean))}
          >
            {saving ? <CircularProgress size={16} color="inherit" /> : "Save Marks"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
