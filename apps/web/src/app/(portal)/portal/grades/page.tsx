"use client";

import { trpc } from "@/lib/trpc/client";
import { useSelectedChild } from "@/components/portal/selected-child-provider";
import { CardListSkeleton } from "@/components/skeletons/card-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PortalGradesPage() {
  const { selectedStudentId, isLoading: contextLoading } = useSelectedChild();

  const { data: gradeGroups, isLoading } = trpc.portal.getStudentGrades.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  if (contextLoading || isLoading) {
    return <CardListSkeleton />;
  }

  if (!selectedStudentId) {
    return <div className="text-muted-foreground">No student linked to your account.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">View grades grouped by subject</p>
      </div>

      {!gradeGroups || gradeGroups.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No grades available" description="No grades have been published yet." />
      ) : (
        gradeGroups.map((group) => (
          <Card key={group.subjectCode}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {group.subjectName} ({group.subjectCode})
                </CardTitle>
                <span className="text-sm font-medium">
                  Avg: {group.weightedAverage}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.grades.map((g) => (
                    <TableRow key={g.assessmentId}>
                      <TableCell className="font-medium">
                        {g.assessmentName}
                      </TableCell>
                      <TableCell className="capitalize">
                        {g.assessmentType}
                      </TableCell>
                      <TableCell>
                        {g.score ? `${g.score}/${g.maxScore}` : "-"}
                      </TableCell>
                      <TableCell>{g.letterGrade ?? "-"}</TableCell>
                      <TableCell>{g.weight ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
