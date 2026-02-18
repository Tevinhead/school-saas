"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useSelectedChild } from "@/components/portal/selected-child-provider";
import { DataTableSkeleton } from "@/components/skeletons/data-table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PortalReportCardsPage() {
  const { selectedStudentId, isLoading: contextLoading } = useSelectedChild();

  const { data: reportCardList, isLoading } =
    trpc.portal.getStudentReportCards.useQuery(
      { studentId: selectedStudentId! },
      { enabled: !!selectedStudentId }
    );

  if (contextLoading || isLoading) {
    return <DataTableSkeleton rows={4} />;
  }

  if (!selectedStudentId) {
    return <div className="text-muted-foreground">No student linked to your account.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground">Published report cards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {!reportCardList || reportCardList.length === 0 ? (
            <EmptyState icon={FileText} title="No report cards" description="No published report cards available yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCardList.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell className="font-medium">{rc.termName}</TableCell>
                    <TableCell>
                      {new Date(rc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/portal/report-cards/${rc.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View Details
                      </Link>
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
