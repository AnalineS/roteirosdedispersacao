/**
 * Test PersonaSwitch Visibility and Clickability
 */

const { chromium } = require('playwright');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app';

async function testPersonaSwitchVisibility() {
  console.log('🔍 Testing PersonaSwitch Visibility on Staging\n');

  const browser = await chromium.launch({ headless: false }); // visible browser
  const context = await browser.newContext();

  // Clear all storage before test
  await context.clearCookies();

  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to /chat and clear localStorage...');
    await page.goto(`${STAGING_URL}/chat`);

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      console.log('[TEST] LocalStorage cleared');
    });

    console.log('✓ LocalStorage cleared\n');

    // Reload page
    console.log('Step 2: Reload page after clearing storage...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('✓ Page reloaded\n');

    console.log('Step 3: Accept LGPD consent if present...');
    const lgpdButton = page.locator('button:has-text("Aceitar"), button:has-text("Concordo"), button:has-text("Entendi")').first();
    const lgpdVisible = await lgpdButton.isVisible().catch(() => false);

    if (lgpdVisible) {
      await lgpdButton.click();
      console.log('✓ LGPD consent accepted\n');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  No LGPD button found\n');
    }

    console.log('Step 4: Look for PersonaSwitch elements...');

    // Try different selectors
    const selectors = [
      '[data-testid="persona-selector"]',
      '[data-testid*="persona"]',
      'button:has-text("Dr. Gasnelio")',
      'button:has-text("Gá")',
      '[class*="persona"]',
      '[class*="PersonaSwitch"]'
    ];

    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      const visible = count > 0 ? await page.locator(selector).first().isVisible().catch(() => false) : false;
      console.log(`  ${selector}`);
      console.log(`    Count: ${count}, Visible: ${visible}`);
    }

    // Take screenshot
    console.log('\nStep 5: Taking screenshot...');
    await page.screenshot({
      path: 'persona_switch_test.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: persona_switch_test.png');

    // Wait for manual inspection
    console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

    await browser.close();
    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'error_persona_switch_test.png', fullPage: true });
    await browser.close();
    process.exit(1);
  }
}

testPersonaSwitchVisibility();
