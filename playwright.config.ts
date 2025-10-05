import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Medical Platform
 * Optimized for testing medical workflows without additional costs
 */

export default defineConfig({
  testDir: './apps/frontend-nextjs/tests/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],

  use: {
    // Base URL configuration
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Screenshot and video only on failure (saves storage)
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Timeout configuration
    // Increased for Cloud Run latency and Next.js 15 streaming (Issue #219)
    actionTimeout: 15000,
    navigationTimeout: 60000, // Supports cold starts + Next.js App Router streaming

    // Browser context options
    contextOptions: {
      // Simulates medical professional device
      userAgent: 'Medical-Platform-Tester/1.0',

      // Permissions for medical features
      permissions: ['clipboard-read', 'clipboard-write'],

      // Locale for Brazilian Portuguese
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    },
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Mobile testing for patient access
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Force high contrast mode
        colorScheme: 'dark',
        // Reduced motion for accessibility
        reducedMotion: 'reduce',
      },
    },
  ],

  // Local development server
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    cwd: './apps/frontend-nextjs',
    timeout: 120000,
  },
});

// Environment-specific timeout configurations (Issue #219)
// Different strategies for different deployment environments
export const envConfig = {
  staging: {
    // Google Cloud Run staging environment
    navigationTimeout: 60000, // Accommodates cold starts (5-15s)
    waitForLoadState: 'domcontentloaded' as const, // Next.js 15 streaming compatible
    maxRetries: 3
  },
  production: {
    // Production environment with warm containers
    navigationTimeout: 45000,
    waitForLoadState: 'load' as const,
    maxRetries: 2
  },
  local: {
    // Local development (can use networkidle)
    navigationTimeout: 30000,
    waitForLoadState: 'networkidle' as const,
    maxRetries: 0
  }
};

// Environment-specific configurations
export const testConfig = {
  // Medical validation thresholds
  validation: {
    minResponseTime: 100, // ms
    maxResponseTime: 5000, // ms
    minAccuracyScore: 0.95, // 95% accuracy required
  },

  // Persona configurations
  personas: {
    drGasnelio: {
      id: 'dr_gasnelio',
      type: 'technical',
      responseStyle: 'formal',
      validationLevel: 'strict',
    },
    ga: {
      id: 'ga',
      type: 'empathetic',
      responseStyle: 'informal',
      validationLevel: 'flexible',
    },
  },

  // Medical protocols
  protocols: {
    pqtU: {
      components: ['Rifampicina', 'Dapsona', 'Clofazimina'],
      duration: 6, // months
      pediatricAdjustment: true,
    },
  },

  // Test data (anonymized)
  testPatients: [
    {
      weight: 25,
      age: 8,
      condition: 'pediatric',
      expectedDose: 'adjusted',
    },
    {
      weight: 70,
      age: 35,
      condition: 'adult',
      expectedDose: 'standard',
    },
    {
      weight: 65,
      age: 28,
      condition: 'pregnancy',
      expectedDose: 'special',
    },
  ],
};