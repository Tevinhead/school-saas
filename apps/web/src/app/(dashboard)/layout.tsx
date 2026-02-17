import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TRPCProvider } from "@/lib/trpc/provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userRole = session.orgRole
    ? ({
        "org:admin": "school_admin",
        "org:teacher": "teacher",
        "org:student": "student",
        "org:parent": "parent",
      }[session.orgRole] ?? null)
    : null;

  return (
    <TRPCProvider>
      <DashboardShell userRole={userRole}>{children}</DashboardShell>
    </TRPCProvider>
  );
}
