"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  Email,
  Message,
  RocketLaunch,
  Support,
} from "@mui/icons-material";
import { AI_POSITIONING } from "@/content/ai";
import FaqAccordion from "@/components/public/FaqAccordion";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";

const ANNUAL_DISCOUNT = 0.2;

const MODULE_LABELS: Record<string, string> = {
  ACADEMICS: "Academics",
  ATTENDANCE: "Attendance Tracking",
  FINANCE: "Finance & Payroll",
  PEOPLE: "People Management",
  REALTIME: "Real-time Updates",
  REPORTING: "Reporting & Analytics",
  EXAMINATIONS: "Examinations",
  DOCUMENTS: "Document Management",
};

interface Plan {
  id: string;
  key: string;
  name: string;
  description: string;
  basePrice: string | number | null;
  currency: string;
  billingCycle: string;
  setupFee: string | number | null;
  defaultModules: string[];
  limits: { maxCampuses?: number | null };
  deploymentModes: string[];
  metadata?: { popular?: boolean; [key: string]: unknown };
  isActive: boolean;
}

const pricingPrinciples = [
  {
    title: "Start with the institution you are today",
    body:
      "Nexus pricing is meant to support schools, colleges, and growing education groups at different operational stages. You should not have to buy enterprise complexity before your institution is ready for it.",
  },
  {
    title: "Expand without rebuilding your ERP choice",
    body:
      "As campuses, modules, and operational needs grow, your plan should scale with you. That is why the pricing model is built around practical growth rather than forcing institutions to re-platform later.",
  },
  {
    title: "Keep buying decisions understandable",
    body:
      "Educational institutions usually need clarity more than clever pricing. Plan structure, campus limits, included modules, and deployment options should be easy to compare without hidden surprises.",
  },
  {
    title: "Get AI-powered assistance without buying into hype",
    body:
      "Nexus plans include an ERP direction that already uses AI-powered assistance through Nexus AI and is expanding toward broader AI-powered insights and smarter institutional support. The goal is credible value, not inflated promises.",
  },
];

const buyerNotes = [
  "All plans are designed for real institutional operations, not generic business software use.",
  "Annual billing reduces cost for institutions that want a longer-term operational commitment.",
  "Nexus AI-powered assistance is part of the wider product direction rather than a separate upsell tier.",
  "If your rollout involves special hosting, procurement rules, or larger campus networks, the enterprise route stays available.",
];

const includedEverywhere = [
  "Core product onboarding support from the Nexus team",
  "Access to the same education-focused ERP foundation across modules and AI-ready workflows",
  "A pricing path that can grow with additional campuses and operational maturity",
];

const faqItems = [
  {
    q: "How should schools or colleges choose between plans?",
    a: "Start with the plan that matches your current campus footprint and the modules you need right now. If your institution expects to expand in campuses, rollout complexity, or procurement requirements, choose the plan that gives you enough growth room without overbuying on day one.",
  },
  {
    q: "Can Nexus pricing support multi-campus growth over time?",
    a: "Yes. The pricing model is meant to support institutions that begin with a smaller operational footprint and grow into broader campus or module needs over time.",
  },
  {
    q: "What if our institution has procurement, deployment, or support requirements that do not fit a standard plan?",
    a: "That is exactly where the custom sales path helps. If you need special hosting, rollout planning, or enterprise-style commercial handling, the team can shape a plan around that reality.",
  },
  {
    q: "Does Nexus pricing include AI-powered assistance?",
    a: "Yes. Nexus is positioned as an AI-assisted education ERP, and that includes access to the broader product direction around Nexus AI, AI-powered assistance, and AI-ready workflows. We do not present AI as a separate hype-driven tier. We present it as part of the platform's evolving value.",
  },
];

