import { EmptyState } from "@/components/ui/empty-state";
import { UserX } from "lucide-react";

export default function StudentNotFound() {
  return (
    <EmptyState
      icon={UserX}
      title="Student not found"
      description="The student you're looking for doesn't exist or has been removed."
      action={{ label: "Back to Students", href: "/students" }}
    />
  );
}
