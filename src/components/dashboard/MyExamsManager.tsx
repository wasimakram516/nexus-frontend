"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExamDocumentDialog, { DocumentExamRef, ExamDocumentKind } from "@/components/dashboard/ExamDocumentDialog";
import MyResultDialog from "@/components/dashboard/MyResultDialog";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatClockRange, formatClockTime, formatDate } from "@/lib/dateFormat";
import { examinationsService } from "@/services/examinations.service";

interface MyExam {
  id: string;
  name: string;
  academicYearId: string;
  examTermName: string;
  examType: "REGULAR" | "RETAKE" | "IMPROVEMENT" | "SUPPLEMENTARY";
  originalExamId: string | null;
  resultsPublished: boolean;
  studentId: string;
  studentName: string;
  datesheet: Array<{
    subjectName: string;
    examDate: string | null;
    startTime: string | null;
    endTime: string | null;
    room: string | null;
  }>;
}

const TYPE_LABELS: Record<MyExam["examType"], string> = {
  REGULAR: "",
  RETAKE: "Retake",
  IMPROVEMENT: "Improvement",
  SUPPLEMENTARY: "Supplementary",
};

/**
 * The student and guardian view of exams: for each child, the exams of their
 * class with the datesheet, and, once an exam is published, its result and
 * report card. The admit card is available before the exam.
 */
export default function MyExamsManager() {
  const { showMessage } = useMessage();
  const [exams, setExams] = useState<MyExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState<{ kind: ExamDocumentKind; exam: MyExam } | null>(null);
  const [resultFor, setResultFor] = useState<MyExam | null>(null);

  const load = useCallback(async () => {
    const { data } = await apiHandler<MyExam[]>(() => examinationsService.getExamsForMe(), {
      showMessage,
      silent: true,
    });
    setExams(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void load();
  }, [load]);

  const byStudent = useMemo(() => {
    const groups = new Map<string, { name: string; exams: MyExam[] }>();
    for (const exam of exams) {
      const group = groups.get(exam.studentId) ?? { name: exam.studentName, exams: [] };
      group.exams.push(exam);
      groups.set(exam.studentId, group);
    }
    return [...groups.entries()];
  }, [exams]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">There are no exams to show yet.</Typography>
        </CardContent>
      </Card>
    );
  }

  const ref = (exam: MyExam): DocumentExamRef => ({ id: exam.id, name: exam.name, academicYearId: exam.academicYearId });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {byStudent.map(([studentId, group]) => (
        <Box key={studentId}>
          {byStudent.length > 1 && (
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{group.name}</Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {group.exams.map((exam) => (
              <Card key={`${studentId}-${exam.id}`}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>{exam.name}</Typography>
                    <Chip size="small" variant="outlined" label={exam.examTermName} />
                    {TYPE_LABELS[exam.examType] && <Chip size="small" color="info" label={TYPE_LABELS[exam.examType]} />}
                    {exam.resultsPublished && <Chip size="small" color="success" label="Results published" />}
                  </Box>

                  {exam.datesheet.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">The datesheet has not been announced yet.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Room</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exam.datesheet.map((paper) => (
                          <TableRow key={paper.subjectName}>
                            <TableCell>{paper.examDate ? formatDate(paper.examDate) : "To be announced"}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{paper.subjectName}</TableCell>
                            <TableCell>{paper.startTime && paper.endTime ? formatClockRange(paper.startTime, paper.endTime) : (formatClockTime(paper.startTime) || "—")}</TableCell>
                            <TableCell>{paper.room ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                    <Button size="small" variant="outlined" onClick={() => setPrinting({ kind: "admit-card", exam })}>
                      Admit card
                    </Button>
                    {exam.resultsPublished && (
                      <Button size="small" variant="contained" onClick={() => setResultFor(exam)}>View result</Button>
                    )}
                    {exam.resultsPublished && exam.examType === "REGULAR" && (
                      <Button size="small" variant="outlined" onClick={() => setPrinting({ kind: "report-card", exam })}>
                        Report card
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      ))}

      <ExamDocumentDialog
        kind={printing?.kind ?? null}
        exam={printing ? ref(printing.exam) : null}
        studentId={printing?.exam.studentId}
        onClose={() => setPrinting(null)}
      />
      <MyResultDialog examId={resultFor?.id ?? null} studentId={resultFor?.studentId ?? ""} onClose={() => setResultFor(null)} />
    </Box>
  );
}
