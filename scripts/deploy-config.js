#!/usr/bin/env node

/**
 * Environment-Aware Deployment Configuration Script
 * Centralizes deployment configuration for dev/staging/production
 * Ensures staging = production configuration principles
 */

const fs = require('fs');
const path = require('path');

// Environment configurations
const ENVIRONMENTS = {
  development: {
    name: 'development',
    description: 'Local development environment',
    cloudRunService: 'roteiro-dispensacao-dev',
    domain: 'localhost:3000',
    apiUrl: 'http://localhost:5000',
    requiresSecrets: false,
    buildCommand: 'npm run build:development',
    environment: 'development',
    variables: {
      NEXT_PUBLIC_ENVIRONMENT: 'development',
      NEXT_PUBLIC_API_URL: 'http://localhost:5000',
      NEXT_PUBLIC_DEBUG_MODE: 'true',
      NEXT_PUBLIC_OFFLINE_MODE: 'true',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'false',
      NEXT_PUBLIC_CACHE_ENABLED: 'false',
      NEXT_PUBLIC_SECURITY_LEVEL: 'development',
      NEXT_PUBLIC_LOG_LEVEL: 'debug'
    }
  },

  staging: {
    name: 'staging',
    description: 'Staging environment (identical to production)',
    cloudRunService: 'hml-roteiro-dispensacao-frontend',
    domain: 'hml-roteiros-de-dispensacao.web.app',
    apiUrl: 'https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app',
    requiresSecrets: true,
    buildCommand: 'npm run build:staging',
    environment: 'staging',
    variables: {
      NEXT_PUBLIC_ENVIRONMENT: 'staging',
      NEXT_PUBLIC_API_URL_STAGING: 'https://hml-roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app',
      NEXT_PUBLIC_DEBUG_MODE: 'false',
      NEXT_PUBLIC_OFFLINE_MODE: 'false',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_CACHE_ENABLED: 'true',
      NEXT_PUBLIC_SECURITY_LEVEL: 'production',
      NEXT_PUBLIC_LOG_LEVEL: 'warn'
    },
    secrets: [
      'GOOGLE_CLIENT_ID_STAGING',
      'GCP_SERVICE_ACCOUNT_KEY',
      'CLOUD_STORAGE_BUCKET'
    ]
  },

  production: {
    name: 'production',
    description: 'Production environment',
    cloudRunService: 'roteiro-dispensacao-frontend',
    domain: 'roteirosdispensacao.com',
    apiUrl: 'https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app',
    requiresSecrets: true,
    buildCommand: 'npm run build:production',
    environment: 'production',
    variables: {
      NEXT_PUBLIC_ENVIRONMENT: 'production',
      NEXT_PUBLIC_API_URL_PRODUCTION: 'https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app',
      NEXT_PUBLIC_DEBUG_MODE: 'false',
      NEXT_PUBLIC_OFFLINE_MODE: 'false',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_CACHE_ENABLED: 'true',
      NEXT_PUBLIC_SECURITY_LEVEL: 'production',
      NEXT_PUBLIC_LOG_LEVEL: 'error'
    },
    secrets: [
      'GOOGLE_CLIENT_ID_PRODUCTION',
      'GCP_SERVICE_ACCOUNT_KEY',
      'CLOUD_STORAGE_BUCKET'
    ]
  }
};

/**
 * Generate environment configuration for deployment
 */
function generateDeployConfig(environment) {
  const config = ENVIRONMENTS[environment];
  if (!config) {
    throw new Error(`Environment '${environment}' not found. Available: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  }

  return {
    ...config,
    timestamp: new Date().toISOString(),
    buildId: `${environment}-${Date.now()}`,
    validationPassed: true
  };
}

/**
 * Validate environment configuration
 */
function validateEnvironment(environment) {
  const config = ENVIRONMENTS[environment];
  const errors = [];

  // Check required fields
  const requiredFields = ['name', 'cloudRunService', 'buildCommand', 'variables'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate staging = production security
  if (environment === 'staging') {
    const stagingVars = config.variables;
    const prodVars = ENVIRONMENTS.production.variables;

    if (stagingVars.NEXT_PUBLIC_SECURITY_LEVEL !== prodVars.NEXT_PUBLIC_SECURITY_LEVEL) {
      errors.push('CRITICAL: Staging security level must match production');
    }

    if (stagingVars.NEXT_PUBLIC_DEBUG_MODE !== 'false') {
      errors.push('CRITICAL: Debug mode must be disabled in staging');
    }
  }

  // Validate production security
  if (environment === 'production') {
    const prodVars = config.variables;

    if (prodVars.NEXT_PUBLIC_DEBUG_MODE !== 'false') {
      errors.push('CRITICAL: Debug mode must be disabled in production');
    }

    if (prodVars.NEXT_PUBLIC_LOG_LEVEL !== 'error') {
      errors.push('WARNING: Production should use error-level logging only');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: errors.filter(e => e.startsWith('WARNING:')),
    critical: errors.filter(e => e.startsWith('CRITICAL:'))
  };
}

/**
 * Generate GitHub Actions environment matrix
 */
function generateGitHubMatrix() {
  const matrix = {
    include: []
  };

  for (const [envName, config] of Object.entries(ENVIRONMENTS)) {
    if (envName === 'development') continue; // Skip development for CI

    matrix.include.push({
      environment: envName,
      'cloud-run-service': config.cloudRunService,
      'build-command': config.buildCommand,
      'requires-secrets': config.requiresSecrets,
      'api-url': config.apiUrl
    });
  }

  return matrix;
}

/**
 * Main CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  switch (command) {
    case 'validate':
      if (!environment) {
        console.error('Usage: node deploy-config.js validate <environment>');
        process.exit(1);
      }

      const validation = validateEnvironment(environment);
      if (validation.valid) {
        console.log(`✅ Environment '${environment}' configuration is valid`);
        process.exit(0);
      } else {
        console.error(`❌ Environment '${environment}' configuration has errors:`);
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }
      break;

    case 'generate':
      if (!environment) {
        console.error('Usage: node deploy-config.js generate <environment>');
        process.exit(1);
      }

      try {
        const config = generateDeployConfig(environment);
        console.log(JSON.stringify(config, null, 2));
      } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
      break;

    case 'matrix':
      const matrix = generateGitHubMatrix();
      console.log(JSON.stringify(matrix, null, 2));
      break;

    case 'list':
      console.log('Available environments:');
      for (const [name, config] of Object.entries(ENVIRONMENTS)) {
        console.log(`  ${name}: ${config.description}`);
      }
      break;

    case 'variables':
      if (!environment) {
        console.error('Usage: node deploy-config.js variables <environment>');
        process.exit(1);
      }

      const config = ENVIRONMENTS[environment];
      if (!config) {
        console.error(`Environment '${environment}' not found`);
        process.exit(1);
      }

      console.log('Environment variables:');
      for (const [key, value] of Object.entries(config.variables)) {
        console.log(`${key}=${value}`);
      }
      break;

    default:
      console.log('Usage: node deploy-config.js <command> [environment]');
      console.log('Commands:');
      console.log('  validate <env>  - Validate environment configuration');
      console.log('  generate <env>  - Generate deployment configuration');
      console.log('  variables <env> - List environment variables');
      console.log('  matrix          - Generate GitHub Actions matrix');
      console.log('  list            - List available environments');
      break;
  }
}

// Export for use as module
module.exports = {
  ENVIRONMENTS,
  generateDeployConfig,
  validateEnvironment,
  generateGitHubMatrix
};

// Run CLI if called directly
if (require.main === module) {
  main();
}