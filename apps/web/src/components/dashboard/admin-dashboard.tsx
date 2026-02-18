"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard } from "./stat-card";
import { RecentActivity } from "./admin/recent-activity";
import { AttendanceTrendChart } from "@/components/charts/attendance-trend-chart";
import { GradeDistributionChart } from "@/components/charts/grade-distribution-chart";
import { FeeCollectionChart } from "@/components/charts/fee-collection-chart";
import { Users, GraduationCap, DollarSign, ClipboardCheck } from "lucide-react";

export function AdminDashboard() {
  const { data: stats } = trpc.dashboard.getAdminStats.useQuery();
  const { data: attendanceTrend } =
    trpc.dashboard.getAttendanceTrendAdmin.useQuery();
  const { data: gradeDistribution } =
    trpc.dashboard.getGradeDistribution.useQuery();
  const { data: feeCollectionTrend } =
    trpc.dashboard.getFeeCollectionTrend.useQuery();

  const att = stats?.todayAttendance;
  const fees = stats?.feeCollection;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          description={`${stats?.totalClasses ?? 0} classes`}
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Total Teachers"
          value={stats?.totalTeachers ?? 0}
        />
        <StatCard
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Today's Attendance"
          value={att ? `${att.rate}%` : "N/A"}
          description={
            att
              ? `${att.present} present, ${att.absent} absent`
              : "No data"
          }
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Fee Collection"
          value={fees ? `${fees.rate}%` : "N/A"}
          description={
            fees
              ? `$${Number(fees.collected).toLocaleString()} collected`
              : "No data"
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceTrendChart data={attendanceTrend ?? []} />
        <FeeCollectionChart data={feeCollectionTrend ?? []} />
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GradeDistributionChart data={gradeDistribution ?? []} />
        <RecentActivity />
      </div>
    </div>
  );
}
