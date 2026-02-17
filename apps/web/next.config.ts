import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@school-saas/api", "@school-saas/db", "@school-saas/validators"],
};

export default nextConfig;
