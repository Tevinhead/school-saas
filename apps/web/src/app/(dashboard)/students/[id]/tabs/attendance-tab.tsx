"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
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

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  absent: "",
  late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  excused: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export function AttendanceTab({ studentId }: { studentId: string }) {
  const { data: records, isLoading: loadingRecords } =
    trpc.attendance.getByStudent.useQuery({ studentId });
  const { data: stats, isLoading: loadingStats } =
    trpc.attendance.getStudentStats.useQuery({ studentId });

  if (loadingRecords || loadingStats) {
    return <StatCardsSkeleton />;
  }

  const summaryCards = [
    { label: "Present", value: stats?.present ?? 0, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    { label: "Absent", value: stats?.absent ?? 0, variant: "destructive" as const, className: "" },
    { label: "Late", value: stats?.late ?? 0, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    { label: "Excused", value: stats?.excused ?? 0, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{card.value}</span>
                <Badge
                  variant={card.variant ?? "default"}
                  className={card.className}
                >
                  {(stats?.total ?? 0) > 0
                    ? Math.round((card.value / stats!.total) * 100)
                    : 0}
                  %
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Overall Attendance: {stats.presentPercentage}%
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {records?.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No attendance records" description="No attendance records have been recorded yet." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={record.status === "absent" ? "destructive" : "default"}
                      className={statusColors[record.status] ?? ""}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.period ?? <span className="text-muted-foreground">&mdash;</span>}
                  </TableCell>
                  <TableCell>
                    {record.notes ?? <span className="text-muted-foreground">&mdash;</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
