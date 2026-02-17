"use client";

import { useState } from "react";
import Link from "next/link";
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
import { reportCardColumns, type ReportCardRow } from "./columns";
import { Plus } from "lucide-react";

export default function ReportCardsPage() {
  const [termFilter, setTermFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: academicYears } = trpc.tenant.listAcademicYears.useQuery();
  const currentYear = academicYears?.find((y) => y.isCurrent);
  const { data: termsList } = trpc.tenant.listTerms.useQuery(
    { academicYearId: currentYear?.id ?? "" },
    { enabled: !!currentYear }
  );

  const { data: reportCards } = trpc.reportCard.list.useQuery({
    termId: termFilter || undefined,
    status: (statusFilter as "draft" | "submitted" | "approved" | "published") || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
          <p className="text-muted-foreground">
            Create, review, and publish student report cards.
          </p>
        </div>
        <Button asChild>
          <Link href="/report-cards/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Report Cards
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All terms</SelectItem>
              {termsList?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["draft", "submitted", "approved", "published"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={reportCardColumns}
        data={(reportCards as ReportCardRow[]) ?? []}
      />
    </div>
  );
}
