import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { DataTableSkeleton } from "@/components/skeletons/data-table-skeleton";

export default function GradebookLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <DataTableSkeleton />
    </div>
  );
}
