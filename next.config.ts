import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Fuerza la transpilación de librerías con incompatibilidad en React 19
  // react-chartjs-2 usa imports de useRef que no resuelven correctamente en ESM
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