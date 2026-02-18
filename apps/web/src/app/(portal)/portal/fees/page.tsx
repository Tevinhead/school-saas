"use client";

import { trpc } from "@/lib/trpc/client";
import { useSelectedChild } from "@/components/portal/selected-child-provider";
import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  partial: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "secondary",
};

export default function PortalFeesPage() {
  const { selectedStudentId, isLoading: contextLoading } = useSelectedChild();

  const { data: feeStats } = trpc.portal.getStudentFeeStats.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  const { data: feeList, isLoading } = trpc.portal.getStudentFees.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  if (contextLoading || isLoading) {
    return (
      <div className="space-y-6">
        <StatCardsSkeleton />
      </div>
    );
  }

  if (!selectedStudentId) {
    return <div className="text-muted-foreground">No student linked to your account.</div>;
  }

  const statCards = [
    { label: "Total Invoiced", value: `$${Number(feeStats?.totalInvoiced ?? 0).toLocaleString()}` },
    { label: "Total Paid", value: `$${Number(feeStats?.totalCollected ?? 0).toLocaleString()}` },
    { label: "Outstanding", value: `$${Number(feeStats?.outstanding ?? 0).toLocaleString()}` },
    { label: "Overdue", value: feeStats?.overdueCount?.toString() ?? "0" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees</h1>
        <p className="text-muted-foreground">Fee summary and invoice history</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{card.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {!feeList || feeList.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices" description="No invoices have been generated yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeList.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.feeStructureName ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      {inv.currency} {parseFloat(inv.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {inv.currency} {parseFloat(inv.paidAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[inv.status] ?? "secondary"}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
