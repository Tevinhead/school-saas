"use client";

import { PortalNav } from "./portal-nav";
import { ChildSelector } from "./child-selector";
import { DemoUserButton } from "@/components/demo/demo-user-button";
import { useEffect, useState } from "react";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function PortalUserButton() {
  const [UserButton, setUserButton] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    if (!IS_DEMO) {
      import("@clerk/nextjs").then((m) => setUserButton(() => m.UserButton));
    }
  }, []);

  if (IS_DEMO) return <DemoUserButton />;
  if (!UserButton) return null;
  return <UserButton />;
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold">Parent Portal</span>
          <div className="flex items-center gap-4">
            <ChildSelector />
            <PortalUserButton />
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
