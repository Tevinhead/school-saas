import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const IS_DEMO = process.env.DEMO_MODE === "true";

// Conditionally import ClerkProvider — in demo mode we skip it entirely
// so the build doesn't require valid Clerk keys.
async function AuthProvider({ children }: { children: React.ReactNode }) {
  if (IS_DEMO) return <>{children}</>;
  const { ClerkProvider } = await import("@clerk/nextjs");
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}

export const metadata: Metadata = {
  title: "School SaaS — Demo",
  description: "Modern school management for international schools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </AuthProvider>
  );
}
