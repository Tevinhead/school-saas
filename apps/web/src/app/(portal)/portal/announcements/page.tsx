"use client";

import { trpc } from "@/lib/trpc/client";
import { CardListSkeleton } from "@/components/skeletons/card-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PortalAnnouncementsPage() {
  const { data: announcementList, isLoading } =
    trpc.portal.getAnnouncements.useQuery();

  if (isLoading) {
    return <CardListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Published announcements</p>
      </div>

      {!announcementList || announcementList.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="No announcements have been posted yet." />
      ) : (
        <div className="space-y-4">
          {announcementList.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {a.publishedAt
                      ? new Date(a.publishedAt).toLocaleDateString()
                      : new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  By {a.authorFirstName} {a.authorLastName}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
