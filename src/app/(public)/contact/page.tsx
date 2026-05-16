import type { Metadata } from "next";
import ContactForm from "@/components/public/ContactForm";
import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { Email, Language } from "@mui/icons-material";
import { AI_POSITIONING } from "@/content/ai";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";

export const metadata: Metadata = {
  title: "Contact - Nexus Education ERP",
  description:
    "Contact the Nexus team to request a demo, ask about pricing, discuss AI-powered assistance, or plan the right ERP rollout for your institution.",
};

const contactInfo = [
  {
    icon: <Email sx={{ color: "primary.main" }} />,
    label: "General enquiries",
    value: "nexus@wisemensoft.com",
    href: "mailto:nexus@wisemensoft.com",
    body:
      "Use this for demos, product questions, pricing conversations, and general institutional enquiries.",
  },
  {
    icon: <Language sx={{ color: "primary.main" }} />,
    label: "Wisemen Soft",
    value: "wisemensoft.com",
    href: "https://wisemensoft.com",
    body:
      "Visit the parent company site if you want to understand the broader team behind Nexus.",
  },
];

const nextSteps = [
  "We review your message and identify whether it is a product, pricing, or support conversation.",
  "A team member follows up with the right context instead of sending a generic reply.",
  "If needed, we schedule a demo or discussion around your actual institutional setup.",
  "You leave the conversation with a clearer next step, not just a sales brochure.",
];

export default function ContactPage() {
  return (
    <>
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <PageBreadcrumbs crumbs={[{ label: "Contact" }]} />

          <Box sx={{ maxWidth: 920 }}>
            <Typography variant="h2" sx={{ fontWeight: 100, mb: 2, lineHeight: 1.3 }}>
              Talk to the{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                Nexus team
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 400, lineHeight: 1.8, mb: 3 }}
            >
              Whether you are exploring Nexus for the first time, comparing ERP
              options, planning a rollout, or already need support, this page is
              meant to make the next step easy.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
              We prefer clear conversations over generic contact funnels. Tell us
              what kind of institution you run, what stage you are at, and what
              you are trying to solve, and we will help you move toward the right
              answer faster.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mt: 2 }}>
              {AI_POSITIONING.short} If you want to understand how Nexus AI fits
              into the wider ERP story, this is also the right place to ask.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Grid container spacing={8}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ maxWidth: 760, mb: 3.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 100, mb: 1.5 }}>
                  Tell us what you{" "}
                  <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                    need help with
                  </Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                  The fastest way to get a useful reply is to share a little
                  context: your institution type, your campus setup, and whether
                  you are exploring demos, pricing, rollout planning, AI-powered
                  assistance, or support.
                </Typography>
              </Box>
              <ContactForm />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 100, mb: 1 }}>
                Reach us{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  directly
                </Box>
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 4, lineHeight: 1.8 }}
              >
                If you already know which path you need, these are the fastest
                ways to contact the right team.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 5 }}>
                {contactInfo.map((item) => (
                  <Box
                    key={item.label}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                  >
                    <Box sx={{ mt: 0.3 }}>{item.icon}</Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", textTransform: "uppercase", letterSpacing: 1 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        component="a"
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "text.primary",
                          textDecoration: "none",
                          "&:hover": { color: "primary.main" },
                          transition: "color 0.2s",
                        }}
                      >
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.75 }}>
                        {item.body}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Card
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  backgroundColor: "background.paper",
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{
                      display: "block",
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      mb: 1.5,
                    }}
                  >
                    Response expectation
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                    What happens after you reach out?
                  </Typography>
                  {nextSteps.map((step, index) => (
                    <Box key={step} sx={{ display: "flex", gap: 1.5, mb: index === nextSteps.length - 1 ? 0 : 1.75 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: "primary.main",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          mt: 0.1,
                        }}
                      >
                        <Typography sx={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>
                          {index + 1}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
