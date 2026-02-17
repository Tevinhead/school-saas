"use client";

// PDF generation placeholder — install @react-pdf/renderer and implement
// when ready for production PDF exports.

import { Button } from "@/components/ui/button";

interface ReportCardPdfProps {
  reportCardId: string;
}

export function ReportCardPdf({ reportCardId: _reportCardId }: ReportCardPdfProps) {
  return (
    <Button variant="outline" disabled>
      Download PDF (coming soon)
    </Button>
  );
}
