import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Configuración de Webpack para estabilidad en entornos con latencia de red
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      // Hemos eliminado la modificación manual de entries que causaba
      // el error "app/layout depends on main-app".
    }
    return config;
  },
};

export default nextConfig;