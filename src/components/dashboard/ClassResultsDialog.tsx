"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
  describeMarks,
  formatPercent,
  formatPosition,
  Outcome,
  OutcomeStatus,
  STATUS_LABELS,
} from "@/lib/examDocuments";
import { examinationsService } from "@/services/examinations.service";

export interface ResultsExam {
  id: string;
  name: string;
  classId: string;
  status: "DRAFT" | "PUBLISHED";
}

export interface ResultsSection {
  id: string;
  name: string;
  classId?: string;
}

interface StudentRow {
  studentId: string;
  name: string;
  regNo: string;
  sectionName: string | null;
  outcome: Outcome;
  positionInClass: number | null;
  classSize: number;
  positionInSection: number | null;
  sectionSize: number;
}

interface Summary {
  exam: { passPolicy: string };
  papers: Array<{ examSubjectId: string; subjectName: string; maxMarks: number }>;
  students: StudentRow[];
  summary: { total: number; pass: number; fail: number; incomplete: number; absent: number; averagePercentage: number | null };
}

const STATUS_COLOR: Record<OutcomeStatus, "success" | "error" | "default" | "warning"> = {
  PASS: "success",
  FAIL: "error",
  ABSENT: "default",
  INCOMPLETE: "warning",
};

const POLICY_LABELS: Record<string, string> = {
  PER_SUBJECT: "Pass every subject",
  AGGREGATE: "Pass on overall percentage",
  AGGREGATE_WITH_MINIMUM: "Pass on overall percentage with a minimum per subject",
};

interface ClassResultsDialogProps {
  exam: ResultsExam | null;
  sections: ResultsSection[];
  onClose: () => void;
}

/**
 * Every student's results for one exam: marks per subject, total, grade, pass
 * or fail and class and section position, computed by the server from the
 * marks, so a correction shows here as soon as it is saved.
 */
export default function ClassResultsDialog({ exam, sections, onClose }: ClassResultsDialogProps) {
  const { showMessage } = useMessage();
  const [sectionId, setSectionId] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const examId = exam?.id;
  const classSections = sections.filter((section) => section.classId === exam?.classId);

  const load = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    const { data: summary } = await apiHandler<Summary>(
      () => examinationsService.getClassResultSummary(examId, sectionId || undefined),
      { showMessage },
    );
    // Ignore a response that is not a results summary instead of failing to render.
    setData(summary && Array.isArray(summary.students) ? summary : null);
    setLoading(false);
  }, [examId, sectionId, showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load whenever an exam or section is chosen
    void load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start each exam on all sections
    setSectionId("");
  }, [examId]);

  if (!exam) return <></>;

  return (
    <Dialog open onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{`Results: ${exam.name}`}</DialogTitle>
      <DialogContent>
        {exam.status === "DRAFT" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This exam is still a draft. Students and guardians cannot see these results until it is published.
          </Alert>
        )}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
          <TextField select label="Section" size="small" value={sectionId} onChange={(e) => setSectionId(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="">All sections</MenuItem>
            {classSections.map((section) => (
              <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
            ))}
          </TextField>
          {data && (
            <>
              <Chip size="small" label={`${data.summary.total} students`} />
              <Chip size="small" color="success" label={`${data.summary.pass} pass`} />
              <Chip size="small" color="error" label={`${data.summary.fail} fail`} />
              {data.summary.incomplete > 0 && <Chip size="small" color="warning" label={`${data.summary.incomplete} awaiting marks`} />}
              {data.summary.absent > 0 && <Chip size="small" label={`${data.summary.absent} absent`} />}
              <Chip size="small" variant="outlined" label={`Average ${formatPercent(data.summary.averagePercentage)}`} />
            </>
          )}
        </Box>
        {data && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {`Pass rule: ${POLICY_LABELS[data.exam.passPolicy] ?? data.exam.passPolicy}.`}
          </Typography>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : !data || data.students.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            No results to show yet.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Section</TableCell>
                  {data.papers.map((paper) => (
                    <TableCell key={paper.examSubjectId} align="right">{`${paper.subjectName} /${paper.maxMarks}`}</TableCell>
                  ))}
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">%</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Class position</TableCell>
                  <TableCell>Section position</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.students.map((row) => (
                  <TableRow key={row.studentId} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <strong>{row.name}</strong>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{row.regNo}</Typography>
                    </TableCell>
                    <TableCell>{row.sectionName ?? "—"}</TableCell>
                    {data.papers.map((paper) => {
                      const subject = row.outcome.subjects.find((s) => s.examSubjectId === paper.examSubjectId);
                      return (
                        <TableCell key={paper.examSubjectId} align="right" sx={{ color: subject?.passed === false ? "error.main" : undefined }}>
                          {subject ? describeMarks(subject) : "—"}
                        </TableCell>
                      );
                    })}
                    <TableCell align="right">{`${row.outcome.totalMarks}/${row.outcome.totalMaxMarks}`}</TableCell>
                    <TableCell align="right">{formatPercent(row.outcome.percentage)}</TableCell>
                    <TableCell>{row.outcome.grade ?? "—"}</TableCell>
                    <TableCell>
                      <Chip size="small" color={STATUS_COLOR[row.outcome.status]} label={STATUS_LABELS[row.outcome.status]} />
                    </TableCell>
                    <TableCell>{formatPosition(row.positionInClass, row.classSize)}</TableCell>
                    <TableCell>{formatPosition(row.positionInSection, row.sectionSize)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
