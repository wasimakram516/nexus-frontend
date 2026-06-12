"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Button, CircularProgress, Container,
  Divider, Step, StepLabel, Stepper, Typography,
} from "@mui/material";
import { ArrowBack, ArrowForward, Save } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { platformService } from "@/services/platform.service";
import { WizardData } from "@/app/platform/institutions/new/page";

import StepBasicInfo from "@/components/platform/wizard/StepBasicInfo";
import StepPlan from "@/components/platform/wizard/StepPlan";
import StepBranding from "@/components/platform/wizard/StepBranding";
import StepModules from "@/components/platform/wizard/StepModules";
import StepSettings from "@/components/platform/wizard/StepSettings";
import StepPermissions from "@/components/platform/wizard/StepPermissions";
import StepReview from "@/components/platform/wizard/StepReview";

const STEPS = ["Basic Info", "Plan & Subscription", "Branding", "Modules", "Settings", "Permissions", "Review & Save"];
const REVIEW_STEP = 6;

function deepUnwrapSetting(value: unknown, depth = 0): string {
  if (depth > 10 || value === null || value === undefined) return "";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null) return deepUnwrapSetting(parsed, depth + 1);
      return String(parsed);
    } catch { return value; }
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return deepUnwrapSetting(obj.value, depth + 1);
    return JSON.stringify(value);
  }
  return String(value);
}

const defaultData: WizardData = {
  name: "", slug: "", status: "ACTIVE", deploymentMode: "SHARED_HOSTED",
  contactEmail: "", contactPhone: "", primaryDomain: "", notes: "",
  adminName: "", adminEmail: "", adminPassword: "", skipAdmin: true,
  planId: "", planName: "", billingCycle: "MONTHLY", agreedPrice: "", currency: "PKR", setupFee: "",
  displayName: "", logoUrl: "", primaryColor: "#059669", secondaryColor: "#6366F1", accentColor: "#34D399", theme: "default",
  modules: {},
  campusName: "", campusAddress: "",
  campusStudentStart: "08:00", campusStudentEnd: "14:00",
  campusStaffStart: "07:30", campusStaffEnd: "15:00",
  campusLateThreshold: "15", campusEarlyLeave: "15",
  skipCampus: true,
  settings: [],
};

