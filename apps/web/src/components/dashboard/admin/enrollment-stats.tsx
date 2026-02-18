"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard } from "../stat-card";
import { Users } from "lucide-react";

export function EnrollmentStats() {
  const { data: stats } = trpc.dashboard.getAdminStats.useQuery();

  return (
    <StatCard
      icon={<Users className="h-4 w-4" />}
      label="Total Students"
      value={stats?.totalStudents ?? 0}
      description={`${stats?.totalClasses ?? 0} classes`}
    />
  );
}
