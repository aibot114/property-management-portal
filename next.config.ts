import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      { source: '/history', destination: '/reports', permanent: true },
    ]
  },
};

export default nextConfig;
