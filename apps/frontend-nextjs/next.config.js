/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizado para Cloud Run
  output: 'standalone',
  
  // Configurações de performance
  compress: true,
  poweredByHeader: false,
  
  // Configurações de imagem
  images: {
    unoptimized: true // Para compatibilidade com Cloud Run
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig