import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";
import { DataTableSkeleton } from "@/components/skeletons/data-table-skeleton";

export default function PortalAttendanceLoading() {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton />
      <DataTableSkeleton rows={5} />
    </div>
  );
}
