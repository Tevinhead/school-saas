import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/students");
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
