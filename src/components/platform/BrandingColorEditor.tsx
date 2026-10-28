"use client";

import { useState } from "react";
import { Alert, Box, Button, Chip, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import Refresh from "@mui/icons-material/Refresh";
import Undo from "@mui/icons-material/Undo";
import {
  BRANDING_COLOR_GROUPS,
  HEX_COLOR_6,
  countOverrides,
  getDefaultTokenColor,
  setTokenOverride,
  type BrandingColorTokenDef,
  type ColorMode,
  type ColorOverrides,
} from "@/theme/branding-tokens";
import { findContrastIssues } from "@/theme/contrast";

interface BrandingColorEditorProps {
  mode: ColorMode;
  value: ColorOverrides;
  onChange: (next: ColorOverrides) => void;
}

interface ColorRowProps {
  def: BrandingColorTokenDef;
  mode: ColorMode;
  custom: string | undefined;
  onSet: (hex: string | null) => void;
}

/** One color: native picker, hex field, and a reset back to the Nexus default. */
function ColorRow({ def, mode, custom, onSet }: ColorRowProps) {
  const fallback = getDefaultTokenColor(mode, def.token);
  const effective = custom ?? fallback;
  // The hex field keeps its own draft so partial input ("#1E3") is not rejected mid-typing.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? custom ?? "";
  const invalid = draft !== null && draft !== "" && !HEX_COLOR_6.test(draft);

  const commit = (text: string) => {
    setDraft(text);
    if (HEX_COLOR_6.test(text)) {
      onSet(text);
      setDraft(null);
    } else if (text === "") {
      onSet(null);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        component="input"
        type="color"
        value={effective.toLowerCase()}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDraft(null); onSet(e.target.value); }}
        aria-label={`${def.label} color picker`}
        sx={{ width: 40, height: 40, border: "none", borderRadius: 999, cursor: "pointer", p: 0.25, flexShrink: 0, backgroundColor: "transparent" }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{def.label}</Typography>
          <Chip size="tiny" label={custom ? "Custom" : "Nexus default"} color={custom ? "primary" : "default"} variant={custom ? "filled" : "outlined"} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{def.hint}</Typography>
      </Box>
      <TextField
        value={shown}
        placeholder={fallback}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setDraft(null)}
        error={invalid}
        size="small"
        sx={{ width: 120 }}
        slotProps={{ htmlInput: { "aria-label": `${def.label} hex value`, maxLength: 7, spellCheck: false } }}
      />
      <Tooltip title={custom ? `Reset to Nexus default (${fallback})` : "Already the Nexus default"}>
        <span>
          <IconButton size="small" disabled={!custom} onClick={() => { setDraft(null); onSet(null); }} aria-label={`Reset ${def.label}`}>
            <Undo fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

/**
 * Lets an admin set every theme color for one mode. Each field defaults to the Nexus theme
 * color; only colors that differ from it are stored (see setTokenOverride).
 */
export default function BrandingColorEditor({ mode, value, onChange }: BrandingColorEditorProps) {
  const overrides = value[mode] ?? {};
  const total = countOverrides(value);
  const contrastIssues = findContrastIssues(mode, value);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {mode === "light" ? "Light mode" : "Dark mode"} colors
        </Typography>
        <Button size="small" startIcon={<Refresh />} disabled={total === 0} onClick={() => onChange({})} sx={{ color: "text.secondary" }}>
          Reset all colors
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
        Every field starts at the Nexus theme color. Change only what this institution needs; the rest keeps following Nexus.
        {total > 0 ? ` ${total} custom color${total === 1 ? "" : "s"} set across light and dark.` : ""}
      </Typography>

      {contrastIssues.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          Some of these colors may be hard to read, especially for people with weaker eyesight:
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {contrastIssues.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </Box>
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {BRANDING_COLOR_GROUPS.map((group) => (
          <Box key={group.id}>
            <Typography variant="overline" color="text.secondary">{group.title}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
              {group.tokens.map((def) => (
                <ColorRow
                  key={`${mode}-${def.token}`}
                  def={def}
                  mode={mode}
                  custom={overrides[def.token]}
                  onSet={(hex) => onChange(setTokenOverride(value, mode, def.token, hex))}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
