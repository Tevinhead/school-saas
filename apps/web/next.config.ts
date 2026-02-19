import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@school-saas/api", "@school-saas/db", "@school-saas/validators"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
