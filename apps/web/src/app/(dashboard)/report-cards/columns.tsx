"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface ReportCardRow {
  id: string;
  studentFirstName: string;
  studentLastName: string;
  studentNumber: string;
  termName: string;
  status: string;
  updatedAt: Date;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  submitted: "outline",
  approved: "default",
  published: "default",
};

export const reportCardColumns: ColumnDef<ReportCardRow>[] = [
  {
    accessorKey: "studentLastName",
    header: "Student",
    cell: ({ row }) => (
      <Link
        href={`/report-cards/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.studentLastName}, {row.original.studentFirstName}
      </Link>
    ),
  },
  {
    accessorKey: "studentNumber",
    header: "Student #",
  },
  {
    accessorKey: "termName",
    header: "Term",
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
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
  },
];
