"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import { Send } from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";

const inquiryTypes = [
  "Request a Demo",
  "Pricing Question",
  "Technical Support",
  "Partnership",
  "General Question",
  "Other",
];

export default function ContactForm() {
  const { showMessage } = useMessage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    institution: "",
    inquiryType: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    showMessage("Message sent! We'll get back to you within 24 hours.", "success");
    setForm({ name: "", email: "", institution: "", inquiryType: "", message: "" });
    setLoading(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ backgroundColor: "background.paper", borderRadius: 3, p: 4, border: "1px solid", borderColor: "divider" }}
    >
      <Typography variant="h5" sx={{ fontWeight: 100, mb: 0.5 }}>
        Send us a{" "}
        <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>message</Box>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Fill in the form and we&apos;ll get back to you shortly.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
          <TextField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <TextField label="Institution / Organisation" name="institution" value={form.institution} onChange={handleChange} fullWidth />
          <TextField
            select
            label="Inquiry Type"
            name="inquiryType"
            value={form.inquiryType}
            onChange={handleChange}
            required
            fullWidth
          >
            {inquiryTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </Box>

        <TextField
          label="Message"
          name="message"
          value={form.message}
          onChange={handleChange}
          required
          fullWidth
          multiline
          rows={6}
          placeholder="Tell us about your institution, how many campuses you manage, and what you're looking for..."
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          endIcon={!loading && <Send />}
          sx={{ alignSelf: "flex-start", px: 4, py: 1.5 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : "Send Message"}
        </Button>
      </Box>
    </Box>
  );
}
