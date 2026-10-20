/** Identity strings shared by metadata, structured data, the OG image and the web manifest. */
export const BRAND_NAME = "Nexus";
export const BRAND_DESCRIPTOR = "Education ERP for Schools, Colleges & Universities";
export const BRAND_TAGLINE = "The ERP That Runs Your Entire Institution.";
export const SITE_DESCRIPTION =
  "The all-in-one ERP for managing students, staff, fees, attendance, examinations, and campuses. Built by Wisemen Soft.";
export const BRAND_DOMAIN = "nexus.wisemensoft.com";

export const COMPANY_NAME = "Wisemen Soft";
export const COMPANY_URL = "https://wisemensoft.com";

/** Modules listed on the home-page social preview image. */
export const OG_MODULE_PILLS = ["Academics", "Attendance", "Finance", "Examinations", "Reporting", "Multi-Campus"] as const;

/** Routes that must never be indexed: authenticated areas and auth screens. */
export const PRIVATE_ROUTE_PREFIXES = ["/dashboard", "/platform", "/login", "/signup"] as const;
