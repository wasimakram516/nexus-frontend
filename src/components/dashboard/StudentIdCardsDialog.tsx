"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, MenuItem, TextField, Typography } from "@mui/material";
import PrintSheet from "@/components/shared/PrintSheet";
import { IdCard, IdCardSheets } from "@/components/dashboard/StudentIdCardViews";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import type { PrintMeta } from "@/lib/examDocuments";
import { peopleService } from "@/services/people.service";

interface Named {
  id: string;
  name: string;
}

interface StudentIdCardsDialogProps {
  open: boolean;
  onClose: () => void;
  campuses: Named[];
  classes: (Named & { campusId?: string })[];
  sections: (Named & { classId?: string })[];
  /** Print the card of one student, such as from their row. */
  studentId?: string;
  /** The campus to start on, such as the one the student is in. */
  initialCampusId?: string;
}

/**
 * Previews and prints student ID cards for a class or section, or for one
 * student. Choosing a class is required for a whole campus so a sheet is never
 * hundreds of cards by accident.
 */
export default function StudentIdCardsDialog({ open, onClose, campuses, classes, sections, studentId, initialCampusId }: StudentIdCardsDialogProps) {
  const { showMessage } = useMessage();
  const [campusId, setCampusId] = useState(initialCampusId ?? campuses[0]?.id ?? "");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [cards, setCards] = useState<IdCard[]>([]);
  const [meta, setMeta] = useState<PrintMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classesHere = useMemo(() => classes.filter((item) => !item.campusId || item.campusId === campusId), [classes, campusId]);
  const sectionsHere = useMemo(() => sections.filter((item) => item.classId === classId), [sections, classId]);
  const ready = Boolean(campusId && (studentId || classId));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, success } = await apiHandler<{ cards: IdCard[]; printMeta: PrintMeta }>(
      () =>
        peopleService.getIdCards({
          campusId,
          ...(studentId ? { studentId } : {}),
          ...(classId ? { classId } : {}),
          ...(sectionId ? { sectionId } : {}),
        }),
      { showMessage, silent: true }
    );
    setLoading(false);
    if (!success || !data) {
      setCards([]);
      setError("The cards could not be made.");
      return;
    }
    setCards(data.cards);
    setMeta(data.printMeta);
  }, [campusId, classId, sectionId, studentId, showMessage]);

  useEffect(() => {
    if (!open || !ready) return;
    (async () => {
      await load();
    })();
  }, [open, ready, load]);

  const controls = studentId ? undefined : (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <TextField select size="small" label="Campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); setClassId(""); setSectionId(""); }} sx={{ minWidth: 200 }}>
        {campuses.map((campus) => (
          <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }} sx={{ minWidth: 200 }}>
        {classesHere.map((item) => (
          <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId} sx={{ minWidth: 160 }}>
        <MenuItem value="">All sections</MenuItem>
        {sectionsHere.map((item) => (
          <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
        ))}
      </TextField>
    </Box>
  );

  return (
    <PrintSheet
      open={open}
      title={studentId ? "ID card" : "Student ID cards"}
      onClose={onClose}
      controls={controls}
      loading={loading}
      error={error}
    >
      {!ready ? (
        <Typography className="no-print" color="text.secondary">Choose a class to see its ID cards.</Typography>
      ) : cards.length === 0 || !meta ? (
        <Typography className="no-print" color="text.secondary">There are no students to make cards for.</Typography>
      ) : (
        <IdCardSheets cards={cards} meta={meta} />
      )}
    </PrintSheet>
  );
}
