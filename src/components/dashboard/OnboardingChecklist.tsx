"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowForwardIos,
  CheckCircle,
  Close,
  RadioButtonUnchecked,
} from "@mui/icons-material";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  required?: boolean;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

const DISMISS_KEY = "nexus-onboarding-dismissed";

/**
 * Setup guide for new institution admins, driven by real data counts.
 * Campus creation is the hard prerequisite — everything else needs one.
 */
export default function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY) === "1";
    const forcedWelcome =
      typeof window !== "undefined" && window.location.search.includes("welcome=1");
    if (forcedWelcome) {
      localStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
      return;
    }
    setDismissed(stored);
  }, []);

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (dismissed || allDone || steps.length === 0) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <Card sx={{ border: "1px solid", borderColor: "primary.main", mb: 4 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Set up your institution
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completed} of {steps.length} steps done. Start with a campus — people, classes and finance all live inside one.
            </Typography>
          </Box>
          <Tooltip title="Hide this guide">
            <IconButton size="small" onClick={dismiss}><Close fontSize="small" /></IconButton>
          </Tooltip>
        </Box>

        <LinearProgress
          variant="determinate"
          value={(completed / steps.length) * 100}
          sx={{ mb: 2, height: 6, borderRadius: 3 }}
        />

        <List dense disablePadding>
          {steps.map((step) => (
            <ListItemButton
              key={step.key}
              onClick={() => router.push(step.href)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {step.done
                  ? <CheckCircle color="success" fontSize="small" />
                  : <RadioButtonUnchecked color="disabled" fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        textDecoration: step.done ? "line-through" : "none",
                        color: step.done ? "text.disabled" : "text.primary",
                      }}
                    >
                      {step.label}
                    </Typography>
                    {step.required && !step.done && (
                      <Chip label="Start here" size="small" color="primary" sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Box>
                }
                secondary={step.done ? undefined : step.description}
                slotProps={{ secondary: { variant: "caption" } }}
              />
              {!step.done && <ArrowForwardIos sx={{ fontSize: 12, color: "text.disabled" }} />}
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button size="small" color="inherit" onClick={dismiss} sx={{ color: "text.secondary" }}>
            I&apos;ll do this later
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
