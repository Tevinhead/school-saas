"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "@/components/ui/error-display";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Something went wrong"
      message={error.message || "An unexpected error occurred."}
      retry={reset}
    />
  );
}
