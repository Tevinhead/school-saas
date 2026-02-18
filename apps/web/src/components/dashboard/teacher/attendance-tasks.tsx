"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AttendanceTasks() {
  const { data: tasks } = trpc.dashboard.getTeacherAttendanceTasks.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {!tasks || tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No class sections assigned.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">{t.className}</span>
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    &mdash; {t.subjectName}
                  </span>
                </div>
                {t.isMarked ? (
                  <Badge variant="default">Marked</Badge>
                ) : (
                  <Link href="/attendance">
                    <Badge variant="secondary">Mark Now</Badge>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
