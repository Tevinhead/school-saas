import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { CardListSkeleton } from "@/components/skeletons/card-list-skeleton";

export default function CommunicationsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardListSkeleton />
    </div>
  );
}
