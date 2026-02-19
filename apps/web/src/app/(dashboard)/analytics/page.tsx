"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-64 rounded bg-muted" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("enrollment");

  const csvMutation = trpc.analytics.exportCsv.useMutation({
    onSuccess: (data, variables) => {
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${variables.type}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Advanced reporting and data insights for your school.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        {/* Enrollment Tab */}
        <TabsContent value="enrollment" className="space-y-4">
          <EnrollmentTab />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => csvMutation.mutate({ type: "enrollment" })}
              disabled={csvMutation.isPending}
            >
              {csvMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceTab />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => csvMutation.mutate({ type: "attendance" })}
              disabled={csvMutation.isPending}
            >
              {csvMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <GradesTab />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => csvMutation.mutate({ type: "grades" })}
              disabled={csvMutation.isPending}
            >
              {csvMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <FeesTab />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => csvMutation.mutate({ type: "fees" })}
              disabled={csvMutation.isPending}
            >
              {csvMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EnrollmentTab() {
  const { data, isLoading } = trpc.analytics.enrollmentTrends.useQuery();

  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.length === 0)
    return <EmptyState message="No enrollment data available." />;

  const totalStudents = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Total Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalStudents}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment by Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gradeLevel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AttendanceTab() {
  const { data, isLoading } = trpc.analytics.attendanceTrends.useQuery();

  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState message="No attendance data available." />;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Attendance Rate (%)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.weeklyRates.length === 0 ? (
            <EmptyState message="No weekly attendance data." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#2563eb"
                    fill="#93c5fd"
                    name="Attendance %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {data.chronicAbsent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chronically Absent Students (&lt;80%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Student</th>
                    <th className="py-2 text-right font-medium">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.chronicAbsent.map((s) => (
                    <tr key={s.studentId} className="border-b">
                      <td className="py-2">{s.studentName}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            s.rate < 60 ? "text-red-600 font-medium" : ""
                          }
                        >
                          {s.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function GradesTab() {
  const { data, isLoading } = trpc.analytics.gradeDistribution.useQuery();

  if (isLoading) return <LoadingSkeleton />;
  if (!data || data.distribution.length === 0)
    return <EmptyState message="No grade data available." />;

  // Sort by grade order
  const order = ["A", "B", "C", "D", "F"];
  const sorted = [...data.distribution].sort(
    (a, b) => order.indexOf(a.range) - order.indexOf(b.range)
  );

  const colors: Record<string, string> = {
    A: "#22c55e",
    B: "#3b82f6",
    C: "#eab308",
    D: "#f97316",
    F: "#ef4444",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Students">
                {sorted.map((entry, index) => (
                  <rect
                    key={index}
                    fill={colors[entry.range] ?? "#6b7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function FeesTab() {
  const { data, isLoading } = trpc.analytics.feeAging.useQuery();

  if (isLoading) return <LoadingSkeleton />;
  if (!data) return <EmptyState message="No fee data available." />;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Collection Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.collectionRate}%</p>
          <p className="text-sm text-muted-foreground">
            of total invoiced amount collected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Invoices by Aging</CardTitle>
        </CardHeader>
        <CardContent>
          {data.buckets.length === 0 ? (
            <EmptyState message="No overdue invoices." />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.buckets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" label={{ value: "Days Overdue", position: "bottom" }} />
                  <YAxis />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={((value: number, name: string) => name === "totalAmount" ? [`$${value}`, "Total Amount"] : [`${value}`, "Count"]) as any} />
                  <Legend />
                  <Bar dataKey="count" fill="#ef4444" name="Invoices" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
