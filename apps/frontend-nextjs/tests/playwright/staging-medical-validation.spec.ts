/**
 * STAGING MEDICAL VALIDATION TEST SUITE
 *
 * Comprehensive validation of medical chat functionality in staging environment
 * Testing both AI personas (Dr. Gasnelio & Gá) with focus on medical accuracy
 *
 * CRITICAL: Medical compliance with PCDT Hanseníase 2022 guidelines
 * Environment: https://hml-frontend-4f2gjf6cua-uc.a.run.app/
 */

import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test configuration
const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app/';
const SCREENSHOTS_DIR = join(__dirname, 'screenshots', 'staging-validation');
const REPORTS_DIR = join(__dirname, 'reports');
const MAX_RESPONSE_TIME = 3000; // 3 seconds per requirements

// Medical test scenarios from PCDT Hanseníase 2022
const MEDICAL_SCENARIOS = {
  dosing: {
    query: "Qual é a dose de rifampicina para paciente adulto com hanseníase paucibacilar?",
    expectedKeywords: ["600mg", "dose única mensal", "6 doses"],
    persona: "Dr. Gasnelio"
  },
  drugInteraction: {
    query: "Posso tomar rifampicina com anticoncepcional?",
    expectedKeywords: ["interação", "reduz eficácia", "contraceptivo"],
    persona: "Dr. Gasnelio"
  },
  sideEffects: {
    query: "Quais são os efeitos colaterais da dapsona?",
    expectedKeywords: ["anemia", "hemólise", "metahemoglobinemia"],
    persona: "Dr. Gasnelio"
  },
  patientFriendly: {
    query: "O que é reação hansênica e como sei se estou tendo?",
    expectedKeywords: ["sintomas", "pele", "nervos", "dor"],
    persona: "Gá"
  }
};

// Validation scoring system
interface ValidationScore {
  medicalAccuracy: number;
  responseTime: number;
  accessibility: number;
  personaConsistency: number;
  errorHandling: number;
  lgpdCompliance: number;
  overall: number;
}

interface TestResult {
  scenario: string;
  persona: string;
  passed: boolean;
  score: ValidationScore;
  errors: string[];
  warnings: string[];
  screenshots: string[];
  responseTime: number;
  timestamp: string;
}

const testResults: TestResult[] = [];

// Helper functions
function calculateOverallScore(score: Partial<ValidationScore>): number {
  const weights = {
    medicalAccuracy: 0.35,
    responseTime: 0.15,
    accessibility: 0.15,
    personaConsistency: 0.15,
    errorHandling: 0.10,
    lgpdCompliance: 0.10
  };

  return Math.round(
    (score.medicalAccuracy || 0) * weights.medicalAccuracy +
    (score.responseTime || 0) * weights.responseTime +
    (score.accessibility || 0) * weights.accessibility +
    (score.personaConsistency || 0) * weights.personaConsistency +
    (score.errorHandling || 0) * weights.errorHandling +
    (score.lgpdCompliance || 0) * weights.lgpdCompliance
  );
}

async function captureScreenshot(page: Page, name: string): Promise<string> {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function validateAccessibility(page: Page): Promise<{ score: number; issues: string[] }> {
  const issues: string[] = [];
  let score = 100;

  // Check for WCAG 2.1 AA compliance indicators
  const hasSkipLink = await page.locator('a[href="#main-content"]').count() > 0;
  if (!hasSkipLink) {
    issues.push('Missing skip to main content link');
    score -= 15;
  }

  // Check ARIA labels on interactive elements
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const ariaLabel = await button.getAttribute('aria-label');
    const text = await button.textContent();
    if (!ariaLabel && !text?.trim()) {
      issues.push('Button without accessible label found');
      score -= 10;
      break;
    }
  }

  // Check form inputs have labels
  const inputs = await page.locator('input, textarea').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;

    if (!hasLabel && !ariaLabel) {
      issues.push('Form input without accessible label');
      score -= 10;
      break;
    }
  }

  // Check heading hierarchy
  const h1Count = await page.locator('h1').count();
  if (h1Count !== 1) {
    issues.push(`Incorrect h1 count: ${h1Count} (should be 1)`);
    score -= 10;
  }

  // Check color contrast (basic check - look for contrast warnings in dev tools)
  const contrastIssues = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    let issues = 0;
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const color = style.color;
      // Simple heuristic: warn if both bg and text are very light or very dark
      if ((bg.includes('255, 255, 255') && color.includes('200')) ||
          (bg.includes('0, 0, 0') && color.includes('50'))) {
        issues++;
      }
    });
    return issues;
  });

  if (contrastIssues > 0) {
    issues.push(`Potential color contrast issues detected: ${contrastIssues} elements`);
    score -= Math.min(20, contrastIssues * 2);
  }

  return { score: Math.max(0, score), issues };
}

