const { chromium } = require('playwright');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app/';

async function quickValidation() {
  console.log('🚀 Quick Staging Validation\n');
  console.log(`Target: ${STAGING_URL}\n`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Loading page...');
    const startTime = Date.now();

    // Use domcontentloaded instead of networkidle (works with Next.js 15)
    await page.goto(STAGING_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    const loadTime = Date.now() - startTime;
    console.log(`✓ Page loaded in ${loadTime}ms`);

    console.log('\nStep 2: Waiting for hydration...');
    await page.waitForLoadState('load', { timeout: 15000 });
    console.log('✓ Resources loaded');

    console.log('\nStep 3: Verifying page is interactive...');
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 10000 });
    console.log('✓ Page interactive');

    console.log('\nStep 4: Extracting page information...');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent || 'NOT FOUND',
        hasNav: !!document.querySelector('nav, [role="navigation"]'),
        imageCount: document.querySelectorAll('img').length,
        linkCount: document.querySelectorAll('a').length,
        nextData: !!window.__NEXT_DATA__
      };
    });

    console.log('\n' + '='.repeat(60));
    console.log('PAGE INFORMATION');
    console.log('='.repeat(60));
    console.log(`Title: ${pageInfo.title}`);
    console.log(`H1: ${pageInfo.h1}`);
    console.log(`Navigation: ${pageInfo.hasNav ? 'Present' : 'Missing'}`);
    console.log(`Images: ${pageInfo.imageCount}`);
    console.log(`Links: ${pageInfo.linkCount}`);
    console.log(`Next.js Data: ${pageInfo.nextData ? 'Loaded' : 'Missing'}`);
    console.log('='.repeat(60));

    console.log('\n✅ VALIDATION PASSED');
    console.log(`Total time: ${Date.now() - startTime}ms\n`);

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ VALIDATION FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(60) + '\n');
    throw error;
  } finally {
    await browser.close();
  }
}

quickValidation().catch(console.error);
