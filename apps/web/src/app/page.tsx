import { redirect } from "next/navigation";
import Link from "next/link";

const IS_DEMO = process.env.DEMO_MODE === "true";

export default async function HomePage() {
  // In demo mode: skip auth check and land straight in the dashboard
  if (IS_DEMO) {
    redirect("/dashboard");
  }

  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();

  if (session.userId) {
    const userRole = session.orgRole
      ? ({
          "org:admin": "school_admin",
          "org:teacher": "teacher",
          "org:student": "student",
          "org:parent": "parent",
        }[session.orgRole] ?? null)
      : null;

    if (userRole === "student" || userRole === "parent") {
      redirect("/portal");
    }

    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold tracking-tight">School SaaS</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Modern school management for international schools
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg border border-input px-6 py-3 text-sm font-medium hover:bg-accent"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
