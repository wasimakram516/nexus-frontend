import { describe, expect, it } from "vitest";
import { POSES } from "@/components/guide/guide-poses";
import { DEFAULT_PUBLIC_TIPS, PUBLIC_TIPS, SCREEN_TIPS, SETUP_TIPS, SIGNUP_TIPS, onboardingTips, publicTipsFor, type GuideScript } from "@/content/guide";

const allScripts = (): GuideScript[] => [
  ...Object.values(SETUP_TIPS).flat(),
  ...Object.values(PUBLIC_TIPS).flat(),
  ...DEFAULT_PUBLIC_TIPS,
  ...SIGNUP_TIPS,
  ...Object.values(SCREEN_TIPS).flat(),
  ...onboardingTips(0, 4, "Create your first campus"),
  ...onboardingTips(2, 4, "Add students"),
  ...onboardingTips(4, 4),
];

describe("guide content", () => {
  it("only uses poses Nex can actually perform", () => {
    for (const tip of allScripts()) expect(Object.keys(POSES)).toContain(tip.pose);
  });

  it("keeps every tip short enough for a speech bubble", () => {
    for (const tip of allScripts()) {
      expect(tip.text.trim().length).toBeGreaterThan(0);
      expect(tip.text.length).toBeLessThanOrEqual(160);
    }
  });

  it("covers every step of the new-institution wizard and the edit flow", () => {
    const steps = ["Basic Info", "Admin Account", "Plan & Subscription", "Branding", "Modules", "First Campus", "Review & Create", "Settings", "Permissions", "Review & Save"];
    for (const step of steps) expect(SETUP_TIPS[step]?.length).toBeGreaterThan(0);
  });

  it("offers the chat only where a hand-off makes sense, never as a claim the guide generated the answer", () => {
    expect(allScripts().some((t) => t.askAi)).toBe(true);
    for (const tip of allScripts()) expect(tip.text).not.toMatch(/\bI (generated|calculated|analy[sz]ed)\b/i);
  });
});

describe("tip sequences", () => {
  it("changes Nex's pose on every Next tip, so each tip visibly reacts", () => {
    const sequences = [...Object.values(SETUP_TIPS), ...Object.values(PUBLIC_TIPS), DEFAULT_PUBLIC_TIPS, SIGNUP_TIPS, ...Object.values(SCREEN_TIPS)];
    for (const tips of sequences) {
      tips.slice(1).forEach((tip, i) => expect(tip.pose).not.toBe(tips[i].pose));
    }
  });
});

describe("publicTipsFor", () => {
  it("matches a page exactly, then by longest prefix, then falls back to the default", () => {
    expect(publicTipsFor("/pricing")).toBe(PUBLIC_TIPS["/pricing"]);
    expect(publicTipsFor("/features/finance")).toBe(PUBLIC_TIPS["/features"]);
    expect(publicTipsFor("/privacy-policy")).toEqual(DEFAULT_PUBLIC_TIPS);
  });

  it("does not let the home route swallow every other path", () => {
    expect(publicTipsFor("/somewhere-else")).not.toBe(PUBLIC_TIPS["/"]);
  });
});

describe("onboardingTips", () => {
  it("welcomes at zero, celebrates progress, and finishes with a celebration", () => {
    expect(onboardingTips(0, 4, "Create your first campus")[0]).toMatchObject({ pose: "wave" });
    expect(onboardingTips(2, 4, "Add students")[0].text).toContain("2 of 4");
    expect(onboardingTips(4, 4)[0].text).toContain("All set");
  });
});
