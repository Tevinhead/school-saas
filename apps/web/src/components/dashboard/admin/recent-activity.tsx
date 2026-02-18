"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentActivity() {
  const { data } = trpc.dashboard.getRecentActivity.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.recentAnnouncements && data.recentAnnouncements.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Announcements</h4>
            <div className="space-y-2">
              {data.recentAnnouncements.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.recentEnrollments && data.recentEnrollments.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Recent Enrollments</h4>
            <div className="space-y-2">
              {data.recentEnrollments.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {e.studentFirstName} {e.studentLastName} &rarr; {e.className}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!data?.recentAnnouncements?.length && !data?.recentEnrollments?.length) && (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}
      </CardContent>
    </Card>
  );
}
