"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "nex-guide-storage";
const noopSubscribe = (): (() => void) => () => {};

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false; // storage unavailable (private mode, blocked): behave as "not dismissed"
  }
}

/** False on the server and during hydration, true afterwards, so client-only UI never mismatches. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * A boolean kept in localStorage, readable without a setState-in-effect: server and hydration see
 * false, then the stored value. Changes in this tab and in other tabs both update it.
 */
export function usePersistedFlag(key?: string): [boolean, (next: boolean) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, []);
  const value = useSyncExternalStore(subscribe, () => (key ? readFlag(key) : false), () => false);
  const set = useCallback((next: boolean) => {
    if (!key) return;
    try {
      if (next) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
    } catch {
      /* storage unavailable: the change simply is not remembered */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [key]);
  return [value, set];
}

const seenKey = (id: string): string => `nex-seen:${id}`;

/** Whether the bubble for this page id was already shown in this browser session. */
export function wasSeenThisSession(id: string): boolean {
  try {
    return sessionStorage.getItem(seenKey(id)) === "1";
  } catch {
    return false;
  }
}

export function markSeenThisSession(id: string): void {
  try {
    sessionStorage.setItem(seenKey(id), "1");
  } catch {
    /* storage unavailable */
  }
}
