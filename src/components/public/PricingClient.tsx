"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CheckCircle, RocketLaunch, Support } from "@mui/icons-material";
import PageBreadcrumbs from "@/components/shared/PageBreadcrumbs";

const ANNUAL_DISCOUNT = 0.2; // 20% off for annual billing

const MODULE_LABELS: Record<string, string> = {
  ACADEMICS:    "Academics",
  ATTENDANCE:   "Attendance Tracking",
  FINANCE:      "Finance & Payroll",
  PEOPLE:       "People Management",
  REALTIME:     "Real-time Updates",
  REPORTING:    "Reporting & Analytics",
  EXAMINATIONS: "Examinations",
  DOCUMENTS:    "Document Management",
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




export default function PricingClient({ apiPlans }: { apiPlans: Plan[] }) {
  const [annual, setAnnual] = useState(false);
  const plans = apiPlans;

  return (
    <>
      {/* Hero */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <PageBreadcrumbs crumbs={[{ label: "Pricing" }]} />
          <Box sx={{ textAlign: "center" }}>
          <Typography variant="h2" sx={{ fontWeight: 100, mb: 2 }}>
            Simple,{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>transparent</Box>{" "}
            pricing
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 5 }}>
            No hidden fees. No lock-in. Cancel anytime.
          </Typography>

          {/* Billing toggle */}
          <Box sx={{ display: "inline-flex", alignItems: "center", backgroundColor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 10, p: 0.5 }}>
            <Button
              size="small"
              onClick={() => setAnnual(false)}
              sx={{
                borderRadius: 8, px: 3, py: 1,
                backgroundColor: !annual ? "primary.main" : "transparent",
                color: !annual ? "#fff" : "text.secondary",
                "&:hover": { backgroundColor: !annual ? "primary.dark" : "action.hover" },
              }}
            >
              Monthly
            </Button>
            <Button
              size="small"
              onClick={() => setAnnual(true)}
              sx={{
                borderRadius: 8, px: 3, py: 1,
                backgroundColor: annual ? "primary.main" : "transparent",
                color: annual ? "#fff" : "text.secondary",
                "&:hover": { backgroundColor: annual ? "primary.dark" : "action.hover" },
              }}
            >
              Annual
              <Chip label={`−${Math.round(ANNUAL_DISCOUNT * 100)}%`} size="small" sx={{ ml: 1, height: 18, fontSize: 10, backgroundColor: annual ? "rgba(255,255,255,0.2)" : "primary.main", color: annual ? "#fff" : "#fff", pointerEvents: "none" }} />
            </Button>
          </Box>
          </Box>
        </Container>
      </Box>

      {/* Plan cards */}
      <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: "background.default" }}>
        <Container maxWidth="xl">

          {plans.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography color="text.secondary">Pricing plans are not available right now. Please contact us.</Typography>
            </Box>
          )}

          {/* Cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: `repeat(${plans.length}, 1fr)` }, gap: 3, mb: 12, alignItems: "stretch" }}>
            {plans.map((plan) => {
              const basePrice = plan.basePrice ? Number(plan.basePrice) : null;
              const annualPrice = basePrice ? Math.round(basePrice * 12 * (1 - ANNUAL_DISCOUNT)) : null;
              const price = annual ? annualPrice : basePrice;
              const period = annual ? "yr" : "mo";
              const saving = basePrice ? Math.round(ANNUAL_DISCOUNT * 100) : 0;
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
                    transform: isPopular ? { md: "scale(1.04)" } : "none",
                    zIndex: isPopular ? 1 : 0,
                    backgroundColor: isPopular ? "background.paper" : "background.default",
                  }}
                >
                  {isPopular && (
                    <Box sx={{ backgroundColor: "primary.main", py: 0.75, textAlign: "center", borderRadius: "16px 16px 0 0" }}>
                      <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                        Most Popular
                      </Typography>
                    </Box>
                  )}

                  <CardContent sx={{ p: 4, flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Name */}
                    <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 4 }}>
                      {plan.description}
                    </Typography>

                    {/* Price */}
                    {price !== null ? (
                      <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, mb: 0.5 }}>
                          <Typography sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1 }}>
                            {plan.currency} {price.toLocaleString()}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                            /{period}
                          </Typography>
                        </Box>
                        {annual && saving > 0 && (
                          <Chip label={`${saving}% off annually`} color="success" size="small" />
                        )}
                        {!annual && annualPrice && (
                          <Typography variant="caption" color="text.secondary">
                            Save with annual — {plan.currency} {annualPrice.toLocaleString()}/yr
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ mb: 4 }}>
                        <Typography sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1, mb: 0.5 }}>
                          Custom
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tailored to your institution
                        </Typography>
                      </Box>
                    )}

                    {/* CTA */}
                    <Link href="/contact" style={{ display: "block", marginBottom: "24px" }}>
                      <Button
                        variant={isPopular ? "contained" : "outlined"}
                        fullWidth
                        size="large"
                        startIcon={price !== null ? <RocketLaunch /> : <Support />}
                        sx={{ py: 1.5, borderRadius: 2 }}
                      >
                        {price !== null && plan.billingCycle !== "CUSTOM" ? "Get Started" : "Contact Sales"}
                      </Button>
                    </Link>

                    <Divider sx={{ mb: 3 }} />

                    {/* Features */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <CheckCircle sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                        <Typography variant="body2">
                          {plan.limits?.maxCampuses ? `Up to ${plan.limits.maxCampuses} campus${plan.limits.maxCampuses > 1 ? "es" : ""}` : "Unlimited campuses"}
                        </Typography>
                      </Box>
                      {(plan.defaultModules ?? []).map((m) => (
                        <Box key={m} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <CheckCircle sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                          <Typography variant="body2">{MODULE_LABELS[m] ?? m}</Typography>
                        </Box>
                      ))}
                      {plan.deploymentModes?.map((d) => (
                        <Box key={d} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <CheckCircle sx={{ fontSize: 18, color: "success.main", flexShrink: 0 }} />
                          <Typography variant="body2">{d.replace(/_/g, " ")}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          {/* Comparison table — built dynamically from plan features */}
          {(() => {
            const allFeatures = Array.from(new Set(plans.flatMap((p) => p.defaultModules ?? [])));
            return (
              <Box sx={{ mb: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 100, mb: 1 }}>
                  Compare{" "}
                  <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>all features</Box>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  See exactly what&apos;s included in each plan.
                </Typography>
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "background.paper" }}>
                        <TableCell sx={{ fontWeight: 700, width: "35%" }}>Feature</TableCell>
                        {plans.map((p) => (
                          <TableCell key={p.id} align="center" sx={{ fontWeight: 700, color: p.key === "growth" ? "primary.main" : "text.primary" }}>
                            {p.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allFeatures.map((feature, i) => (
                        <TableRow key={feature} sx={{ backgroundColor: i % 2 === 0 ? "background.default" : "background.paper" }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{MODULE_LABELS[feature] ?? feature}</Typography>
                          </TableCell>
                          {plans.map((p) => (
                            <TableCell key={p.id} align="center">
                              {(p.defaultModules ?? []).includes(feature)
                                ? <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                                : <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>—</Typography>
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            );
          })()}

          {/* Bottom note */}
          <Box sx={{ textAlign: "center", py: 4, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="body1" color="text.secondary">
              All plans include a 14-day free trial · No credit card required ·{" "}
              <Link href="/contact" style={{ color: "#059669", textDecoration: "none", fontWeight: 600 }}>
                Talk to sales →
              </Link>
            </Typography>
          </Box>

        </Container>
      </Box>
    </>
  );
}
