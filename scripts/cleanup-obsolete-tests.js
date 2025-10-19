#!/usr/bin/env node

/**
 * Cleanup Script for Obsolete Tests
 * Removes old test files, reports, and temporary data
 */

const fs = require('fs').promises;
const path = require('path');

const CLEANUP_TARGETS = {
  // Test result directories older than 7 days
  testResults: {
    paths: [
      'test-results',
      'playwright-report',
      'coverage',
      '.nyc_output',
      'apps/frontend-nextjs/coverage',
      'apps/backend/htmlcov',
    ],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },

  // Temporary test files
  tempFiles: {
    patterns: [
      '**/*.test.tmp',
      '**/*.spec.tmp',
      '**/test-*.tmp.js',
      '**/temp-test-*',
      '**/.test-cache',
    ],
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },

  // Old screenshots and videos
  media: {
    paths: [
      'test-screenshots',
      'test-videos',
      'playwright-screenshots',
      'cypress/screenshots',
      'cypress/videos',
    ],
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
  },

  // Obsolete test configurations
  obsoleteConfigs: [
    '.eslintrc.test.js',
    'jest.config.old.js',
    'playwright.config.old.ts',
    'cypress.json',
    'nightwatch.conf.js',
  ],

  // Legacy test directories
  legacyDirs: [
    '__tests_old__',
    'tests_backup',
    'spec_old',
    'e2e_legacy',
  ],
};

// Statistics tracking
const stats = {
  filesDeleted: 0,
  bytesFreed: 0,
  errors: [],
};

/**
 * Check if file/directory is older than maxAge
 */
async function isOlderThan(filePath, maxAge) {
  try {
    const stat = await fs.stat(filePath);
    const age = Date.now() - stat.mtime.getTime();
    return age > maxAge;
  } catch (error) {
    return false;
  }
}

/**
 * Get size of file or directory
 */
async function getSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(filePath);
      let totalSize = 0;
      for (const file of files) {
        totalSize += await getSize(path.join(filePath, file));
      }
      return totalSize;
    }
    return stat.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Delete file or directory
 */
async function deleteItem(itemPath) {
  try {
    const size = await getSize(itemPath);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      await fs.rm(itemPath, { recursive: true, force: true });
      console.log(`📁 Deleted directory: ${itemPath}`);
    } else {
      await fs.unlink(itemPath);
      console.log(`📄 Deleted file: ${itemPath}`);
    }

    stats.filesDeleted++;
    stats.bytesFreed += size;
    return true;
  } catch (error) {
    stats.errors.push({ path: itemPath, error: error.message });
    return false;
  }
}

/**
 * Clean test results older than maxAge
 */
async function cleanTestResults() {
  console.log('🧹 Cleaning old test results...');

  for (const dirPath of CLEANUP_TARGETS.testResults.paths) {
    const fullPath = path.join(process.cwd(), dirPath);

    try {
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      if (!exists) continue;

      const files = await fs.readdir(fullPath);
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        if (await isOlderThan(filePath, CLEANUP_TARGETS.testResults.maxAge)) {
          await deleteItem(filePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
    }
  }
}

/**
 * Clean temporary test files
 */
async function cleanTempFiles() {
  console.log('🧹 Cleaning temporary test files...');

  const tempPatterns = [
    '.test.tmp',
    '.spec.tmp',
    'test-*.tmp.js',
    'temp-test-',
    '.test-cache'
  ];

  async function scanDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            await scanDirectory(fullPath);
          }
        } else {
          // Check if file matches temp patterns
          const matchesPattern = tempPatterns.some(pattern =>
            entry.name.includes(pattern)
          );

          if (matchesPattern && await isOlderThan(fullPath, CLEANUP_TARGETS.tempFiles.maxAge)) {
            await deleteItem(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
    }
  }

  await scanDirectory(process.cwd());
}

/**
 * Clean media files (screenshots, videos)
 */
async function cleanMediaFiles() {
  console.log('🧹 Cleaning old test media files...');

  for (const dirPath of CLEANUP_TARGETS.media.paths) {
    const fullPath = path.join(process.cwd(), dirPath);

    try {
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      if (!exists) continue;

      const files = await fs.readdir(fullPath);
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        if (await isOlderThan(filePath, CLEANUP_TARGETS.media.maxAge)) {
          await deleteItem(filePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }
  }
}

/**
 * Clean obsolete configurations
 */
async function cleanObsoleteConfigs() {
  console.log('🧹 Cleaning obsolete test configurations...');

  for (const configFile of CLEANUP_TARGETS.obsoleteConfigs) {
    const fullPath = path.join(process.cwd(), configFile);

    try {
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      if (exists) {
        await deleteItem(fullPath);
      }
    } catch (error) {
      // File doesn't exist
    }
  }
}

/**
 * Clean legacy test directories
 */
async function cleanLegacyDirs() {
  console.log('🧹 Cleaning legacy test directories...');

  for (const dir of CLEANUP_TARGETS.legacyDirs) {
    const fullPath = path.join(process.cwd(), dir);

    try {
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      if (exists) {
        await deleteItem(fullPath);
      }
    } catch (error) {
      // Directory doesn't exist
    }
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main cleanup function
 */
async function main() {
  console.log('🚀 Starting Test Cleanup');
  console.log('=' .repeat(50));

  const startTime = Date.now();

  // Run cleanup tasks
  await cleanTestResults();
  await cleanTempFiles();
  await cleanMediaFiles();
  await cleanObsoleteConfigs();
  await cleanLegacyDirs();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Cleanup Complete!');
  console.log(`📊 Files deleted: ${stats.filesDeleted}`);
  console.log(`💾 Space freed: ${formatBytes(stats.bytesFreed)}`);
  console.log(`⏱️  Time taken: ${duration}s`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    if (process.env.VERBOSE) {
      stats.errors.forEach(err => {
        console.log(`  - ${err.path}: ${err.error}`);
      });
    }
  }

  // Write cleanup log
  const logPath = path.join(process.cwd(), 'cleanup.log');
  const logContent = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    filesDeleted: stats.filesDeleted,
    bytesFreed: stats.bytesFreed,
    errors: stats.errors.length,
    details: stats.errors,
  };

  await fs.writeFile(logPath, JSON.stringify(logContent, null, 2));
  console.log(`\n📝 Cleanup log saved to: cleanup.log`);

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

// Command line options
if (process.argv.includes('--dry-run')) {
  console.log('🔍 DRY RUN MODE - No files will be deleted');
  // In dry run, override deleteItem to just log
  const originalDelete = deleteItem;
  deleteItem = async (itemPath) => {
    console.log(`[DRY RUN] Would delete: ${itemPath}`);
    return true;
  };
}

if (process.argv.includes('--help')) {
  console.log(`
Usage: node cleanup-obsolete-tests.js [options]

Options:
  --dry-run    Show what would be deleted without actually deleting
  --verbose    Show detailed error messages
  --help       Show this help message

This script cleans up:
  - Test results older than 7 days
  - Temporary test files older than 1 day
  - Screenshots/videos older than 3 days
  - Obsolete test configurations
  - Legacy test directories
  `);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, CLEANUP_TARGETS };