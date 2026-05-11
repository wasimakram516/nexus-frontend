import type { Metadata } from "next";
import FaqAccordion from "@/components/public/FaqAccordion";
import { Box, Container, Grid, Typography } from "@mui/material";
import { Email, Message } from "@mui/icons-material";

export const metadata: Metadata = {
  title: "FAQ — Nexus Education ERP",
  description:
    "Frequently asked questions about Nexus — setup, pricing, data security, multi-campus support, and more.",
};

export const faqs = [
  {
    q: "How many campuses can I manage with Nexus?",
    a: "Nexus supports unlimited campuses. The number available depends on your plan — Growth includes up to 5, Enterprise supports unlimited.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (TLS) and at rest. Each institution's data is fully isolated. We do not share data between institutions.",
  },
  {
    q: "Can I try Nexus before paying?",
    a: "Yes, all plans include a 14-day free trial. No credit card is required to start.",
  },
  {
    q: "What user roles are available?",
    a: "Nexus includes 6 roles: Admin, Teacher, Student, Guardian, Accountant, and Superadmin. Each role has scoped access to relevant modules and data.",
  },
  {
    q: "Can I customise fields for students or teachers?",
    a: "Yes. Nexus has a built-in Custom Fields system that lets you add dynamic fields to any entity — students, teachers, guardians, and more — without any code changes.",
  },
  {
    q: "Does Nexus support Arabic or RTL languages?",
    a: "RTL and Arabic language support is on our roadmap. Contact us if this is a requirement for your institution.",
  },
  {
    q: "How does billing work?",
    a: "You can choose monthly or annual billing. Annual billing gives you a significant discount. Enterprise plans are billed on a custom cycle agreed with the sales team.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You own your data. Nexus provides data export at any time. There is no lock-in.",
  },
  {
    q: "Is there an API?",
    a: "Yes, Nexus is built on a fully documented REST API. Enterprise customers can integrate Nexus with other systems via the API.",
  },
  {
    q: "What support options are available?",
    a: "All plans include email support. Growth plans include priority support. Enterprise plans include a dedicated support contact and SLA guarantees.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Typography variant="h3" sx={{ fontWeight: 100, mb: 2 }}>
            Frequently{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>Asked Questions</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Everything you need to know about Nexus.
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 8 }}>
              <FaqAccordion faqs={faqs} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ position: "sticky", top: 100 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Still have questions?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                  Can&apos;t find what you&apos;re looking for? Our team is happy to help.
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Email sx={{ fontSize: 18, color: "primary.main" }} />
                  <Box component="a" href="mailto:nexus@wisemensoft.com" sx={{ color: "text.secondary", textDecoration: "none", fontSize: 14, "&:hover": { color: "primary.main" }, transition: "color 0.2s" }}>
                    nexus@wisemensoft.com
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Message sx={{ fontSize: 18, color: "primary.main" }} />
                  <Box component="a" href="/contact" sx={{ color: "text.secondary", textDecoration: "none", fontSize: 14, "&:hover": { color: "primary.main" }, transition: "color 0.2s" }}>
                    Send us a message
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
