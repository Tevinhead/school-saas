"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/portal", label: "Home" },
  { href: "/portal/grades", label: "Grades" },
  { href: "/portal/attendance", label: "Attendance" },
  { href: "/portal/fees", label: "Fees" },
  { href: "/portal/timetable", label: "Timetable" },
  { href: "/portal/announcements", label: "Announcements" },
  { href: "/portal/report-cards", label: "Report Cards" },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {navLinks.map((link) => {
        const isActive =
          link.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
