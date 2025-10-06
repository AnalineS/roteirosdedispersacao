/**
 * Validation Script: Personas Architecture Refactoring
 *
 * Tests that refactoring fixed ERR_INSUFFICIENT_RESOURCES issue
 * Issue #221 - PersonaSwitch not rendering due to API call overflow
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const results = {
    siteLoads: false,
    apiCallCount: 0,
    personasLoaded: false,
    personaSwitchVisible: false,
    localStorageHealthy: false,
    errors: []
  };

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

  // Track errors
  page.on('pageerror', error => {
    results.errors.push(error.message);
    console.error('❌ Page Error:', error.message);
  });

  page.on('requestfailed', request => {
    if (request.url().includes('personas')) {
      results.errors.push(`Request failed: ${request.url()}`);
      console.error('❌ Request Failed:', request.url(), request.failure()?.errorText);
    }
  });

  try {
    console.log('🔍 Testing staging site after refactoring...\n');

    // Navigate to staging
    console.log('1️⃣ Loading page...');
    await page.goto('https://hml-frontend-4f2gjf6cua-uc.a.run.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    results.siteLoads = true;
    console.log('   ✅ Site loaded successfully\n');

    // Wait for React hydration
    await page.waitForTimeout(3000);

    // Check API call count
    results.apiCallCount = apiCalls.length;
    console.log('2️⃣ API Calls to /api/v1/personas:');
    console.log(`   Count: ${results.apiCallCount}`);

    if (results.apiCallCount === 1) {
      console.log('   ✅ PASS: Single API call (expected after refactoring)');
    } else if (results.apiCallCount === 0) {
      console.log('   ⚠️  WARNING: No API calls detected (might be cached)');
    } else {
      console.log('   ❌ FAIL: Multiple API calls detected (refactoring may not be working)');
      apiCalls.forEach((call, i) => {
        console.log(`      ${i + 1}. ${call.timestamp}`);
      });
    }
    console.log();

    // Check localStorage health
    console.log('3️⃣ LocalStorage Health:');
    const storage = await page.evaluate(() => ({
      total: localStorage.length,
      anonProfiles: Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
        .filter(k => k?.startsWith('user-profile-anon-')).length,
      personas: localStorage.getItem('personas_cache') !== null
    }));

    console.log(`   Total keys: ${storage.total}`);
    console.log(`   Anonymous profiles: ${storage.anonProfiles}`);
    console.log(`   Personas cached: ${storage.personas}`);

    results.localStorageHealthy = storage.total < 100 && storage.anonProfiles < 10;

    if (results.localStorageHealthy) {
      console.log('   ✅ PASS: Storage healthy (< 100 keys, < 10 anon profiles)');
    } else {
      console.log('   ❌ FAIL: Storage overflow detected');
    }
    console.log();

    // Accept LGPD consent
    console.log('4️⃣ Testing PersonaSwitch rendering:');
    const consentButton = page.locator('button:has-text("Concordo")');
    const buttonCount = await consentButton.count();

    if (buttonCount > 0) {
      console.log('   Clicking LGPD consent button...');
      await consentButton.first().click();
      await page.waitForTimeout(2000);
    }

    // Check if PersonaSwitch is visible
    const personaSwitch = page.locator('[data-testid="persona-switcher"]').first();
    try {
      await personaSwitch.waitFor({ state: 'visible', timeout: 5000 });
      results.personaSwitchVisible = true;

      const count = await page.locator('[data-testid="persona-switcher"]').count();
      console.log(`   ✅ PASS: PersonaSwitch visible (${count} found)`);
    } catch (e) {
      console.log('   ❌ FAIL: PersonaSwitch not visible after consent');

      // Debug info
      const hasConsent = await page.evaluate(() =>
        localStorage.getItem('lgpd_consent_granted') === 'true'
      );
      const personasCount = await page.evaluate(() => {
        const cache = localStorage.getItem('personas_cache');
        return cache ? Object.keys(JSON.parse(cache)).length : 0;
      });

      console.log(`   Debug: LGPD consent = ${hasConsent}`);
      console.log(`   Debug: Personas in cache = ${personasCount}`);
    }
    console.log();

    // Check console for initialization logs
    console.log('5️⃣ Console Logs Analysis:');
    const logs = await page.evaluate(() => {
      // Return relevant log patterns
      return {
        hasInitLog: true, // Simplified check
        note: 'Check browser DevTools for [usePersonas] logs'
      };
    });
    console.log(`   ${logs.note}`);
    console.log();

    // Final Results
    console.log('═══════════════════════════════════════');
    console.log('📊 VALIDATION RESULTS');
    console.log('═══════════════════════════════════════');
    console.log(`Site Loads: ${results.siteLoads ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Call Count: ${results.apiCallCount === 1 ? '✅ PASS (1 call)' : results.apiCallCount === 0 ? '⚠️  CACHED' : `❌ FAIL (${results.apiCallCount} calls)`}`);
    console.log(`LocalStorage Health: ${results.localStorageHealthy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PersonaSwitch Visible: ${results.personaSwitchVisible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Errors Found: ${results.errors.length === 0 ? '✅ NONE' : `❌ ${results.errors.length}`}`);
    console.log('═══════════════════════════════════════');

    if (results.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      results.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    const allPassed = results.siteLoads &&
                      results.apiCallCount <= 1 &&
                      results.localStorageHealthy &&
                      results.personaSwitchVisible &&
                      results.errors.length === 0;

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED - Issue #221 RESOLVED!');
    } else {
      console.log('\n⚠️  Some tests failed - review results above');
    }

    console.log('\n⏸️  Browser will stay open for 10s for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    results.errors.push(error.message);
  } finally {
    await browser.close();

    // Exit with appropriate code
    const success = results.siteLoads && results.apiCallCount <= 1 && results.localStorageHealthy;
    process.exit(success ? 0 : 1);
  }
})();
