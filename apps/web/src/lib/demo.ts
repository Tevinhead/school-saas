/**
 * Demo mode constants.
 * When DEMO_MODE=true the app bypasses Clerk auth and uses these values.
 */

export const IS_DEMO = process.env.DEMO_MODE === "true";

export const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? "org_39n7rluabtOAtn1Hvu8d3HM0ThY";
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo_user_admin_001";
/** Mapped Clerk role string (org:admin) used by the tRPC middleware */
export const DEMO_CLERK_ROLE = "org:admin";
/** Human-readable role after mapping */
export const DEMO_ROLE = "school_admin";
export const DEMO_USER_NAME = "Demo Admin";
export const DEMO_SCHOOL_NAME = "Raintree International School";
