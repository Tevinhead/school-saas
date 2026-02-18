"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard } from "../stat-card";
import { DollarSign } from "lucide-react";

export function FeeSummary() {
  const { data: stats } = trpc.dashboard.getAdminStats.useQuery();
  const fees = stats?.feeCollection;

  return (
    <StatCard
      icon={<DollarSign className="h-4 w-4" />}
      label="Fee Collection"
      value={fees ? `${fees.rate}%` : "N/A"}
      description={
        fees
          ? `$${Number(fees.collected).toLocaleString()} of $${Number(fees.invoiced).toLocaleString()}`
          : "No data"
      }
    />
  );
}
