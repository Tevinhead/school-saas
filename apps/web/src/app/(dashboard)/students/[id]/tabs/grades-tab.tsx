"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function GradesTab({ studentId }: { studentId: string }) {
  const { data: subjects, isLoading } =
    trpc.gradebook.getStudentGradeSummary.useQuery({ studentId });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading grades...</div>;
  }

  if (!subjects?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No grade records found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {subjects.map((subject) => (
        <Card key={subject.subjectCode}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{subject.subjectName}</CardTitle>
              <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
            </div>
            {subject.weightedAverage !== null && (
              <Badge variant="outline" className="text-lg">
                {subject.weightedAverage}%
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
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
                  {subject.grades.map((g) => (
                    <TableRow key={g.assessmentId}>
                      <TableCell className="font-medium">
                        {g.assessmentName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {g.assessmentType.charAt(0).toUpperCase() +
                            g.assessmentType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {g.score !== null
                          ? `${g.score}${g.maxScore ? ` / ${g.maxScore}` : ""}`
                          : "\u2014"}
                      </TableCell>
                      <TableCell>{g.letterGrade || "\u2014"}</TableCell>
                      <TableCell>
                        {g.weight ? `${g.weight}%` : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
