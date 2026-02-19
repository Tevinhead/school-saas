"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  "all",
  "inquiry",
  "applied",
  "interviewed",
  "accepted",
  "enrolled",
  "rejected",
  "waitlisted",
] as const;

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-gray-100 text-gray-800",
  applied: "bg-blue-100 text-blue-800",
  interviewed: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  enrolled: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-red-800",
  waitlisted: "bg-orange-100 text-orange-800",
};

const FUNNEL_COLORS: Record<string, string> = {
  inquiry: "bg-gray-500",
  applied: "bg-blue-500",
  interviewed: "bg-yellow-500",
  accepted: "bg-green-500",
  enrolled: "bg-teal-500",
  rejected: "bg-red-500",
  waitlisted: "bg-orange-500",
};

export default function AdmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: funnel } = trpc.admissions.getPipelineFunnel.useQuery();
  const { data: applicationsData } = trpc.admissions.listApplications.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    pageSize: 20,
  });
  const { data: waitlist } = trpc.admissions.getWaitlist.useQuery();

  const totalApplications = funnel?.reduce((sum, f) => sum + Number(f.count), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admissions</h1>
          <p className="text-muted-foreground">
            Manage applications, interviews, and waitlists.
          </p>
        </div>
        <Button asChild>
          <Link href="/apply/org">New Application</Link>
        </Button>
      </div>

      {/* Pipeline Funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {["inquiry", "applied", "interviewed", "accepted", "enrolled", "rejected", "waitlisted"].map(
          (status) => {
            const item = funnel?.find((f) => f.status === status);
            const cnt = item ? Number(item.count) : 0;
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
                <CardHeader className="pb-1 pt-3 px-3">
                  <div className={`w-2 h-2 rounded-full ${FUNNEL_COLORS[status]} inline-block mr-1`} />
                  <CardTitle className="text-xs font-medium text-muted-foreground capitalize inline">
                    {status}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <span className="text-2xl font-bold">{cnt}</span>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4 space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {applicationsData?.total ?? 0} application{(applicationsData?.total ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Applications Table */}
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Student Name</th>
                  <th className="text-left p-3 font-medium">Guardian</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Applied</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicationsData?.items.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      {app.studentFirstName} {app.studentLastName}
                    </td>
                    <td className="p-3">
                      <div>{app.guardianName}</div>
                      <div className="text-xs text-muted-foreground">{app.guardianEmail}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] ?? "bg-gray-100"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admissions/${app.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!applicationsData?.items || applicationsData.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {applicationsData && applicationsData.total > 20 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(applicationsData.total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(applicationsData.total / 20)}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Rank</th>
                  <th className="text-left p-3 font-medium">Student Name</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Offered</th>
                  <th className="text-left p-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {waitlist?.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono">{entry.rank}</td>
                    <td className="p-3">
                      <Link href={`/admissions/${entry.applicationId}`} className="text-blue-600 hover:underline">
                        {entry.studentFirstName} {entry.studentLastName}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.applicationStatus] ?? "bg-gray-100"}`}>
                        {entry.applicationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {entry.offeredAt ? new Date(entry.offeredAt).toLocaleDateString() : "Not yet"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
                {(!waitlist || waitlist.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No waitlist entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
