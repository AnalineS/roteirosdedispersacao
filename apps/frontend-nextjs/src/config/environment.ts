/**
 * Environment Configuration System
 * Follows Next.js best practices for environment detection and configuration
 * Based on Context7 patterns for production-ready applications
 */

// Environment Types
export type Environment = 'development' | 'staging' | 'production'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type SecurityLevel = 'development' | 'staging' | 'production'

// Environment Configuration Interface
interface EnvironmentConfig {
  // Environment Detection
  environment: Environment
  nodeEnv: string
  isProduction: boolean
  isDevelopment: boolean
  isStaging: boolean

  // API Configuration
  api: {
    baseUrl: string
    backendUrl: string
    timeout: number
    retries: number
  }

  // Feature Flags
  features: {
    auth: boolean
    offline: boolean
    debug: boolean
    analytics: boolean
    cookies: boolean
    cache: boolean
    performanceMonitoring: boolean
    hotReload: boolean
    sourceMaps: boolean
  }

  // Security Configuration
  security: {
    level: SecurityLevel
    cors: boolean
    csp: boolean
    headers: boolean
  }

  // Build Configuration
  build: {
    basePath: string
    assetPrefix: string
    buildId?: string
    version?: string
  }

  // Logging Configuration
  logging: {
    level: LogLevel
    console: boolean
    remote: boolean
  }

  // OAuth Configuration
  oauth: {
    googleClientId?: string
  }

  // Storage Configuration
  storage: {
    mode: 'local' | 'cloud'
    database: 'mock' | 'production'
  }
}

/**
 * Get environment variable with type safety and fallback
 */
function getEnvVar(key: string, fallback: string = ''): string {
  if (typeof window !== 'undefined') {
    // Client-side: only NEXT_PUBLIC_ variables are available
    return (window as any).__NEXT_DATA__?.env?.[key] ||
           process.env[key] ||
           fallback
  }
  // Server-side: all variables available
  return process.env[key] || fallback
}

/**
 * Get boolean environment variable
 */
function getEnvBool(key: string, fallback: boolean = false): boolean {
  const value = getEnvVar(key).toLowerCase()
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return fallback
}

/**
 * Get number environment variable
 */
function getEnvNumber(key: string, fallback: number): number {
  const value = getEnvVar(key)
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Detect current environment based on multiple sources
 */
function detectEnvironment(): Environment {
  // Priority 1: Explicit environment variable (GitHub Variables override)
  const explicitEnv = getEnvVar('NEXT_PUBLIC_ENVIRONMENT').toLowerCase()
  if (explicitEnv === 'development' || explicitEnv === 'staging' || explicitEnv === 'production') {
    return explicitEnv as Environment
  }

  // Priority 2: GitHub Variables detection (staging/production only set via GitHub)
  const hasGitHubVars = getEnvVar('NEXT_PUBLIC_API_URL_STAGING') || getEnvVar('NEXT_PUBLIC_API_URL_PRODUCTION')
  if (hasGitHubVars) {
    // If GitHub variables are present, determine based on which ones
    if (getEnvVar('NEXT_PUBLIC_API_URL_PRODUCTION')) {
      return 'production'
    }
    if (getEnvVar('NEXT_PUBLIC_API_URL_STAGING')) {
      return 'staging'
    }
  }

  // Priority 3: Hostname detection (client-side only)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    // Development patterns
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return 'development'
    }

    // Staging patterns
    if (hostname.includes('hml-') || hostname.includes('staging') || hostname.includes('test')) {
      return 'staging'
    }

    // Production patterns
    if (hostname.includes('roteirosdispensacao.com') ||
        hostname.includes('roteiros-de-dispensacao.web.app')) {
      return 'production'
    }
  }

  // Priority 4: Default to development (local builds without GitHub Variables)
  return 'development'
}

/**
 * Get API URL based on environment
 */
function getApiUrl(environment: Environment): string {
  // Priority 1: Explicit environment variable (standard naming)
  const explicitUrl = getEnvVar('NEXT_PUBLIC_API_URL')
  if (explicitUrl) return explicitUrl

  // Priority 2: Environment-specific URLs (GitHub Variables for staging/production)
  switch (environment) {
    case 'development':
      // Development: Allow fallback to localhost
      return getEnvVar('NEXT_PUBLIC_API_URL_DEV', 'http://localhost:5000')

    case 'staging':
      // Staging: Must use GitHub Variables only
      const stagingUrl = getEnvVar('NEXT_PUBLIC_API_URL_STAGING')
      if (!stagingUrl) {
        throw new Error('CRITICAL: NEXT_PUBLIC_API_URL_STAGING is required for staging environment (set via GitHub Variables)')
      }
      return stagingUrl

    case 'production':
      // Production: Must use GitHub Variables only
      const productionUrl = getEnvVar('NEXT_PUBLIC_API_URL_PRODUCTION')
      if (!productionUrl) {
        throw new Error('CRITICAL: NEXT_PUBLIC_API_URL_PRODUCTION is required for production environment (set via GitHub Variables)')
      }
      return productionUrl

    default:
      return 'http://localhost:5000'
  }
}

