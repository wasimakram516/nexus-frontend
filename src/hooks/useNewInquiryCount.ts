"use client";

import { useEffect, useRef, useState } from "react";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { isInquirySoundEnabled, playInquiry } from "@/lib/chatSounds";
import { subscribeInquiryCreated } from "@/lib/inquirySocket";
import { contactInquiriesService } from "@/services/contact.service";

const CHANGED_EVENT = "inquiries:changed";
const FALLBACK_REFRESH_MS = 60_000;

/** Tells every mounted `useNewInquiryCount` to refetch (call after a status change or delete). */
export function notifyInquiriesChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED_EVENT));
}

/**
 * Number of contact inquiries still in NEW status, for the superadmin unread badge.
 * Refetches on mount, whenever `refreshKey` changes (e.g. the route), after
 * `notifyInquiriesChanged()`, on every live `inquiry.created` socket event, and
 * every 60s while the tab is visible (fallback when the socket is unavailable).
 * Failures leave the last known count in place; socket failures are silent.
 *
 * @param {string} [refreshKey] Any value whose change should trigger a refetch.
 * @param {{announce?: boolean}} [options] `announce` plays the chime and shows the
 *   toast on a live event; pass it from exactly one mounted consumer (the layout).
 * @returns {number} Count of NEW inquiries (0 until loaded or when unavailable).
 */
export function useNewInquiryCount(refreshKey?: string, options: { announce?: boolean } = {}): number {
  const [count, setCount] = useState(0);
  const { showMessage } = useMessage();
  const announce = options.announce === true;
  const showMessageRef = useRef(showMessage);
  useEffect(() => {
    showMessageRef.current = showMessage;
  }, [showMessage]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await apiHandler<{ total?: number }>(
        () => contactInquiriesService.getAll({ status: "NEW", page: 1, limit: 1 }),
        { showMessage: () => undefined, silent: true },
      );
      if (!cancelled && typeof data?.total === "number") setCount(data.total);
    };

    void load();
    window.addEventListener(CHANGED_EVENT, load);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, FALLBACK_REFRESH_MS);
    const unsubscribe = subscribeInquiryCreated((event) => {
      if (announce) {
        if (isInquirySoundEnabled()) playInquiry();
        showMessageRef.current(`New inquiry from ${event.name}`, "info");
      }
      void load();
    });
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED_EVENT, load);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [refreshKey, announce]);

  return count;
}
