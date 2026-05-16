import type { Metadata } from "next";
import FaqAccordion from "@/components/public/FaqAccordion";
import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import { Email, Message } from "@mui/icons-material";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";

export const metadata: Metadata = {
  title: "FAQ - Nexus Education ERP",
  description:
    "Find answers to common questions about Nexus pricing, security, campuses, support, AI-powered assistance, trial access, API availability, and product flexibility for educational institutions.",
};

export const faqs = [
  {
    q: "How many campuses can I manage with Nexus?",
    a: "Nexus can support multi-campus institutions, including organisations that need central oversight with local campus control. The exact commercial allowance depends on your plan, but the product itself is built with multi-campus operations in mind rather than treating campuses as an afterthought.",
  },
  {
    q: "Is our institutional data secure in Nexus?",
    a: "Yes. Data isolation, scoped access, and secure handling are core expectations for the platform. Nexus is designed so institutions can manage sensitive student, staff, attendance, and finance records with stronger operational boundaries than ad hoc tools usually provide.",
  },
  {
    q: "Can we try Nexus before making a buying decision?",
    a: "Yes. Nexus offers a 14-day free trial so institutions can understand the product direction before committing commercially. That gives teams a clearer way to evaluate operational fit instead of relying on sales copy alone.",
  },
  {
    q: "What user roles does Nexus support?",
    a: "Nexus includes core role-based access for major institutional users such as administrators, teachers, students, guardians, accountants, and superadmin-level control. The goal is to keep each role close to the part of the system it should actually use.",
  },
  {
    q: "Can we customise student, teacher, or guardian data fields?",
    a: "Yes. Nexus includes a custom-fields system so institutions can extend supported records without turning every local data requirement into a development request. That helps the product stay flexible while keeping the core model cleaner.",
  },
  {
    q: "Does Nexus support Arabic or RTL languages?",
    a: "Arabic and RTL support are on the roadmap. If language support is important for your institution or deployment region, it is worth discussing early so the product conversation reflects that operational need clearly.",
  },
  {
    q: "How does pricing and billing work?",
    a: "Nexus supports both monthly and annual billing, with annual billing offering a lower effective cost for institutions ready for a longer-term commitment. Custom enterprise-style pricing remains available for institutions with broader rollout or procurement requirements.",
  },
  {
    q: "Can we export our data from Nexus?",
    a: "Yes. Your institution owns its data. Nexus is designed to avoid lock-in and supports exportability so institutions are not trapped in a system they cannot inspect or leave cleanly.",
  },
  {
    q: "Does Nexus provide an API?",
    a: "Yes. Nexus is backed by a documented API, which is especially useful for institutions or enterprise buyers that need integration paths beyond the standard product experience.",
  },
  {
    q: "What support options are available?",
    a: "Support options vary by plan and commercial arrangement, but the broader direction includes email support, stronger help for growth-stage customers, and more tailored support handling for enterprise-style deployments.",
  },
  {
    q: "Does Nexus include AI-powered assistance?",
    a: "Yes. Nexus is positioned as an AI-assisted education ERP, and Nexus AI is the clearest public expression of that today. We use measured language deliberately: the platform already includes AI-powered assistance, and it is evolving toward broader AI-powered insights and smarter operational support across modules.",
  },
  {
    q: "Is Nexus claiming fully autonomous AI across the platform?",
    a: "No. We avoid overclaiming. The direction is AI-assisted rather than AI-first hype. That means practical guidance, smarter visibility, and evolving workflows built on top of connected ERP data, not exaggerated claims about autonomous decision-making.",
  },
];

const faqThemes = [
  {
    title: "Buying and rollout",
    body:
      "Questions about trials, billing, support, and rollout usually come up first because institutions want to understand commercial fit before they commit to system change.",
  },
  {
    title: "Security and trust",
    body:
      "Education ERP decisions involve sensitive data and operational dependence. That is why questions about access, ownership, and exportability matter early in the process.",
  },
  {
    title: "Flexibility and scale",
    body:
      "Multi-campus structure, custom fields, and API access matter because institutions rarely stay static. The product has to support operational growth without forcing a rebuild later.",
  },
];

export default function FaqPage() {
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
          <PageBreadcrumbs crumbs={[{ label: "FAQ" }]} />

          <Box sx={{ maxWidth: 920 }}>
            <Typography variant="h2" sx={{ fontWeight: 100, mb: 2, lineHeight: 1.3 }}>
              Frequently asked{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                questions about Nexus
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 400, lineHeight: 1.8, mb: 3 }}
            >
              This page is here to answer the questions institutions usually ask
              before they choose an ERP: pricing, campuses, security,
              customisation, support, and rollout fit.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
              If you are comparing products, trying to understand whether Nexus
              fits your operational model, or preparing internal stakeholders for
              a buying decision, these are the answers most teams ask for first.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mt: 2 }}>
              That now includes questions about AI-powered assistance too. We
              want the AI story to feel trustworthy, useful, and connected to the
              wider ERP rather than like a detached chatbot pitch.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
              gap: 5,
              mb: 8,
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
                What institutions usually{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  want to know first
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, mb: 3 }}>
                Most ERP questions are not random. They usually cluster around a
                few practical concerns: commercial fit, operational trust, and
                whether the system can grow with the institution instead of
                forcing another change later.
              </Typography>
            </Box>

            <Card
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
                backgroundColor: "background.paper",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    mb: 2,
                  }}
                >
                  Main FAQ themes
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {faqThemes.map((theme) => (
                    <Box key={theme.title}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {theme.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {theme.body}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
              Questions and{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                answers
              </Box>
            </Typography>
            <FaqAccordion faqs={faqs} />
          </Box>

          <Box
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: 4,
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              textAlign: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 100, mb: 1.25 }}>
              Still have{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                questions?
              </Box>
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.85, mb: 3, maxWidth: 760, mx: "auto" }}
            >
              If you cannot find the answer you need here, we are happy to talk
              through your institution&apos;s requirements directly and help you map
              them against Nexus more clearly.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 3,
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Email sx={{ fontSize: 18, color: "primary.main" }} />
                <Box
                  component="a"
                  href="mailto:nexus@wisemensoft.com"
                  sx={{
                    color: "text.secondary",
                    textDecoration: "none",
                    fontSize: 14,
                    "&:hover": { color: "primary.main" },
                    transition: "color 0.2s",
                  }}
                >
                  nexus@wisemensoft.com
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Message sx={{ fontSize: 18, color: "primary.main" }} />
                <Box
                  component="a"
                  href="/contact"
                  sx={{
                    color: "text.secondary",
                    textDecoration: "none",
                    fontSize: 14,
                    "&:hover": { color: "primary.main" },
                    transition: "color 0.2s",
                  }}
                >
                  Send us a message
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
