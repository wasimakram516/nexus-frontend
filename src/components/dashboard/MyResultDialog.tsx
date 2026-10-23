"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

interface ResultData {
  exam: { name: string };
  result: {
    name: string;
    outcome: Outcome;
    positionInClass: number | null;
    classSize: number;
    positionInSection: number | null;
    sectionSize: number;
  };
}

const STATUS_COLOR: Record<OutcomeStatus, "success" | "error" | "default" | "warning"> = {
  PASS: "success",
  FAIL: "error",
  ABSENT: "default",
  INCOMPLETE: "warning",
};

interface MyResultDialogProps {
  examId: string | null;
  studentId: string;
  onClose: () => void;
}

/**
 * One student's published result for one exam: marks and grade per subject,
 * the total, pass or fail and their position. It contains no other student's
 * data; the server only returns the requested student's own result.
 */
export default function MyResultDialog({ examId, studentId, onClose }: MyResultDialogProps) {
  const { showMessage } = useMessage();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch whenever a result is opened
    setLoading(true);
    void apiHandler<ResultData>(() => examinationsService.getStudentResultSummary(examId, studentId), { showMessage }).then(
      ({ data: loaded }) => {
        if (cancelled) return;
        setData(loaded && loaded.result ? loaded : null);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [examId, studentId, showMessage]);

  if (!examId) return <></>;
  const outcome = data?.result.outcome;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{data ? `Result: ${data.exam.name}` : "Result"}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : !data || !outcome ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            This result is not available.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip color={STATUS_COLOR[outcome.status]} label={STATUS_LABELS[outcome.status]} />
              <Chip variant="outlined" label={`${formatPercent(outcome.percentage)}${outcome.grade ? ` · Grade ${outcome.grade}` : ""}`} />
              <Chip variant="outlined" label={`Class position ${formatPosition(data.result.positionInClass, data.result.classSize)}`} />
              <Chip variant="outlined" label={`Section position ${formatPosition(data.result.positionInSection, data.result.sectionSize)}`} />
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="right">Out of</TableCell>
                  <TableCell align="right">Marks</TableCell>
                  <TableCell>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outcome.subjects.map((subject) => (
                  <TableRow key={subject.examSubjectId}>
                    <TableCell>{subject.subjectName}</TableCell>
                    <TableCell align="right">{subject.maxMarks}</TableCell>
                    <TableCell align="right" sx={{ color: subject.passed === false ? "error.main" : undefined }}>
                      {describeMarks(subject)}
                    </TableCell>
                    <TableCell>{subject.grade ?? "—"}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{outcome.totalMaxMarks}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{outcome.totalMarks}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{outcome.grade ?? "—"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
