import { TRPCProvider } from "@/lib/trpc/provider";
import { SelectedChildProvider } from "@/components/portal/selected-child-provider";
import { PortalShell } from "@/components/portal/portal-shell";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <SelectedChildProvider>
        <PortalShell>{children}</PortalShell>
      </SelectedChildProvider>
    </TRPCProvider>
  );
}
