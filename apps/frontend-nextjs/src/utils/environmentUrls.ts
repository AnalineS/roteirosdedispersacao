/**
 * Environment-Aware URL Generation
 * Centralizes all URL generation to avoid hardcoded values
 * Ensures staging and production use environment variables only
 */

import config from '@/config/environment';

export interface EnvironmentUrls {
  baseUrl: string;
  apiUrl: string;
  verificationUrl: string;
  chatUrl: string;
  modulesUrl: string;
  aboutUrl: string;
  lifeWithHansenUrl: string;
  certificationUrl: string;
}

/**
 * Get environment-specific URLs
 * CRITICAL: No hardcoded fallbacks for staging/production
 */
function getEnvironmentUrls(): EnvironmentUrls {
  const environment = config.environment;

  // Base URL determination
  let baseUrl: string;

  switch (environment) {
    case 'development':
      baseUrl = 'http://localhost:3000';
      break;

    case 'staging':
      const stagingUrl = process.env.NEXT_PUBLIC_STAGING_DOMAIN ||
                        process.env.NEXT_PUBLIC_BASE_URL_STAGING;
      if (!stagingUrl) {
        throw new Error('CRITICAL: NEXT_PUBLIC_STAGING_DOMAIN or NEXT_PUBLIC_BASE_URL_STAGING is required for staging');
      }
      baseUrl = stagingUrl;
      break;

    case 'production':
      const productionUrl = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ||
                           process.env.NEXT_PUBLIC_BASE_URL_PRODUCTION;
      if (!productionUrl) {
        throw new Error('CRITICAL: NEXT_PUBLIC_PRODUCTION_DOMAIN or NEXT_PUBLIC_BASE_URL_PRODUCTION is required for production');
      }
      baseUrl = productionUrl;
      break;

    default:
      baseUrl = 'http://localhost:3000';
  }

  // Ensure baseUrl has protocol
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  return {
    baseUrl,
    apiUrl: config.api.baseUrl,
    verificationUrl: `${baseUrl}/verify`,
    chatUrl: `${baseUrl}/chat`,
    modulesUrl: `${baseUrl}/modules`,
    aboutUrl: `${baseUrl}/sobre`,
    lifeWithHansenUrl: `${baseUrl}/vida-com-hanseniase`,
    certificationUrl: `${baseUrl}/certificacao`,
  };
}

// Singleton instance for performance
let urlsCache: EnvironmentUrls | null = null;

/**
 * Get cached environment URLs
 */
export function getUrls(): EnvironmentUrls {
  if (!urlsCache) {
    urlsCache = getEnvironmentUrls();

    // Log configuration in development
    if (config.features.debug) {
      console.group('🌐 Environment URLs Configuration');
      console.log('Environment:', config.environment);
      console.log('URLs:', urlsCache);
      console.groupEnd();
    }
  }

  return urlsCache;
}

/**
 * Get specific URL types
 */
export const urls = {
  base: () => getUrls().baseUrl,
  api: () => getUrls().apiUrl,
  verification: () => getUrls().verificationUrl,
  chat: () => getUrls().chatUrl,
  modules: () => getUrls().modulesUrl,
  about: () => getUrls().aboutUrl,
  lifeWithHansen: () => getUrls().lifeWithHansenUrl,
  certification: () => getUrls().certificationUrl,

  // Dynamic URL builders
  certificationVerify: (certId: string) => `${getUrls().verificationUrl}/cert-${certId}`,
  qrCode: (path: string) => `${getUrls().baseUrl}${path}`,
  canonical: (path: string) => `${getUrls().baseUrl}${path}`,
};

/**
 * Structured data URLs for SEO
 */
export function getStructuredDataUrls() {
  const baseUrls = getUrls();

  return {
    organization: baseUrls.baseUrl,
    website: baseUrls.baseUrl,
    mainEntity: baseUrls.baseUrl,
    sameAs: [
      baseUrls.chatUrl,
      baseUrls.modulesUrl,
      baseUrls.lifeWithHansenUrl
    ],
    breadcrumbItems: [
      { name: 'Início', url: baseUrls.baseUrl },
      { name: 'Módulos', url: baseUrls.modulesUrl },
      { name: 'Chat', url: baseUrls.chatUrl },
      { name: 'Sobre', url: baseUrls.aboutUrl }
    ]
  };
}

/**
 * Validate environment URLs on app startup
 */
export function validateEnvironmentUrls(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const urls = getUrls();

    // Validate base URL format
    if (!urls.baseUrl.match(/^https?:\/\//)) {
      errors.push('Base URL must include protocol (http/https)');
    }

    // Validate API URL format
    if (!urls.apiUrl.match(/^https?:\/\//)) {
      errors.push('API URL must include protocol (http/https)');
    }

    // Environment-specific validations
    if (config.environment === 'production') {
      if (!urls.baseUrl.startsWith('https://')) {
        errors.push('Production base URL must use HTTPS');
      }
      if (!urls.apiUrl.startsWith('https://')) {
        errors.push('Production API URL must use HTTPS');
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Configuration error: ${errorMessage}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default urls;