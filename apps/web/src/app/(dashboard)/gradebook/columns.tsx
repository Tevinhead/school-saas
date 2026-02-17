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
import { MoreHorizontal, Pencil, Trash2, ClipboardList } from "lucide-react";

export interface AssessmentRow {
  id: string;
  name: string;
  type: string;
  maxScore: string | null;
  weight: string | null;
  dueDate: Date | null;
  isPublished: boolean;
}

export function getAssessmentColumns(opts: {
  onEdit: (row: AssessmentRow) => void;
  onDelete: (id: string) => void;
  onGrade: (id: string) => void;
}): ColumnDef<AssessmentRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.type.charAt(0).toUpperCase() + row.original.type.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "maxScore",
      header: "Max Score",
      cell: ({ row }) => row.original.maxScore ?? "\u2014",
    },
    {
      accessorKey: "weight",
      header: "Weight",
      cell: ({ row }) => (row.original.weight ? `${row.original.weight}%` : "\u2014"),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) =>
        row.original.dueDate
          ? new Date(row.original.dueDate).toLocaleDateString()
          : "\u2014",
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? "default" : "secondary"}>
          {row.original.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => opts.onGrade(row.original.id)}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Enter Grades
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => opts.onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => opts.onDelete(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
