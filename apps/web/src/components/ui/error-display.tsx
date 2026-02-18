"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
}: ErrorDisplayProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="mb-1 text-lg font-medium">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
