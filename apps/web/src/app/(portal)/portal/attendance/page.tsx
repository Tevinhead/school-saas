"use client";

import { trpc } from "@/lib/trpc/client";
import { useSelectedChild } from "@/components/portal/selected-child-provider";
import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  present: "default",
  absent: "destructive",
  late: "outline",
  excused: "secondary",
};

export default function PortalAttendancePage() {
  const { selectedStudentId, isLoading: contextLoading } = useSelectedChild();

  const { data: stats } = trpc.portal.getStudentAttendanceStats.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  const { data: records, isLoading } = trpc.portal.getStudentAttendance.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  if (contextLoading || isLoading) {
    return (
      <div className="space-y-6">
        <StatCardsSkeleton />
      </div>
    );
  }

  if (!selectedStudentId) {
    return <div className="text-muted-foreground">No student linked to your account.</div>;
  }

  const statCards = [
    { label: "Present", value: stats?.present ?? 0 },
    { label: "Absent", value: stats?.absent ?? 0 },
    { label: "Late", value: stats?.late ?? 0 },
    { label: "Excused", value: stats?.excused ?? 0 },
    { label: "Rate", value: `${stats?.presentPercentage ?? 0}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Attendance records and statistics</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{card.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {!records || records.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No attendance records" description="No attendance records available yet." />
          ) : (
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
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[record.status] ?? "secondary"}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.period ?? "-"}</TableCell>
                    <TableCell>{record.notes ?? "-"}</TableCell>
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
