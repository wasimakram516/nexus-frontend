import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  isIndexableDeployment,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

describe("absoluteUrl", () => {
  it("resolves a path against the configured site origin", () => {
    expect(absoluteUrl("/pricing")).toBe("http://localhost:3000/pricing");
    expect(absoluteUrl("/")).toBe("http://localhost:3000/");
  });
});

describe("isIndexableDeployment", () => {
  it("allows production and non-Vercel hosting, blocks previews and dev", () => {
    expect(isIndexableDeployment("production")).toBe(true);
    expect(isIndexableDeployment(undefined)).toBe(true);
    expect(isIndexableDeployment("preview")).toBe(false);
    expect(isIndexableDeployment("development")).toBe(false);
  });
});

describe("buildPageMetadata", () => {
  const meta = buildPageMetadata({ title: "About Nexus", description: "Desc", path: "/about" });

  it("sets title, description and a canonical path", () => {
    expect(meta.title).toBe("About Nexus");
    expect(meta.description).toBe("Desc");
    expect(meta.alternates?.canonical).toBe("/about");
  });

  it("fills Open Graph and a large Twitter card from the same values", () => {
    expect(meta.openGraph).toMatchObject({ title: "About Nexus", description: "Desc", url: "/about", type: "website", siteName: "Nexus" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "About Nexus", description: "Desc" });
  });

  it("omits keywords unless given", () => {
    expect(meta.keywords).toBeUndefined();
    expect(buildPageMetadata({ title: "t", description: "d", path: "/", keywords: ["erp"] }).keywords).toEqual(["erp"]);
  });
});

describe("JSON-LD builders", () => {
  it("links website and software entries to the organization by @id", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(websiteJsonLd().publisher).toEqual({ "@id": org["@id"] });
    expect(softwareApplicationJsonLd().publisher).toEqual({ "@id": org["@id"] });
  });

  it("builds an FAQPage with one Question per entry", () => {
    const ld = faqJsonLd([{ question: "Q1?", answer: "A1" }, { question: "Q2?", answer: "A2" }]) as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> };
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toMatchObject({ name: "Q1?", acceptedAnswer: { text: "A1" } });
  });

  it("builds 1-indexed breadcrumbs with absolute URLs", () => {
    const ld = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]) as { itemListElement: Array<{ position: number; item: string }> };
    expect(ld.itemListElement.map((e) => e.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toBe("http://localhost:3000/faq");
  });
});
