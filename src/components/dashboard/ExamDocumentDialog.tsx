"use client";

import { useCallback, useEffect, useState } from "react";
import { MenuItem, TextField } from "@mui/material";
import PrintSheet from "@/components/shared/PrintSheet";
import { AdmitCardView, DatesheetView, ReportCardView } from "@/components/dashboard/ExamDocumentViews";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { downloadFile } from "@/lib/downloadFile";
import { AdmitCardData, DatesheetData, PrintMeta, ReportCardData } from "@/lib/examDocuments";
import { examinationsService } from "@/services/examinations.service";

export type ExamDocumentKind = "datesheet" | "admit-cards" | "admit-card" | "report-cards" | "report-card";

export interface DocumentExamRef {
  id: string;
  name: string;
  classId?: string;
  academicYearId: string;
}

export interface DocumentSection {
  id: string;
  name: string;
  classId?: string;
}

interface ExamDocumentDialogProps {
  kind: ExamDocumentKind | null;
  exam: DocumentExamRef | null;
  /** Needed for the single-student kinds. */
  studentId?: string;
  /** Used for the section picker of the whole-class kinds. */
  sections?: DocumentSection[];
  onClose: () => void;
}

const TITLES: Record<ExamDocumentKind, string> = {
  datesheet: "Datesheet",
  "admit-cards": "Admit cards",
  "admit-card": "Admit card",
  "report-cards": "Report cards",
  "report-card": "Report card",
};

type Loaded =
  | { kind: "datesheet"; data: DatesheetData }
  | { kind: "admit-cards"; cards: AdmitCardData[]; printMeta: PrintMeta }
  | { kind: "report-cards"; cards: ReportCardData[]; printMeta: PrintMeta };

/**
 * Previews and prints one exam document. Whole-class documents offer a
 * section picker; the single-student documents (a family's own admit card or
 * report card) load straight away.
 */
export default function ExamDocumentDialog({ kind, exam, studentId, sections = [], onClose }: ExamDocumentDialogProps) {
  const { showMessage } = useMessage();
  const [sectionId, setSectionId] = useState("");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The PDF of what is on screen, from the server route that matches the document. */
  const downloadPdf = async () => {
    if (!kind || !exam) return;
    const section = sectionId || undefined;
    try {
      if (kind === "datesheet") {
        await downloadFile(`/examinations/exams/${exam.id}/datesheet/pdf`, undefined, "datesheet.pdf");
      } else if (kind === "admit-cards") {
        await downloadFile(`/examinations/exams/${exam.id}/admit-cards/pdf`, section ? { sectionId: section } : undefined, "admit-cards.pdf");
      } else if (kind === "admit-card" && studentId) {
        await downloadFile(`/examinations/exams/${exam.id}/students/${studentId}/admit-card/pdf`, undefined, "admit-card.pdf");
      } else if (kind === "report-cards" && exam.classId) {
        await downloadFile(
          `/examinations/academic-years/${exam.academicYearId}/report-cards/pdf`,
          { classId: exam.classId, ...(section ? { sectionId: section } : {}) },
          "report-cards.pdf",
        );
      } else if (kind === "report-card" && studentId) {
        await downloadFile(`/examinations/students/${studentId}/academic-years/${exam.academicYearId}/report-card/pdf`, undefined, "report-card.pdf");
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ?? (err as Error).message;
      showMessage(message || "The PDF could not be downloaded.", "error");
    }
  };

  const classSections = sections.filter((section) => section.classId === exam?.classId);
  const wholeClass = kind === "admit-cards" || kind === "report-cards";

  const load = useCallback(async () => {
    if (!kind || !exam) return;
    setLoading(true);
    setError(null);
    setLoaded(null);
    const section = sectionId || undefined;
    let result: Loaded | null = null;

    if (kind === "datesheet") {
      const { data } = await apiHandler<DatesheetData>(() => examinationsService.getDatesheet(exam.id), { showMessage });
      if (data?.printMeta && Array.isArray(data.papers)) result = { kind, data };
    } else if (kind === "admit-cards") {
      const { data } = await apiHandler<{ cards: AdmitCardData[]; printMeta: PrintMeta }>(
        () => examinationsService.getAdmitCards(exam.id, section),
        { showMessage },
      );
      if (data?.printMeta && Array.isArray(data.cards)) result = { kind, cards: data.cards, printMeta: data.printMeta };
    } else if (kind === "admit-card" && studentId) {
      const { data } = await apiHandler<AdmitCardData & { printMeta: PrintMeta }>(
        () => examinationsService.getAdmitCard(exam.id, studentId),
        { showMessage },
      );
      if (data?.printMeta) result = { kind: "admit-cards", cards: [data], printMeta: data.printMeta };
    } else if (kind === "report-cards" && exam.classId) {
      const { data } = await apiHandler<{ cards: ReportCardData[]; printMeta: PrintMeta }>(
        () => examinationsService.getReportCards(exam.academicYearId, exam.classId as string, section),
        { showMessage },
      );
      if (data?.printMeta && Array.isArray(data.cards)) result = { kind, cards: data.cards, printMeta: data.printMeta };
    } else if (kind === "report-card" && studentId) {
      const { data } = await apiHandler<ReportCardData & { printMeta: PrintMeta }>(
        () => examinationsService.getReportCard(studentId, exam.academicYearId),
        { showMessage },
      );
      if (data?.printMeta) result = { kind: "report-cards", cards: [data], printMeta: data.printMeta };
    }

    setLoaded(result);
    setError(result ? null : "This document could not be loaded.");
    setLoading(false);
  }, [kind, exam, studentId, sectionId, showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load whenever a document or section is chosen
    void load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start each document on all sections
    setSectionId("");
  }, [kind, exam?.id]);

  if (!kind || !exam) return <></>;

  const controls = wholeClass ? (
    <TextField
      select
      label="Section"
      size="small"
      value={sectionId}
      onChange={(e) => setSectionId(e.target.value)}
      sx={{ minWidth: 220 }}
    >
      <MenuItem value="">All sections</MenuItem>
      {classSections.map((section) => (
        <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
      ))}
    </TextField>
  ) : undefined;

  return (
    <PrintSheet
      open
      title={`${TITLES[kind]}: ${exam.name}`}
      loading={loading}
      error={error}
      onClose={onClose}
      controls={controls}
      onDownloadPdf={loaded ? downloadPdf : undefined}
    >
      {loaded?.kind === "datesheet" && <DatesheetView data={loaded.data} />}
      {loaded?.kind === "admit-cards" &&
        (loaded.cards.length === 0 ? (
          <NoDocuments />
        ) : (
          loaded.cards.map((card) => <AdmitCardView key={card.student.id} card={card} meta={loaded.printMeta} />)
        ))}
      {loaded?.kind === "report-cards" &&
        (loaded.cards.length === 0 ? (
          <NoDocuments />
        ) : (
          loaded.cards.map((card) => <ReportCardView key={card.student.id} card={card} meta={loaded.printMeta} />)
        ))}
    </PrintSheet>
  );
}

function NoDocuments() {
  return <div role="status">No students are enrolled for this selection.</div>;
}
