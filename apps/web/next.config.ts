import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  transpilePackages: ["@school-saas/api", "@school-saas/db", "@school-saas/validators"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default withBundleAnalyzer(nextConfig);
