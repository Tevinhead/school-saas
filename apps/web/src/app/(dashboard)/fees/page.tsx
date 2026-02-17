"use client";

import { trpc } from "@/lib/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeStructuresTab } from "./fee-structures-tab";
import { InvoicesTab } from "./invoices-tab";

export default function FeesPage() {
  const { data: stats } = trpc.fees.getFeeStats.useQuery();

  const statCards = [
    { label: "Total Invoiced", value: stats ? `$${stats.totalInvoiced.toLocaleString()}` : "$0" },
    { label: "Total Collected", value: stats ? `$${stats.totalCollected.toLocaleString()}` : "$0" },
    { label: "Outstanding", value: stats ? `$${stats.totalOutstanding.toLocaleString()}` : "$0" },
    { label: "Overdue", value: stats?.overdueCount?.toString() ?? "0" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground">
          Manage fee structures, invoices, and payments.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="structures" className="mt-4">
          <FeeStructuresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
