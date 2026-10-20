"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, ButtonBase, IconButton, Typography } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Close from "@mui/icons-material/Close";
import type { GuidePose } from "./guide-poses";
import { GUIDE_OFFSET, GUIDE_SIZE } from "@/theme/layout";
import { markSeenThisSession, useIsClient, usePersistedFlag, wasSeenThisSession } from "./guide-storage";
import NexMascot from "./NexMascot";

export interface GuideTip {
  pose: GuidePose;
  text: string;
  /** Optional button on this tip, e.g. "Chat with Nex". */
  action?: { label: string; onClick: () => void };
}

export interface NexGuideProps {
  /** The scripted tips for this screen, shown one at a time. */
  tips: GuideTip[];
  /** localStorage key that remembers a dismissal. Omit to never remember it. */
  storageKey?: string;
  /** sessionStorage id: show the bubble once per browser session, then leave only the mascot. */
  oncePerSession?: string;
  /** Which screen corner it sits in, and the offset from the edges in px. */
  side?: "left" | "right";
  offset?: { bottom: number; side: number };
  /** Makes the mascot a button (the chat launcher) instead of a tip toggle. */
  onMascotClick?: () => void;
  mascotLabel?: string;
  /** Hides the bubble and parks Nex, e.g. while the chat panel is open. */
  quiet?: boolean;
  mascotSize?: number;
  zIndex?: number;
}

/** Visually hidden but read by screen readers. */
const SR_ONLY = { position: "absolute", width: 1, height: 1, p: 0, m: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 } as const;

const TYPE_STEP_CHARS = 2;
const TYPE_INTERVAL_MS = 24;

/**
 * Nex with a speech bubble that walks through scripted tips. The tips are written guidance, not
 * generated text; "Chat with Nex" style actions hand over to the chat. Dismissing hides the
 * bubble (and remembers it); non-launcher guides then park as a small "Show guide" pill.
 */
