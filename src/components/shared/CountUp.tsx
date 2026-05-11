"use client";

import { useEffect, useRef, useState } from "react";
import { Typography } from "@mui/material";
import { useInView } from "framer-motion";

interface Props {
  value: string;
  variant?: "h3" | "h4" | "h5";
  sx?: object;
}

function parseNumber(val: string): { num: number; suffix: string; prefix: string } {
  const match = val.match(/^([^0-9]*)([0-9,]+)([^0-9]*)$/);
  if (!match) return { num: 0, suffix: val, prefix: "" };
  return {
    prefix: match[1] ?? "",
    num: parseInt(match[2].replace(/,/g, ""), 10),
    suffix: match[3] ?? "",
  };
}

export default function CountUp({ value, variant = "h3", sx }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");
  const { num, suffix, prefix } = parseNumber(value);
  const isNumeric = num > 0;

  useEffect(() => {
    if (!isInView || !isNumeric) { setDisplay(value); return; }
    const duration = 1200;
    const steps = 40;
    const step = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += num / steps;
      if (current >= num) { setDisplay(`${prefix}${num.toLocaleString()}${suffix}`); clearInterval(timer); }
      else setDisplay(`${prefix}${Math.floor(current).toLocaleString()}${suffix}`);
    }, step);
    return () => clearInterval(timer);
  }, [isInView, isNumeric, num, prefix, suffix, value]);

  return (
    <Typography ref={ref} variant={variant} sx={{ fontWeight: 800, color: "primary.main", ...sx }}>
      {isNumeric ? display : value}
    </Typography>
  );
}
