import type { GuideScript } from "@/content/guide";
import type { GuideTip } from "./NexGuide";

/** Turns written scripts into guide tips, adding the "Chat with Nex" hand-off where a script asks for it. */
export function toGuideTips(scripts: readonly GuideScript[], onAskAi?: () => void): GuideTip[] {
  return scripts.map(({ pose, text, askAi }) => ({
    pose,
    text,
    ...(askAi && onAskAi ? { action: { label: "Chat with Nex", onClick: onAskAi } } : {}),
  }));
}
