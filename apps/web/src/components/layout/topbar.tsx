"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <OrganizationSwitcher
          appearance={{
            elements: { rootBox: "flex items-center" },
          }}
        />
        <UserButton />
      </div>
    </header>
  );
}