export default function EditInstitutionWizard() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const router = useRouter();
  const { showMessage } = useMessage();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const [instRes, configRes] = await Promise.all([
        apiHandler(() => platformService.getInstitution(slugOrId), { showMessage, silent: true }),
        apiHandler(() => platformService.getRuntimeConfig(slugOrId), { showMessage, silent: true }),
      ]);

      const inst = instRes.data as Record<string, unknown> | null;
      const config = configRes.data as Record<string, unknown> | null;
      const branding = config?.branding as Record<string, unknown> | null;
      const sub = config?.subscription as Record<string, unknown> | null;
      const modulesRaw = config?.modules as Record<string, { enabled: boolean }> | undefined;

      setInstitutionId(String(inst?.id ?? ""));
      setSlug(String(inst?.slug ?? ""));

      const modules: Record<string, boolean> = {};
      if (modulesRaw) {
        for (const [k, v] of Object.entries(modulesRaw)) {
          modules[k] = v.enabled;
        }
      }

      setData({
        name: String(inst?.name ?? ""),
        slug: String(inst?.slug ?? ""),
        status: String(inst?.status ?? "ACTIVE"),
        deploymentMode: String(inst?.deploymentMode ?? "SHARED_HOSTED"),
        contactEmail: String(inst?.contactEmail ?? ""),
        contactPhone: String(inst?.contactPhone ?? ""),
        primaryDomain: String(inst?.primaryDomain ?? ""),
        notes: String(inst?.notes ?? ""),
        adminName: "", adminEmail: "", adminPassword: "", skipAdmin: true,
        planId: String(sub?.planId ?? ""),
        planName: String(sub?.planName ?? ""),
        billingCycle: "MONTHLY",
        agreedPrice: "",
        currency: "PKR",
        setupFee: "",
        displayName: String(branding?.displayName ?? ""),
        logoUrl: String(branding?.logoUrl ?? ""),
        primaryColor: String(branding?.primaryColor ?? "#059669"),
        secondaryColor: String(branding?.secondaryColor ?? "#6366F1"),
        accentColor: String(branding?.accentColor ?? "#34D399"),
        theme: String(branding?.theme ?? "default"),
        modules,
        campusName: "", campusAddress: "",
        campusStudentStart: "08:00", campusStudentEnd: "14:00",
        campusStaffStart: "07:30", campusStaffEnd: "15:00",
        campusLateThreshold: "15", campusEarlyLeave: "15",
        skipCampus: true,
        settings: Object.entries(
          (config?.settings as Record<string, unknown>) ?? {}
        ).map(([key, rawValue]) => ({ key, value: deepUnwrapSetting(rawValue) })),
      });
      setLoading(false);
    };
    load();
  }, [slugOrId]);

  const update = (partial: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async () => {
    setSubmitting(true);

    await apiHandler(
      () => platformService.updateInstitution(institutionId, {
        name: data.name,
        slug: data.slug,
        status: data.status,
        deploymentMode: data.deploymentMode,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        primaryDomain: data.primaryDomain || null,
        notes: data.notes || null,
      }),
      { showMessage, silent: true }
    );

    if (data.planId) {
      await apiHandler(
        () => platformService.updateSubscription(institutionId, {
          planId: data.planId,
          billingCycle: data.billingCycle,
          currency: data.currency,
          ...(data.agreedPrice && { agreedPrice: Number(data.agreedPrice) }),
          ...(data.setupFee && { setupFee: Number(data.setupFee) }),
        }),
        { showMessage, silent: true }
      );
    }

    await apiHandler(
      () => platformService.updateBranding(institutionId, {
        displayName: data.displayName || data.name,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        theme: data.theme,
      }),
      { showMessage, silent: true }
    );

    const entitlements = Object.entries(data.modules).map(([moduleKey, isEnabled]) => ({ moduleKey, isEnabled }));
    if (entitlements.length > 0) {
      await apiHandler(
        () => platformService.updateEntitlements(institutionId, { entitlements }),
        { showMessage, silent: true }
      );
    }

    const validSettings = (data.settings ?? []).filter((s) => s.key.trim());
    if (validSettings.length > 0) {
      await apiHandler(
        () => platformService.updateSettings(institutionId, {
          settings: validSettings.map((s) => ({ key: s.key, value: s.value, description: "" })),
        }),
        { showMessage, silent: true }
      );
    }

    setSubmitting(false);
    showMessage("Institution updated successfully.", "success");
    router.push(`/platform/institutions/${slug || slugOrId}`);
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const stepProps = { data, update };

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Box sx={{
        px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 },
        borderBottom: "1px solid", borderColor: "divider",
        backgroundColor: "background.paper",
        display: "flex", alignItems: "center", gap: 2,
        flexWrap: "wrap",
      }}>
        <Button
          startIcon={<ArrowBack />}
          color="inherit"
          size="small"
          onClick={() => router.push(`/platform/institutions/${slug || slugOrId}`)}
          sx={{ color: "text.secondary" }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{data.name || "Institution"}</Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Back</Box>
        </Button>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.5rem" } }}>
            Edit Institution
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Box sx={{ backgroundColor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: { xs: 2, sm: 4 }, py: 2, overflowX: "auto" }}>
        <Stepper activeStep={step} alternativeLabel sx={{ minWidth: { xs: 700, sm: "auto" } }}>
          {STEPS.map((label, i) => (
            <Step key={label} completed={i < step} onClick={() => setStep(i)}
              sx={{ cursor: "pointer", "& .MuiStepLabel-root": { cursor: "pointer" }, "& .MuiStepIcon-root": { cursor: "pointer" } }}>
              <StepLabel sx={{ cursor: "pointer" }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step content */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        {step === 0 && <StepBasicInfo {...stepProps} />}
        {step === 1 && <StepPlan {...stepProps} />}
        {step === 2 && <StepBranding {...stepProps} />}
        {step === 3 && <StepModules {...stepProps} />}
        {step === 4 && <StepSettings {...stepProps} />}
        {step === 5 && <StepPermissions institutionId={institutionId} />}
        {step === REVIEW_STEP && (
          <StepReview
            {...stepProps}
            onSubmit={handleSave}
            onBack={back}
            onCancel={() => router.push(`/platform/institutions/${slug || slugOrId}`)}
            submitting={submitting}
            submitLabel="Save Changes"
            hideCampus
          />
        )}

        {step < REVIEW_STEP && (
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 5 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button startIcon={<ArrowBack />} onClick={back} disabled={step === 0} variant="outlined">
                Back
              </Button>
              <Button color="inherit" onClick={() => router.push(`/platform/institutions/${slug || slugOrId}`)} sx={{ color: "text.secondary" }}>
                Cancel
              </Button>
            </Box>
            <Button endIcon={<ArrowForward />} onClick={next} variant="contained" disabled={!data.name || !data.slug}>
              Continue
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