/**
 * Create environment configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const environment = detectEnvironment()
  const nodeEnv = getEnvVar('NODE_ENV', 'development')
  const apiUrl = getApiUrl(environment)

  const isDevelopment = environment === 'development'
  const isStaging = environment === 'staging'
  const isProduction = environment === 'production'

  return {
    // Environment Detection
    environment,
    nodeEnv,
    isProduction,
    isDevelopment,
    isStaging,

    // API Configuration
    api: {
      baseUrl: apiUrl,
      backendUrl: getEnvVar('NEXT_PUBLIC_BACKEND_URL', apiUrl),
      timeout: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', isDevelopment ? 30000 : 15000),
      retries: getEnvNumber('NEXT_PUBLIC_API_RETRIES', isDevelopment ? 1 : 3)
    },

    // Feature Flags
    features: {
      auth: getEnvBool('NEXT_PUBLIC_AUTH_ENABLED', true),
      offline: getEnvBool('NEXT_PUBLIC_OFFLINE_MODE', isDevelopment),
      debug: getEnvBool('NEXT_PUBLIC_DEBUG_MODE', isDevelopment),
      analytics: getEnvBool('NEXT_PUBLIC_ANALYTICS_ENABLED', !isDevelopment),
      cookies: getEnvBool('NEXT_PUBLIC_COOKIES_ENABLED', true),
      cache: getEnvBool('NEXT_PUBLIC_CACHE_ENABLED', !isDevelopment),
      performanceMonitoring: getEnvBool('NEXT_PUBLIC_PERFORMANCE_MONITORING', true),
      hotReload: getEnvBool('NEXT_PUBLIC_HOT_RELOAD', isDevelopment),
      sourceMaps: getEnvBool('NEXT_PUBLIC_SOURCE_MAPS', isDevelopment)
    },

    // Security Configuration
    security: {
      level: (isDevelopment ? 'development' : isStaging ? 'staging' : 'production') as SecurityLevel,
      cors: getEnvBool('NEXT_PUBLIC_CORS_ENABLED', isDevelopment),
      csp: getEnvBool('NEXT_PUBLIC_CSP_ENABLED', !isDevelopment),
      headers: getEnvBool('NEXT_PUBLIC_SECURITY_HEADERS', !isDevelopment)
    },

    // Build Configuration
    build: {
      basePath: getEnvVar('NEXT_PUBLIC_BASE_PATH', ''),
      assetPrefix: getEnvVar('NEXT_PUBLIC_ASSET_PREFIX', ''),
      buildId: getEnvVar('NEXT_PUBLIC_BUILD_ID'),
      version: getEnvVar('NEXT_PUBLIC_VERSION')
    },

    // Logging Configuration
    logging: {
      level: (getEnvVar('NEXT_PUBLIC_LOG_LEVEL',
        isDevelopment ? 'debug' : isStaging ? 'warn' : 'error'
      )) as LogLevel,
      console: getEnvBool('NEXT_PUBLIC_CONSOLE_LOGGING', true),
      remote: getEnvBool('NEXT_PUBLIC_REMOTE_LOGGING', !isDevelopment)
    },

    // OAuth Configuration
    oauth: {
      googleClientId: getEnvVar('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
    },

    // Storage Configuration
    storage: {
      mode: getEnvVar('NEXT_PUBLIC_STORAGE_MODE', isDevelopment ? 'local' : 'cloud') as 'local' | 'cloud',
      database: getEnvVar('NEXT_PUBLIC_DATABASE_MODE', isDevelopment ? 'mock' : 'production') as 'mock' | 'production'
    }
  }
}

// Global configuration instance
const config = createEnvironmentConfig()

// Export configuration and utilities
export default config
export { createEnvironmentConfig, detectEnvironment, getApiUrl }

// Log configuration in development
if (config.isDevelopment && config.features.debug) {
  console.group('🔧 Environment Configuration')
  console.log('Environment:', config.environment)
  console.log('API URL:', config.api.baseUrl)
  console.log('Features:', config.features)
  console.log('Security Level:', config.security.level)
  console.groupEnd()
}