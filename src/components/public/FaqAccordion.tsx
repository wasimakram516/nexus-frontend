"use client";

import { useId, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Collapse, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Remove from "@mui/icons-material/Remove";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqRowProps {
  id: string;
  index: number;
  isOpen: boolean;
  item: FaqItem;
  onToggle: (expanded: boolean) => void;
}

/**
 * One numbered question that opens to its answer and is highlighted while open.
 */
function FaqRow({ id, index, isOpen, item, onToggle }: FaqRowProps) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={isOpen}
      onChange={(_event, expanded) => onToggle(expanded)}
      // MUI wraps the button in an h3 by default; the question is already the h3, so the wrapper
      // becomes a plain div to avoid a heading inside a heading.
      slotProps={{ heading: { component: "div" }, transition: { timeout: 220 } }}
      sx={{
        "&::before": { display: "none" },
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: isOpen ? "primary.main" : "divider",
        borderRadius: "12px !important",
        overflow: "hidden",
        transition: "border-color 200ms ease",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <AccordionSummary
        aria-controls={`${id}-content`}
        expandIcon={null}
        id={`${id}-header`}
        sx={{
          px: 2.5,
          py: 1,
          "& .MuiAccordionSummary-content": { alignItems: "center", gap: 2, m: 0 },
        }}
      >
        <Typography
          aria-hidden="true"
          sx={{
            color: isOpen ? "primary.main" : "text.disabled",
            fontSize: "0.85rem",
            fontWeight: 700,
            minWidth: 24,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </Typography>
        <Typography component="h3" sx={{ flexGrow: 1, fontSize: "1.05rem", fontWeight: 650 }}>
          {item.q}
        </Typography>
        <Box
          aria-hidden="true"
          sx={{
            alignItems: "center",
            backgroundColor: isOpen ? "primary.main" : "action.hover",
            borderRadius: "50%",
            color: isOpen ? "primary.contrastText" : "primary.main",
            display: "inline-flex",
            flexShrink: 0,
            height: 32,
            justifyContent: "center",
            transition: "background-color 200ms ease, color 200ms ease",
            width: 32,
          }}
        >
          {isOpen ? <Remove fontSize="small" /> : <Add fontSize="small" />}
        </Box>
      </AccordionSummary>
      <AccordionDetails id={`${id}-content`} sx={{ pb: 2.75, pl: { xs: 2.5, sm: 8.5 }, pr: 2.5, pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {item.a}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}

interface FaqAccordionProps {
  faqs: FaqItem[];
  /** How many questions show before "Show more". Leave out to show them all. */
  visibleCount?: number;
}

/**
 * A list of questions, shown the same way on every public page. One answer is open at a time.
 * Questions past `visibleCount` fold away behind a "Show more" button; every answer stays in the
 * page markup, so search engines still read all of them.
 */
export default function FaqAccordion({ faqs, visibleCount = faqs.length }: FaqAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | false>(false);
  const [showAll, setShowAll] = useState(false);
  const moreCount = faqs.length - visibleCount;
  const moreId = `${baseId}-more`;

  /**
   * Opens or closes one answer, keeping only one open at a time.
   */
  function handleToggle(index: number, expanded: boolean) {
    setOpenIndex(expanded ? index : false);
  }

  /**
   * Shows or hides the extra questions, closing an answer that would be hidden with them.
   */
  function handleShowToggle() {
    if (showAll && typeof openIndex === "number" && openIndex >= visibleCount) {
      setOpenIndex(false);
    }
    setShowAll((current) => !current);
  }

  const renderRow = (item: FaqItem, index: number) => (
    <FaqRow
      key={item.q}
      id={`${baseId}-${index}`}
      index={index}
      isOpen={openIndex === index}
      item={item}
      onToggle={(expanded) => handleToggle(index, expanded)}
    />
  );

  return (
    <Box>
      <Box sx={{ display: "grid", gap: 1.5 }}>{faqs.slice(0, visibleCount).map((item, i) => renderRow(item, i))}</Box>

      {moreCount > 0 ? (
        <>
          <Collapse id={moreId} in={showAll} timeout={350}>
            <Box sx={{ display: "grid", gap: 1.5, pt: 1.5 }}>
              {faqs.slice(visibleCount).map((item, i) => renderRow(item, visibleCount + i))}
            </Box>
          </Collapse>
          <Button
            aria-controls={moreId}
            aria-expanded={showAll}
            endIcon={showAll ? <ExpandLess /> : <ExpandMore />}
            onClick={handleShowToggle}
            sx={{ mt: 1.5 }}
          >
            {showAll ? "Show less" : `Show more questions (${moreCount})`}
          </Button>
        </>
      ) : null}
    </Box>
  );
}
