"use client";

import { trpc } from "@/lib/trpc/client";
import { TenantSettingsForm } from "./tenant-settings-form";

export default function SettingsPage() {
  const { data: tenant, isLoading } = trpc.tenant.getCurrent.useQuery();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!tenant) {
    return <div className="text-muted-foreground">No tenant found. Please select an organization.</div>;
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
