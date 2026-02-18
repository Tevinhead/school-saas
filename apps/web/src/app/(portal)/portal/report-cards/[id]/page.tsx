"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "@/components/skeletons/detail-page-skeleton";
import { ArrowLeft } from "lucide-react";

export default function PortalReportCardDetailPage() {
  const params = useParams();
  const reportCardId = params.id as string;

  const { data, isLoading } = trpc.portal.getReportCardDetail.useQuery({
    reportCardId,
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!data) {
    return <div className="text-muted-foreground">Report card not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/report-cards">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Card</h1>
          <p className="text-muted-foreground">
            {data.student?.firstName} {data.student?.lastName} &mdash;{" "}
            {data.term?.name}
          </p>
        </div>
      </div>

      {data.reportCard.comments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(
                data.reportCard.comments as Array<{
                  subjectName: string;
                  comment: string;
                }>
              ).map((c, i) => (
                <div key={i}>
                  <span className="font-medium">{c.subjectName}: </span>
                  <span className="text-sm">{c.comment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grades</CardTitle>
        </CardHeader>
        <CardContent>
          {data.grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No grades recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.grades.map((g, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {g.subjectName} ({g.subjectCode})
                    </TableCell>
                    <TableCell>{g.assessmentName}</TableCell>
                    <TableCell>
                      {g.score ? `${g.score}/${g.maxScore}` : "-"}
                    </TableCell>
                    <TableCell>{g.letterGrade ?? "-"}</TableCell>
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
