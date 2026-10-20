"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SCREEN_TIPS, type ScreenTipKey } from "@/content/guide";
import NexGuide from "./NexGuide";
import { toGuideTips } from "./guide-tips";

/** One dismissal hides the first-setup tips on every screen. */
export const SCREEN_GUIDE_KEY = "nexus-guide-screens";

/**
 * Nex's first-setup tips for one dashboard screen (campuses, academics, people). Shown to
 * institution admins only, once per screen per session, so it helps a new admin without nagging
 * staff or anyone who has already set up.
 */
export default function ScreenGuide({ screen }: { screen: ScreenTipKey }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return null;
  return <NexGuide tips={toGuideTips(SCREEN_TIPS[screen])} storageKey={SCREEN_GUIDE_KEY} oncePerSession={`screen:${screen}`} />;
}
