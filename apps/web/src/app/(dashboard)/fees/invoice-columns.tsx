"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface InvoiceRow {
  id: string;
  studentFirstName: string;
  studentLastName: string;
  studentNumber: string;
  feeStructureName: string;
  amount: string;
  paidAmount: string;
  currency: string;
  dueDate: Date;
  status: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  partial: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "secondary",
};

export const invoiceColumns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "studentLastName",
    header: "Student",
    cell: ({ row }) => (
      <Link
        href={`/fees/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.studentLastName}, {row.original.studentFirstName}
      </Link>
    ),
  },
  {
    accessorKey: "feeStructureName",
    header: "Fee",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      `${row.original.currency} ${parseFloat(row.original.amount).toLocaleString()}`,
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    cell: ({ row }) =>
      `${row.original.currency} ${parseFloat(row.original.paidAmount).toLocaleString()}`,
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] ?? "secondary"}>
        {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
      </Badge>
    ),
  },
];
