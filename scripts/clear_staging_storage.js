/**
 * Emergency localStorage cleanup for staging
 * Clears all user-profile-anon entries that are causing overflow
 */

const { chromium } = require('playwright');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app';

async function clearStagingStorage() {
  console.log('🧹 Emergency LocalStorage Cleanup - Staging\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to staging...');
    await page.goto(`${STAGING_URL}/chat`, { timeout: 30000 });
    console.log('✓ Page loaded\n');

    console.log('Step 2: Check localStorage size...');
    const beforeSize = await page.evaluate(() => {
      return {
        total: Object.keys(localStorage).length,
        anonKeys: Object.keys(localStorage).filter(k => k.includes('user-profile-anon')).length
      };
    });
    console.log(`  Total keys: ${beforeSize.total}`);
    console.log(`  Anonymous profile keys: ${beforeSize.anonKeys}\n`);

    console.log('Step 3: Delete all user-profile-anon entries...');
    const deleted = await page.evaluate(() => {
      let count = 0;
      const keysToDelete = [];

      // Collect keys to delete
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('user-profile-anon')) {
          keysToDelete.push(key);
        }
      }

      // Delete them
      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });

      return count;
    });
    console.log(`✓ Deleted ${deleted} anonymous profile entries\n`);

    console.log('Step 4: Check localStorage after cleanup...');
    const afterSize = await page.evaluate(() => {
      return {
        total: Object.keys(localStorage).length,
        anonKeys: Object.keys(localStorage).filter(k => k.includes('user-profile-anon')).length
      };
    });
    console.log(`  Total keys: ${afterSize.total}`);
    console.log(`  Anonymous profile keys: ${afterSize.anonKeys}\n`);

    console.log('Step 5: Reload page to test functionality...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('✓ Page reloaded\n');

    console.log('Step 6: Check for PersonaSwitch...');
    const personaSwitchExists = await page.locator('[data-testid*="persona"]').count();
    console.log(`  PersonaSwitch elements found: ${personaSwitchExists}\n`);

    // Take screenshot
    await page.screenshot({
      path: 'staging_after_cleanup.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: staging_after_cleanup.png\n');

    console.log('✅ Cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Before: ${beforeSize.total} keys (${beforeSize.anonKeys} anon)`);
    console.log(`   After: ${afterSize.total} keys (${afterSize.anonKeys} anon)`);
    console.log(`   Freed: ${deleted} entries`);

    // Keep browser open for manual verification
    console.log('\n⏳ Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

    await browser.close();

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await browser.close();
    process.exit(1);
  }
}

clearStagingStorage();
