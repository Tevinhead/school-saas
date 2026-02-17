"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { invoiceColumns, type InvoiceRow } from "./invoice-columns";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { BulkInvoiceDialog } from "./bulk-invoice-dialog";
import { Plus, Users } from "lucide-react";

export function InvoicesTab() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: invoiceList } = trpc.fees.listInvoices.useQuery({
    status: (statusFilter as "pending" | "partial" | "paid" | "overdue" | "cancelled") || undefined,
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["pending", "partial", "paid", "overdue", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Bulk Create
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <DataTable
        columns={invoiceColumns}
        data={(invoiceList as InvoiceRow[]) ?? []}
      />

      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <BulkInvoiceDialog open={bulkOpen} onOpenChange={setBulkOpen} />
    </>
  );
}
