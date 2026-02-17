"use client";

import { useParams } from "next/navigation";
import { InvoiceDetail } from "./invoice-detail";

export default function InvoicePage() {
  const params = useParams<{ invoiceId: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Detail</h1>
        <p className="text-muted-foreground">
          View invoice details and record payments.
        </p>
      </div>
      <InvoiceDetail invoiceId={params.invoiceId} />
    </div>
  );
}
