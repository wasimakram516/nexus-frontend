"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  ListSubheader,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import FileDownload from "@mui/icons-material/FileDownload";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
import ReportTableView from "@/components/dashboard/ReportTableView";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { comparisonCards, REPORT_GROUPS, REPORTS, type ReportDefinition, type ReportTable } from "@/lib/reports";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { reportsService } from "@/services/reports.service";

interface Named {
  id: string;
  name: string;
}
interface CampusItem extends Named {
  institutionId?: string;
}
interface LevelItem extends Named {
  campusId?: string;
}
interface ClassItem extends Named {
  levelId?: string;
}
interface SectionItem extends Named {
  classId?: string;
}

interface ReportsManagerProps {
  /** Set when a superadmin views one institution from the platform console. */
  institutionId?: string;
}

/** How long to wait after a filter changes before asking again, so typing a number asks once. */
const SETTLE_MS = 350;

/**
 * Reports for institution administrators: pick a report, set its filters, see
 * it as a table, and download it as a spreadsheet or a PDF. The first report,
 * the campus comparison, doubles as the overview with headline figures.
 */
export default function ReportsManager({ institutionId }: ReportsManagerProps) {
  const { showMessage } = useMessage();
  const [reportKey, setReportKey] = useState(REPORTS[0].key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [classId, setClassId] = useState("");
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [table, setTable] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);

  const definition = REPORTS.find((report) => report.key === reportKey) as ReportDefinition;

  useEffect(() => {
    (async () => {
      const [campusRes, levelRes, classRes, sectionRes] = await Promise.all([
        apiHandler<{ items: CampusItem[] }>(() => campusesService.getAll({ limit: 100 }), { showMessage, silent: true }),
        apiHandler<LevelItem[]>(() => academicsService.getLevels(), { showMessage, silent: true }),
        apiHandler<ClassItem[]>(() => academicsService.getClasses(), { showMessage, silent: true }),
        apiHandler<SectionItem[]>(() => academicsService.getSections(), { showMessage, silent: true }),
      ]);
      const mine = (campusRes.data?.items ?? []).filter((campus) => !institutionId || campus.institutionId === institutionId);
      const campusIds = new Set(mine.map((campus) => campus.id));
      const myLevels = (levelRes.data ?? []).filter((level) => !institutionId || (level.campusId && campusIds.has(level.campusId)));
      const levelIds = new Set(myLevels.map((level) => level.id));
      const myClasses = (classRes.data ?? []).filter((item) => !institutionId || (item.levelId && levelIds.has(item.levelId)));
      const classIds = new Set(myClasses.map((item) => item.id));
      setCampuses(mine);
      setLevels(myLevels);
      setClasses(myClasses);
      setSections((sectionRes.data ?? []).filter((section) => !institutionId || (section.classId && classIds.has(section.classId))));
    })();
  }, [institutionId, showMessage]);

  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const changeReport = (key: string) => {
    setReportKey(key);
    setValues({});
    setClassId("");
    setTable(null);
  };

  /** The filters actually sent: only the ones this report takes and that have a value. */
  const params = useMemo(() => {
    const sent: Record<string, string> = {};
    const add = (key: string, value: string | undefined) => {
      if (value) sent[key] = value;
    };
    for (const filter of definition.filters) {
      if (filter === "date") add("date", values.date);
      if (filter === "campus") add("campusId", values.campusId);
      if (filter === "period") {
        add("from", values.from);
        add("to", values.to);
      }
      if (filter === "month") add("month", values.month);
      if (filter === "section") add("sectionId", values.sectionId);
      if (filter === "groupBy") add("groupBy", values.groupBy);
      if (filter === "threshold") add("thresholdPercent", values.thresholdPercent);
    }
    if (institutionId) sent.institutionId = institutionId;
    return sent;
  }, [definition, values, institutionId]);

  const missing = (definition.required ?? []).some((filter) => filter === "section" && !values.sectionId);

  const run = useCallback(async () => {
    setLoading(true);
    const { data } = await apiHandler<ReportTable>(() => reportsService.get(definition.path, params), { showMessage });
    setTable(data);
    setLoading(false);
  }, [definition.path, params, showMessage]);

  useEffect(() => {
    if (missing) return;
    const timer = setTimeout(() => {
      void run();
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [run, missing]);

  const download = async (format: "csv" | "pdf") => {
    setDownloading(format);
    try {
      await reportsService.download(definition.path, params, format);
    } catch (error) {
      showMessage((error as Error).message || "The report could not be downloaded.", "error");
    } finally {
      setDownloading(null);
    }
  };

  const campusLabel = (campusId?: string) => campuses.find((campus) => campus.id === campusId)?.name;
  const classLabel = (item: ClassItem) => {
    const campus = campusLabel(levels.find((level) => level.id === item.levelId)?.campusId);
    return campuses.length > 1 && campus ? `${item.name} · ${campus}` : item.name;
  };
  const sectionsOfClass = sections.filter((section) => section.classId === classId);

  const has = (filter: ReportDefinition["filters"][number]) => definition.filters.includes(filter);
  const cards = table && table.key === "campus-comparison" ? comparisonCards(table) : [];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField select fullWidth size="small" label="Report" value={reportKey} onChange={(e) => changeReport(e.target.value)} helperText={definition.description}>
            {REPORT_GROUPS.flatMap((group) => [
              <ListSubheader key={group}>{group}</ListSubheader>,
              ...REPORTS.filter((report) => report.group === group).map((report) => (
                <MenuItem key={report.key} value={report.key}>{report.label}</MenuItem>
              )),
            ])}
          </TextField>
        </Grid>

        {has("date") && (
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField fullWidth size="small" type="date" label="As of" value={values.date ?? ""} onChange={(e) => set("date", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="Empty is today" />
          </Grid>
        )}
        {has("campus") && (
          <Grid size={{ xs: 6, md: 3 }}>
            <TextField select fullWidth size="small" label="Campus" value={values.campusId ?? ""} onChange={(e) => set("campusId", e.target.value)}>
              <MenuItem value="">All campuses</MenuItem>
              {campuses.map((campus) => (
                <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
        {has("period") && (
          <>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField fullWidth size="small" type="date" label="From" value={values.from ?? ""} onChange={(e) => set("from", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="Empty is the 1st of the month" />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField fullWidth size="small" type="date" label="To" value={values.to ?? ""} onChange={(e) => set("to", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="Empty is today" />
            </Grid>
          </>
        )}
        {has("section") && (
          <>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField select fullWidth size="small" label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); set("sectionId", ""); }}>
                {classes.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{classLabel(item)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField select fullWidth size="small" label="Section" value={values.sectionId ?? ""} onChange={(e) => set("sectionId", e.target.value)} disabled={!classId}>
                {sectionsOfClass.map((section) => (
                  <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </>
        )}
        {has("month") && (
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField fullWidth size="small" type="month" label="Month" value={values.month ?? ""} onChange={(e) => set("month", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="Empty is this month" />
          </Grid>
        )}
        {has("groupBy") && (
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField select fullWidth size="small" label="Group by" value={values.groupBy ?? "DAY"} onChange={(e) => set("groupBy", e.target.value)}>
              <MenuItem value="DAY">Day</MenuItem>
              <MenuItem value="MONTH">Month</MenuItem>
              <MenuItem value="CAMPUS">Campus</MenuItem>
            </TextField>
          </Grid>
        )}
        {has("threshold") && (
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField fullWidth size="small" type="number" label="Absent at least %" value={values.thresholdPercent ?? ""} onChange={(e) => set("thresholdPercent", e.target.value)} slotProps={{ htmlInput: { min: 1, max: 100 } }} helperText="Empty is 20" />
          </Grid>
        )}
      </Grid>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button variant="outlined" startIcon={downloading === "csv" ? <CircularProgress size={16} /> : <FileDownload />} onClick={() => download("csv")} disabled={missing || Boolean(downloading)}>
          Download CSV
        </Button>
        <Button variant="outlined" startIcon={downloading === "pdf" ? <CircularProgress size={16} /> : <PictureAsPdf />} onClick={() => download("pdf")} disabled={missing || Boolean(downloading)}>
          Download PDF
        </Button>
      </Box>

      {missing ? (
        <Alert severity="info">Choose a class and a section to see its register.</Alert>
      ) : loading && !table ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : table ? (
        <Box sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 120ms" }}>
          {cards.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {cards.map((card) => (
                <Grid key={card.label} size={{ xs: 6, md: 12 / 5 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                      {card.hint && <Typography variant="caption" color="text.secondary">{card.hint}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          <ReportTableView table={table} />
        </Box>
      ) : null}
    </Box>
  );
}
