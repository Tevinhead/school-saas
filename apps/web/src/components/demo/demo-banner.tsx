"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-white text-sm font-medium">
      <Zap className="h-4 w-4 flex-shrink-0" />
      <span>
        <strong>Demo Mode</strong> — You&apos;re logged in as{" "}
        <strong>Demo Admin</strong> at{" "}
        <strong>Raintree International School</strong>. All data is sample data.
        Explore freely!
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto flex-shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