async function checkLGPDCompliance(page: Page, responseText: string): Promise<{ score: number; issues: string[] }> {
  const issues: string[] = [];
  let score = 100;

  // Check for PII patterns in response (CPF, phone, email)
  const piiPatterns = [
    { pattern: /\d{3}\.\d{3}\.\d{3}-\d{2}/, name: 'CPF' },
    { pattern: /\(\d{2}\)\s?\d{4,5}-\d{4}/, name: 'Phone' },
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, name: 'Email' }
  ];

  for (const { pattern, name } of piiPatterns) {
    if (pattern.test(responseText)) {
      issues.push(`Potential PII leakage detected: ${name}`);
      score -= 30;
    }
  }

  // Check for privacy policy link
  const privacyLink = await page.locator('a[href*="privacidade"], a:has-text("Privacidade")').count();
  if (privacyLink === 0) {
    issues.push('Privacy policy link not found');
    score -= 20;
  }

  // Check for data collection consent
  const cookieConsent = await page.locator('[data-testid*="cookie"], [class*="cookie-consent"]').count();
  if (cookieConsent === 0) {
    issues.push('Cookie consent mechanism not visible');
    score -= 15;
  }

  return { score: Math.max(0, score), issues };
}

async function validateMedicalAccuracy(
  responseText: string,
  expectedKeywords: string[]
): Promise<{ score: number; missing: string[] }> {
  const normalizedResponse = responseText.toLowerCase();
  const missing: string[] = [];

  expectedKeywords.forEach(keyword => {
    if (!normalizedResponse.includes(keyword.toLowerCase())) {
      missing.push(keyword);
    }
  });

  const score = Math.round((1 - missing.length / expectedKeywords.length) * 100);
  return { score, missing };
}

async function switchPersona(page: Page, personaName: string): Promise<void> {
  // Convert persona name to ID format
  const personaMap: Record<string, string> = {
    'Dr. Gasnelio': 'dr_gasnelio',
    'Gá': 'ga',
    'dr_gasnelio': 'dr_gasnelio',
    'ga': 'ga'
  };

  const targetPersonaId = personaMap[personaName] || personaName.toLowerCase().replace(/\s+/g, '_');

  // Look for the persona selector container
  const personaSelector = page.locator('[data-testid="persona-selector"]');

  if (await personaSelector.count() === 0) {
    throw new Error('Persona selector not found on page - check that data-testid="persona-selector" exists');
  }

  // The PersonaSwitch is a toggle button - click it to switch between personas
  // It shows the current persona, so we need to click if we're not already on the target
  const toggleButton = personaSelector.locator('button[role="radio"]');

  // Get current persona from data-testid
  const currentPersonaTestId = await toggleButton.getAttribute('data-testid');
  const currentPersona = currentPersonaTestId?.replace('persona-option-', '');

  // Only click if we need to switch
  if (currentPersona !== targetPersonaId) {
    await toggleButton.click();

    // Wait for transition to complete
    await page.waitForTimeout(300);

    // Verify the switch occurred
    const newPersonaTestId = await toggleButton.getAttribute('data-testid');
    const newPersona = newPersonaTestId?.replace('persona-option-', '');

    if (newPersona !== targetPersonaId) {
      throw new Error(`Persona switch failed: expected ${targetPersonaId}, got ${newPersona}`);
    }
  }

  // Wait for any state updates to complete
  await page.waitForTimeout(200);
}

async function sendMessage(page: Page, message: string): Promise<{ responseText: string; responseTime: number }> {
  const startTime = Date.now();

  // Find message input
  const messageInput = page.locator('textarea, input[type="text"]').last();
  await messageInput.fill(message);

  // Find and click send button
  const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")').last();
  await sendButton.click();

  // Wait for response to appear
  const responseLocator = page.locator('[data-testid*="message"], [class*="message"]').last();
  await responseLocator.waitFor({ timeout: MAX_RESPONSE_TIME + 2000 });

  const responseTime = Date.now() - startTime;
  const responseText = await responseLocator.textContent() || '';

  return { responseText, responseTime };
}

