"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function CompletionStep() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
      <h2 className="mb-2 text-xl font-semibold">You&apos;re all set!</h2>
      <p className="mb-6 text-muted-foreground">
        Your school is configured and ready to use. You can always adjust
        these settings later from the Settings page.
      </p>
      <Button asChild size="lg">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
