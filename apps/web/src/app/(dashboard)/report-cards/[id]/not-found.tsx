import { EmptyState } from "@/components/ui/empty-state";
import { FileX } from "lucide-react";

export default function ReportCardNotFound() {
  return (
    <EmptyState
      icon={FileX}
      title="Report card not found"
      description="The report card you're looking for doesn't exist or has been removed."
      action={{ label: "Back to Report Cards", href: "/report-cards" }}
    />
  );
}
