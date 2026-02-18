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
import { MoreHorizontal } from "lucide-react";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  authorId: string;
  audience: string;
  audienceTargetId: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  authorFirstName: string | null;
  authorLastName: string | null;
}

const audienceVariant: Record<string, "default" | "secondary" | "outline"> = {
  all: "default",
  teachers: "secondary",
  parents: "outline",
  specific_class: "secondary",
};

export function createAnnouncementColumns(handlers: {
  onEdit: (row: AnnouncementRow) => void;
  onDelete: (id: string) => void;
}): ColumnDef<AnnouncementRow>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: "author",
      header: "Author",
      cell: ({ row }) =>
        row.original.authorFirstName
          ? `${row.original.authorFirstName} ${row.original.authorLastName}`
          : "Unknown",
    },
    {
      accessorKey: "audience",
      header: "Audience",
      cell: ({ row }) => (
        <Badge variant={audienceVariant[row.original.audience] ?? "secondary"}>
          {row.original.audience === "specific_class"
            ? "Class"
            : row.original.audience.charAt(0).toUpperCase() + row.original.audience.slice(1)}
        </Badge>
      ),
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
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlers.onEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handlers.onDelete(row.original.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
