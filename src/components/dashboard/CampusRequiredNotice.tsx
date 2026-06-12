"use client";

import Link from "next/link";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { AddBusiness } from "@mui/icons-material";

interface CampusRequiredNoticeProps {
  /** Name of the module the user tried to use, e.g. "people". */
  moduleLabel: string;
  /** CTA target; omit to hide the button (e.g. platform console context). */
  ctaHref?: string;
}

/**
 * Shown when an institution has no campuses yet — campusId is a required
 * field on people, academics, attendance and finance records.
 */
export default function CampusRequiredNotice({ moduleLabel, ctaHref }: CampusRequiredNoticeProps) {
  return (
    <Card sx={{ border: "1px dashed", borderColor: "primary.main" }}>
      <CardContent sx={{ py: 7, textAlign: "center" }}>
        <AddBusiness sx={{ fontSize: 44, color: "primary.main", mb: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create a campus first
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: ctaHref ? 3 : 0, maxWidth: 440, mx: "auto" }}>
          Every {moduleLabel} record belongs to a campus. Set up your first campus
          (even a single-branch school counts as one campus) and come back here.
        </Typography>
        {ctaHref && (
          <Button component={Link} href={ctaHref} variant="contained" startIcon={<AddBusiness />}>
            Create Campus
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
