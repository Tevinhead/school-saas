import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@school-saas/db";
import { tenants } from "@school-saas/db/schema";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TRPCProvider } from "@/lib/trpc/provider";

const IS_DEMO = process.env.DEMO_MODE === "true";
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? "org_39n7rluabtOAtn1Hvu8d3HM0ThY";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userRole: string | null = null;

  if (IS_DEMO) {
    userRole = "school_admin";
  } else {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    userRole = session.orgRole
      ? ({
          "org:admin": "school_admin",
          "org:teacher": "teacher",
          "org:student": "student",
          "org:parent": "parent",
        }[session.orgRole] ?? null)
      : null;

    // Check if tenant exists — redirect admins to onboarding if not
    if (session.orgId && (userRole === "school_admin" || session.orgRole === "org:admin")) {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.orgId),
      });
      if (!tenant) {
        redirect("/onboarding");
      }
    }
  }

  return (
    <TRPCProvider>
      <DashboardShell userRole={userRole}>{children}</DashboardShell>
    </TRPCProvider>
  );
}
