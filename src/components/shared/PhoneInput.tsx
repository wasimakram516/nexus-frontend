"use client";

import { useMemo, useState } from "react";
import {
  Box, InputAdornment, ListSubheader, MenuItem, Select, TextField, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { COUNTRIES, getCountry, resolveCountry, searchCountries } from "@/lib/countries";
import { exampleNumber, isValidPhone, joinPhone, splitPhone } from "@/lib/phone";
import CountryFlag from "@/components/shared/CountryFlag";

interface Props {
  label?: string;
  /** The number in international form ("+923001234567"), or an older stored number. Empty when there is none. */
  value: string;
  /** Called with "+<calling code><digits>", or "" when the box is empty. Use `isValidPhone` to check it. */
  onChange: (value: string) => void;
  /** The country a school's numbers are usually in. Defaults to the signed-in school's setting. */
  defaultCountry?: string | null;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
  name?: string;
  /** Shown instead of the built-in message when the form has its own error. */
  error?: boolean;
  helperText?: string;
}

/**
 * A phone number box with a country picker in front of it. Any country can be
 * chosen; a school's default country is simply what it starts on, so people
 * type the usual local number without picking a code every time. A number
 * pasted or typed with its own "+" or "00" prefix switches the country itself.
 */
export default function PhoneInput({
  label = "Phone number", value, onChange, defaultCountry, required, disabled, fullWidth = true,
  size = "medium", name, error, helperText,
}: Props) {
  const runtime = useOptionalRuntimeConfig();
  const fallback = resolveCountry(defaultCountry ?? runtime?.config?.defaultCountry);

  const initial = splitPhone(value, fallback);
  const [country, setCountry] = useState(initial.country);
  const [national, setNational] = useState(initial.national);
  const [touched, setTouched] = useState(false);
  const [query, setQuery] = useState("");

  // Follow a value that changed from outside, such as a form being reset or another record opened.
  // Typing already keeps the pieces in step, so only a value that does not match them is taken in.
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== joinPhone(country, national)) {
      const next = splitPhone(value, fallback);
      setCountry(next.country);
      setNational(next.national);
    }
  }

  const matches = useMemo(() => searchCountries(query, COUNTRIES), [query]);
  const joined = joinPhone(country, national);
  const invalid = Boolean(joined) && !isValidPhone(joined);
  const showError = error ?? (touched && invalid);
  const sample = exampleNumber(country);

  const handleNational = (text: string) => {
    const typedWithCode = /^\s*(\+|00)/.test(text);
    if (typedWithCode) {
      const parsed = splitPhone(text, country);
      setCountry(parsed.country);
      setNational(parsed.national);
      onChange(joinPhone(parsed.country, parsed.national));
      return;
    }
    setNational(text);
    onChange(joinPhone(country, text));
  };

  const handleCountry = (iso: string) => {
    const next = resolveCountry(iso);
    setCountry(next);
    onChange(joinPhone(next, national));
  };

  return (
    <TextField
      label={label}
      name={name}
      type="tel"
      value={national}
      onChange={(e) => handleNational(e.target.value)}
      onBlur={() => setTouched(true)}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      error={showError}
      helperText={
        helperText ??
        (showError
          ? `Enter a valid ${getCountry(country)?.name ?? ""} number${sample ? `, for example ${sample}` : ""}.`
          : sample
            ? `For example ${sample}. Choose another country for an international number.`
            : undefined)
      }
      slotProps={{
        htmlInput: { inputMode: "tel", autoComplete: "tel-national" },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ mr: 0 }}>
              <Select
                value={country}
                onChange={(e) => handleCountry(e.target.value)}
                onClose={() => setQuery("")}
                disabled={disabled}
                variant="standard"
                disableUnderline
                inputProps={{ "aria-label": "Country code" }}
                renderValue={(iso) => (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <CountryFlag iso={iso} />
                    <span>{getCountry(iso)?.dialCode}</span>
                  </Box>
                )}
                MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360, width: 320 } } }, autoFocus: false }}
                sx={{ "& .MuiSelect-select": { py: 0, pr: "20px !important", display: "flex", alignItems: "center" } }}
              >
                <ListSubheader sx={{ lineHeight: 1, py: 1 }}>
                  <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    placeholder="Search country or code"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    slotProps={{
                      input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
                      htmlInput: { "aria-label": "Search countries" },
                    }}
                  />
                </ListSubheader>
                {matches.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>No country matches.</Typography>
                )}
                {matches.map((c) => (
                  <MenuItem key={c.iso} value={c.iso} sx={{ gap: 1.25 }}>
                    <CountryFlag iso={c.iso} />
                    <Box sx={{ flex: 1 }}>{c.name}</Box>
                    <Typography variant="body2" color="text.secondary">{c.dialCode}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
