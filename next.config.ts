import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // @react-pdf/renderer usa canvas y APIs de Node — no bundlear para el cliente
  serverExternalPackages: ['@react-pdf/renderer'],
  transpilePackages: ["react-chartjs-2", "chart.js"],
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;