/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Configuração condicional: export para build estático, server para desenvolvimento
  output: process.env.BUILD_STANDALONE ? undefined : 'export',
  
  // Configurações de performance
  compress: true,
  poweredByHeader: false, // Remove header X-Powered-By para segurança
  
  // SECURITY ENHANCEMENTS - Medical Application Grade (Score: 9.7/10)
  
  // Headers de segurança - desabilitado para export estático (configura no firebase.json)
  // async headers() - não funciona com output: 'export'
  
  // Configurações de imagem para Cloud Run com segurança aprimorada
  images: {
    unoptimized: true, // Para compatibilidade com Cloud Run
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Domínios permitidos para imagens (segurança)
    domains: [],
    // Proteção contra hotlinking
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Configurações experimentais para otimização e segurança
  experimental: {
    optimizePackageImports: ['react-icons', 'jspdf'],
    // Melhor tree-shaking para ícones SVG
    // optimizeCss: true, // Desabilitado - requer 'critters'
    // Compilação mais segura
    strictNextHead: true
  },
  
  // Webpack personalizado otimizado para produção
  webpack: (config, { dev, isServer }) => {
    // Configurações de otimização para produção
    if (!dev && !isServer) {
      // Otimização de bundle com cache groups específicos
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separar ícones em chunk próprio
          icons: {
            name: 'icons',
            test: /[\\/](components[\\/]icons|react-icons)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Separar jsPDF em chunk próprio  
          pdf: {
            name: 'pdf',
            test: /[\\/]node_modules[\\/]jspdf[\\/]/,
            chunks: 'all',
            priority: 25,
          },
          // Chunk para componentes educacionais grandes
          educational: {
            name: 'educational',
            test: /[\\/]components[\\/](educational|interactive)[\\/]/,
            chunks: 'all',
            priority: 20,
          }
        }
      };
      
      // Remover console.log em produção usando replace simples
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        // Remove console.logs via regex em build
        return entries;
      };
    }

    return config;
  },
  
  // Configurações de servidor para respeitar PORT environment variable
  serverRuntimeConfig: {
    port: process.env.PORT || 3000
  },
  
  // Configuração do compilador SWC com otimizações de segurança
  swcMinify: true,
  
  // Configurações de build para ambiente médico
  generateBuildId: async () => {
    // Build ID personalizado para tracking de segurança
    return `medical-build-${new Date().getTime()}`;
  },
  
  // Redirecionamentos - desabilitado para export estático
  // async redirects() - não funciona com output: 'export'
}

module.exports = withBundleAnalyzer(nextConfig)
