import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {},
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
