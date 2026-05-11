import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
import { Box, Container, Grid, Typography } from "@mui/material";
import { Email, Language, Support } from "@mui/icons-material";

export const metadata: Metadata = {
  title: "Contact — Nexus Education ERP",
  description:
    "Get in touch with the Nexus team. Request a demo, ask about pricing, or reach out for support.",
};

const contactInfo = [
  {
    icon: <Email sx={{ color: "primary.main" }} />,
    label: "General Enquiries",
    value: "nexus@wisemensoft.com",
    href: "mailto:nexus@wisemensoft.com",
  },
  {
    icon: <Support sx={{ color: "primary.main" }} />,
    label: "Support",
    value: "support@wisemensoft.com",
    href: "mailto:support@wisemensoft.com",
  },
  {
    icon: <Language sx={{ color: "primary.main" }} />,
    label: "Website",
    value: "wisemensoft.com",
    href: "https://wisemensoft.com",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ fontWeight: 100, mb: 2 }}>
            Got a problem?{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>We&apos;ve got you.</Box>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 500 }}>
            Whether you want a demo, have questions about pricing, or need help choosing the right plan — we&apos;re here.
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Grid container spacing={8}>
            {/* Left — info */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 100, mb: 1 }}>
                Reach us{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>directly</Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                We typically respond within 24 hours on business days.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 6 }}>
                {contactInfo.map((item) => (
                  <Box key={item.label} sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ mt: 0.3 }}>{item.icon}</Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {item.label}
                      </Typography>
                      <Typography
                        component="a"
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" }, transition: "color 0.2s" }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* What to expect */}
              <Box sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  What happens after you reach out?
                </Typography>
                {[
                  "We review your message within 24 hours",
                  "A team member reaches out to understand your needs",
                  "We schedule a demo tailored to your institution type",
                  "You get a custom plan recommendation",
                ].map((step, i) => (
                  <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                      <Typography sx={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{i + 1}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{step}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Right — form */}
            <Grid size={{ xs: 12, md: 8 }}>
              <ContactForm />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
