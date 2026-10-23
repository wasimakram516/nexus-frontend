"use client";

import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  GlobalStyles,
  Toolbar,
  Typography,
} from "@mui/material";
import Print from "@mui/icons-material/Print";
import Close from "@mui/icons-material/Close";
import { PrintMeta } from "@/lib/examDocuments";

const ACCENT_FALLBACK = "#1a237e";

/** Print rules: hide everything but the sheet, and start each document on a new page. */
const PRINT_STYLES = {
  "@media print": {
    "body *": { visibility: "hidden !important" },
    "#print-root, #print-root *": { visibility: "visible !important" },
    "#print-root": { position: "absolute", left: 0, top: 0, width: "100%" },
    ".no-print": { display: "none !important" },
    ".print-page": { breakAfter: "page", pageBreakAfter: "always", breakInside: "avoid" },
    ".print-page:last-child": { breakAfter: "auto", pageBreakAfter: "auto" },
    ".MuiDialog-root, .MuiDialog-container, .MuiDialog-paper": {
      position: "static !important",
      overflow: "visible !important",
      height: "auto !important",
      maxHeight: "none !important",
      boxShadow: "none !important",
    },
    "@page": { margin: "12mm" },
  },
} as const;

interface PrintSheetProps {
  open: boolean;
  /** Shown in the toolbar, not printed. */
  title: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  /** Controls above the document, such as a section picker. Not printed. */
  controls?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The shared print layout: a full-screen preview with a Print button. Only the
 * document itself is printed, each document starting on its own page. Exam
 * documents use it now; fee vouchers can reuse it.
 */
export default function PrintSheet({ open, title, loading, error, onClose, controls, children }: PrintSheetProps) {
  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <GlobalStyles styles={PRINT_STYLES} />
      <AppBar position="sticky" color="default" elevation={1} className="no-print">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>{title}</Typography>
          <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={loading || Boolean(error)}>
            Print
          </Button>
          <Button startIcon={<Close />} onClick={onClose}>Close</Button>
        </Toolbar>
      </AppBar>
      {controls && <Box className="no-print" sx={{ px: 3, pt: 2 }}>{controls}</Box>}
      <Box sx={{ p: { xs: 1, sm: 3 }, bgcolor: "grey.100", flex: 1 }}>
        <Box id="print-root" sx={{ maxWidth: 900, mx: "auto" }}>
          {loading ? (
            <Box className="no-print" sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
          ) : error ? (
            <Typography role="alert" color="error" className="no-print">{error}</Typography>
          ) : (
            children
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

interface DocumentHeaderProps {
  meta: PrintMeta;
  title: string;
}

/** The institution name, logo and campus at the top of every printed document. */
export function DocumentHeader({ meta, title }: DocumentHeaderProps) {
  const accent = meta.institution.branding.primaryColorLight ?? ACCENT_FALLBACK;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, borderBottom: `3px solid ${accent}`, pb: 1.5, mb: 2 }}>
      {meta.institution.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- print documents use the plain image so it prints reliably
        <img src={meta.institution.logoUrl} alt={`${meta.institution.name} logo`} style={{ height: 56, width: "auto" }} />
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{meta.institution.name}</Typography>
        {meta.campus && <Typography variant="body2" sx={{ color: "#444" }}>{meta.campus.name}</Typography>}
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 1 }}>
        {title}
      </Typography>
    </Box>
  );
}

/** One printed page: white, dark text, and a page break after it. */
export function PrintPage({ children }: { children: React.ReactNode }) {
  return (
    <Box className="print-page" sx={{ bgcolor: "#fff", color: "#111", p: 4, mb: 3, boxShadow: 1, "@media print": { boxShadow: "none", p: 0, mb: 0 } }}>
      {children}
    </Box>
  );
}