export default function PricingClient({ apiPlans }: { apiPlans: Plan[] }) {
  const [annual, setAnnual] = useState(false);
  const plans = apiPlans;

  const allFeatures = useMemo(
    () => Array.from(new Set(plans.flatMap((plan) => plan.defaultModules ?? []))),
    [plans],
  );

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
          <PageBreadcrumbs crumbs={[{ label: "Pricing" }]} />

          <Box sx={{ maxWidth: 920, mx: "auto", textAlign: "center" }}>
            <Chip label="Pricing" color="primary" size="small" sx={{ mb: 2 }} />
            <Typography variant="h2" sx={{ fontWeight: 100, mb: 2 }}>
              Pricing built for{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                real institutional growth
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 400, lineHeight: 1.8, mb: 3 }}
            >
              Choose the Nexus plan that fits your current scale, operational
              complexity, and rollout needs. The goal is not just to show a
              monthly amount. It is to help schools, colleges, and education
              groups understand what level of ERP support makes sense for them.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 760, mx: "auto", lineHeight: 1.9 }}
            >
              Whether you are standardising one campus, expanding across
              multiple branches, or preparing for a larger institutional rollout,
              Nexus pricing is designed to stay transparent and easier to reason
              about than the hidden-cost approach many ERP buyers run into later.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 760, mx: "auto", lineHeight: 1.9, mt: 2 }}
            >
              {AI_POSITIONING.short}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: 5,
              mb: 8,
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
                How Nexus{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  pricing works
                </Box>
              </Typography>
              <Stack spacing={2.25}>
                {pricingPrinciples.map((item) => (
                  <Box key={item.title}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.9 }}
                    >
                      {item.body}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Card
              sx={{
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
                borderRadius: 4,
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
                  What every buyer should know
                </Typography>
                <Stack spacing={1.75}>
                  {buyerNotes.map((item) => (
                    <Box
                      key={item}
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                    >
                      <CheckCircle
                        sx={{ fontSize: 18, color: "success.main", mt: 0.2, flexShrink: 0 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 100, mb: 1.5 }}>
              Compare monthly and{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                annual billing
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              Annual billing is designed for institutions that want lower
              effective cost over a longer operational commitment.
            </Typography>

            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 10,
                p: 0.5,
              }}
            >
              <Button
                size="small"
                onClick={() => setAnnual(false)}
                sx={{
                  borderRadius: 8,
                  px: 3,
                  py: 1,
                  backgroundColor: !annual ? "primary.main" : "transparent",
                  color: !annual ? "#fff" : "text.secondary",
                  "&:hover": {
                    backgroundColor: !annual ? "primary.dark" : "action.hover",
                  },
                }}
              >
                Monthly
              </Button>
              <Button
                size="small"
                onClick={() => setAnnual(true)}
                sx={{
                  borderRadius: 8,
                  px: 3,
                  py: 1,
                  backgroundColor: annual ? "primary.main" : "transparent",
                  color: annual ? "#fff" : "text.secondary",
                  "&:hover": {
                    backgroundColor: annual ? "primary.dark" : "action.hover",
                  },
                }}
              >
                Annual
                <Chip
                  label={`-${Math.round(ANNUAL_DISCOUNT * 100)}%`}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 18,
                    fontSize: 10,
                    backgroundColor: annual ? "rgba(255,255,255,0.18)" : "primary.main",
                    color: "#fff",
                    pointerEvents: "none",
                  }}
                />
              </Button>
            </Box>
          </Box>

          {plans.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography color="text.secondary">
                Pricing plans are not available right now. Please contact us for
                current commercial details.
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: plans.length ? `repeat(${plans.length}, 1fr)` : "1fr",
              },
              gap: 3,
              mb: 10,
              alignItems: "stretch",
            }}
          >
            {plans.map((plan) => {
              const basePrice = plan.basePrice ? Number(plan.basePrice) : null;
              const annualPrice = basePrice
                ? Math.round(basePrice * 12 * (1 - ANNUAL_DISCOUNT))
                : null;
              const price = annual ? annualPrice : basePrice;
              const period = annual ? "yr" : "mo";
              const isPopular = plan.metadata?.popular === true || plan.key === "growth";

              return (
                <Card
                  key={plan.id}
                  elevation={isPopular ? 8 : 0}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid",
                    borderColor: isPopular ? "primary.main" : "divider",
                    borderRadius: 4,
                    position: "relative",
                    transform: isPopular ? { md: "scale(1.03)" } : "none",
                    zIndex: isPopular ? 1 : 0,
                    backgroundColor: isPopular ? "background.paper" : "background.default",
                  }}
                >
                  {isPopular && (
                    <Box
                      sx={{
                        backgroundColor: "primary.main",
                        py: 0.75,
                        textAlign: "center",
                        borderRadius: "16px 16px 0 0",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#fff",
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        Most Popular
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ p: 4, flex: 1, display: "flex", flexDirection: "column" }}>
                    <Typography
                      variant="overline"
                      color="primary"
                      sx={{ fontWeight: 700, letterSpacing: 2 }}
                    >
                      {plan.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5, mb: 3.5, lineHeight: 1.8 }}
                    >
                      {plan.description}
                    </Typography>

                    {price !== null ? (
                      <Box sx={{ mb: 3.5 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, mb: 0.5 }}>
                          <Typography sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1 }}>
                            {plan.currency} {price.toLocaleString()}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                            /{period}
                          </Typography>
                        </Box>
                        {annual && (
                          <Chip
                            label={`${Math.round(ANNUAL_DISCOUNT * 100)}% off annually`}
                            color="success"
                            size="small"
                          />
                        )}
                        {!annual && annualPrice && (
                          <Typography variant="caption" color="text.secondary">
                            Save with annual - {plan.currency} {annualPrice.toLocaleString()}/yr
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ mb: 3.5 }}>
                        <Typography sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1, mb: 0.5 }}>
                          Custom
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tailored to your institution
                        </Typography>
                      </Box>
                    )}

                    <Link
                      href={price !== null && plan.billingCycle !== "CUSTOM" ? "/signup" : "/contact"}
                      style={{ display: "block", marginBottom: "24px" }}
                    >
                      <Button
                        variant={isPopular ? "contained" : "outlined"}
                        fullWidth
                        size="large"
                        startIcon={price !== null ? <RocketLaunch /> : <Support />}
                        sx={{ py: 1.5, borderRadius: 2 }}
                      >
                        {price !== null && plan.billingCycle !== "CUSTOM"
                          ? "Start Free Trial"
                          : "Contact Sales"}
                      </Button>
                    </Link>

                    <Divider sx={{ mb: 3 }} />

                    <Stack spacing={1.5}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <CheckCircle sx={{ fontSize: 18, color: "primary.main", mt: 0.2 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                          {plan.limits?.maxCampuses
                            ? `Up to ${plan.limits.maxCampuses} campus${plan.limits.maxCampuses > 1 ? "es" : ""}`
                            : "Unlimited campuses"}
                        </Typography>
                      </Box>
                      {(plan.defaultModules ?? []).map((moduleKey) => (
                        <Box
                          key={moduleKey}
                          sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                        >
                          <CheckCircle sx={{ fontSize: 18, color: "primary.main", mt: 0.2 }} />
                          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                            {MODULE_LABELS[moduleKey] ?? moduleKey}
                          </Typography>
                        </Box>
                      ))}
                      {(plan.deploymentModes ?? []).map((mode) => (
                        <Box
                          key={mode}
                          sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                        >
                          <CheckCircle sx={{ fontSize: 18, color: "success.main", mt: 0.2 }} />
                          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                            {mode.replace(/_/g, " ")}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
              gap: 5,
              mb: 10,
              alignItems: "start",
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 1 }}>
                What is{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  included either way
                </Box>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                Even when institutions choose different plans, they should still
                understand the operational principles behind the product. Nexus
                pricing is structured so buyers can scale features and rollout
                complexity without losing the core ERP direction.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.85 }}>
                That includes the AI-assisted direction of the product: AI-powered assistance today,
                with broader AI-powered insights and smarter institutional workflows expanding on top
                of the same connected ERP foundation.
              </Typography>
              <Stack spacing={1.75}>
                {includedEverywhere.map((item) => (
                  <Box
                    key={item}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                  >
                    <CheckCircle
                      sx={{ fontSize: 18, color: "success.main", mt: 0.25, flexShrink: 0 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Stack>
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
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
                  Need a buying conversation instead of just a price table?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
                  If your institution needs help comparing plans, mapping rollout
                  stages, or discussing enterprise deployment needs, the team can
                  help you translate pricing into an actual implementation path.
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Email sx={{ fontSize: 18, color: "primary.main" }} />
                    <Box
                      component="a"
                      href="mailto:nexus@wisemensoft.com"
                      sx={{
                        color: "text.secondary",
                        textDecoration: "none",
                        fontSize: 14,
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      nexus@wisemensoft.com
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Message sx={{ fontSize: 18, color: "primary.main" }} />
                    <Box
                      component="a"
                      href="/contact"
                      sx={{
                        color: "text.secondary",
                        textDecoration: "none",
                        fontSize: 14,
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      Talk to the Nexus team
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {plans.length > 0 && allFeatures.length > 0 ? (
            <Box sx={{ mb: 10 }}>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 1 }}>
                Compare{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  included modules
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                Use this view when you need a straightforward feature comparison
                before moving into demos or procurement conversations.
              </Typography>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  overflow: "hidden",
                  backgroundColor: "background.paper",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "background.default" }}>
                      <TableCell sx={{ fontWeight: 700, width: "35%" }}>Feature</TableCell>
                      {plans.map((plan) => (
                        <TableCell
                          key={plan.id}
                          align="center"
                          sx={{
                            fontWeight: 700,
                            color: plan.key === "growth" ? "primary.main" : "text.primary",
                          }}
                        >
                          {plan.name}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allFeatures.map((feature, index) => (
                      <TableRow
                        key={feature}
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "background.default" : "background.paper",
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {MODULE_LABELS[feature] ?? feature}
                          </Typography>
                        </TableCell>
                        {plans.map((plan) => (
                          <TableCell key={plan.id} align="center">
                            {(plan.defaultModules ?? []).includes(feature) ? (
                              <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: 700 }}
                              >
                                -
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : null}

          <Box sx={{ mb: 8 }}>
            <Box sx={{ width: "100%", mb: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 100, mb: 2 }}>
                Common pricing{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  questions
                </Box>
              </Typography>
              <FaqAccordion faqs={faqItems} />
            </Box>

            <Box
              sx={{
                p: { xs: 4, md: 5 },
                borderRadius: 4,
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
                maxWidth: 1200,
                mx: "auto",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 100, mb: 1.25 }}>
                Ready to talk about{" "}
                <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                  rollout and pricing?
                </Box>
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.85, maxWidth: 760, mx: "auto" }}
              >
                We can help you compare plans, discuss the right module path, and
                shape a pricing conversation around your campus structure and
                operational goals.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Link href="/signup">
                  <Button variant="contained" size="large" startIcon={<RocketLaunch />}>
                    Start free trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outlined" size="large">
                    Request pricing help
                  </Button>
                </Link>
              </Box>
            </Box>
          </Box>

          <Box sx={{ textAlign: "center", py: 4, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              All plans include a 14-day free trial · No credit card required ·{" "}
              <Link
                href="/contact"
                style={{ color: "#059669", textDecoration: "none", fontWeight: 600 }}
              >
                Talk to sales →
              </Link>
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
}
