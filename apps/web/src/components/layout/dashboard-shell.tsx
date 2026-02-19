"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileSidebar } from "./mobile-sidebar";
import { DemoBanner } from "@/components/demo/demo-banner";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface DashboardShellProps {
  userRole?: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ userRole, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {IS_DEMO && <DemoBanner />}
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-sidebar-background lg:block">
          <Sidebar userRole={userRole} />
        </aside>
        <MobileSidebar
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          userRole={userRole}
        />
        <div className="flex flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
