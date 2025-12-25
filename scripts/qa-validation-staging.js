#!/usr/bin/env node
/**
 * QA Validation Script for Staging Environment
 *
 * Tests medical chat functionality (Dr. Gasnelio + Gá personas) in staging
 * Automatically creates GitHub issues for any errors found with screenshot evidence
 *
 * Usage: node scripts/qa-validation-staging.js
 *
 * Environment: Staging (hml)
 * URL: https://hml-frontend-4f2gjf6cua-uc.a.run.app/
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app/';
const REPORT_DIR = path.join(__dirname, '..', 'qa-reports', 'staging');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Ensure directories exist
if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

console.log('🧪 Starting QA Validation for Staging Environment');
console.log(`📍 Target URL: ${STAGING_URL}`);
console.log(`📊 Report Directory: ${REPORT_DIR}`);
console.log(`📸 Screenshots Directory: ${SCREENSHOTS_DIR}\n`);

// Test configuration
const tests = [
    {
        name: 'Medical Chat - Dr. Gasnelio Persona',
        description: 'Test technical pharmacist persona responses',
        testFile: 'tests/playwright/e2e-medical.spec.ts',
        grep: 'Dr. Gasnelio'
    },
    {
        name: 'Medical Chat - Gá Persona',
        description: 'Test empathetic assistant persona responses',
        testFile: 'tests/playwright/e2e-medical.spec.ts',
        grep: 'Gá'
    },
    {
        name: 'Chat Interface - Accessibility',
        description: 'Test WCAG 2.1 AA compliance for chat interface',
        testFile: 'tests/playwright/e2e-medical.spec.ts',
        grep: 'accessibility'
    }
];

const errors = [];
const results = [];

console.log('🎭 Running Playwright Tests...\n');

// Run Playwright tests
tests.forEach((test, index) => {
    console.log(`\n[${index + 1}/${tests.length}] ${test.name}`);
    console.log(`   ${test.description}`);

    try {
        const command = `cd apps/frontend-nextjs && npx playwright test ${test.testFile} --grep "${test.grep}" --reporter=json`;
        const output = execSync(command, {
            encoding: 'utf-8',
            env: {
                ...process.env,
                PLAYWRIGHT_BASE_URL: STAGING_URL,
                PLAYWRIGHT_SCREENSHOTS: SCREENSHOTS_DIR
            }
        });

        results.push({
            test: test.name,
            status: 'PASSED',
            output: output
        });

        console.log('   ✅ PASSED');

    } catch (error) {
        console.log('   ❌ FAILED');

        const errorDetails = {
            test: test.name,
            description: test.description,
            status: 'FAILED',
            error: error.message,
            stdout: error.stdout ? error.stdout.toString() : '',
            stderr: error.stderr ? error.stderr.toString() : '',
            timestamp: new Date().toISOString(),
            screenshots: []
        };

        // Find screenshots for this test
        if (fs.existsSync(SCREENSHOTS_DIR)) {
            const screenshots = fs.readdirSync(SCREENSHOTS_DIR)
                .filter(f => f.includes(test.name.replace(/\s+/g, '-')))
                .map(f => path.join(SCREENSHOTS_DIR, f));
            errorDetails.screenshots = screenshots;
        }

        errors.push(errorDetails);
        results.push(errorDetails);
    }
});

// Generate summary report
const summaryReport = {
    timestamp: new Date().toISOString(),
    environment: 'staging',
    url: STAGING_URL,
    totalTests: tests.length,
    passed: results.filter(r => r.status === 'PASSED').length,
    failed: errors.length,
    errors: errors,
    results: results
};

const reportFile = path.join(REPORT_DIR, `qa-validation-${TIMESTAMP}.json`);
fs.writeFileSync(reportFile, JSON.stringify(summaryReport, null, 2));

console.log('\n\n📊 QA Validation Summary');
console.log('━'.repeat(50));
console.log(`Total Tests: ${summaryReport.totalTests}`);
console.log(`✅ Passed: ${summaryReport.passed}`);
console.log(`❌ Failed: ${summaryReport.failed}`);
console.log(`📄 Report: ${reportFile}\n`);

// Create GitHub issues for errors
if (errors.length > 0) {
    console.log('🐛 Creating GitHub Issues for Errors...\n');

    errors.forEach((error, index) => {
        console.log(`[${index + 1}/${errors.length}] Creating issue: ${error.test}`);

        // Prepare issue body with evidence
        let issueBody = `## QA Validation Error - Staging Environment\n\n`;
        issueBody += `**Test**: ${error.test}\n`;
        issueBody += `**Description**: ${error.description}\n`;
        issueBody += `**Environment**: Staging (hml)\n`;
        issueBody += `**URL**: ${STAGING_URL}\n`;
        issueBody += `**Timestamp**: ${error.timestamp}\n\n`;

        issueBody += `### Error Details\n\n`;
        issueBody += `\`\`\`\n${error.error}\n\`\`\`\n\n`;

        if (error.stderr) {
            issueBody += `### Error Output\n\n`;
            issueBody += `\`\`\`\n${error.stderr.slice(0, 1000)}\n\`\`\`\n\n`;
        }

        if (error.screenshots.length > 0) {
            issueBody += `### Screenshots\n\n`;
            error.screenshots.forEach(screenshot => {
                issueBody += `- [${path.basename(screenshot)}](${screenshot})\n`;
            });
            issueBody += `\n`;
        }

        issueBody += `### Reproduction Steps\n\n`;
        issueBody += `1. Access staging environment: ${STAGING_URL}\n`;
        issueBody += `2. Execute test: \`${error.test}\`\n`;
        issueBody += `3. Observe error in console/UI\n\n`;

        issueBody += `### Expected Behavior\n\n`;
        issueBody += `${error.description} should work without errors.\n\n`;

        issueBody += `### Additional Context\n\n`;
        issueBody += `- Related PR: #217 (Frontend dependency consolidation)\n`;
        issueBody += `- Deployment: FASE 2 + Consolidation\n`;
        issueBody += `- Report: ${path.basename(reportFile)}\n\n`;

        issueBody += `---\n`;
        issueBody += `🤖 Auto-generated by QA validation script\n`;
        issueBody += `📋 Full report: \`${reportFile}\``;

        // Create issue title
        const issueTitle = `[QA] ${error.test} - Staging Validation Failure`;

        // Create GitHub issue using gh CLI
        try {
            const labels = 'bug,qa-validation,staging,medical-chat';
            // Properly escape backslashes first, then quotes (CWE-116 fix)
            const escapedBody = issueBody.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const createIssueCmd = `gh issue create --title "${issueTitle}" --body "${escapedBody}" --label "${labels}"`;

            const issueUrl = execSync(createIssueCmd, { encoding: 'utf-8' }).trim();
            console.log(`   ✅ Issue created: ${issueUrl}`);

            // Upload screenshots as comments if available
            if (error.screenshots.length > 0) {
                console.log(`   📸 Uploading ${error.screenshots.length} screenshot(s)...`);
                // Note: gh CLI doesn't support image uploads directly
                // Screenshots will be referenced by local path in issue
            }

        } catch (issueError) {
            console.log(`   ❌ Failed to create issue: ${issueError.message}`);
        }
    });

    console.log('\n❌ QA Validation FAILED - Issues created for errors');
    process.exit(1);

} else {
    console.log('✅ All tests passed! No issues to report.\n');
    process.exit(0);
}
