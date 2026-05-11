"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Container, Divider, MobileStepper,
  Step, StepLabel, Stepper, Typography,
} from "@mui/material";
import { ArrowBack, ArrowForward, Check } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import { campusesService } from "@/services/campuses.service";

import StepBasicInfo from "@/components/platform/wizard/StepBasicInfo";
import StepPlan from "@/components/platform/wizard/StepPlan";
import StepBranding from "@/components/platform/wizard/StepBranding";
import StepModules from "@/components/platform/wizard/StepModules";
import StepCampus from "@/components/platform/wizard/StepCampus";
import StepReview from "@/components/platform/wizard/StepReview";

const STEPS = [
  "Basic Info",
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
  // Step 2
  planId: string;
  planName: string;
  billingCycle: string;
  agreedPrice: string;
  currency: string;
  setupFee: string;
  // Step 3
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: string;
  // Step 4
  modules: Record<string, boolean>;
  // Step 5
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
  contactEmail: "", contactPhone: "", primaryDomain: "", notes: "",
  planId: "", planName: "", billingCycle: "MONTHLY", agreedPrice: "", currency: "PKR", setupFee: "",
  displayName: "", logoUrl: "", primaryColor: "#059669", secondaryColor: "#6366F1", accentColor: "#34D399", theme: "default",
  modules: {},
  campusName: "", campusAddress: "",
  campusStudentStart: "08:00", campusStudentEnd: "14:00",
  campusStaffStart: "07:30", campusStaffEnd: "15:00",
  campusLateThreshold: "15", campusEarlyLeave: "15",
  skipCampus: false,
  settings: [],
};

export default function NewInstitutionWizard() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const STORAGE_KEY = "nexus-wizard-draft";

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);

  // Restore draft after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { step: number; data: WizardData };
        setStep(draft.step ?? 0);
        setData(draft.data ?? defaultData);
      }
    } catch { /* ignore corrupted draft */ }
  }, []);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreate = async () => {
    setSubmitting(true);

    // Step 1 — Create institution
    const instPayload: Record<string, unknown> = {
      name: data.name, slug: data.slug, status: data.status,
      deploymentMode: data.deploymentMode,
      ...(data.contactEmail && { contactEmail: data.contactEmail }),
      ...(data.contactPhone && { contactPhone: data.contactPhone }),
      ...(data.primaryDomain && { primaryDomain: data.primaryDomain }),
      ...(data.notes && { notes: data.notes }),
      ...(data.planId && { planId: data.planId }),
    };

    const { data: inst, success: instOk } = await apiHandler(
      () => platformService.createInstitution(instPayload),
      { showMessage, successMessage: "Institution created." }
    );

    if (!instOk || !inst) { setSubmitting(false); return; }
    const id = (inst as { id: string }).id;
    setCreatedId(id);

    // Step 2 — Subscription
    if (data.planId) {
      const subPayload: Record<string, unknown> = {
        planId: data.planId, status: "TRIAL", billingCycle: data.billingCycle, currency: data.currency,
        ...(data.agreedPrice && { agreedPrice: Number(data.agreedPrice) }),
        ...(data.setupFee && { setupFee: Number(data.setupFee) }),
      };
      await apiHandler(() => platformService.updateSubscription(id, subPayload), { showMessage, silent: true });
    }

    // Step 3 — Branding
    const brandPayload = {
      displayName: data.displayName || data.name,
      logoUrl: data.logoUrl || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      theme: data.theme,
    };
    await apiHandler(() => platformService.updateBranding(id, brandPayload), { showMessage, silent: true });

    // Step 4 — Entitlements
    const enabledModules = Object.entries(data.modules)
      .filter(([, v]) => v)
      .map(([k]) => ({ moduleKey: k, isEnabled: true }));
    const disabledModules = Object.entries(data.modules)
      .filter(([, v]) => !v)
      .map(([k]) => ({ moduleKey: k, isEnabled: false }));
    if (enabledModules.length > 0 || disabledModules.length > 0) {
      await apiHandler(
        () => platformService.updateEntitlements(id, { entitlements: [...enabledModules, ...disabledModules] }),
        { showMessage, silent: true }
      );
    }

    // Step 5 — First campus (optional)
    if (!data.skipCampus && data.campusName) {
      await apiHandler(
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
    }

    setSubmitting(false);
    clearDraft();
    showMessage("Institution setup complete!", "success");
    router.push(`/platform/institutions/${id}`);
  };

  const stepProps = { data, update };

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
      <Container maxWidth="xl" sx={{ py: 5 }}>
        {step === 0 && <StepBasicInfo {...stepProps} />}
        {step === 1 && <StepPlan {...stepProps} />}
        {step === 2 && <StepBranding {...stepProps} />}
        {step === 3 && <StepModules {...stepProps} />}
        {step === 4 && <StepCampus {...stepProps} />}
        {step === 5 && <StepReview {...stepProps} onSubmit={handleCreate} onBack={back} submitting={submitting} />}

        {/* Nav buttons */}
        {step < 5 && (
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
              disabled={step === 0 && (!data.name || !data.slug)}
            >
              Continue
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
