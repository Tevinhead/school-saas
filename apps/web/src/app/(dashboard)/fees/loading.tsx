import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";
import { DataTableSkeleton } from "@/components/skeletons/data-table-skeleton";

export default function FeesLoading() {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton />
      <DataTableSkeleton />
    </div>
  );
}
