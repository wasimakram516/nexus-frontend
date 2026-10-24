"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const URL_EVENT = "nexus:url-section";

/** A label as a short, stable URL value: "Fee Vouchers" becomes "fee-vouchers". */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function subscribeToUrl(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(URL_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(URL_EVENT, callback);
  };
}

/**
 * Where the user is inside a module (a Finance section, an Exams tab) kept in
 * the address bar as `?section=fee-vouchers`. Refreshing or sharing the link
 * lands on the same place, and the browser's back button steps up to the
 * module's own page. It returns nothing until the page has loaded, so the
 * server and the first browser render agree.
 *
 * @param {string} [param] - The query parameter to use.
 * @returns {[string | null, (next: string | null) => void]} The current value and a setter; `null` clears it.
 */
export function useUrlSection(param = "section"): [string | null, (next: string | null) => void] {
  const value = useSyncExternalStore(
    subscribeToUrl,
    () => new URLSearchParams(window.location.search).get(param),
    () => null,
  );
  const setValue = useCallback(
    (next: string | null) => {
      const url = new URL(window.location.href);
      if (next) url.searchParams.set(param, next);
      else url.searchParams.delete(param);
      if (url.href === window.location.href) return;
      window.history.pushState(window.history.state, "", url);
      window.dispatchEvent(new Event(URL_EVENT));
    },
    [param],
  );
  return [value, setValue];
}

/* The label of the place the user is in, shown as the last breadcrumb. */
let currentCrumb: string | null = null;
const crumbListeners = new Set<() => void>();

function setCrumb(label: string | null): void {
  if (currentCrumb === label) return;
  currentCrumb = label;
  crumbListeners.forEach((listener) => listener());
}

/**
 * Tells the page's breadcrumbs which place inside the module is open, such as
 * "Fee Vouchers". Pass `null` while the module's own page is showing. It clears
 * itself when the module leaves the screen.
 *
 * @param {string | null} label - The open place, or null for none.
 */
export function useSectionCrumb(label: string | null): void {
  useEffect(() => {
    setCrumb(label);
    return () => setCrumb(null);
  }, [label]);
}

/** The label set by {@link useSectionCrumb}, for the component that draws the breadcrumbs. */
export function useSectionCrumbLabel(): string | null {
  return useSyncExternalStore(
    (callback) => {
      crumbListeners.add(callback);
      return () => crumbListeners.delete(callback);
    },
    () => currentCrumb,
    () => null,
  );
}
