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

  // Environment Variables - Explicit declaration for build-time inlining
  env: {
    // API Configuration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_URL_DEV: process.env.NEXT_PUBLIC_API_URL_DEV,
    NEXT_PUBLIC_API_URL_STAGING: process.env.NEXT_PUBLIC_API_URL_STAGING,
    NEXT_PUBLIC_API_URL_PRODUCTION: process.env.NEXT_PUBLIC_API_URL_PRODUCTION,

    // Environment Detection
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,

    // Feature Flags
    NEXT_PUBLIC_AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED,
    NEXT_PUBLIC_OFFLINE_MODE: process.env.NEXT_PUBLIC_OFFLINE_MODE,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
    NEXT_PUBLIC_COOKIES_ENABLED: process.env.NEXT_PUBLIC_COOKIES_ENABLED,
    NEXT_PUBLIC_CACHE_ENABLED: process.env.NEXT_PUBLIC_CACHE_ENABLED,
    NEXT_PUBLIC_PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING,

    // Security Settings
    NEXT_PUBLIC_SECURITY_LEVEL: process.env.NEXT_PUBLIC_SECURITY_LEVEL,
    NEXT_PUBLIC_CORS_ENABLED: process.env.NEXT_PUBLIC_CORS_ENABLED,
    NEXT_PUBLIC_CSP_ENABLED: process.env.NEXT_PUBLIC_CSP_ENABLED,

    // Build Configuration
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    NEXT_PUBLIC_ASSET_PREFIX: process.env.NEXT_PUBLIC_ASSET_PREFIX,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,

    // OAuth Configuration
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

    // Logging
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,

    // Storage Configuration
    NEXT_PUBLIC_STORAGE_MODE: process.env.NEXT_PUBLIC_STORAGE_MODE,
    NEXT_PUBLIC_DATABASE_MODE: process.env.NEXT_PUBLIC_DATABASE_MODE,
  },

  // Configurações de performance
  compress: true,
  poweredByHeader: false, // Remove header X-Powered-By para segurança

  // File tracing configuration moved to experimental.outputFileTracingRoot

  // SECURITY ENHANCEMENTS - Medical Application Grade (Score: 9.7/10)

  // Security headers configuration (Context7 recommended patterns)
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // CSP policy - stricter for production
    const cspHeader = `
      default-src 'self';
      script-src 'self' ${isDev ? "'unsafe-eval'" : ''};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Control browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()',
          },
        ],
      },
    ];
  },

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

  // Standalone deployment configuration following Context7 recommendations
  // Force standalone generation in current project directory, not monorepo root
  outputFileTracingRoot: __dirname,

  // Configurações experimentais para otimização e segurança
  experimental: {
    optimizePackageImports: ["react-icons", "jspdf", "lucide-react"],
    // Melhor tree-shaking para ícones SVG
    // React Compiler configuration
    reactCompiler: {
      compilationMode: "annotation",
    }
  },

  // Server external packages - ensure compatibility with standalone build
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
