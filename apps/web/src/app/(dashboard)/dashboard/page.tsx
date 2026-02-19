import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";

const IS_DEMO = process.env.DEMO_MODE === "true";

export default async function DashboardHomePage() {
  let userRole: string | null = null;

  if (IS_DEMO) {
    userRole = "school_admin";
  } else {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    userRole = session.orgRole
      ? ({
          "org:admin": "school_admin",
          "org:teacher": "teacher",
          "org:student": "student",
          "org:parent": "parent",
        }[session.orgRole] ?? null)
      : null;

    if (userRole === "student" || userRole === "parent") {
      redirect("/portal");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {userRole === "teacher"
            ? "Overview of your classes and tasks"
            : "School overview and analytics"}
        </p>
      </div>

      {userRole === "teacher" ? <TeacherDashboard /> : <AdminDashboard />}
    </div>
  );
}
