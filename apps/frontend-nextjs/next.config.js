/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  // Arquitetura dinâmica para maximizar potencial do projeto
  // Dynamic rendering para features em tempo real (leaderboard, chat AI, analytics)
  // output: 'export', // Removido para habilitar SSR e funcionalidades dinâmicas

  // Standalone output para Cloud Run
  output: "standalone",
  // Ensure trailingSlash is consistent with Firebase Hosting configuration
  trailingSlash: false,

  // INCREMENTAL BUILD OPTIMIZATIONS

  // SWC minification is now default in Next.js 15

  // Enable compiler optimizations
  compiler: {
    // Remove logging statements in production builds
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Variáveis de ambiente para Cloud Run deployment
  env: {
    // Backend API URL configurado via Cloud Run
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },

  // Configurações de performance
  compress: true,
  poweredByHeader: false, // Remove header X-Powered-By para segurança

  // File tracing configuration moved to experimental.outputFileTracingRoot

  // SECURITY ENHANCEMENTS - Medical Application Grade (Score: 9.7/10)

  // Headers de segurança - desabilitado para export estático (configura no firebase.json)
  // async headers() - não funciona com output: 'export'

  // Configurações de imagem para Cloud Run
  images: {
    unoptimized: false, // Otimização habilitada para Cloud Run
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 80, 96, 120, 128, 160, 256, 384], // Adicionado tamanhos para avatares
    // Domínios permitidos para imagens (segurança)
    domains: [],
    // Proteção contra hotlinking
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
  },

  // Fix workspace root warning - point to the actual workspace root
  // TESTE DIAGNÓSTICO: Comentado temporariamente para verificar se resolve problema do server.js
  // outputFileTracingRoot: require("path").join(__dirname, "../../"),

  // Configurações experimentais para otimização e segurança
  experimental: {
    optimizePackageImports: ["react-icons", "jspdf", "lucide-react"],
    // Melhor tree-shaking para ícones SVG
    // React Compiler configuration
    reactCompiler: {
      compilationMode: "annotation",
    },
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: [],
  // ESLint configuração para build
  eslint: {
    // IMPORTANTE: Só ignorar warnings em build, não em desenvolvimento
    ignoreDuringBuilds: process.env.NODE_ENV === "production",
  },

  // BUILD CACHE OPTIMIZATION

  // Enable build caching for faster incremental builds
  // Automatically handled by Next.js 14+

  // Webpack personalizado otimizado para produção e builds incrementais
  webpack: (config, { dev, isServer, buildId }) => {
    // Build cache optimization
    if (!dev) {
      // Enable persistent cache for faster rebuilds with timeout protection
      const path = require("path");
      config.cache = {
        type: "filesystem",
        cacheDirectory: path.resolve(__dirname, "./.next/cache/webpack"),
        buildDependencies: {
          config: [__filename],
        },
        maxMemoryGenerations: 1, // Prevent memory issues
        memoryCacheUnaffected: true,
        idleTimeout: 60000, // 1 minute idle timeout
        idleTimeoutForInitialStore: 0,
      };
    }

    // Configurações de otimização para produção
    if (!dev && !isServer) {
      // Otimização de bundle com cache groups específicos
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separar ícones em chunk próprio
          icons: {
            name: "icons",
            test: /[\\/](components[\\/]icons|react-icons)[\\/]/,
            chunks: "all",
            priority: 30,
          },
          // Separar jsPDF em chunk próprio
          pdf: {
            name: "pdf",
            test: /[\\/]node_modules[\\/]jspdf[\\/]/,
            chunks: "all",
            priority: 25,
          },
          // Chunk para componentes educacionais grandes
          educational: {
            name: "educational",
            test: /[\\/]components[\\/](educational|interactive)[\\/]/,
            chunks: "all",
            priority: 20,
          },
          // Chunk para data/static content
          data: {
            name: "data",
            test: /[\\/]data[\\/]/,
            chunks: "all",
            priority: 15,
          },
        },
      };

      // Enable module concatenation for better tree shaking
      config.optimization.concatenateModules = true;

      // Build performance optimizations
      config.optimization.runtimeChunk = "single";

      // Improve build performance with parallel processing
      const TerserPlugin = require("terser-webpack-plugin");
      config.optimization.minimizer.push(
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          },
        }),
      );
    }

    return config;
  },

  // Configurações de servidor são automáticas com output: "standalone"
  // O server.js gerado respeitará a variável PORT automaticamente

  // SWC minification is enabled by default in Next.js 15

  // Configurações de build para ambiente médico
  generateBuildId: async () => {
    // Build ID personalizado para tracking de segurança
    return `medical-build-${new Date().getTime()}`;
  },

  // Redirecionamentos - desabilitado para export estático
  // async redirects() - não funciona com output: 'export'
};

module.exports = withBundleAnalyzer(nextConfig);
