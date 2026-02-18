"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard } from "../stat-card";
import { ClipboardCheck } from "lucide-react";

export function AttendanceOverview() {
  const { data: stats } = trpc.dashboard.getAdminStats.useQuery();
  const att = stats?.todayAttendance;

  return (
    <StatCard
      icon={<ClipboardCheck className="h-4 w-4" />}
      label="Today's Attendance"
      value={att ? `${att.rate}%` : "N/A"}
      description={
        att
          ? `${att.present} present, ${att.absent} absent, ${att.late} late`
          : "No data"
      }
    />
  );
}
