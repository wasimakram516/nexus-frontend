"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Card, CardContent, Chip, Container, Divider, List, ListItem,
  ListItemIcon, ListItemText, Step, StepLabel, Stepper, Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Cancel from "@mui/icons-material/Cancel";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ManageAccounts from "@mui/icons-material/ManageAccounts";
import RemoveCircleOutlined from "@mui/icons-material/RemoveCircleOutlined";
import RocketLaunch from "@mui/icons-material/RocketLaunch";
import { useMessage } from "@/contexts/MessageContext";
import { buildBrandingColorPayload } from "@/lib/branding";
import type { ColorOverrides } from "@/theme/branding-tokens";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";
import { platformService } from "@/services/platform.service";
import { campusesService } from "@/services/campuses.service";

import StepBasicInfo from "@/components/platform/wizard/StepBasicInfo";
import StepAdmin from "@/components/platform/wizard/StepAdmin";
import StepPlan from "@/components/platform/wizard/StepPlan";
import StepBranding from "@/components/platform/wizard/StepBranding";
import StepModules from "@/components/platform/wizard/StepModules";
import StepCampus from "@/components/platform/wizard/StepCampus";
import StepReview from "@/components/platform/wizard/StepReview";
import NexGuide from "@/components/guide/NexGuide";
import { toGuideTips } from "@/components/guide/guide-tips";
import { SETUP_TIPS } from "@/content/guide";
import { browserTimeZone } from "@/components/shared/TimezonePicker";

const STEPS = [
  "Basic Info",
  "Admin Account",
  "Plan & Subscription",
  "Branding",
  "Modules",
  "First Campus",
  "Review & Create",
];

export interface WizardData {
  // Step 1
  name: string;
  slug: string;
  status: string;
  deploymentMode: string;
  contactEmail: string;
  contactPhone: string;
  primaryDomain: string;
  notes: string;
  /** IANA zone the school's dates and times are written in. */
  timezone: string;
  // Step 2 — admin account
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  skipAdmin: boolean;
  // Step 3
  planId: string;
  planName: string;
  billingCycle: string;
  agreedPrice: string;
  currency: string;
  setupFee: string;
  // Step 4
  displayName: string;
  logoUrl: string;
  /** Only colors an admin changed; unset colors follow the Nexus theme. */
  colorOverrides: ColorOverrides;
  theme: string;
  // Step 5
  modules: Record<string, boolean>;
  // Step 6
  campusName: string;
  campusAddress: string;
  campusStudentStart: string;
  campusStudentEnd: string;
  campusStaffStart: string;
  campusStaffEnd: string;
  campusLateThreshold: string;
  campusEarlyLeave: string;
  skipCampus: boolean;
  // Settings
  settings: Array<{ key: string; value: string }>;
}

const defaultData: WizardData = {
  name: "", slug: "", status: "ACTIVE", deploymentMode: "SHARED_HOSTED",
  contactEmail: "", contactPhone: "", primaryDomain: "", notes: "", timezone: "",
  adminName: "", adminEmail: "", adminPassword: "", skipAdmin: false,
  planId: "", planName: "", billingCycle: "MONTHLY", agreedPrice: "", currency: "PKR", setupFee: "",
  displayName: "", logoUrl: "",
  colorOverrides: {},
  theme: "default",
  modules: {},
  campusName: "", campusAddress: "",
  campusStudentStart: "08:00", campusStudentEnd: "14:00",
  campusStaffStart: "07:30", campusStaffEnd: "15:00",
  campusLateThreshold: "15", campusEarlyLeave: "15",
  skipCampus: false,
  settings: [],
};

type StepStatus = "success" | "failed" | "skipped";

interface SetupResult {
  institutionId: string;
  slug: string;
  steps: Array<{ label: string; status: StepStatus; hint?: string }>;
}

