import { EmptyState } from "@/components/ui/empty-state";
import { FileX } from "lucide-react";

export default function InvoiceNotFound() {
  return (
    <EmptyState
      icon={FileX}
      title="Invoice not found"
      description="The invoice you're looking for doesn't exist or has been removed."
      action={{ label: "Back to Fees", href: "/fees" }}
    />
  );
}
