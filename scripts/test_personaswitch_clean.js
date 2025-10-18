/**
 * Test PersonaSwitch with clean localStorage
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing PersonaSwitch with fresh state...\n');

    // Navigate
    await page.goto('https://hml-frontend-4f2gjf6cua-uc.a.run.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await page.waitForTimeout(2000);

    // Clear all storage
    console.log('1️⃣ Clearing localStorage and reloading...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check for LGPD modal
    console.log('2️⃣ Checking for LGPD consent modal...');
    const lgpdModal = await page.locator('[role="dialog"]').count();
    console.log(`   Modals found: ${lgpdModal}`);

    if (lgpdModal > 0) {
      console.log('   ✅ LGPD modal present');

      // Find consent button
      const consentBtn = page.locator('button').filter({ hasText: /aceito|concordo/i });
      const btnCount = await consentBtn.count();
      console.log(`   Consent buttons: ${btnCount}`);

      if (btnCount > 0) {
        console.log('   Clicking consent button...');
        await consentBtn.first().click();
        await page.waitForTimeout(2000);

        const consentGranted = await page.evaluate(() =>
          localStorage.getItem('lgpd_consent_granted')
        );
        console.log(`   Consent granted: ${consentGranted}`);
      }
    } else {
      console.log('   ⚠️  No LGPD modal - checking if already consented');
      const alreadyConsented = await page.evaluate(() =>
        localStorage.getItem('lgpd_consent_granted') === 'true'
      );
      console.log(`   Already consented: ${alreadyConsented}`);
    }

    // Check personas loaded
    console.log('\n3️⃣ Checking personas loaded...');
    const personasData = await page.evaluate(() => ({
      cache: localStorage.getItem('personas_cache') !== null,
      cacheCount: (() => {
        const cache = localStorage.getItem('personas_cache');
        return cache ? Object.keys(JSON.parse(cache)).length : 0;
      })()
    }));
    console.log(`   Personas cached: ${personasData.cache}`);
    console.log(`   Personas count: ${personasData.cacheCount}`);

    // Look for PersonaSwitch
    console.log('\n4️⃣ Looking for PersonaSwitch...');

    // Try different selectors
    const selectors = [
      '[data-testid="persona-switcher"]',
      '[data-testid="persona-switch"]',
      'button[aria-label*="persona"]',
      'button[aria-label*="Persona"]'
    ];

    let found = false;
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const visible = await page.locator(selector).first().isVisible();
        console.log(`   ${selector}: ${count} found, visible: ${visible}`);
        if (visible) found = true;
      }
    }

    if (!found) {
      console.log('   ❌ PersonaSwitch not found with standard selectors');

      // Debug: Check what persona-related elements exist
      console.log('\n   Searching for any persona-related text...');
      const personaText = await page.locator('text=/persona/i').count();
      console.log(`   Elements with "persona" text: ${personaText}`);
    } else {
      console.log('   ✅ PersonaSwitch found and visible!');
    }

    // Final storage check
    console.log('\n5️⃣ Final localStorage check:');
    const finalStorage = await page.evaluate(() => ({
      total: localStorage.length,
      keys: Object.keys(localStorage).slice(0, 10)
    }));
    console.log(`   Total keys: ${finalStorage.total}`);
    console.log(`   Keys:`, finalStorage.keys);

    console.log('\n⏸️  Browser stays open for 15s for manual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
