"use client";

import { Box, Typography } from "@mui/material";
import { PrintPage } from "@/components/shared/PrintSheet";
import { formatDate } from "@/lib/dateFormat";
import type { PrintMeta } from "@/lib/examDocuments";

export interface IdCard {
  studentId: string;
  name: string;
  regNo: string;
  className: string;
  sectionName: string | null;
  picture: string | null;
  dob: string;
  validUntil: string | null;
  guardianPhone: string | null;
  customValues: { label: string; value: string }[];
}

/** A standard ID card is 85.6 by 54 millimetres; ten fit a portrait A4 page in two columns. */
const CARDS_PER_PAGE = 10;
const ACCENT_FALLBACK = "#1a237e";

/** The first letters of a name, for a student with no photo. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Typography sx={{ fontSize: 9.5, lineHeight: 1.35, color: "#111" }}>
      <Box component="span" sx={{ color: "#555" }}>{label} </Box>
      <Box component="span" sx={{ fontWeight: 600 }}>{value}</Box>
    </Typography>
  );
}

/** One identity card: the school, a photo, who the student is and where they study. */
export function IdCardFace({ card, meta }: { card: IdCard; meta: PrintMeta }) {
  const accent = meta.institution.branding.primaryColorLight ?? ACCENT_FALLBACK;
  return (
    <Box
      data-testid="id-card"
      sx={{
        width: "85.6mm",
        height: "54mm",
        border: "1px solid #999",
        borderRadius: "3mm",
        overflow: "hidden",
        bgcolor: "#fff",
        color: "#111",
        display: "flex",
        flexDirection: "column",
        breakInside: "avoid",
      }}
    >
      <Box data-testid="id-card-header" sx={{ bgcolor: accent, color: "#fff", px: "3mm", py: "1.6mm", display: "flex", alignItems: "center", gap: "2mm" }}>
        {meta.institution.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- print documents use the plain image so it prints reliably
          <img src={meta.institution.logoUrl} alt="" style={{ height: "7mm", width: "auto", background: "#fff", borderRadius: 2 }} />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, lineHeight: 1.15 }} noWrap>{meta.institution.name}</Typography>
          {meta.campus && <Typography sx={{ fontSize: 8, opacity: 0.9, lineHeight: 1.1 }} noWrap>{meta.campus.name}</Typography>}
        </Box>
        <Typography sx={{ ml: "auto", fontSize: 8, fontWeight: 700, letterSpacing: 0.8 }}>STUDENT</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: "3mm", p: "2.5mm 3mm", flex: 1, minHeight: 0 }}>
        <Box sx={{ width: "20mm", height: "25mm", flexShrink: 0, border: "1px solid #bbb", borderRadius: "1mm", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f1f1f1" }}>
          {card.picture ? (
            // eslint-disable-next-line @next/next/no-img-element -- print documents use the plain image so it prints reliably
            <img src={card.picture} alt={`Photo of ${card.name}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#777" }}>{initialsOf(card.name)}</Typography>
          )}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, lineHeight: 1.2, mb: "1mm" }}>{card.name}</Typography>
          <Line label="Reg No" value={card.regNo} />
          <Line label="Class" value={`${card.className}${card.sectionName ? `, ${card.sectionName}` : ""}`} />
          <Line label="Born" value={formatDate(card.dob)} />
          {card.guardianPhone && <Line label="Guardian" value={card.guardianPhone} />}
          {card.customValues.map((item) => (
            <Line key={item.label} label={item.label} value={item.value} />
          ))}
        </Box>
      </Box>

      {card.validUntil && (
        <Box sx={{ borderTop: `1px solid ${accent}`, px: "3mm", py: "1mm", display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 8, color: "#555" }}>Valid until</Typography>
          <Typography sx={{ fontSize: 8, fontWeight: 700 }}>{formatDate(card.validUntil)}</Typography>
        </Box>
      )}
    </Box>
  );
}

/** Cards laid two across, ten to a page, ready to print and cut. */
export function IdCardSheets({ cards, meta }: { cards: IdCard[]; meta: PrintMeta }) {
  const pages: IdCard[][] = [];
  for (let start = 0; start < cards.length; start += CARDS_PER_PAGE) pages.push(cards.slice(start, start + CARDS_PER_PAGE));
  return (
    <>
      {pages.map((page, index) => (
        <PrintPage key={index} compact>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 85.6mm)", gap: "4mm", justifyContent: "center" }}>
            {page.map((card) => (
              <IdCardFace key={card.studentId} card={card} meta={meta} />
            ))}
          </Box>
        </PrintPage>
      ))}
    </>
  );
}
