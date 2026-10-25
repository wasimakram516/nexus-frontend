"use client";

import { useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";

/** The timezone this device is set to, for suggesting a default. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

/** Used where the runtime cannot list zones. */
const COMMON_ZONES = [
  "UTC",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Muscat",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Kabul",
  "Asia/Tashkent",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Istanbul",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

/** Every IANA zone the browser knows, with UTC added (browsers leave it out of the list). */
export function listTimeZones(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  let zones: string[] = [];
  try {
    zones = supported ? supported("timeZone") : [];
  } catch {
    zones = [];
  }
  const all = new Set(zones.length > 0 ? zones : COMMON_ZONES);
  all.add("UTC");
  const own = browserTimeZone();
  if (own) all.add(own);
  return [...all].sort((a, b) => a.localeCompare(b));
}

/** `GMT+5` for a zone, so people can find theirs by offset as well as by city. */
function offsetOf(zone: string): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((found) => found.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

/** Lowercase, with `_` and `/` as spaces, so "new york" finds "America/New_York". */
const normalise = (text: string) => text.toLowerCase().replace(/[_/]+/g, " ");

interface TimezonePickerProps {
  /** The chosen IANA zone; empty for none. */
  value: string;
  onChange: (zone: string) => void;
  label?: string;
  helperText?: string;
  /** Lets the person clear the choice (for a campus that follows its institution). */
  clearable?: boolean;
  /** Shown when nothing is chosen and the choice can be cleared. */
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Pick a timezone by searching for a city, country-side name or offset
 * instead of typing an IANA identifier from memory.
 */
export default function TimezonePicker({
  value,
  onChange,
  label = "Timezone",
  helperText,
  clearable = false,
  emptyLabel,
  disabled,
  required,
}: TimezonePickerProps) {
  const options = useMemo(() => listTimeZones().map((zone) => ({ zone, label: `${zone} (${offsetOf(zone)})` })), []);
  const chosen = options.find((option) => option.zone === value) ?? (value ? { zone: value, label: value } : null);

  return (
    <Autocomplete
      options={options}
      value={chosen}
      disabled={disabled}
      disableClearable={!clearable}
      autoHighlight
      isOptionEqualToValue={(option, selected) => option.zone === selected.zone}
      getOptionLabel={(option) => option.label}
      filterOptions={(all, state) => {
        const wanted = normalise(state.inputValue.trim());
        return wanted ? all.filter((option) => normalise(option.label).includes(wanted)) : all;
      }}
      onChange={(_, selected) => onChange(selected?.zone ?? "")}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} helperText={helperText} placeholder={clearable ? emptyLabel : "Search by city or offset"} />
      )}
    />
  );
}
