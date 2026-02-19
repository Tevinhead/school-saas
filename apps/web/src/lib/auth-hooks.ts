"use client";

/**
 * Thin shim around @clerk/nextjs hooks.
 * In DEMO_MODE the hooks return hardcoded demo values so Clerk is never called.
 *
 * Usage: import { useAuth } from "@/lib/auth-hooks" instead of "@clerk/nextjs"
 */

import { useAuth as useClerkAuth } from "@clerk/nextjs";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function useAuth() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkAuth = IS_DEMO ? null : useClerkAuth();

  if (IS_DEMO) {
    return {
      userId: "demo_user_admin_001",
      orgId: process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "org_39n7rluabtOAtn1Hvu8d3HM0ThY",
      orgRole: "org:admin",
      isLoaded: true,
      isSignedIn: true,
    };
  }

  return clerkAuth!;
}
