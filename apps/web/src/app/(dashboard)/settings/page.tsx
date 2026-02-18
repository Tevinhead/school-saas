"use client";

import { trpc } from "@/lib/trpc/client";
import { TenantSettingsForm } from "./tenant-settings-form";
import { FormSkeleton } from "@/components/skeletons/form-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";

export default function SettingsPage() {
  const { data: tenant, isLoading } = trpc.tenant.getCurrent.useQuery();

  if (isLoading) {
    return <FormSkeleton />;
  }

  if (!tenant) {
    return (
      <EmptyState
        icon={Building2}
        title="No organization found"
        description="Please select an organization to manage settings."
      />
    );
  }

  return (
    <TenantSettingsForm
      initialData={{
        name: tenant.name,
        timezone: tenant.timezone,
        defaultLocale: tenant.defaultLocale,
        defaultCurrency: tenant.defaultCurrency,
        academicYearStartMonth: tenant.academicYearStartMonth,
      }}
    />
  );
}
