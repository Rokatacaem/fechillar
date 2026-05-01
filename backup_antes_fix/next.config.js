/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitar Turbopack temporalmente para evitar errores
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Configuración de Webpack (alternativa a Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Evitar problemas con módulos del servidor en el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  // Optimizaciones
  swcMinify: true,
  
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
