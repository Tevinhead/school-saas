"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string | null;
}

export function MobileSidebar({ open, onOpenChange, userRole }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar userRole={userRole} />
      </SheetContent>
    </Sheet>
  );
}
