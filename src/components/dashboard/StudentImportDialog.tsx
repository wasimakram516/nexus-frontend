"use client";

import { useRef, useState } from "react";
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
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import FileDownload from "@mui/icons-material/FileDownload";
import UploadFile from "@mui/icons-material/UploadFile";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import {
  credentialsCsv,
  IMPORT_CHUNK,
  parseStudentFile,
  templateCsv,
  type ImportResult,
  type ImportRow,
} from "@/lib/studentImport";
import { peopleService } from "@/services/people.service";

interface Named {
  id: string;
  name: string;
}

interface CheckedRow {
  line: number;
  name: string;
  errors: string[];
  warnings: string[];
  guardian: { mode: "NONE" | "NEW" | "EXISTING"; sharedWithLine?: number };
}

interface Preview {
  rows: CheckedRow[];
  summary: { total: number; valid: number; invalid: number; newGuardians: number; existingGuardians: number };
}

interface StudentImportDialogProps {
  open: boolean;
  onClose: () => void;
  campuses: Named[];
  /** Called when students were saved, so the list can reload. */
  onImported: () => void;
}

/** How many problem lines are listed; the rest are counted. */
const SHOWN_PROBLEMS = 100;

/** Saves a text file as a download. */
function saveText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Bring a school's students in from a spreadsheet. The file is read here, every
 * line is checked by the server first (nothing is saved), and then the good
 * lines are saved a few at a time. The first passwords are shown once, as a
 * file to download, because they are not stored anywhere readable.
 */
