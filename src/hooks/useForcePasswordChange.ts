"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Sends a person whose account was set up for them to choose their own
 * password before they use anything else. The screens that need it call this.
 */
export function useForcePasswordChange(): void {
  const router = useRouter();
  const { user } = useAuth();
  const mustChange = Boolean(user?.mustChangePassword);

  useEffect(() => {
    if (mustChange) router.replace("/change-password");
  }, [mustChange, router]);
}
