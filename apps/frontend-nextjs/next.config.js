/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizado para Firebase Hosting
  output: 'export',
  trailingSlash: true,
  
  // Configurações de performance
  compress: true,
  poweredByHeader: false,
  
  // Configurações de imagem
  images: {
    unoptimized: true, // Para compatibilidade com Cloud Run
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Headers movidos para firebase.json para export mode
  // Mas mantemos configurações básicas aqui
  experimental: {
    optimizePackageImports: ['react-icons', 'jspdf']
  },

  // Headers de segurança configurados no firebase.json para produção
}

module.exports = nextConfig