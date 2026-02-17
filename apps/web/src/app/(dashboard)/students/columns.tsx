"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table";
import { MoreHorizontal, Eye, Pencil } from "lucide-react";
import Link from "next/link";

export interface StudentRow {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  nationality: string | null;
  status: string;
  enrollmentDate: Date | null;
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  graduated: "outline",
  transferred: "outline",
};

export const columns: ColumnDef<StudentRow>[] = [
  {
    accessorKey: "studentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student #" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.getValue("studentNumber")}</span>
    ),
  },
  {
    id: "name",
    accessorFn: (row) => `${row.lastName}, ${row.firstName}`,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/students/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.lastName}, {row.original.firstName}
      </Link>
    ),
  },
  {
    accessorKey: "nationality",
    header: "Nationality",
    cell: ({ row }) =>
      row.getValue("nationality") ?? (
        <span className="text-muted-foreground">&mdash;</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={statusVariant[status] ?? "secondary"}>{status}</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/students/${student.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
