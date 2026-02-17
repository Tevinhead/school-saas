"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DailySummaryProps {
  date: Date;
}

export function DailySummary({ date }: DailySummaryProps) {
  const { data: summary, isLoading } = trpc.attendance.dailySummary.useQuery({ date });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading summary...</div>;
  }

  const stats = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const row of summary ?? []) {
    const key = row.status as keyof typeof stats;
    if (key in stats) {
      stats[key] = Number(row.count);
    }
  }
  const total = stats.present + stats.absent + stats.late + stats.excused;

  const cards = [
    { label: "Present", value: stats.present, variant: "default" as const, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    { label: "Absent", value: stats.absent, variant: "destructive" as const, className: "" },
    { label: "Late", value: stats.late, variant: "default" as const, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    { label: "Excused", value: stats.excused, variant: "default" as const, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{card.value}</span>
              <Badge variant={card.variant} className={card.className}>
                {total > 0 ? Math.round((card.value / total) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
