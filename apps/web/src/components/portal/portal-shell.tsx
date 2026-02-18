"use client";

import { UserButton } from "@clerk/nextjs";
import { PortalNav } from "./portal-nav";
import { ChildSelector } from "./child-selector";

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold">Parent Portal</span>
          <div className="flex items-center gap-4">
            <ChildSelector />
            <UserButton />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-3">
          <PortalNav />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