export default function NexGuide({
  tips,
  storageKey,
  oncePerSession,
  side = "right",
  offset = { bottom: GUIDE_OFFSET, side: GUIDE_OFFSET },
  onMascotClick,
  mascotLabel = "Chat with Nex",
  quiet = false,
  mascotSize = GUIDE_SIZE,
  zIndex = 1060,
}: NexGuideProps) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isClient = useIsClient();
  const [storedDismissed, setStoredDismissed] = usePersistedFlag(storageKey);
  const [localDismissed, setLocalDismissed] = useState(false);
  // Without a storageKey a dismissal lasts only until the page is left.
  const dismissed = storageKey ? storedDismissed : localDismissed;
  const setDismissed = (value: boolean): void => (storageKey ? setStoredDismissed(value) : setLocalDismissed(value));

  const tipsKey = useMemo(() => tips.map((t) => `${t.pose}:${t.text}`).join("|"), [tips]);
  const launcher = Boolean(onMascotClick);

  // Which tip is showing and whether the bubble is open. A new set of tips (new setup step or page)
  // starts again from the first tip: state is re-derived during render, the React-recommended way to
  // reset state when an input changes, instead of setting state inside an effect.
  const viewKey = isClient ? `${tipsKey}|${oncePerSession ?? ""}` : "";
  const [view, setView] = useState({ key: "", index: 0, open: false });
  if (view.key !== viewKey) {
    const hiddenForSession = Boolean(oncePerSession) && wasSeenThisSession(oncePerSession as string);
    setView({ key: viewKey, index: 0, open: isClient && !dismissed && !hiddenForSession });
  }
  const { index, open } = view;
  const tip = tips[Math.min(index, tips.length - 1)];

  // Remember that this page's bubble was shown, so it appears once per session.
  useEffect(() => {
    if (open && oncePerSession) markSeenThisSession(oncePerSession);
  }, [open, oncePerSession]);

  // Typewriter: text appears quickly, and Nex's mouth moves while it does. The count resets whenever
  // the visible tip changes; reduced-motion visitors get the full text at once.
  const total = tip?.text.length ?? 0;
  const tipId = `${viewKey}#${index}`;
  const [typing, setTyping] = useState({ id: "", n: 0 });
  if (typing.id !== tipId) setTyping({ id: tipId, n: reduceMotion ? total : 0 });
  const typed = typing.id === tipId ? typing.n : reduceMotion ? total : 0;
  const typingDone = typed >= total;
  useEffect(() => {
    if (!open || reduceMotion || typingDone) return;
    const timer = setInterval(
      () => setTyping((p) => (p.id === tipId ? { id: p.id, n: p.n + TYPE_STEP_CHARS } : p)),
      TYPE_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [open, reduceMotion, typingDone, tipId]);

  const dismiss = (): void => { setView((v) => ({ ...v, open: false })); setDismissed(true); };
  const reopen = (): void => { setDismissed(false); setView((v) => ({ ...v, index: 0, open: true })); };
  const isLast = index >= tips.length - 1;
  const next = (): void => setView((v) => (isLast ? { ...v, open: false } : { ...v, index: v.index + 1 }));

  if (!isClient || !tip || tips.length === 0) return null;

  // Non-launcher guides park as a small pill once dismissed, so it can always be brought back.
  if (!launcher && dismissed && !open) {
    return (
      <Button
        variant="contained"
        size="small"
        onClick={reopen}
        startIcon={<NexMascot size={28} decorative />}
        sx={{ position: "fixed", bottom: offset.bottom, [side]: offset.side, zIndex, pl: 0.75 }}
      >
        Show guide
      </Button>
    );
  }

  const talking = open && !quiet && !typingDone;
  const showBubble = open && !quiet;
  const mascot = (
    <NexMascot pose={showBubble ? tip.pose : "idle"} talking={talking} cue={tipId} size={mascotSize} decorative />
  );

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: offset.bottom,
        [side]: offset.side,
        zIndex,
        display: "flex",
        flexDirection: side === "right" ? "row" : "row-reverse",
        alignItems: "flex-end",
        gap: 0.5,
        maxWidth: `calc(100vw - ${offset.side * 2}px)`,
        pointerEvents: "none",
        "& > *": { pointerEvents: "auto" },
      }}
    >
      {showBubble && (
        <Box
          sx={{
            position: "relative",
            maxWidth: 270,
            mb: 2,
            p: 1.75,
            pr: 4,
            borderRadius: side === "right" ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
            // A deep brand gradient with a soft glow, so Nex reads as an assistant rather than a plain note.
            backgroundImage: (t) => `linear-gradient(150deg, ${darken(t.palette.primary.dark, 0.6)} 0%, ${darken(t.palette.primary.dark, 0.25)} 100%)`,
            color: "common.white",
            border: "1px solid",
            borderColor: (t) => alpha(t.palette.primary.light, 0.45),
            boxShadow: (t) => `0 8px 28px ${alpha(t.palette.primary.main, 0.4)}, 0 0 0 3px ${alpha(t.palette.primary.light, 0.12)}`,
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 16,
              [side === "right" ? "right" : "left"]: -7,
              width: 12,
              height: 12,
              backgroundColor: (t) => darken(t.palette.primary.dark, 0.25),
              borderColor: (t) => alpha(t.palette.primary.light, 0.45),
              borderStyle: "solid",
              borderWidth: side === "right" ? "1px 1px 0 0" : "0 0 1px 1px",
              transform: "rotate(45deg)",
            },
          }}
        >
          <IconButton size="small" aria-label="Hide guide" onClick={dismiss} sx={{ position: "absolute", top: 4, right: 4, color: "common.white", opacity: 0.8 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
          <Box aria-hidden sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, opacity: 0.85 }}>
            <AutoAwesome sx={{ fontSize: 13 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.06em" }}>Nex</Typography>
          </Box>
          <Typography variant="body2" aria-hidden sx={{ minHeight: "3em", lineHeight: 1.6 }}>
            {tip.text.slice(0, typed)}
          </Typography>
          {/* Screen readers get the full tip once, not letter by letter. */}
          <Box role="status" sx={SR_ONLY}>{tip.text}</Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1.25 }}>
            <Button
              size="small"
              variant="contained"
              onClick={next}
              sx={{ backgroundColor: "common.white", color: "primary.dark", "&:hover": { backgroundColor: "grey.200" } }}
            >
              {isLast ? "Got it" : "Next tip"}
            </Button>
            {tip.action && (
              <Button
                size="small"
                variant="outlined"
                onClick={tip.action.onClick}
                sx={{
                  color: "common.white",
                  borderColor: (t) => alpha(t.palette.common.white, 0.6),
                  "&:hover": { borderColor: "common.white", backgroundColor: (t) => alpha(t.palette.common.white, 0.12) },
                }}
              >
                {tip.action.label}
              </Button>
            )}
          </Box>
        </Box>
      )}
      {launcher ? (
        <ButtonBase
          onClick={onMascotClick}
          aria-label={mascotLabel}
          sx={{ borderRadius: "50%", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}
        >
          {mascot}
        </ButtonBase>
      ) : (
        <ButtonBase
          onClick={() => setView((v) => ({ ...v, open: !v.open }))}
          aria-label={open ? "Hide tip from Nex" : "Show tip from Nex"}
          sx={{ borderRadius: "50%", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}
        >
          {mascot}
        </ButtonBase>
      )}
    </Box>
  );
}
