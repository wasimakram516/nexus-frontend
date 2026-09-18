import { z } from "zod";

/**
 * Runtime schema for the frontend's public environment variables.
 *
 * All of these are `NEXT_PUBLIC_*`, so they are inlined into the client
 * bundle at build time. Each one is still referenced individually below
 * (`process.env.NEXT_PUBLIC_X`) rather than via `process.env` as a whole,
 * because Next.js only statically replaces literal `process.env.NEXT_PUBLIC_*`
 * expressions in client code — a dynamic/spread read of `process.env` would
 * resolve to `undefined` in the browser bundle.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_BASE_URL is required")
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
  NEXT_PUBLIC_API_VERSION: z
    .string()
    .min(1, "NEXT_PUBLIC_API_VERSION is required"),
  NEXT_PUBLIC_NEXUS_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_NEXUS_URL is required")
    .url("NEXT_PUBLIC_NEXUS_URL must be a valid URL"),
  NEXT_PUBLIC_WISEMENSOFT_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_WISEMENSOFT_URL is required")
    .url("NEXT_PUBLIC_WISEMENSOFT_URL must be a valid URL"),
});

/**
 * Validates the raw `process.env` values against {@link envSchema} and
 * throws a single, readable error listing every missing/invalid variable
 * instead of letting each one fail silently (or as `undefined`) wherever
 * it happens to be used downstream.
 *
 * @returns {z.infer<typeof envSchema>} The parsed, validated env vars.
 * @throws {Error} If one or more required variables are missing or invalid.
 */
function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
    NEXT_PUBLIC_NEXUS_URL: process.env.NEXT_PUBLIC_NEXUS_URL,
    NEXT_PUBLIC_WISEMENSOFT_URL: process.env.NEXT_PUBLIC_WISEMENSOFT_URL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid or missing environment variables:\n${details}\n\nCheck .env.local against .env.example.`,
    );
  }

  return parsed.data;
}

const parsedEnv = validateEnv();

const env = {
  apiBaseUrl: parsedEnv.NEXT_PUBLIC_API_BASE_URL,
  apiVersion: parsedEnv.NEXT_PUBLIC_API_VERSION,
  nexusUrl: parsedEnv.NEXT_PUBLIC_NEXUS_URL,
  wisemensoftUrl: parsedEnv.NEXT_PUBLIC_WISEMENSOFT_URL,
};

export default env;
