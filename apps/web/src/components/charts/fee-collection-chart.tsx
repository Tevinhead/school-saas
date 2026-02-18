"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeeCollectionData {
  month: string;
  invoiced: number;
  collected: number;
}

interface FeeCollectionChartProps {
  data: FeeCollectionData[];
}

export function FeeCollectionChart({ data }: FeeCollectionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fee Collection Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="invoiced" fill="hsl(221, 83%, 53%)" name="Invoiced" />
            <Bar
              dataKey="collected"
              fill="hsl(142, 76%, 36%)"
              name="Collected"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
