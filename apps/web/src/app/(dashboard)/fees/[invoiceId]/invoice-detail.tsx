"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordPaymentDialog } from "./record-payment-dialog";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  partial: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "secondary",
};

interface InvoiceDetailProps {
  invoiceId: string;
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { data: invoice, isLoading } = trpc.fees.getInvoiceById.useQuery({ id: invoiceId });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!invoice) {
    return <div className="text-muted-foreground">Invoice not found.</div>;
  }

  const total = parseFloat(invoice.amount);
  const paid = parseFloat(invoice.paidAmount);
  const outstanding = total - paid;
  const progressPercent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {invoice.studentLastName}, {invoice.studentFirstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {invoice.studentNumber} &middot; {invoice.feeStructureName}
          </p>
        </div>
        <Badge variant={statusVariant[invoice.status] ?? "secondary"} className="text-sm">
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </Badge>
      </div>

      {/* Payment progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">
                {invoice.currency} {total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-xl font-bold text-green-600">
                {invoice.currency} {paid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-xl font-bold text-red-600">
                {invoice.currency} {outstanding.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(progressPercent)}% paid &middot; Due{" "}
            {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      {invoice.status !== "paid" && invoice.status !== "cancelled" && (
        <Button onClick={() => setPaymentDialogOpen(true)}>Record Payment</Button>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-muted-foreground">No payments recorded.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.receivedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invoice.currency} {parseFloat(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {p.method.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.referenceNumber ?? (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={invoiceId}
        outstandingAmount={outstanding}
      />
    </div>
  );
}
