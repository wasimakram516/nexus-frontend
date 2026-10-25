"use client";

import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { DocumentHeader, PrintPage } from "@/components/shared/PrintSheet";
import { formatDate } from "@/lib/dateFormat";
import {
  AdmitCardData,
  DatesheetData,
  DatesheetPaper,
  describeMarks,
  describeRetake,
  formatPercent,
  formatPosition,
  PrintMeta,
  ReportCardData,
  STATUS_LABELS,
} from "@/lib/examDocuments";

const cell = { color: "#111", borderColor: "#999", py: 0.75 };
const head = { ...cell, fontWeight: 700, bgcolor: "#f1f1f1" };

function timeRange(paper: DatesheetPaper): string {
  return paper.startTime && paper.endTime ? `${paper.startTime} – ${paper.endTime}` : paper.startTime ?? "—";
}

function PapersTable({ papers }: { papers: DatesheetPaper[] }) {
  return (
    <Table size="small" sx={{ border: "1px solid #999" }}>
      <TableHead>
        <TableRow>
          <TableCell sx={head}>Date</TableCell>
          <TableCell sx={head}>Subject</TableCell>
          <TableCell sx={head}>Time</TableCell>
          <TableCell sx={head}>Room</TableCell>
          <TableCell sx={head} align="right">Max marks</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {papers.map((paper) => (
          <TableRow key={paper.examSubjectId}>
            <TableCell sx={cell}>{paper.examDate ? formatDate(paper.examDate) : "To be announced"}</TableCell>
            <TableCell sx={{ ...cell, fontWeight: 600 }}>{paper.subjectName}</TableCell>
            <TableCell sx={cell}>{timeRange(paper)}</TableCell>
            <TableCell sx={cell}>{paper.room ?? "—"}</TableCell>
            <TableCell sx={cell} align="right">{paper.maxMarks}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The custom values the institution chose to print, as plain labelled lines. */
function PrintedValues({ values }: { values?: Array<{ label: string; value: string }> }) {
  if (!values || values.length === 0) return null;
  return (
    <Box sx={{ mt: 0.5, mb: 1 }}>
      {values.map((field) => (
        <Typography key={field.label} variant="body2" sx={{ color: "#111" }}>
          <strong>{field.label}:</strong> {field.value}
        </Typography>
      ))}
    </Box>
  );
}

function ExamTitle({ exam }: { exam: DatesheetData["exam"] }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#111" }}>{exam.name}</Typography>
      <Typography variant="body2" sx={{ color: "#444" }}>
        {`${exam.className} · ${exam.termName} · ${exam.academicYearName}`}
      </Typography>
      <PrintedValues values={exam.customValues} />
    </Box>
  );
}

/** The exam schedule on one page. */
export function DatesheetView({ data }: { data: DatesheetData }) {
  return (
    <PrintPage>
      <DocumentHeader meta={data.printMeta} title="Datesheet" />
      <ExamTitle exam={data.exam} />
      {data.papers.length === 0 ? (
        <Typography sx={{ color: "#444" }}>No papers have been added to this exam yet.</Typography>
      ) : (
        <PapersTable papers={data.papers} />
      )}
    </PrintPage>
  );
}

/** One admit card per page: the student, then the schedule. */
export function AdmitCardView({ card, meta }: { card: AdmitCardData; meta: PrintMeta }) {
  return (
    <PrintPage>
      <DocumentHeader meta={meta} title="Admit card" />
      <ExamTitle exam={card.exam} />
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        {card.student.picture && (
          // eslint-disable-next-line @next/next/no-img-element -- printed documents use the plain image
          <img src={card.student.picture} alt={`${card.student.name}`} style={{ height: 90, width: 72, objectFit: "cover", border: "1px solid #999" }} />
        )}
        <Box>
          <Typography sx={{ fontWeight: 700, color: "#111" }}>{card.student.name}</Typography>
          <Typography variant="body2" sx={{ color: "#444" }}>{`Registration no. ${card.student.regNo}`}</Typography>
          <Typography variant="body2" sx={{ color: "#444" }}>
            {card.student.sectionName ? `${card.student.className}, Section ${card.student.sectionName}` : card.student.className}
          </Typography>
        </Box>
      </Box>
      <PapersTable papers={card.papers} />
      <Typography variant="caption" sx={{ display: "block", mt: 4, color: "#444" }}>
        This card must be shown at every paper.
      </Typography>
    </PrintPage>
  );
}

/** A student's report card: each term, then the year. */
export function ReportCardView({ card, meta }: { card: ReportCardData; meta: PrintMeta }) {
  return (
    <PrintPage>
      <DocumentHeader meta={meta} title="Report card" />
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#111" }}>{card.student.name}</Typography>
        <Typography variant="body2" sx={{ color: "#444" }}>
          {`Reg. no. ${card.student.regNo} · ${card.student.className}${card.student.sectionName ? `, Section ${card.student.sectionName}` : ""} · ${card.academicYear.name}`}
        </Typography>
      </Box>

      {card.terms.length === 0 && (
        <Typography sx={{ color: "#444" }}>No results have been published for this year yet.</Typography>
      )}

      {card.terms.map((term) => (
        <Box key={term.exam.id} sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, color: "#111", mb: 0.5 }}>{`${term.term.name} · ${term.exam.name}`}</Typography>
          <PrintedValues values={term.exam.customValues} />
          <Table size="small" sx={{ border: "1px solid #999" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={head}>Subject</TableCell>
                <TableCell sx={head} align="right">Out of</TableCell>
                <TableCell sx={head} align="right">Marks</TableCell>
                <TableCell sx={head} align="right">%</TableCell>
                <TableCell sx={head}>Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {term.outcome.subjects.map((subject) => (
                <TableRow key={subject.examSubjectId}>
                  <TableCell sx={cell}>
                    {subject.subjectName}
                    {subject.isRetake && (
                      <Typography component="span" variant="caption" sx={{ display: "block", color: "#555" }}>
                        {describeRetake(subject)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={cell} align="right">{subject.maxMarks}</TableCell>
                  <TableCell sx={cell} align="right">{describeMarks(subject)}</TableCell>
                  <TableCell sx={cell} align="right">{formatPercent(subject.percentage)}</TableCell>
                  <TableCell sx={cell}>{subject.grade ?? "—"}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ ...cell, fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ ...cell, fontWeight: 700 }} align="right">{term.outcome.totalMaxMarks}</TableCell>
                <TableCell sx={{ ...cell, fontWeight: 700 }} align="right">{term.outcome.totalMarks}</TableCell>
                <TableCell sx={{ ...cell, fontWeight: 700 }} align="right">{formatPercent(term.outcome.percentage)}</TableCell>
                <TableCell sx={{ ...cell, fontWeight: 700 }}>{term.outcome.grade ?? "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Typography variant="body2" sx={{ mt: 0.75, color: "#111" }}>
            {`Result: ${STATUS_LABELS[term.outcome.status]} · Class position: ${formatPosition(term.positionInClass, term.classSize)} · Section position: ${formatPosition(term.positionInSection, term.sectionSize)}`}
          </Typography>
        </Box>
      ))}

      {card.annual && (
        <Box sx={{ border: "2px solid #111", p: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: "#111" }}>Annual result</Typography>
          <Typography variant="body2" sx={{ color: "#111" }}>
            {`Overall ${formatPercent(card.annual.percentage)}${card.annual.grade ? ` · Grade ${card.annual.grade}` : ""} · ${STATUS_LABELS[card.annual.status]}`}
          </Typography>
          <Typography variant="caption" sx={{ color: "#555" }}>
            {card.annual.subjects.map((s) => `${s.subjectName} ${formatPercent(s.percentage)}`).join(" · ")}
          </Typography>
        </Box>
      )}
    </PrintPage>
  );
}
