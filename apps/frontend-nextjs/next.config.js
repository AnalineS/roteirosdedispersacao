/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurado para Cloud Run com standalone output
  output: 'standalone',
  
  // Configurações de performance
  compress: true,
  poweredByHeader: false,
  
  // Configurações de imagem para Cloud Run
  images: {
    unoptimized: true, // Para compatibilidade com Cloud Run
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Configurações experimentais para otimização
  experimental: {
    optimizePackageImports: ['react-icons', 'jspdf']
  },
  
  // Configurações de servidor para respeitar PORT environment variable
  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  }
}

module.exports = nextConfig
