/**
 * Environment-Aware Security Configuration
 * Centralizes all security settings based on environment
 * Ensures staging = production security levels
 */

import config from './environment';

export type SecurityLevel = 'development' | 'staging' | 'production';

export interface SecurityConfig {
  // Environment info
  environment: SecurityLevel;
  level: SecurityLevel;

  // Authentication settings
  auth: {
    tokenTimeout: number;
    refreshTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    requireEmailVerification: boolean;
    enableGoogleAuth: boolean;
    sessionTimeout: number;
  };

  // Security monitoring
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    auditTrail: boolean;
    realTimeAlerts: boolean;
    performanceMonitoring: boolean;
    anomalyDetection: boolean;
  };

  // Data protection
  dataProtection: {
    encryptionLevel: 'basic' | 'standard' | 'maximum';
    sanitizationLevel: 'permissive' | 'standard' | 'strict';
    lgpdCompliance: boolean;
    dataRetention: number; // days
    piiDetection: boolean;
    automaticSanitization: boolean;
  };

  // Security headers
  headers: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXSSProtection: boolean;
    enableFrameOptions: boolean;
    enableContentTypeOptions: boolean;
    cspReportingEnabled: boolean;
  };

  // Rate limiting
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
    strictMode: boolean;
  };

  // Development aids
  development: {
    allowDebugHeaders: boolean;
    exposeEnvironmentInfo: boolean;
    relaxedCors: boolean;
    verboseLogging: boolean;
  };
}

/**
 * Create environment-specific security configuration
 */
function createSecurityConfig(): SecurityConfig {
  const environment = config.environment;
  const isProduction = environment === 'production';
  const isStaging = environment === 'staging';
  const isDevelopment = environment === 'development';

  // CRITICAL: Staging must be identical to production
  const productionLevel = isProduction || isStaging;

  return {
    environment: environment as SecurityLevel,
    level: productionLevel ? 'production' : 'development',

    auth: {
      tokenTimeout: productionLevel ? 900000 : 3600000, // 15min prod, 1h dev
      refreshTimeout: productionLevel ? 604800000 : 2592000000, // 7d prod, 30d dev
      maxLoginAttempts: productionLevel ? 3 : 10,
      lockoutDuration: productionLevel ? 900000 : 60000, // 15min prod, 1min dev
      requireEmailVerification: productionLevel,
      enableGoogleAuth: config.oauth.googleClientId !== undefined,
      sessionTimeout: productionLevel ? 1800000 : 7200000, // 30min prod, 2h dev
    },

    monitoring: {
      enabled: config.features.performanceMonitoring,
      logLevel: productionLevel ? 'error' : 'debug',
      auditTrail: productionLevel,
      realTimeAlerts: productionLevel,
      performanceMonitoring: config.features.performanceMonitoring,
      anomalyDetection: productionLevel,
    },

    dataProtection: {
      encryptionLevel: productionLevel ? 'maximum' : 'standard',
      sanitizationLevel: productionLevel ? 'strict' : 'standard',
      lgpdCompliance: true, // Always enabled for medical data
      dataRetention: productionLevel ? 1095 : 30, // 3 years prod, 30 days dev
      piiDetection: true, // Always enabled for medical data
      automaticSanitization: productionLevel,
    },

    headers: {
      enableCSP: config.security.csp,
      enableHSTS: productionLevel,
      enableXSSProtection: productionLevel,
      enableFrameOptions: true, // Always enabled
      enableContentTypeOptions: true, // Always enabled
      cspReportingEnabled: productionLevel,
    },

    rateLimit: {
      enabled: productionLevel,
      requestsPerMinute: productionLevel ? 60 : 1000,
      burstLimit: productionLevel ? 10 : 100,
      strictMode: productionLevel,
    },

    development: {
      allowDebugHeaders: isDevelopment,
      exposeEnvironmentInfo: isDevelopment,
      relaxedCors: isDevelopment,
      verboseLogging: config.features.debug,
    },
  };
}

// Global security configuration instance
const securityConfig = createSecurityConfig();

// Logging for development
if (securityConfig.development.verboseLogging) {
  console.group('🛡️ Security Configuration');
  console.log('Environment:', securityConfig.environment);
  console.log('Security Level:', securityConfig.level);
  console.log('Auth Settings:', securityConfig.auth);
  console.log('Monitoring:', securityConfig.monitoring);
  console.log('Data Protection:', securityConfig.dataProtection);
  console.groupEnd();
}

export default securityConfig;
export { createSecurityConfig };

// Validation warnings
if (securityConfig.environment === 'staging' && securityConfig.level !== 'production') {
  console.error('⚠️ CRITICAL: Staging environment must use production security level!');
}

if (securityConfig.environment === 'production' && securityConfig.development.allowDebugHeaders) {
  console.error('⚠️ CRITICAL: Debug headers enabled in production!');
}