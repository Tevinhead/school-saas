"use client";

import { useParams } from "next/navigation";
import { ReportCardDetail } from "./report-card-detail";

export default function ReportCardPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Card</h1>
        <p className="text-muted-foreground">
          View and manage this report card.
        </p>
      </div>
      <ReportCardDetail reportCardId={params.id} />
    </div>
  );
}