export default function StudentImportDialog({ open, onClose, campuses, onImported }: StudentImportDialogProps) {
  const { showMessage } = useMessage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? "");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState<{ ignored: string[]; missing: string[] }>({ ignored: [], missing: [] });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);

  const reset = () => {
    setRows([]);
    setFileName("");
    setNotes({ ignored: [], missing: [] });
    setPreview(null);
    setProgress(null);
    setResults(null);
    setStoppedAt(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const close = () => {
    if (progress) return;
    if (results?.some((result) => result.status !== "FAILED")) onImported();
    reset();
    onClose();
  };

  const check = async (lines: ImportRow[], campus: string) => {
    setChecking(true);
    setPreview(null);
    const { data } = await apiHandler<Preview>(() => peopleService.previewStudentImport({ campusId: campus, rows: lines }), { showMessage, silent: true });
    setPreview(data);
    setChecking(false);
  };

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = parseStudentFile(await file.text());
    setFileName(file.name);
    setRows(parsed.rows);
    setNotes({ ignored: parsed.ignoredColumns, missing: parsed.missingColumns });
    setPreview(null);
    setResults(null);
    if (parsed.missingColumns.length === 0 && parsed.rows.length > 0 && campusId) await check(parsed.rows, campusId);
  };

  const changeCampus = async (id: string) => {
    setCampusId(id);
    if (rows.length > 0 && notes.missing.length === 0) await check(rows, id);
  };

  const run = async () => {
    const all: ImportResult[] = [];
    setResults(null);
    setStoppedAt(null);
    setProgress({ done: 0, total: rows.length });
    // Every line is sent, in order, so a line keeps its number in the file; the server skips the ones with problems.
    for (let start = 0; start < rows.length; start += IMPORT_CHUNK) {
      const { data, success } = await apiHandler<{ results: ImportResult[] }>(
        () => peopleService.importStudents({ campusId, rows: rows.slice(start, start + IMPORT_CHUNK), rowOffset: start }),
        { showMessage, silent: true }
      );
      if (!success || !data) {
        setStoppedAt(start + 2);
        break;
      }
      all.push(...data.results);
      setProgress({ done: Math.min(start + IMPORT_CHUNK, rows.length), total: rows.length });
    }
    setResults(all);
    setProgress(null);
  };

  const problems = (preview?.rows ?? []).filter((row) => row.errors.length > 0);
  const warned = (preview?.rows ?? []).filter((row) => row.errors.length === 0 && row.warnings.length > 0);
  const imported = results?.filter((result) => result.status !== "FAILED") ?? [];
  const failed = results?.filter((result) => result.status === "FAILED" || result.status === "IMPORTED_GUARDIAN_FAILED") ?? [];

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Import students</DialogTitle>
      <DialogContent>
        {results ? (
          <Box>
            <Alert severity={imported.length > 0 ? "success" : "warning"} sx={{ mb: 2 }}>
              {imported.length} of {results.length} lines imported{failed.length > 0 ? `, ${failed.length} need attention` : ""}.
              {stoppedAt ? ` The import stopped at line ${stoppedAt} because the server could not be reached; the lines after it were not tried.` : ""}
            </Alert>
            {imported.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }} action={<Button color="inherit" size="small" startIcon={<FileDownload />} onClick={() => saveText("student-login-details.csv", credentialsCsv(results))}>Download</Button>}>
                Download the sign-in details now. The first passwords are shown only here and cannot be looked up later. Each person must choose their own password when they first sign in.
              </Alert>
            )}
            {failed.length > 0 && (
              <Table size="small" aria-label="Lines that need attention">
                <TableHead>
                  <TableRow>
                    <TableCell>Line</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>What happened</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failed.slice(0, SHOWN_PROBLEMS).map((result) => (
                    <TableRow key={result.line}>
                      <TableCell>{result.line}</TableCell>
                      <TableCell>{result.name || "—"}</TableCell>
                      <TableCell>{result.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        ) : progress ? (
          <Box sx={{ py: 3 }}>
            <Typography sx={{ mb: 1 }}>Importing students, line {progress.done} of {progress.total}. Please keep this window open.</Typography>
            <LinearProgress variant="determinate" value={(progress.done / Math.max(progress.total, 1)) * 100} />
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file saved from Excel or Google Sheets, one student on each line. Every line is checked first and nothing is saved until you confirm.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
              <TextField select size="small" label="Campus" value={campusId} onChange={(e) => void changeCampus(e.target.value)} sx={{ minWidth: 220 }}>
                {campuses.map((campus) => (
                  <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
                ))}
              </TextField>
              <Button variant="outlined" startIcon={<UploadFile />} component="label" disabled={checking || !campusId}>
                Choose CSV file
                <input ref={fileInput} hidden type="file" accept=".csv,text/csv" aria-label="CSV file" onChange={chooseFile} />
              </Button>
              <Button startIcon={<FileDownload />} onClick={() => saveText("student-import-template.csv", templateCsv())}>
                Download template
              </Button>
              {fileName && <Typography variant="body2" color="text.secondary">{fileName}</Typography>}
            </Box>

            {notes.missing.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                The file has no {notes.missing.join(", ")} column. Add {notes.missing.length === 1 ? "it" : "them"} to the first line, or start from the template.
              </Alert>
            )}
            {notes.ignored.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Not used: {notes.ignored.join(", ")}.
              </Alert>
            )}
            {fileName && rows.length === 0 && notes.missing.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>The file has no students in it.</Alert>
            )}
            {checking && <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>}

            {preview && (
              <Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Chip label={`${preview.summary.total} lines`} />
                  <Chip color="success" label={`${preview.summary.valid} ready`} />
                  {preview.summary.invalid > 0 && <Chip color="error" label={`${preview.summary.invalid} with problems`} />}
                  {preview.summary.newGuardians > 0 && <Chip variant="outlined" label={`${preview.summary.newGuardians} new guardians`} />}
                  {preview.summary.existingGuardians > 0 && <Chip variant="outlined" label={`${preview.summary.existingGuardians} existing guardians linked`} />}
                </Box>
                {problems.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Lines with problems (these will be skipped)</Typography>
                    <Table size="small" aria-label="Lines with problems">
                      <TableHead>
                        <TableRow>
                          <TableCell>Line</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Problem</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {problems.slice(0, SHOWN_PROBLEMS).map((row) => (
                          <TableRow key={row.line}>
                            <TableCell>{row.line}</TableCell>
                            <TableCell>{row.name || "—"}</TableCell>
                            <TableCell>{row.errors.join(" ")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {problems.length > SHOWN_PROBLEMS && (
                      <Typography variant="caption" color="text.secondary">and {problems.length - SHOWN_PROBLEMS} more.</Typography>
                    )}
                  </>
                )}
                {warned.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {warned.length} line{warned.length === 1 ? "" : "s"} will be imported but may need a look, for example line {warned[0].line}: {warned[0].warnings[0]}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {results ? (
          <>
            {failed.length > 0 && <Button onClick={reset}>Import another file</Button>}
            <Button variant="contained" onClick={close}>Done</Button>
          </>
        ) : (
          <>
            <Button onClick={close} disabled={Boolean(progress)}>Cancel</Button>
            <Button variant="contained" onClick={run} disabled={!preview || preview.summary.valid === 0 || Boolean(progress)}>
              {preview ? `Import ${preview.summary.valid} student${preview.summary.valid === 1 ? "" : "s"}` : "Import"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
