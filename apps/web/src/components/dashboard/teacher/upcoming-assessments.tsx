"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UpcomingAssessments() {
  const { data: assessmentList } =
    trpc.dashboard.getTeacherUpcomingAssessments.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Assessments</CardTitle>
      </CardHeader>
      <CardContent>
        {!assessmentList || assessmentList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming assessments.</p>
        ) : (
          <div className="space-y-2">
            {assessmentList.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    &mdash; {a.className} / {a.subjectName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {a.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {a.dueDate
                      ? new Date(a.dueDate).toLocaleDateString()
                      : "No date"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
