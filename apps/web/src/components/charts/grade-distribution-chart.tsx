"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GradeDistributionData {
  range: string;
  count: number;
}

interface GradeDistributionChartProps {
  data: GradeDistributionData[];
}

export function GradeDistributionChart({ data }: GradeDistributionChartProps) {
  // Sort ranges in order
  const order = ["90-100", "80-89", "70-79", "60-69", "Below 60"];
  const sortedData = [...data].sort(
    (a, b) => order.indexOf(a.range) - order.indexOf(b.range)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grade Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(221, 83%, 53%)" name="Students" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
