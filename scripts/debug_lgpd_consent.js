/**
 * Debug LGPD Consent Button
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Loading staging...');
    await page.goto('https://hml-frontend-4f2gjf6cua-uc.a.run.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await page.waitForTimeout(3000);

    console.log('\nSearching for LGPD consent button...');

    // Try different selectors
    const selectors = [
      'button:has-text("Concordo")',
      'button:has-text("Aceito")',
      'button:has-text("Concordo e Aceito")',
      '[data-testid="lgpd-consent-button"]',
      'button[type="button"]:has-text("Concordo")'
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      const visible = count > 0 ? await page.locator(selector).first().isVisible() : false;
      console.log(`  ${selector}: ${count} found, visible: ${visible}`);
    }

    // Get all buttons
    console.log('\nAll buttons on page:');
    const buttons = await page.$$('button');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      const visible = await buttons[i].isVisible();
      console.log(`  ${i + 1}. "${text?.trim()}" - visible: ${visible}`);
    }

    // Check LGPD modal/dialog
    console.log('\nChecking for LGPD modal...');
    const modal = await page.locator('[role="dialog"]').count();
    console.log(`  Dialogs found: ${modal}`);

    console.log('\n⏸️  Inspect browser for 30s...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
