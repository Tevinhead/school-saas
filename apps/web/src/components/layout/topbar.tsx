"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { useEffect, useState } from "react";

interface TopbarProps {
  onMenuClick: () => void;
}

function LocaleSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("locale="))
      ?.split("=")[1];
    if (cookie) setLocale(cookie);
  }, []);

  async function switchLocale(next: string) {
    await fetch("/api/i18n/set-locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    setLocale(next);
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-md border text-xs font-medium overflow-hidden">
      <button
        onClick={() => switchLocale("en")}
        className={`px-2.5 py-1 transition-colors ${locale === "en" ? "bg-foreground text-background" : "hover:bg-muted"}`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale("km")}
        className={`px-2.5 py-1 transition-colors ${locale === "km" ? "bg-foreground text-background" : "hover:bg-muted"}`}
      >
        ខ្មែរ
      </button>
    </div>
  );
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
        <LocaleSwitcher />
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
