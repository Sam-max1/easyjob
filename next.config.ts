import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Extend serverless function timeout for SSE streaming pipelines
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
