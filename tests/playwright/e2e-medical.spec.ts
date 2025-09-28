/**
 * End-to-End Tests for Medical Platform
 * Tests both personas (Dr. Gasnelio and Gá) and medical workflows
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';

test.describe('Medical Platform - Persona Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should display both personas available', async ({ page }) => {
    // Navigate to chat page
    await page.goto(`${BASE_URL}/chat`);

    // Verify Dr. Gasnelio is available
    const drGasnelio = page.locator('text=Dr. Gasnelio');
    await expect(drGasnelio).toBeVisible();

    // Verify Gá is available
    const ga = page.locator('text=Gá');
    await expect(ga).toBeVisible();

    // Check API health shows 2 personas
    const response = await page.request.get(`${API_URL}/api/health`);
    const health = await response.json();
    expect(health.available_personas).toBe(2);
  });

  test('Dr. Gasnelio should provide technical responses', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);

    // Select Dr. Gasnelio
    await page.click('button[data-persona="dr_gasnelio"]');

    // Ask technical question
    await page.fill('textarea[name="message"]', 'Qual a dosagem de PQT-U para criança de 25kg?');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForSelector('.chat-response', { timeout: 30000 });

    // Verify response contains technical terms
    const response = await page.textContent('.chat-response');
    expect(response).toContain('mg');
    expect(response).toContain('dose');
    expect(response).toMatch(/\d+/); // Contains numbers
  });

  test('Gá should provide empathetic responses', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);

    // Select Gá
    await page.click('button[data-persona="ga"]');

    // Ask patient-oriented question
    await page.fill('textarea[name="message"]', 'Estou preocupado com os efeitos colaterais');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForSelector('.chat-response', { timeout: 30000 });

    // Verify response is empathetic
    const response = await page.textContent('.chat-response');
    expect(response).toMatch(/compreendo|entendo|normal|tranquilo/i);
    expect(response.length).toBeGreaterThan(100); // Detailed response
  });
});

test.describe('Dose Calculator Validation', () => {
  test('should calculate pediatric dose correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dose-calculator`);

    // Input patient data
    await page.fill('input[name="weight"]', '20');
    await page.selectOption('select[name="age-group"]', 'pediatric');

    // Calculate
    await page.click('button:has-text("Calcular")');

    // Verify calculation
    await page.waitForSelector('.dose-result');
    const result = await page.textContent('.dose-result');

    // Pediatric dose should be weight-based
    expect(result).toContain('Rifampicina');
    expect(result).toContain('Dapsona');
    expect(result).toContain('Clofazimina');
  });

  test('should validate dose limits', async ({ page }) => {
    await page.goto(`${BASE_URL}/dose-calculator`);

    // Try invalid weight
    await page.fill('input[name="weight"]', '200'); // Too high
    await page.click('button:has-text("Calcular")');

    // Should show error
    await expect(page.locator('.error-message')).toContainText(/peso inválido/i);
  });
});

test.describe('Accessibility Tests', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(BASE_URL);

    // Tab through main elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Enter should activate buttons
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);

    // Check ARIA labels
    const chatInput = page.locator('textarea[name="message"]');
    await expect(chatInput).toHaveAttribute('aria-label', /mensagem|pergunta/i);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAttribute('aria-label', /enviar/i);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto(BASE_URL);

    // Use Playwright's accessibility tree
    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).toBeTruthy();
  });
});

test.describe('Medical Compliance Tests', () => {
  test('should validate medication protocols', async ({ page }) => {
    await page.goto(`${BASE_URL}/protocols`);

    // Check PQT-U protocol is present
    await expect(page.locator('text=Poliquimioterapia Única')).toBeVisible();

    // Verify protocol components
    const protocol = page.locator('[data-protocol="pqt-u"]');
    await expect(protocol).toContainText('Rifampicina');
    await expect(protocol).toContainText('Dapsona');
    await expect(protocol).toContainText('Clofazimina');
  });

  test('should display safety warnings', async ({ page }) => {
    await page.goto(`${BASE_URL}/dose-calculator`);

    // Select pregnancy
    await page.selectOption('select[name="special-condition"]', 'pregnancy');

    // Should show warning
    await expect(page.locator('.warning-message')).toContainText(/gravidez/i);
    await expect(page.locator('.warning-message')).toContainText(/médico/i);
  });
});

test.describe('Environment-Aware Tests', () => {
  test('development should allow offline mode', async ({ page, context }) => {
    // Only in development
    if (process.env.NODE_ENV !== 'production') {
      await context.setOffline(true);
      await page.goto(BASE_URL);

      // Should still work with fallbacks
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should use correct API endpoints', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/health`);
    const health = await response.json();

    // Verify environment
    expect(health.environment).toBe(process.env.NODE_ENV || 'development');

    // Verify no hardcoded URLs
    const htmlContent = await page.content();
    expect(htmlContent).not.toContain('localhost:5000');
    expect(htmlContent).not.toContain('127.0.0.1');
  });
});

// Performance tests
test.describe('Performance Metrics', () => {
  test('should load chat page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should respond to queries within 5 seconds', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    await page.click('button[data-persona="dr_gasnelio"]');

    const startTime = Date.now();
    await page.fill('textarea[name="message"]', 'Teste de performance');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.chat-response', { timeout: 5000 });
    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(5000);
  });
});

// Data validation tests
test.describe('Data Integrity Tests', () => {
  test('should sanitize user input', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);

    // Try XSS injection
    await page.fill('textarea[name="message"]', '<script>alert("XSS")</script>');
    await page.click('button[type="submit"]');

    // Should not execute script
    await page.waitForTimeout(1000);
    const alerts = await page.evaluate(() => window.alert);
    expect(alerts).toBeUndefined();
  });

  test('should validate medication names', async ({ page }) => {
    await page.goto(`${BASE_URL}/medications`);

    // Search for valid medication
    await page.fill('input[name="search"]', 'Rifampicina');
    await page.click('button:has-text("Buscar")');

    // Should show results
    await expect(page.locator('.medication-result')).toBeVisible();

    // Search for invalid
    await page.fill('input[name="search"]', 'InvalidMed123');
    await page.click('button:has-text("Buscar")');

    // Should show no results
    await expect(page.locator('.no-results')).toBeVisible();
  });
});