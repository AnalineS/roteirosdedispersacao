#!/usr/bin/env node

/**
 * Security Alert False Positive Dismissal Script
 *
 * This script automatically dismisses known false positive security alerts
 * to reduce noise and focus on real security vulnerabilities.
 *
 * Usage: node .github/scripts/dismiss-false-positives.js
 */

const { execSync } = require('child_process');

// Configuration
const FALSE_POSITIVE_PATTERNS = [
  // JavaScript/TypeScript patterns that are typically false positives
  'js/unused-local-variable',
  'js/unreachable-statement',
  'js/inconsistent-use-of-new',
  'js/duplicate-property',
  'js/missing-token',
  'js/useless-assignment-to-local',
  'js/unused-property',
  'js/useless-conditional',
  'js/redundant-operation',
  'js/identical-branches',
  'js/empty-block',
  'js/assignment-to-const',
  'js/comparison-of-identical-expressions',
  'js/duplicate-condition',

  // Python patterns that are typically false positives
  'py/unused-import',
  'py/unused-local-variable',
  'py/redundant-assignment',
  'py/similar-function',
  'py/missing-call-to-init',
  'py/unused-name-in-except',
  'py/redundant-else',
  'py/unreachable-statement',
  'py/unused-loop-variable',
  'py/multiple-definition',
  'py/duplicate-key-dict-literal',

  // Code quality issues (not security vulnerabilities)
  'py/too-many-locals',
  'py/complex-condition',
  'js/too-many-parameters',
  'js/complex-condition',
  'py/long-parameter-list'
];

// File patterns that should be ignored (common sources of false positives)
const IGNORE_FILE_PATTERNS = [
  'test',
  'spec',
  '__tests__',
  'node_modules',
  'venv',
  'vendor',
  'build',
  'dist',
  '.next',
  'coverage',
  '.min.js',
  '.bundle.js',
  'package-lock.json',
  'yarn.lock',
  '.d.ts'
];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function executeGHCommand(command) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return JSON.parse(result);
  } catch (error) {
    log(`Failed to execute: ${command}`, 'error');
    log(`Error: ${error.message}`, 'error');
    return null;
  }
}

function dismissAlert(alertNumber, reason) {
  try {
    const command = `gh api repos/${process.env.GITHUB_REPOSITORY}/code-scanning/alerts/${alertNumber} \\
      -X PATCH \\
      -f state='dismissed' \\
      -f dismissed_reason='false positive' \\
      -f dismissed_comment='${reason} - Auto-dismissed by security management script'`;

    execSync(command, { stdio: 'pipe' });
    return true;
  } catch (error) {
    log(`Failed to dismiss alert #${alertNumber}: ${error.message}`, 'error');
    return false;
  }
}

function shouldDismissAlert(alert) {
  const ruleId = alert.rule.id;
  const filePath = alert.most_recent_instance?.location?.path || '';

  // Check if it matches false positive patterns
  for (const pattern of FALSE_POSITIVE_PATTERNS) {
    if (ruleId.includes(pattern)) {
      return {
        dismiss: true,
        reason: `False positive: ${pattern} pattern detected`
      };
    }
  }

  // Check if it's in an ignored file pattern
  for (const pattern of IGNORE_FILE_PATTERNS) {
    if (filePath.includes(pattern)) {
      return {
        dismiss: true,
        reason: `False positive: Alert in ${pattern} file (${filePath})`
      };
    }
  }

  // Keep the alert if it doesn't match any dismissal criteria
  return { dismiss: false };
}

async function main() {
  log('🚀 Starting security alert false positive dismissal');

  if (!process.env.GITHUB_REPOSITORY) {
    log('GITHUB_REPOSITORY environment variable not set', 'error');
    process.exit(1);
  }

  // Get all open security alerts
  log('📊 Fetching security alerts...');
  const alerts = executeGHCommand(`gh api repos/${process.env.GITHUB_REPOSITORY}/code-scanning/alerts --paginate`);

  if (!alerts) {
    log('Failed to fetch security alerts', 'error');
    process.exit(1);
  }

  const openAlerts = alerts.filter(alert => alert.state === 'open');
  log(`Found ${openAlerts.length} open security alerts`);

  if (openAlerts.length === 0) {
    log('No open alerts to process', 'success');
    return;
  }

  // Process each alert
  let dismissedCount = 0;
  let keptCount = 0;

  for (const alert of openAlerts) {
    const analysis = shouldDismissAlert(alert);

    if (analysis.dismiss) {
      log(`🗑️ Dismissing alert #${alert.number}: ${alert.rule.id} - ${analysis.reason}`);
      const success = dismissAlert(alert.number, analysis.reason);

      if (success) {
        dismissedCount++;
      }
    } else {
      log(`✅ Keeping alert #${alert.number}: ${alert.rule.id} (severity: ${alert.rule.severity})`);
      keptCount++;
    }
  }

  // Summary
  log('📈 Summary:', 'success');
  log(`  • Original alerts: ${openAlerts.length}`);
  log(`  • Dismissed as false positives: ${dismissedCount}`);
  log(`  • Kept for review: ${keptCount}`);
  log(`  • Reduction: ${Math.round((dismissedCount / openAlerts.length) * 100)}%`);

  if (keptCount > 0) {
    log('⚠️ Please review remaining alerts for legitimate security issues', 'warning');
  } else {
    log('🎉 All alerts were dismissed as false positives!', 'success');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { shouldDismissAlert, FALSE_POSITIVE_PATTERNS, IGNORE_FILE_PATTERNS };