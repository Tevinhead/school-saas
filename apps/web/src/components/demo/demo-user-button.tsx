"use client";

import { User } from "lucide-react";

/**
 * Replacement for <UserButton /> and <OrganizationSwitcher /> in demo mode.
 * Shows a fake avatar + school name — no Clerk UI.
 */
export function DemoUserButton() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold">
        DA
      </div>
      <span className="hidden sm:inline">Demo Admin</span>
    </div>
  );
}

export function DemoOrgBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground">
      <User className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="hidden sm:inline">Raintree International School</span>
    </div>
  );
}
