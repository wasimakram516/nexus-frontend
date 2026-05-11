"use client";

import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  return (
    <>
      {faqs.map((faq, i) => (
        <Accordion key={i} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", mb: 1, borderRadius: "8px !important", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {faq.q}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {faq.a}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
