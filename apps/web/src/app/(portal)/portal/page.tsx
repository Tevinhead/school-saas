"use client";

import { trpc } from "@/lib/trpc/client";
import { useSelectedChild } from "@/components/portal/selected-child-provider";
import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortalHomePage() {
  const { selectedStudentId, isLoading: contextLoading } = useSelectedChild();

  const { data: summary, isLoading } = trpc.portal.getStudentSummary.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  if (contextLoading || isLoading) {
    return <StatCardsSkeleton />;
  }

  if (!selectedStudentId) {
    return <EmptyState icon={User} title="No student linked" description="No student is linked to your account." />;
  }

  const statCards = [
    {
      label: "Attendance Rate",
      value: summary ? `${summary.attendance.rate}%` : "N/A",
      description: summary
        ? `${summary.attendance.present} present of ${summary.attendance.total} total`
        : "",
    },
    {
      label: "Recent Grades",
      value: summary?.recentGrades.length.toString() ?? "0",
      description: "Latest assessments",
    },
    {
      label: "Outstanding Fees",
      value: summary ? `$${Number(summary.fees.outstanding).toLocaleString()}` : "$0",
      description: summary
        ? `$${Number(summary.fees.totalPaid).toLocaleString()} paid`
        : "",
    },
    {
      label: "Announcements",
      value: summary?.announcementCount.toString() ?? "0",
      description: "Published announcements",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your student&apos;s progress</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{card.value}</span>
              {card.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
