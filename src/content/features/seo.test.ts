import { describe, expect, it } from "vitest";
import { featureModules } from "@/content/features";
import { pricingFaqs } from "@/content/pricing-faqs";

// Google truncates descriptions around 160 characters.
const MAX_DESCRIPTION = 160;
// Titles get " | Nexus" appended by the root layout; Google truncates around 60 characters.
const MAX_TITLE_WITH_SUFFIX = 60;

describe("feature module SEO copy", () => {
  it("gives every module a distinct, benefit-led title that fits in search results", () => {
    const titles = featureModules.map((m) => m.seoTitle);
    expect(new Set(titles).size).toBe(titles.length);
    for (const title of titles) {
      expect(title.length + " | Nexus".length).toBeLessThanOrEqual(MAX_TITLE_WITH_SUFFIX);
      expect(title).not.toMatch(/\bModule\b/);
    }
  });

  it("gives every module a description in the range search engines display", () => {
    for (const m of featureModules) {
      expect(m.seoDescription.length).toBeGreaterThan(70);
      expect(m.seoDescription.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }
  });
});

describe("pricing FAQs", () => {
  it("has non-empty questions and answers for structured data", () => {
    expect(pricingFaqs.length).toBeGreaterThan(0);
    for (const f of pricingFaqs) {
      expect(f.q).toBeTruthy();
      expect(f.a).toBeTruthy();
    }
  });
});
