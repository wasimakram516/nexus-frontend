import type { GuidePose } from "@/components/guide/guide-poses";

/**
 * Everything Nex says. Tips are written guidance, not generated text; `askAi` adds a button that
 * hands the visitor over to the Nex chat. Edit wording here without touching components.
 */
export interface GuideScript {
  pose: GuidePose;
  text: string;
  askAi?: boolean;
}

/** Institution setup, keyed by step label (the new-institution wizard and the edit flow share labels). */
export const SETUP_TIPS: Readonly<Record<string, GuideScript[]>> = {
  "Basic Info": [
    { pose: "wave", text: "Hi, I'm Nex! I'll walk you through setting up this institution. Start with its name and contact details." },
    { pose: "point", text: "The short name becomes the institution's address inside Nexus, so keep it simple and easy to say." },
  ],
  "Admin Account": [
    { pose: "point", text: "This is the person who will run the institution day to day. You can skip it and add an admin later." },
  ],
  "Plan & Subscription": [
    { pose: "think", text: "Pick the plan that fits their size. New institutions start on a free trial, so nothing is locked in." },
  ],
  Branding: [
    { pose: "point", text: "Upload a logo, then check the colors. Every color starts at the Nexus default." },
    { pose: "think", text: "Change only what this institution needs. Anything you leave alone keeps following Nexus." },
    { pose: "wave", text: "Use the preview to check light and dark mode before you continue." },
  ],
  Modules: [
    { pose: "point", text: "Choose the modules this institution will use. You can turn more on later as they grow." },
  ],
  "First Campus": [
    { pose: "point", text: "Campuses hold students, staff, classes and finance, so everything starts here. Add the main one." },
  ],
  Settings: [
    { pose: "think", text: "These settings shape how the institution behaves. The defaults are a safe place to start." },
  ],
  Permissions: [
    { pose: "point", text: "Decide who can see and change what. Tighter is easier to loosen later than the other way round." },
  ],
  "Review & Create": [
    { pose: "celebrate", text: "Almost there! Take a last look, then create the institution. You can edit anything afterwards." },
  ],
  "Review & Save": [
    { pose: "celebrate", text: "Looking good! Review your changes and save when you are happy with them." },
  ],
};

/** Public marketing pages, matched by the longest route prefix. */
export const PUBLIC_TIPS: Readonly<Record<string, GuideScript[]>> = {
  "/": [
    { pose: "wave", text: "Welcome! I'm Nex. Want a quick look at what Nexus can do for your school or college?" },
    { pose: "point", text: "Academics, attendance, finance and campuses all live in one connected place." },
    { pose: "think", text: "Have a specific question? I can open the chat for you.", askAi: true },
  ],
  "/features": [
    { pose: "point", text: "Each module is built to work with the others, so a change in one shows up everywhere it matters." },
    { pose: "think", text: "Not sure which module you need? Chat with me.", askAi: true },
  ],
  "/pricing": [
    { pose: "point", text: "Every plan starts with a free trial, so you can see how it fits before you commit." },
    { pose: "think", text: "Comparing plans for several campuses? Chat with me and we will work it out.", askAi: true },
  ],
  "/about": [
    { pose: "wave", text: "Nexus grew out of real school operations. Curious how it started? Read on." },
  ],
  "/contact": [
    { pose: "point", text: "Tell the team about your institution and they'll plan the right rollout with you." },
    { pose: "think", text: "Want an instant answer first? Chat with me.", askAi: true },
  ],
  "/faq": [
    { pose: "think", text: "Can't find your question here? Chat with me.", askAi: true },
  ],
};

export const DEFAULT_PUBLIC_TIPS: readonly GuideScript[] = [
  { pose: "wave", text: "Hi, I'm Nex! Ask me anything about features, pricing or rollout.", askAi: true },
];

/** The tips for a public route: exact match first, then the longest matching prefix, then the default. */
export function publicTipsFor(pathname: string): GuideScript[] {
  if (PUBLIC_TIPS[pathname]) return PUBLIC_TIPS[pathname];
  const prefix = Object.keys(PUBLIC_TIPS)
    .filter((p) => p !== "/" && pathname.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? PUBLIC_TIPS[prefix] : [...DEFAULT_PUBLIC_TIPS];
}

/** Dashboard onboarding: Nex reacts to how many setup steps are done. */
export function onboardingTips(completed: number, total: number, nextStepLabel?: string): GuideScript[] {
  if (completed >= total) {
    return [{ pose: "celebrate", text: "All set! Your institution is ready to run. Nice work." }];
  }
  if (completed === 0) {
    return [
      { pose: "wave", text: `Welcome! Let's get set up. ${nextStepLabel ? `Start with: ${nextStepLabel}.` : "Start with the first step."}` },
    ];
  }
  return [
    {
      pose: "celebrate",
      text: `Nice! ${completed} of ${total} done.${nextStepLabel ? ` Next up: ${nextStepLabel}.` : ""}`,
    },
  ];
}
