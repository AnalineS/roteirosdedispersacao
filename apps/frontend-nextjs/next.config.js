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
    unoptimized: true // Para compatibilidade com Cloud Run
  },

  // Headers movidos para firebase.json para export mode
}

module.exports = nextConfig