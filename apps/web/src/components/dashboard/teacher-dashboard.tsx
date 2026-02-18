"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard } from "./stat-card";
import { MyClasses } from "./teacher/my-classes";
import { AttendanceTasks } from "./teacher/attendance-tasks";
import { UpcomingAssessments } from "./teacher/upcoming-assessments";
import { BookOpen, ClipboardCheck, FileText } from "lucide-react";

export function TeacherDashboard() {
  const { data: classList } = trpc.dashboard.getTeacherClasses.useQuery();
  const { data: tasks } = trpc.dashboard.getTeacherAttendanceTasks.useQuery();
  const { data: assessmentList } =
    trpc.dashboard.getTeacherUpcomingAssessments.useQuery();

  const unmarkedCount =
    tasks?.filter((t) => !t.isMarked).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="My Classes"
          value={classList?.length ?? 0}
        />
        <StatCard
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Attendance Today"
          value={
            tasks
              ? `${tasks.filter((t) => t.isMarked).length}/${tasks.length}`
              : "N/A"
          }
          description={
            unmarkedCount > 0
              ? `${unmarkedCount} section${unmarkedCount !== 1 ? "s" : ""} pending`
              : "All marked"
          }
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Upcoming Assessments"
          value={assessmentList?.length ?? 0}
        />
      </div>

      {/* Content */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MyClasses />
        <div className="space-y-4">
          <AttendanceTasks />
          <UpcomingAssessments />
        </div>
      </div>
    </div>
  );
}
