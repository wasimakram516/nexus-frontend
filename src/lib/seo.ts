import type { Metadata } from "next";
import env from "@/config/env";
import {
  BRAND_DESCRIPTOR,
  BRAND_NAME,
  COMPANY_NAME,
  COMPANY_URL,
  SITE_DESCRIPTION,
} from "@/lib/site-config";

type JsonLdObject = Record<string, unknown>;

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

interface PageMetadataInput {
  /** Page title without the site suffix; the root layout template appends "| Nexus". */
  title: string;
  description: string;
  /** Site-relative path, used for the canonical URL and og:url. */
  path: string;
  keywords?: readonly string[];
}

/** Resolves a site-relative path to an absolute URL on the configured site origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, env.nexusUrl).toString();
}

/**
 * Whether search engines may index this deployment. Vercel preview deployments
 * get their own URLs and must stay out of search results so they never compete
 * with, or duplicate, the real site.
 */
export function isIndexableDeployment(vercelEnv: string | undefined = process.env.VERCEL_ENV): boolean {
  return vercelEnv === undefined || vercelEnv === "production";
}

/**
 * Builds the metadata every public page needs: canonical URL, Open Graph and
 * Twitter card values. The share image itself comes from the opengraph-image /
 * twitter-image file conventions, so it is intentionally not set here.
 */
export function buildPageMetadata({ title, description, path, keywords }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    ...(keywords ? { keywords: [...keywords] } : {}),
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      siteName: BRAND_NAME,
      locale: "en_US",
      type: "website",
      url: path,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Stable identifier other entries use to reference the organization. */
function organizationId(): string {
  return `${absoluteUrl("/")}#organization`;
}

/** Describes who is behind the site: Nexus, a product of Wisemen Soft. */
export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: BRAND_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon.png"),
    parentOrganization: { "@type": "Organization", name: COMPANY_NAME, url: COMPANY_URL },
  };
}

/** Describes the site itself and links it to its organization. */
export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    url: absoluteUrl("/"),
    publisher: { "@id": organizationId() },
  };
}

/** Describes Nexus as a business software product (a web application). */
export function softwareApplicationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${BRAND_NAME} ${BRAND_DESCRIPTOR}`,
    description: SITE_DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web-based)",
    url: absoluteUrl("/"),
    publisher: { "@id": organizationId() },
  };
}

/** Describes a list of questions and answers, enabling FAQ rich results. */
export function faqJsonLd(entries: readonly FaqEntry[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Describes the page's position in the site hierarchy, enabling breadcrumb rich results. */
export function breadcrumbJsonLd(entries: readonly BreadcrumbEntry[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}
