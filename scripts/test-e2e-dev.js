#!/usr/bin/env node

/**
 * End-to-End Tests for Development Environment
 * Validates the complete environment-aware system
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(title.toUpperCase(), 'bright');
  log('='.repeat(60), 'cyan');
}

function logTest(testName, status = 'info') {
  const icons = {
    info: '🧪',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  log(`${icons[status]} ${testName}`, status === 'success' ? 'green' : status === 'error' ? 'red' : 'yellow');
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    logTest(name, 'success');
  } else {
    testResults.failed++;
    logTest(`${name} - ${details}`, 'error');
  }
}

// Cross-platform utility functions
function execCommand(command, description, customCwd = null) {
  try {
    logTest(`Executing: ${description}`, 'info');
    const workDir = customCwd || path.join(__dirname, '..', 'apps', 'frontend-nextjs');

    // Cross-platform command execution
    const isWindows = process.platform === 'win32';
    let shell = isWindows ? 'cmd' : 'sh';
    let shellArgs = isWindows ? ['/c'] : ['-c'];

    const result = execSync(`${shell} ${shellArgs.join(' ')} "${command}"`, {
      encoding: 'utf8',
      cwd: workDir,
      timeout: 60000,
      env: {
        ...process.env,
        NEXT_PUBLIC_ENVIRONMENT: 'development',
        PATH: process.env.PATH
        // Remove NODE_ENV override to avoid Next.js warning
      }
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function spawnCrossplatform(command, args, options = {}) {
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    if (command === 'npm') {
      // On Windows, try npm.cmd first, then fallback to npm
      try {
        return spawn('npm.cmd', args, { ...options, windowsHide: true });
      } catch (error) {
        return spawn('npm', args, { ...options, shell: true, windowsHide: true });
      }
    }
    // For other commands on Windows, use shell
    return spawn(command, args, { ...options, shell: true, windowsHide: true });
  }

  return spawn(command, args, options);
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function testEnvironmentDetection() {
  logSection('TEST 1: Environment Detection');

  // Test 1.1: Check if environment config is working
  logTest('Testing environment configuration import', 'info');

  const configPath = path.join(__dirname, '..', 'apps', 'frontend-nextjs', 'src', 'config', 'environment.ts');
  const configExists = fs.existsSync(configPath);
  recordTest('Environment config file exists', configExists);

  // Test 1.2: Test development build
  logTest('Testing development build', 'info');
  const buildResult = execCommand('npm run build', 'Development build');
  recordTest('Development build succeeds', buildResult.success, buildResult.error);

  // Test 1.3: Check if build output contains environment info
  if (buildResult.success) {
    const containsDevEnv = buildResult.output.includes('development') || buildResult.output.includes('NEXT_PUBLIC_ENVIRONMENT');
    recordTest('Build includes environment configuration', containsDevEnv);
  }

  return testResults.failed === 0;
}

async function testAPIConnectivity() {
  logSection('TEST 2: API Connectivity');

  // Test 2.1: Start development server
  logTest('Starting Next.js development server', 'info');

  let serverProcess;
  try {
    // Start the server in background using cross-platform spawn
    serverProcess = spawnCrossplatform('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..', 'apps', 'frontend-nextjs'),
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NEXT_PUBLIC_ENVIRONMENT: 'development'
        // Remove NODE_ENV override to avoid Next.js warning
      }
    });

    // Wait for server to be ready
    const serverReady = await waitForServer('http://localhost:3000');
    recordTest('Development server starts successfully', serverReady);

    if (serverReady) {
      // Test 2.2: Test health endpoint
      try {
        const healthResponse = await fetch('http://localhost:3000/api/health');
        recordTest('Health endpoint responds', healthResponse.ok);

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          recordTest('Health endpoint returns valid JSON', typeof healthData === 'object');

          // Check for expected fields
          const hasEnvironment = 'environment' in healthData || 'status' in healthData;
          recordTest('Health response contains environment info', hasEnvironment);
        }
      } catch (error) {
        recordTest('Health endpoint test', false, error.message);
      }

      // Test 2.3: Test main page
      try {
        const pageResponse = await fetch('http://localhost:3000');
        recordTest('Main page loads', pageResponse.ok);
      } catch (error) {
        recordTest('Main page test', false, error.message);
      }
    }

  } catch (error) {
    recordTest('Server startup', false, error.message);
  } finally {
    // Clean up server process
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function testURLGeneration() {
  logSection('TEST 3: URL Generation');

  // Test 3.1: Check URL utility exists
  const urlUtilPath = path.join(__dirname, '..', 'apps', 'frontend-nextjs', 'src', 'utils', 'environmentUrls.ts');
  const urlUtilExists = fs.existsSync(urlUtilPath);
  recordTest('Environment URLs utility exists', urlUtilExists);

  // Test 3.2: Test TypeScript compilation
  logTest('Testing TypeScript compilation with URL utilities', 'info');
  const tsResult = execCommand('npm run type-check', 'TypeScript type checking');
  recordTest('TypeScript compilation passes', tsResult.success, tsResult.error);

  // Test 3.3: Test if environment URLs are properly typed
  if (urlUtilExists) {
    const urlUtilContent = fs.readFileSync(urlUtilPath, 'utf8');
    const hasEnvironmentAware = urlUtilContent.includes('getEnvironmentUrls') && urlUtilContent.includes('environment');
    recordTest('URL utility is environment-aware', hasEnvironmentAware);

    const hasValidation = urlUtilContent.includes('validateEnvironmentUrls');
    recordTest('URL utility includes validation', hasValidation);
  }
}

async function testSecurityConfiguration() {
  logSection('TEST 4: Security Configuration');

  // Test 4.1: Check security config exists
  const securityConfigPath = path.join(__dirname, '..', 'apps', 'frontend-nextjs', 'src', 'config', 'security.ts');
  const securityConfigExists = fs.existsSync(securityConfigPath);
  recordTest('Security configuration exists', securityConfigExists);

  // Test 4.2: Check middleware exists
  const middlewarePath = path.join(__dirname, '..', 'apps', 'frontend-nextjs', 'middleware.ts');
  const middlewareExists = fs.existsSync(middlewarePath);
  recordTest('Security middleware exists', middlewareExists);

  // Test 4.3: Validate middleware is environment-aware
  if (middlewareExists) {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    const isEnvironmentAware = middlewareContent.includes('detectEnvironment') || middlewareContent.includes('environment');
    recordTest('Middleware is environment-aware', isEnvironmentAware);

    const hasSecurityHeaders = middlewareContent.includes('Content-Security-Policy') && middlewareContent.includes('X-Frame-Options');
    recordTest('Middleware sets security headers', hasSecurityHeaders);
  }
}

async function testFallbackSystem() {
  logSection('TEST 5: Fallback System');

  // Test 5.1: Check if fallbacks are properly configured
  const apiServicePath = path.join(__dirname, '..', 'apps', 'frontend-nextjs', 'src', 'services', 'api.ts');
  const apiServiceExists = fs.existsSync(apiServicePath);
  recordTest('API service exists', apiServiceExists);

  if (apiServiceExists) {
    const apiContent = fs.readFileSync(apiServicePath, 'utf8');

    // Test 5.2: Check for retry logic
    const hasRetryLogic = apiContent.includes('maxRetries') || apiContent.includes('attempt');
    recordTest('API service includes retry logic', hasRetryLogic);

    // Test 5.3: Check for timeout handling
    const hasTimeoutHandling = apiContent.includes('timeout') || apiContent.includes('AbortController');
    recordTest('API service includes timeout handling', hasTimeoutHandling);

    // Test 5.4: Check for offline fallbacks
    const hasOfflineFallback = apiContent.includes('offline') || apiContent.includes('generateOfflineResponse');
    recordTest('API service includes offline fallbacks', hasOfflineFallback);

    // Test 5.5: Check environment-aware configuration
    const isEnvironmentAware = apiContent.includes('config.') || apiContent.includes('environment');
    recordTest('API service is environment-aware', isEnvironmentAware);
  }
}

async function testBuildAndStart() {
  logSection('TEST 6: Build and Start');

  // Test 6.1: Test production build for development
  logTest('Testing production build process', 'info');
  const buildResult = execCommand('npm run build', 'Production build');
  recordTest('Production build succeeds', buildResult.success, buildResult.error);

  // Test 6.2: Check if standalone build works
  if (buildResult.success) {
    logTest('Testing standalone build assets', 'info');
    const standaloneResult = execCommand('npm run build:standalone', 'Standalone build');
    recordTest('Standalone build succeeds', standaloneResult.success, standaloneResult.error);
  }

  // Test 6.3: Test linting
  logTest('Testing code quality (linting)', 'info');
  const lintResult = execCommand('npm run lint', 'ESLint validation');
  recordTest('Code passes linting', lintResult.success, lintResult.error);
}

// Main test runner
async function runAllTests() {
  logSection('🧪 STARTING END-TO-END TESTS FOR DEVELOPMENT');
  log('Testing environment-aware system implementation\n', 'blue');

  const startTime = Date.now();

  try {
    await testEnvironmentDetection();
    await testAPIConnectivity();
    await testURLGeneration();
    await testSecurityConfiguration();
    await testFallbackSystem();
    await testBuildAndStart();
  } catch (error) {
    log(`\nUnexpected error during testing: ${error.message}`, 'red');
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final results
  logSection('📊 TEST RESULTS SUMMARY');
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⏱️  Duration: ${duration} seconds`, 'blue');

  if (testResults.failed > 0) {
    log('\n🔍 FAILED TESTS:', 'red');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        log(`   • ${test.name}${test.details ? ': ' + test.details : ''}`, 'red');
      });
  }

  const success = testResults.failed === 0;
  if (success) {
    log('\n🎉 ALL TESTS PASSED! Development environment is ready.', 'green');
    log('✅ Environment-aware system is working correctly', 'green');
    log('🚀 Ready to proceed with staging/production testing', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED! Please review and fix issues before proceeding.', 'red');
  }

  return success;
}

// Export for use as module or run directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n💥 Test runner crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };