import { TRPCProvider } from "@/lib/trpc/provider";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </TRPCProvider>
  );
}