// Test suite setup
test.beforeAll(() => {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  mkdirSync(REPORTS_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  // Strategy compatible with Next.js 15 App Router streaming architecture
  // Issue #219: networkidle incompatible with persistent prefetch connections
  await page.goto(STAGING_URL, {
    waitUntil: 'domcontentloaded', // DOM ready for interaction (SSR/SSG compatible)
    timeout: 60000 // Accommodates Cloud Run cold starts (5-15s typical)
  });

  // Wait for full page load
  await page.waitForLoadState('load');

  // Ensure complete document readiness
  await page.waitForFunction(() => document.readyState === 'complete', {
    timeout: 10000
  });
});

test.afterAll(() => {
  // Generate comprehensive report
  const report = {
    environment: STAGING_URL,
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length,
      averageScore: testResults.reduce((sum, r) => sum + r.score.overall, 0) / testResults.length
    },
    results: testResults
  };

  const reportPath = join(REPORTS_DIR, `staging-validation-${new Date().toISOString().split('T')[0]}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== VALIDATION REPORT ===');
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Average Score: ${report.summary.averageScore.toFixed(2)}/100`);
  console.log(`Report saved to: ${reportPath}`);
});

// Test 1: Dr. Gasnelio - Medication Dosing Query
test('Medical Accuracy: Rifampicina dosing for paucibacilar hanseníase', async ({ page }) => {
  const scenario = MEDICAL_SCENARIOS.dosing;
  const result: TestResult = {
    scenario: 'Rifampicina dosing query',
    persona: scenario.persona,
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // Switch to Dr. Gasnelio
    await switchPersona(page, scenario.persona);
    result.screenshots.push(await captureScreenshot(page, 'dosing-persona-switch'));

    // Send medical query
    const { responseText, responseTime } = await sendMessage(page, scenario.query);
    result.responseTime = responseTime;
    result.screenshots.push(await captureScreenshot(page, 'dosing-response'));

    // Validate response time
    result.score.responseTime = responseTime <= MAX_RESPONSE_TIME ? 100 : Math.max(0, 100 - (responseTime - MAX_RESPONSE_TIME) / 100);
    if (responseTime > MAX_RESPONSE_TIME) {
      result.warnings.push(`Response time ${responseTime}ms exceeds ${MAX_RESPONSE_TIME}ms threshold`);
    }

    // Validate medical accuracy
    const { score: medicalScore, missing } = await validateMedicalAccuracy(responseText, scenario.expectedKeywords);
    result.score.medicalAccuracy = medicalScore;
    if (missing.length > 0) {
      result.errors.push(`Missing expected medical terms: ${missing.join(', ')}`);
    }

    // Validate accessibility
    const { score: a11yScore, issues: a11yIssues } = await validateAccessibility(page);
    result.score.accessibility = a11yScore;
    result.warnings.push(...a11yIssues);

    // Validate LGPD compliance
    const { score: lgpdScore, issues: lgpdIssues } = await checkLGPDCompliance(page, responseText);
    result.score.lgpdCompliance = lgpdScore;
    if (lgpdIssues.length > 0) {
      result.errors.push(...lgpdIssues);
    }

    // Persona consistency check (technical language expected)
    const technicalTerms = ['dose', 'mg', 'mensal', 'tratamento'];
    const foundTerms = technicalTerms.filter(term => responseText.toLowerCase().includes(term));
    result.score.personaConsistency = (foundTerms.length / technicalTerms.length) * 100;

    // Error handling score (no errors occurred)
    result.score.errorHandling = 100;

    // Calculate overall score
    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.overall >= 70 && result.score.medicalAccuracy >= 80;

    expect(result.score.medicalAccuracy).toBeGreaterThanOrEqual(80);
    expect(result.score.overall).toBeGreaterThanOrEqual(70);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'dosing-error'));
    result.score.errorHandling = 0;
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 2: Dr. Gasnelio - Drug Interaction Warning
test('Medical Accuracy: Rifampicina drug interaction with contraceptives', async ({ page }) => {
  const scenario = MEDICAL_SCENARIOS.drugInteraction;
  const result: TestResult = {
    scenario: 'Drug interaction query',
    persona: scenario.persona,
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    await switchPersona(page, scenario.persona);
    result.screenshots.push(await captureScreenshot(page, 'interaction-persona-switch'));

    const { responseText, responseTime } = await sendMessage(page, scenario.query);
    result.responseTime = responseTime;
    result.screenshots.push(await captureScreenshot(page, 'interaction-response'));

    // Response time validation
    result.score.responseTime = responseTime <= MAX_RESPONSE_TIME ? 100 : Math.max(0, 100 - (responseTime - MAX_RESPONSE_TIME) / 100);

    // Medical accuracy validation
    const { score: medicalScore, missing } = await validateMedicalAccuracy(responseText, scenario.expectedKeywords);
    result.score.medicalAccuracy = medicalScore;
    if (missing.length > 0) {
      result.errors.push(`Missing expected interaction warnings: ${missing.join(', ')}`);
    }

    // Accessibility validation
    const { score: a11yScore, issues: a11yIssues } = await validateAccessibility(page);
    result.score.accessibility = a11yScore;
    result.warnings.push(...a11yIssues);

    // LGPD compliance
    const { score: lgpdScore, issues: lgpdIssues } = await checkLGPDCompliance(page, responseText);
    result.score.lgpdCompliance = lgpdScore;
    if (lgpdIssues.length > 0) {
      result.errors.push(...lgpdIssues);
    }

    // Persona consistency - should include warning/alert language
    const warningIndicators = ['atenção', 'cuidado', 'importante', 'reduz', 'interferir'];
    const foundWarnings = warningIndicators.filter(term => responseText.toLowerCase().includes(term));
    result.score.personaConsistency = (foundWarnings.length / warningIndicators.length) * 100;

    result.score.errorHandling = 100;
    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.overall >= 70 && result.score.medicalAccuracy >= 80;

    expect(result.score.medicalAccuracy).toBeGreaterThanOrEqual(80);
    expect(result.score.overall).toBeGreaterThanOrEqual(70);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'interaction-error'));
    result.score.errorHandling = 0;
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 3: Dr. Gasnelio - Side Effects Information
test('Medical Accuracy: Dapsona side effects information', async ({ page }) => {
  const scenario = MEDICAL_SCENARIOS.sideEffects;
  const result: TestResult = {
    scenario: 'Side effects query',
    persona: scenario.persona,
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    await switchPersona(page, scenario.persona);
    result.screenshots.push(await captureScreenshot(page, 'sideeffects-persona-switch'));

    const { responseText, responseTime } = await sendMessage(page, scenario.query);
    result.responseTime = responseTime;
    result.screenshots.push(await captureScreenshot(page, 'sideeffects-response'));

    result.score.responseTime = responseTime <= MAX_RESPONSE_TIME ? 100 : Math.max(0, 100 - (responseTime - MAX_RESPONSE_TIME) / 100);

    const { score: medicalScore, missing } = await validateMedicalAccuracy(responseText, scenario.expectedKeywords);
    result.score.medicalAccuracy = medicalScore;
    if (missing.length > 0) {
      result.errors.push(`Missing expected side effects: ${missing.join(', ')}`);
    }

    const { score: a11yScore, issues: a11yIssues } = await validateAccessibility(page);
    result.score.accessibility = a11yScore;
    result.warnings.push(...a11yIssues);

    const { score: lgpdScore, issues: lgpdIssues } = await checkLGPDCompliance(page, responseText);
    result.score.lgpdCompliance = lgpdScore;
    if (lgpdIssues.length > 0) {
      result.errors.push(...lgpdIssues);
    }

    // Persona consistency - technical medical terminology
    const medicalTerms = ['efeito', 'adverso', 'reação', 'paciente'];
    const foundTerms = medicalTerms.filter(term => responseText.toLowerCase().includes(term));
    result.score.personaConsistency = (foundTerms.length / medicalTerms.length) * 100;

    result.score.errorHandling = 100;
    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.overall >= 70 && result.score.medicalAccuracy >= 80;

    expect(result.score.medicalAccuracy).toBeGreaterThanOrEqual(80);
    expect(result.score.overall).toBeGreaterThanOrEqual(70);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'sideeffects-error'));
    result.score.errorHandling = 0;
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 4: Gá - Patient-Friendly Explanation
test('Persona Validation: Gá empathetic patient-friendly response', async ({ page }) => {
  const scenario = MEDICAL_SCENARIOS.patientFriendly;
  const result: TestResult = {
    scenario: 'Patient-friendly explanation',
    persona: scenario.persona,
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    await switchPersona(page, scenario.persona);
    result.screenshots.push(await captureScreenshot(page, 'empathetic-persona-switch'));

    const { responseText, responseTime } = await sendMessage(page, scenario.query);
    result.responseTime = responseTime;
    result.screenshots.push(await captureScreenshot(page, 'empathetic-response'));

    result.score.responseTime = responseTime <= MAX_RESPONSE_TIME ? 100 : Math.max(0, 100 - (responseTime - MAX_RESPONSE_TIME) / 100);

    const { score: medicalScore, missing } = await validateMedicalAccuracy(responseText, scenario.expectedKeywords);
    result.score.medicalAccuracy = medicalScore;
    if (missing.length > 0) {
      result.warnings.push(`Missing some expected terms (acceptable for patient-friendly): ${missing.join(', ')}`);
    }

    const { score: a11yScore, issues: a11yIssues } = await validateAccessibility(page);
    result.score.accessibility = a11yScore;
    result.warnings.push(...a11yIssues);

    const { score: lgpdScore, issues: lgpdIssues } = await checkLGPDCompliance(page, responseText);
    result.score.lgpdCompliance = lgpdScore;
    if (lgpdIssues.length > 0) {
      result.errors.push(...lgpdIssues);
    }

    // Persona consistency - empathetic, simple language
    const empatheticIndicators = ['você', 'sentir', 'normal', 'ajudar', 'importante'];
    const foundEmpathy = empatheticIndicators.filter(term => responseText.toLowerCase().includes(term));
    result.score.personaConsistency = (foundEmpathy.length / empatheticIndicators.length) * 100;

    // Check for absence of overly technical jargon
    const technicalJargon = ['hemólise', 'metahemoglobinemia', 'farmacocinética'];
    const foundJargon = technicalJargon.filter(term => responseText.toLowerCase().includes(term));
    if (foundJargon.length > 0) {
      result.warnings.push(`Technical jargon found in patient-friendly response: ${foundJargon.join(', ')}`);
      result.score.personaConsistency -= 20;
    }

    result.score.errorHandling = 100;
    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.overall >= 70 && result.score.personaConsistency >= 60;

    expect(result.score.personaConsistency).toBeGreaterThanOrEqual(60);
    expect(result.score.overall).toBeGreaterThanOrEqual(70);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'empathetic-error'));
    result.score.errorHandling = 0;
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 5: Error Handling - Network Failure Simulation
test('Error Handling: Network failure recovery', async ({ page }) => {
  const result: TestResult = {
    scenario: 'Network failure handling',
    persona: 'N/A',
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // Simulate network failure
    await page.route('**/api/chat', route => route.abort('failed'));
    result.screenshots.push(await captureScreenshot(page, 'network-failure-setup'));

    const startTime = Date.now();
    const messageInput = page.locator('textarea, input[type="text"]').last();
    await messageInput.fill('Test message during network failure');

    const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")').last();
    await sendButton.click();

    // Wait for error message to appear
    const errorMessage = page.locator('[data-testid*="error"], [class*="error"], text=/erro|falha|problema/i').first();
    await errorMessage.waitFor({ timeout: 5000 }).catch(() => {
      result.errors.push('No error message displayed to user');
    });

    result.responseTime = Date.now() - startTime;
    result.screenshots.push(await captureScreenshot(page, 'network-failure-error'));

    // Validate error handling
    const errorDisplayed = await errorMessage.count() > 0;
    const errorText = errorDisplayed ? await errorMessage.textContent() : '';

    if (errorDisplayed) {
      result.score.errorHandling = 100;

      // Check if error message is user-friendly
      if (errorText && !errorText.match(/500|timeout|failed|undefined/i)) {
        result.score.errorHandling += 20; // Bonus for user-friendly message
      }
    } else {
      result.score.errorHandling = 0;
      result.errors.push('No error feedback provided to user');
    }

    // Restore network
    await page.unroute('**/api/chat');
    result.screenshots.push(await captureScreenshot(page, 'network-restored'));

    // Accessibility check
    const { score: a11yScore, issues: a11yIssues } = await validateAccessibility(page);
    result.score.accessibility = a11yScore;
    result.warnings.push(...a11yIssues);

    result.score.responseTime = 100; // Not applicable for error test
    result.score.medicalAccuracy = 100; // Not applicable
    result.score.personaConsistency = 100; // Not applicable
    result.score.lgpdCompliance = 100; // Not applicable

    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.errorHandling >= 80;

    expect(result.score.errorHandling).toBeGreaterThanOrEqual(80);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'network-failure-test-error'));
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 6: Performance - Concurrent User Simulation
test('Performance: Response time under load', async ({ page, browser }) => {
  const result: TestResult = {
    scenario: 'Concurrent user load',
    persona: 'Dr. Gasnelio',
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // Simulate 3 concurrent users
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    // Navigate all pages
    await Promise.all(pages.map(p => p.goto(STAGING_URL)));
    await Promise.all(pages.map(p => p.waitForLoadState('networkidle')));

    result.screenshots.push(await captureScreenshot(page, 'load-test-setup'));

    // Send concurrent queries
    const startTime = Date.now();
    const responses = await Promise.all(
      pages.map(async (p, i) => {
        try {
          await switchPersona(p, 'Dr. Gasnelio');
          const query = "Qual a dose de rifampicina para adulto?";
          return await sendMessage(p, query);
        } catch (error) {
          return { responseText: '', responseTime: 0, error: String(error) };
        }
      })
    );

    const totalTime = Date.now() - startTime;
    result.responseTime = totalTime / responses.length; // Average response time

    result.screenshots.push(await captureScreenshot(page, 'load-test-complete'));

    // Validate all responses succeeded
    const successfulResponses = responses.filter(r => r.responseText.length > 0);
    const errorResponses = responses.filter(r => 'error' in r);

    if (errorResponses.length > 0) {
      result.errors.push(`${errorResponses.length} concurrent requests failed`);
    }

    // Score based on success rate and response time
    const successRate = (successfulResponses.length / responses.length) * 100;
    result.score.errorHandling = successRate;

    const avgResponseTime = successfulResponses.reduce((sum, r) => sum + r.responseTime, 0) / successfulResponses.length;
    result.score.responseTime = avgResponseTime <= MAX_RESPONSE_TIME * 1.5 ? 100 : Math.max(0, 100 - (avgResponseTime - MAX_RESPONSE_TIME * 1.5) / 100);

    if (avgResponseTime > MAX_RESPONSE_TIME * 1.5) {
      result.warnings.push(`Average response time ${avgResponseTime}ms exceeds acceptable threshold under load`);
    }

    result.score.medicalAccuracy = 100; // Not evaluated in load test
    result.score.personaConsistency = 100; // Not evaluated
    result.score.accessibility = 100; // Not evaluated
    result.score.lgpdCompliance = 100; // Not evaluated

    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.errorHandling >= 80 && result.score.responseTime >= 60;

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));

    expect(result.score.errorHandling).toBeGreaterThanOrEqual(80);
    expect(result.score.responseTime).toBeGreaterThanOrEqual(60);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'load-test-error'));
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 7: Accessibility - Keyboard Navigation
test('Accessibility: Complete keyboard navigation', async ({ page }) => {
  const result: TestResult = {
    scenario: 'Keyboard navigation',
    persona: 'N/A',
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    result.screenshots.push(await captureScreenshot(page, 'keyboard-nav-start'));

    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    result.screenshots.push(await captureScreenshot(page, 'keyboard-nav-first-tab'));

    if (!focusedElement || focusedElement === 'BODY') {
      result.errors.push('Tab navigation does not focus on interactive elements');
      result.score.accessibility -= 25;
    }

    // Navigate through interactive elements
    let tabCount = 0;
    const maxTabs = 20;
    const focusedElements: string[] = [];

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      const element = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}` : 'NONE';
      });
      focusedElements.push(element);
      tabCount++;

      // Check if we've cycled back to the first element
      if (tabCount > 1 && element === focusedElements[0]) {
        break;
      }
    }

    result.screenshots.push(await captureScreenshot(page, 'keyboard-nav-complete'));

    // Validate focus indicators are visible
    const hasFocusIndicators = await page.evaluate(() => {
      const styles = getComputedStyle(document.activeElement!);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    if (!hasFocusIndicators) {
      result.errors.push('Focus indicators not visible for keyboard navigation');
      result.score.accessibility -= 25;
    }

    // Test Enter key to activate elements
    const sendButton = page.locator('button[type="submit"], button:has-text("Enviar")').last();
    await sendButton.focus();
    await page.keyboard.press('Enter');

    result.screenshots.push(await captureScreenshot(page, 'keyboard-nav-activation'));

    // Run comprehensive accessibility validation
    const { score: a11yScore, issues: a11yIssues } = await validateAccessibility(page);
    result.score.accessibility = Math.max(0, a11yScore - result.errors.length * 10);
    result.warnings.push(...a11yIssues);

    result.score.medicalAccuracy = 100; // Not applicable
    result.score.responseTime = 100; // Not applicable
    result.score.personaConsistency = 100; // Not applicable
    result.score.errorHandling = 100; // Not applicable
    result.score.lgpdCompliance = 100; // Not applicable

    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.accessibility >= 80;

    expect(result.score.accessibility).toBeGreaterThanOrEqual(80);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'keyboard-nav-error'));
    throw error;
  } finally {
    testResults.push(result);
  }
});

// Test 8: LGPD Compliance - No PII Leakage
test('LGPD Compliance: PII protection validation', async ({ page }) => {
  const result: TestResult = {
    scenario: 'LGPD PII protection',
    persona: 'Dr. Gasnelio',
    passed: false,
    score: {
      medicalAccuracy: 0,
      responseTime: 0,
      accessibility: 0,
      personaConsistency: 0,
      errorHandling: 0,
      lgpdCompliance: 0,
      overall: 0
    },
    errors: [],
    warnings: [],
    screenshots: [],
    responseTime: 0,
    timestamp: new Date().toISOString()
  };

  try {
    await switchPersona(page, 'Dr. Gasnelio');
    result.screenshots.push(await captureScreenshot(page, 'lgpd-test-start'));

    // Send query with potential PII triggers
    const piiQuery = "Paciente João Silva, CPF 123.456.789-00, teve reação hansênica. O que fazer?";
    const { responseText, responseTime } = await sendMessage(page, piiQuery);
    result.responseTime = responseTime;

    result.screenshots.push(await captureScreenshot(page, 'lgpd-test-response'));

    // Validate LGPD compliance in response
    const { score: lgpdScore, issues: lgpdIssues } = await checkLGPDCompliance(page, responseText);
    result.score.lgpdCompliance = lgpdScore;

    if (lgpdIssues.length > 0) {
      result.errors.push(...lgpdIssues);
    }

    // Check browser console for PII leakage
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    await page.waitForTimeout(2000); // Wait for any async logging

    const piiInLogs = consoleLogs.some(log =>
      log.includes('123.456.789-00') ||
      log.includes('João Silva') ||
      /\d{3}\.\d{3}\.\d{3}-\d{2}/.test(log)
    );

    if (piiInLogs) {
      result.errors.push('PII detected in console logs - LGPD violation');
      result.score.lgpdCompliance = 0;
    }

    // Check network requests for PII
    const requests: string[] = [];
    page.on('request', req => requests.push(req.url() + ' ' + req.postData()));

    await page.waitForTimeout(1000);

    const piiInRequests = requests.some(req =>
      req.includes('123.456.789-00') && !req.includes('encrypted')
    );

    if (piiInRequests) {
      result.errors.push('Unencrypted PII in network requests - LGPD violation');
      result.score.lgpdCompliance = Math.min(result.score.lgpdCompliance, 30);
    }

    result.screenshots.push(await captureScreenshot(page, 'lgpd-test-complete'));

    result.score.medicalAccuracy = 100; // Not primary focus
    result.score.responseTime = 100;
    result.score.accessibility = 100;
    result.score.personaConsistency = 100;
    result.score.errorHandling = 100;

    result.score.overall = calculateOverallScore(result.score);
    result.passed = result.score.lgpdCompliance >= 90;

    expect(result.score.lgpdCompliance).toBeGreaterThanOrEqual(90);

  } catch (error) {
    result.errors.push(`Test execution failed: ${error}`);
    result.screenshots.push(await captureScreenshot(page, 'lgpd-test-error'));
    throw error;
  } finally {
    testResults.push(result);
  }
});