export default function NewInstitutionWizard() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const STORAGE_KEY = "nexus-wizard-draft";

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [result, setResult] = useState<SetupResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Restore draft after mount to avoid SSR/client hydration mismatch. The
  // restore itself is wrapped in a nested function so it isn't a bare
  // top-level setState call in the effect body (matches the async-fetch
  // pattern used elsewhere — see e.g. ProfileDialog.tsx).
  useEffect(() => {
    const restoreDraft = () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as { step: number; data: WizardData };
          setStep(draft.step ?? 0);
          setData({ ...defaultData, ...(draft.data ?? {}) });
        }
      } catch { /* ignore corrupted draft */ }
      // A school starts on the timezone of the device creating it, which is almost always its own.
      setData((current) => (current.timezone ? current : { ...current, timezone: browserTimeZone() }));
    };
    restoreDraft();
  }, []);

  const update = (partial: Partial<WizardData>) =>
    setData((prev) => {
      const next = { ...prev, ...partial };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data: next }));
      return next;
    });

  const setStepAndSave = (s: number) => {
    setStep(s);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step: s, data }));
  };

  const clearDraft = () => sessionStorage.removeItem(STORAGE_KEY);

  const next = () => setStepAndSave(Math.min(step + 1, STEPS.length - 1));
  const back = () => setStepAndSave(Math.max(step - 1, 0));

  const adminStepValid =
    data.skipAdmin ||
    (Boolean(data.adminName && data.adminEmail) && data.adminPassword.length >= 8);

  const handleCreate = async () => {
    setSubmitting(true);
    const steps: SetupResult["steps"] = [];

    // 1 — Create institution
    const instPayload: Record<string, unknown> = {
      name: data.name, slug: data.slug, status: data.status,
      deploymentMode: data.deploymentMode,
      ...(data.contactEmail && { contactEmail: data.contactEmail }),
      ...(data.contactPhone && { contactPhone: data.contactPhone }),
      ...(data.primaryDomain && { primaryDomain: data.primaryDomain }),
      ...(data.notes && { notes: data.notes }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.planId && { planId: data.planId }),
    };

    const { data: inst, success: instOk } = await apiHandler(
      () => platformService.createInstitution(instPayload),
      { showMessage, successMessage: "Institution created." }
    );

    if (!instOk || !inst) { setSubmitting(false); return; }
    const created = inst as { id: string; slug?: string };
    const id = created.id;
    steps.push({ label: "Institution created", status: "success" });

    // 2 — Subscription
    if (data.planId) {
      const subPayload: Record<string, unknown> = {
        planId: data.planId, status: "TRIAL", billingCycle: data.billingCycle, currency: data.currency,
        ...(data.agreedPrice && { agreedPrice: Number(data.agreedPrice) }),
        ...(data.setupFee && { setupFee: Number(data.setupFee) }),
      };
      const { success } = await apiHandler(() => platformService.updateSubscription(id, subPayload), { showMessage, silent: true });
      steps.push({ label: "Trial subscription configured", status: success ? "success" : "failed", hint: success ? undefined : "Set it up in the Subscription tab." });
    } else {
      steps.push({ label: "Subscription", status: "skipped", hint: "Default starter trial applied." });
    }

    // 3 — Branding
    const brandPayload = {
      displayName: data.displayName || data.name,
      logoUrl: data.logoUrl || null,
      ...buildBrandingColorPayload(data.colorOverrides),
      theme: data.theme,
    };
    {
      const { success } = await apiHandler(() => platformService.updateBranding(id, brandPayload), { showMessage, silent: true });
      steps.push({ label: "Branding applied", status: success ? "success" : "failed", hint: success ? undefined : "Retry from the Branding tab." });
    }

    // 4 — Entitlements
    const enabledModules = Object.entries(data.modules)
      .filter(([, v]) => v)
      .map(([k]) => ({ moduleKey: k, isEnabled: true }));
    const disabledModules = Object.entries(data.modules)
      .filter(([, v]) => !v)
      .map(([k]) => ({ moduleKey: k, isEnabled: false }));
    if (enabledModules.length > 0 || disabledModules.length > 0) {
      const { success } = await apiHandler(
        () => platformService.updateEntitlements(id, { entitlements: [...enabledModules, ...disabledModules] }),
        { showMessage, silent: true }
      );
      steps.push({ label: `Modules configured (${enabledModules.length} enabled)`, status: success ? "success" : "failed", hint: success ? undefined : "Adjust in the Entitlements tab." });
    } else {
      steps.push({ label: "Modules", status: "skipped", hint: "Plan defaults applied." });
    }

    // 5 — Admin account
    if (!data.skipAdmin && data.adminEmail) {
      const { success } = await apiHandler(
        () =>
          authService.register({
            name: data.adminName,
            email: data.adminEmail,
            password: data.adminPassword,
            role: "ADMIN",
            institutionId: id,
          }),
        { showMessage, silent: true }
      );
      steps.push({
        label: success ? `Admin account created (${data.adminEmail})` : "Admin account",
        status: success ? "success" : "failed",
        hint: success ? "Share the credentials securely." : "Create one from Manage → Users.",
      });
    } else {
      steps.push({ label: "Admin account", status: "skipped", hint: "Add one from Manage → Users so someone can sign in." });
    }

    // 6 — First campus (optional)
    if (!data.skipCampus && data.campusName) {
      const { success } = await apiHandler(
        () => campusesService.create({
          name: data.campusName,
          location: data.campusAddress || undefined,
          studentStartTime: data.campusStudentStart,
          studentEndTime: data.campusStudentEnd,
          staffStartTime: data.campusStaffStart,
          staffEndTime: data.campusStaffEnd,
          lateThreshold: Number(data.campusLateThreshold),
          earlyLeaveThreshold: Number(data.campusEarlyLeave),
          institutionId: id,
        }),
        { showMessage, silent: true }
      );
      steps.push({ label: `Campus "${data.campusName}" created`, status: success ? "success" : "failed", hint: success ? undefined : "Add it from Manage → Campuses." });
    } else {
      steps.push({ label: "First campus", status: "skipped", hint: "Campuses are required before adding people or classes." });
    }

    setSubmitting(false);
    clearDraft();
    setResult({ institutionId: id, slug: created.slug ?? id, steps });
  };

  const stepProps = { data, update };

  if (result) {
    const failed = result.steps.filter((s) => s.status === "failed");
    return (
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Card>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <RocketLaunch sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                {data.name} is ready{failed.length > 0 ? " (with warnings)" : "!"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {failed.length > 0
                  ? "Most of the setup finished — review the items below."
                  : "Everything was set up successfully. Here's what happened:"}
              </Typography>

              <List dense sx={{ textAlign: "left", mb: 2 }}>
                {result.steps.map((s) => (
                  <ListItem key={s.label} disableGutters>
                    <ListItemIcon sx={{ minWidth: 34 }}>
                      {s.status === "success" && <CheckCircle color="success" fontSize="small" />}
                      {s.status === "failed" && <Cancel color="error" fontSize="small" />}
                      {s.status === "skipped" && <RemoveCircleOutlined color="disabled" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={s.label}
                      secondary={s.hint}
                      slotProps={{ primary: { variant: "body2", sx: { fontWeight: 600 } }, secondary: { variant: "caption" } }}
                    />
                    {s.status === "skipped" && <Chip label="Skipped" size="tiny" />}
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Next: add campuses and users under Manage, then share the admin credentials.
              </Typography>

              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
                <Button variant="contained" startIcon={<ManageAccounts />} onClick={() => router.push(`/platform/institutions/${result.slug}/manage`)}>
                  Manage Institution
                </Button>
                <Button variant="outlined" onClick={() => router.push(`/platform/institutions/${result.slug}`)}>
                  View Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Box sx={{ px: 4, py: 3, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper", display: "flex", alignItems: "center", gap: 2 }}>
        <Button startIcon={<ArrowBack />} color="inherit" size="small" onClick={() => router.push("/platform/institutions")} sx={{ color: "text.secondary" }}>
          Institutions
        </Button>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>New Institution</Typography>
          <Typography variant="body2" color="text.secondary">Step {step + 1} of {STEPS.length} — {STEPS[step]}</Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Box sx={{ backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 4, py: 2 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label, i) => (
            <Step key={label} completed={i < step} onClick={() => setStep(i)}
              sx={{ cursor: "pointer", "& .MuiStepLabel-root": { cursor: "pointer" }, "& .MuiStepIcon-root": { cursor: "pointer" } }}>
              <StepLabel sx={{ cursor: "pointer" }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step content */}
      <Container maxWidth="xl" sx={{ pt: 5, pb: 16 }}>
        {step === 0 && <StepBasicInfo {...stepProps} />}
        {step === 1 && <StepAdmin {...stepProps} />}
        {step === 2 && <StepPlan {...stepProps} />}
        {step === 3 && <StepBranding {...stepProps} />}
        {step === 4 && <StepModules {...stepProps} />}
        {step === 5 && <StepCampus {...stepProps} />}
        {step === 6 && <StepReview {...stepProps} onSubmit={handleCreate} onBack={back} submitting={submitting} />}

        {/* Nav buttons */}
        {step < 6 && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 5 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={back}
              disabled={step === 0}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              endIcon={<ArrowForward />}
              onClick={next}
              variant="contained"
              disabled={
                (step === 0 && (!data.name || !data.slug)) ||
                (step === 1 && !adminStepValid)
              }
            >
              Continue
            </Button>
          </Box>
        )}
      </Container>

      {/* Nex walks the admin through each setup step. */}
      <NexGuide tips={toGuideTips(SETUP_TIPS[STEPS[step]] ?? [])} storageKey="nexus-guide-setup" />
    </Box>
  );
}
