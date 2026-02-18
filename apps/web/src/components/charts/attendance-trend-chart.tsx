"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceTrendData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendData[];
  title?: string;
}

export function AttendanceTrendChart({
  data,
  title = "Attendance Trend",
}: AttendanceTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="present"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              name="Present"
            />
            <Line
              type="monotone"
              dataKey="absent"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              name="Absent"
            />
            <Line
              type="monotone"
              dataKey="late"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              name="Late"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
