/**
 * Validate PersonaSwitch in /chat page
 *
 * Issue #221 - Final validation
 * PersonaSwitch only exists in /chat page, NOT homepage
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track API calls
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/v1/personas')) {
      apiCalls.push({
        url: request.url(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    console.log('🔍 Validating PersonaSwitch in /chat page...\n');

    // Navigate to /chat page (not homepage!)
    console.log('1️⃣ Navigating to /chat...');
    await page.goto('https://hml-frontend-4f2gjf6cua-uc.a.run.app/chat', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await page.waitForTimeout(3000);

    // Check API calls
    console.log('\n2️⃣ API Calls Analysis:');
    console.log(`   Total /api/v1/personas calls: ${apiCalls.length}`);
    if (apiCalls.length > 0) {
      console.log('   Call details:');
      apiCalls.forEach((call, i) => {
        console.log(`   ${i + 1}. ${call.timestamp} - ${call.url}`);
      });

      // Check if calls are simultaneous (within 100ms)
      if (apiCalls.length > 1) {
        const times = apiCalls.map(c => new Date(c.timestamp).getTime());
        const maxDiff = Math.max(...times) - Math.min(...times);
        console.log(`   Time spread: ${maxDiff}ms`);
        if (maxDiff < 100) {
          console.log('   ⚠️  SIMULTANEOUS calls detected (within 100ms)');
        } else {
          console.log('   ✅ Sequential calls (good)');
        }
      } else {
        console.log('   ✅ SINGLE API call (optimal!)');
      }
    }

    // Check localStorage health
    console.log('\n3️⃣ LocalStorage Health:');
    const storageData = await page.evaluate(() => ({
      total: localStorage.length,
      keys: Object.keys(localStorage),
      personasCache: localStorage.getItem('personas_cache') !== null,
      cacheSize: (() => {
        const cache = localStorage.getItem('personas_cache');
        return cache ? cache.length : 0;
      })()
    }));
    console.log(`   Total keys: ${storageData.total}`);
    console.log(`   Personas cached: ${storageData.personasCache}`);
    console.log(`   Cache size: ${storageData.cacheSize} bytes`);
    console.log(`   Keys: ${storageData.keys.join(', ')}`);

    // Check for LGPD consent modal
    console.log('\n4️⃣ LGPD Consent Check:');
    await page.waitForTimeout(2000);

    const lgpdModal = await page.locator('[role="dialog"]').count();
    console.log(`   LGPD modals found: ${lgpdModal}`);

    if (lgpdModal > 0) {
      console.log('   ✅ LGPD modal present (expected for /chat)');

      // Look for consent button
      const consentBtn = page.locator('button').filter({ hasText: /aceito.*termos|concordo/i });
      const btnCount = await consentBtn.count();
      console.log(`   Consent buttons: ${btnCount}`);

      if (btnCount > 0) {
        console.log('   Clicking consent button...');
        await consentBtn.first().click();
        await page.waitForTimeout(2000);

        const consentData = await page.evaluate(() =>
          localStorage.getItem('lgpd-consent-chat')
        );
        console.log(`   Consent granted: ${consentData !== null}`);
      }
    } else {
      console.log('   ⚠️  No LGPD modal - checking if already consented');
      const alreadyConsented = await page.evaluate(() =>
        localStorage.getItem('lgpd-consent-chat') !== null
      );
      console.log(`   Already consented: ${alreadyConsented}`);
    }

    // Look for PersonaSwitch (AFTER potential consent)
    console.log('\n5️⃣ PersonaSwitch Visibility:');
    await page.waitForTimeout(2000);

    const selectors = [
      '[data-testid="persona-switcher"]',
      '[data-testid="persona-switch"]',
      'button[aria-label*="persona"]',
      'button[aria-label*="Persona"]',
      'div:has-text("Dr. Gasnelio")',
      'div:has-text("Gá")'
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

    if (found) {
      console.log('   ✅ PersonaSwitch found and visible!');
    } else {
      console.log('   ❌ PersonaSwitch not found');

      // Debug: show what IS visible
      console.log('\n   Debugging - checking for persona-related text:');
      const personaText = await page.locator('text=/persona/i').count();
      const drGasnelioText = await page.locator('text=/gasnelio/i').count();
      const gaText = await page.locator('text=/gá/i').count();
      console.log(`   "persona" text: ${personaText}`);
      console.log(`   "gasnelio" text: ${drGasnelioText}`);
      console.log(`   "gá" text: ${gaText}`);
    }

    // Final summary
    console.log('\n═══════════════════════════════════════');
    console.log('📊 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Issue #221 FIX: ${apiCalls.length <= 1 ? 'RESOLVED' : 'FAILED'}`);
    console.log(`   API calls: ${apiCalls.length} (target: 1)`);
    console.log(`   LocalStorage: ${storageData.total} keys (healthy: <20)`);
    console.log(`   PersonaSwitch: ${found ? 'VISIBLE ✅' : 'NOT FOUND ❌'}`);
    console.log('═══════════════════════════════════════\n');

    console.log('⏸️  Browser stays open for 15s for manual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
