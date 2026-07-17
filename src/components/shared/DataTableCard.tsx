"use client";

import { Card, CardProps } from "@mui/material";

/** Bordered, scrollable Card wrapper for data tables — the border+overflow idiom repeated across every manager. */
export default function DataTableCard({ sx, children, ...props }: CardProps) {
  return (
    <Card sx={{ border: "1px solid", borderColor: "divider", overflow: "auto", ...sx }} {...props}>
      {children}
    </Card>
  );
}
