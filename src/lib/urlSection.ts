"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

/** A label as a short, stable URL segment: "Fee Vouchers" becomes "fee-vouchers". */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The address of the module's own page, such as `/dashboard/finance`. */
const ModuleBaseContext = createContext<string | null>(null);

/**
 * Tells the module inside it where its own page lives, so the place that is
 * open can be a real address below it (`/dashboard/finance/fee-vouchers`).
 */
export function ModuleBase({ path, children }: { path: string; children: React.ReactNode }) {
  return createElement(ModuleBaseContext.Provider, { value: path }, children);
}

/** The first path segment after the module's address, or null when the module's own page is showing. */
export function sectionFromPath(pathname: string | null, base: string): string | null {
  if (!pathname || (pathname !== base && !pathname.startsWith(`${base}/`))) return null;
  const rest = pathname.slice(base.length).split("/").filter(Boolean)[0];
  return rest ? decodeURIComponent(rest) : null;
}

/** The router, or nothing when the component is shown outside the app (such as in a test). */
function useOptionalRouter(): ReturnType<typeof useRouter> | null {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

/**
 * Where the user is inside a module (a Finance section, an Exams tab) as a
 * real address below the module's own page. Because it is an ordinary route,
 * a refresh stays put, links and breadcrumbs navigate to it, and the browser's
 * back and forward buttons just work. Outside a module page it falls back to
 * remembering the place in memory only.
 *
 * @returns {[string | null, (next: string | null) => void]} The open place's slug, and a setter; `null` goes back to the module's own page.
 */
export function useModuleSection(): [string | null, (next: string | null) => void] {
  const base = useContext(ModuleBaseContext);
  const pathname = usePathname();
  const router = useOptionalRouter();
  const [local, setLocal] = useState<string | null>(null);

  const setSection = useCallback(
    (next: string | null) => {
      if (base && router) router.push(next ? `${base}/${next}` : base);
      else setLocal(next);
    },
    [base, router],
  );
  return [base && router ? sectionFromPath(pathname, base) : local, setSection];
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
