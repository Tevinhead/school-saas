"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  DollarSign,
  MessageSquare,
  Settings,
  FileText,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users, roles: ["super_admin", "school_admin", "teacher"] },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ["super_admin", "school_admin", "teacher"] },
  { label: "Gradebook", href: "/gradebook", icon: BookOpen, roles: ["super_admin", "school_admin", "teacher"] },
  { label: "Report Cards", href: "/report-cards", icon: FileText, roles: ["super_admin", "school_admin", "teacher"] },
  { label: "Timetable", href: "/timetable", icon: Calendar, roles: ["super_admin", "school_admin", "teacher"] },
  { label: "Fees", href: "/fees", icon: DollarSign, roles: ["super_admin", "school_admin"] },
  { label: "Communications", href: "/communications", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["super_admin", "school_admin"] },
];

interface SidebarProps {
  userRole?: string | null;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="text-lg font-semibold">
          School SaaS
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
