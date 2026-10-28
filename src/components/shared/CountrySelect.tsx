"use client";

import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { COUNTRIES, Country, getCountry, searchCountries } from "@/lib/countries";
import CountryFlag from "@/components/shared/CountryFlag";

interface Props {
  label?: string;
  /** A country code such as "PK", or "" for none chosen. */
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
  error?: boolean;
  helperText?: string;
}

/**
 * A searchable country field with flags, for anywhere a country is chosen on
 * its own (a school's default country, an address). Type the name, the code
 * or the calling code to find it.
 */
export default function CountrySelect({
  label = "Country", value, onChange, required, disabled, fullWidth = true, size = "medium", error, helperText,
}: Props) {
  return (
    <Autocomplete<Country>
      options={COUNTRIES}
      value={getCountry(value)}
      onChange={(_, next) => onChange(next?.iso ?? "")}
      getOptionLabel={(country) => country.name}
      isOptionEqualToValue={(option, selected) => option.iso === selected.iso}
      filterOptions={(options, state) => searchCountries(state.inputValue, options)}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      renderOption={(props, country) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <Box component="li" key={key} {...rest} sx={{ gap: 1.25 }}>
            <CountryFlag iso={country.iso} />
            <Box sx={{ flex: 1 }}>{country.name}</Box>
            <Typography variant="body2" color="text.secondary">{country.dialCode}</Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} error={error} helperText={helperText} />
      )}
    />
  );
}
