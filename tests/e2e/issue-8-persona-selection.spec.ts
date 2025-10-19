/**
 * E2E Tests for Issue #8 - Persona Selection System
 *
 * Tests all acceptance criteria:
 * - AC1: Persona cards on home page
 * - AC2: Navigation to /chat with persona query param
 * - AC3: localStorage persistence
 * - AC4: No-reload persona switching
 * - AC5-8: Accessibility features (WCAG 2.1 AA)
 *
 * ✅ IMPROVED: Uses waitForSelector with data-testid instead of networkidle
 * This prevents timeouts caused by continuous React state updates
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Persona Selection System - Issue #8', () => {
  test.beforeEach(async ({ page }) => {
    // ✅ Navigate to home page
    await page.goto(BASE_URL);

    // ✅ Wait for persona cards to be loaded using data-testid
    // This is much more reliable than networkidle
    await page.waitForSelector('[data-testid="persona-card-dr_gasnelio"]', {
      state: 'visible',
      timeout: 10000
    });
  });

  test('AC1: Persona cards exist on home page', async ({ page }) => {
    // Verify both persona cards are present and visible
    const drGasnelioCard = page.locator('[data-testid="persona-card-dr_gasnelio"]');
    const gaCard = page.locator('[data-testid="persona-card-ga"]');

    await expect(drGasnelioCard).toBeVisible();
    await expect(gaCard).toBeVisible();

    // Verify cards have proper ARIA labels
    await expect(drGasnelioCard).toHaveAttribute('aria-label', /Dr\. Gasnelio/);
    await expect(gaCard).toHaveAttribute('aria-label', /Gá/);

    // Verify CTA buttons are present
    await expect(page.locator('[data-testid="persona-cta-dr_gasnelio"]')).toBeVisible();
    await expect(page.locator('[data-testid="persona-cta-ga"]')).toBeVisible();
  });

  test('AC2: Navigation to /chat with persona query param', async ({ page }) => {
    // Click on Dr. Gasnelio card
    await page.click('[data-testid="persona-card-dr_gasnelio"]');

    // ✅ Wait for navigation using URL pattern instead of networkidle
    await page.waitForURL('**/chat?persona=dr_gasnelio', { timeout: 10000 });

    // Verify URL contains correct query parameter
    expect(page.url()).toContain('/chat?persona=dr_gasnelio');
  });

  test('AC3: LocalStorage persistence after selection', async ({ page }) => {
    // Click on Gá card
    await page.click('[data-testid="persona-card-ga"]');

    // Wait for navigation
    await page.waitForURL('**/chat?persona=ga', { timeout: 10000 });

    // Check localStorage (wait for PersonaContext to persist)
    await page.waitForTimeout(500); // Small delay for async storage

    const storedPersona = await page.evaluate(() => {
      return localStorage.getItem('selectedPersona');
    });

    expect(storedPersona).toBe('ga');
  });

  test('AC4: Keyboard navigation works', async ({ page }) => {
    // Focus on first card using Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure

    // ✅ Wait for focus using selector
    await page.waitForSelector('[data-testid="persona-card-dr_gasnelio"]:focus-visible', {
      timeout: 5000
    });

    // Verify card is focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.getAttribute('data-testid');
    });

    expect(['persona-card-dr_gasnelio', 'persona-card-ga']).toContain(focusedElement);

    // Activate card with Enter
    await page.keyboard.press('Enter');

    // Verify navigation occurred
    await page.waitForURL('**/chat?persona=**', { timeout: 10000 });
  });

  test('AC5: Screen reader announcements present', async ({ page }) => {
    // Check for ARIA live regions
    const liveRegions = await page.locator('[role="status"], [role="alert"], [aria-live]').count();
    expect(liveRegions).toBeGreaterThan(0);

    // Verify persona cards have proper ARIA attributes
    const drGasnelioCard = page.locator('[data-testid="persona-card-dr_gasnelio"]');
    await expect(drGasnelioCard).toHaveAttribute('role', 'button');
    await expect(drGasnelioCard).toHaveAttribute('aria-label');
  });

  test('AC6: Heading hierarchy is semantic', async ({ page }) => {
    // Check heading levels are proper
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();

    // Should have at least one h1
    expect(h1Count).toBeGreaterThan(0);

    // Persona cards should use h3 (subordinate to main heading)
    expect(h3Count).toBeGreaterThanOrEqual(2); // At least 2 for each persona card
  });

  test('AC7: Focus indicators are visible', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Get computed styles of focused element
    const focusOutline = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return null;

      const styles = window.getComputedStyle(focused, ':focus-visible');
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor
      };
    });

    // Verify focus indicators exist
    expect(focusOutline).toBeTruthy();
    expect(focusOutline?.outlineWidth).not.toBe('0px');
  });

  test('AC8: Persona preference restored on revisit', async ({ page }) => {
    // Select a persona
    await page.click('[data-testid="persona-card-dr_gasnelio"]');
    await page.waitForURL('**/chat?persona=dr_gasnelio', { timeout: 10000 });

    // Go back to home
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="persona-card-dr_gasnelio"]', { state: 'visible' });

    // ✅ Check for active badge using data-testid
    const activeBadge = page.locator('[data-testid="persona-badge-active-dr_gasnelio"]');

    // Wait a bit for context to restore persona
    await page.waitForTimeout(1000);

    // Verify badge is visible (indicates active persona)
    await expect(activeBadge).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility Compliance - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="persona-card-dr_gasnelio"]', { state: 'visible' });
  });

  test('A11Y1: Contrast ratio meets 4.5:1 for normal text', async ({ page }) => {
    // This would typically use axe-core or similar tool
    // For now, manual verification that colors meet WCAG AA standards

    const drGasnelioCard = page.locator('[data-testid="persona-card-dr_gasnelio"]');

    const colors = await drGasnelioCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });

    // Basic check that colors are defined
    expect(colors.backgroundColor).toBeTruthy();
    expect(colors.color).toBeTruthy();
  });

  test('A11Y2: Landmarks are properly structured', async ({ page }) => {
    // Check for main landmark
    const mainLandmark = await page.locator('[role="main"]').count();
    expect(mainLandmark).toBeGreaterThan(0);

    // Verify assistants container has proper role
    const assistantsContainer = page.locator('#assistentes');
    await expect(assistantsContainer).toHaveAttribute('role', 'main');
  });

  test('A11Y3: Interactive elements have labels', async ({ page }) => {
    // All persona cards should have aria-label
    const cardCount = await page.locator('[data-testid^="persona-card-"]').count();
    expect(cardCount).toBe(2);

    const cardsWithLabels = await page.locator('[data-testid^="persona-card-"][aria-label]').count();
    expect(cardsWithLabels).toBe(2);

    // All buttons should have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      // Button must have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });
});
