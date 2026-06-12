"use client";

import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import type { WizardData } from "@/app/platform/institutions/new/page";

interface Props {
  data: WizardData;
  update: (partial: Partial<WizardData>) => void;
}

export default function StepAdmin({ data, update }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Institution Administrator</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create the first admin account so someone can sign in and run this institution from day one.
      </Typography>

      <Card sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent sx={{ p: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={data.skipAdmin}
                onChange={(e) => update({ skipAdmin: e.target.checked })}
              />
            }
            label="Skip for now — I'll add an admin later"
            sx={{ mb: data.skipAdmin ? 0 : 2 }}
          />

          {!data.skipAdmin && (
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Full Name *"
                  value={data.adminName}
                  onChange={(e) => update({ adminName: e.target.value })}
                  fullWidth
                  slotProps={{ htmlInput: { autoComplete: "off", name: "wizard-admin-name" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email *"
                  type="email"
                  value={data.adminEmail}
                  onChange={(e) => update({ adminEmail: e.target.value })}
                  fullWidth
                  helperText="They sign in with this email."
                  slotProps={{ htmlInput: { autoComplete: "off", name: "wizard-admin-email" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Password *"
                  type={showPassword ? "text" : "password"}
                  value={data.adminPassword}
                  onChange={(e) => update({ adminPassword: e.target.value })}
                  fullWidth
                  helperText="At least 8 characters. Share it securely."
                  slotProps={{
                    htmlInput: { autoComplete: "new-password", name: "wizard-admin-password" },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end" onClick={() => setShowPassword((p) => !p)}>
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
