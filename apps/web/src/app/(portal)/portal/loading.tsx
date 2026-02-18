import { StatCardsSkeleton } from "@/components/skeletons/stat-cards-skeleton";

export default function PortalHomeLoading() {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton />
    </div>
  );
}
