"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import Send from "@mui/icons-material/Send";
import { AxiosError } from "axios";
import { useMessage } from "@/contexts/MessageContext";
import { contactService } from "@/services/contact.service";

const inquiryTypes = [
  "Request a Demo",
  "Pricing Question",
  "Technical Support",
  "Partnership",
  "General Question",
  "Other",
];

/**
 * Maps a failed submission to a user-facing message without leaking internals.
 * @param err The thrown axios error.
 */
export function describeSubmitError(err: unknown): string {
  const error = err as AxiosError<{ message?: unknown }>;
  if (!error.response) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (error.response.status === 429) {
    return "Too many messages sent. Please wait a minute and try again.";
  }
  if (error.response.status === 400) {
    const message = error.response.data?.message;
    const text = Array.isArray(message) ? message.join(", ") : message;
    return typeof text === "string" && text
      ? text
      : "Please check the highlighted details and try again.";
  }
  return "Something went wrong sending your message. Please try again shortly.";
}

export default function ContactForm() {
  const { showMessage } = useMessage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    institution: "",
    inquiryType: "",
    message: "",
    website: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await contactService.submitInquiry({
        name: form.name,
        email: form.email,
        organisation: form.institution || undefined,
        inquiryType: form.inquiryType,
        message: form.message,
        website: form.website,
      });
      showMessage("Message sent! We'll get back to you within 24 hours.", "success");
      setForm({ name: "", email: "", institution: "", inquiryType: "", message: "", website: "" });
    } catch (err) {
      showMessage(describeSubmitError(err), "error");
    } finally {
      setLoading(false);
    }
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
        {/* Honeypot: visually hidden, skipped by keyboard and screen readers. */}
        <Box
          aria-hidden="true"
          sx={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}
        >
          <input
            type="text"
            name="website"
            data-testid="contact-honeypot"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={handleChange}
          />
        </Box>
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
