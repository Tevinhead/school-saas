"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportCardPdfProps {
  reportCardId: string;
}

export function ReportCardPdf({ reportCardId }: ReportCardPdfProps) {
  return (
    <Button variant="outline" asChild>
      <a href={`/api/pdf/report-card/${reportCardId}`} download>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </a>
    </Button>
  );
}
