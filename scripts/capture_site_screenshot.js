const { chromium } = require('playwright');
const path = require('path');

async function captureScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    await page.goto('https://hml-roteiros-de-dispensacao.web.app/', {
      waitUntil: 'networkidle'
    });

    const screenshotPath = path.join(__dirname, '..', 'claudedocs', 'site_current_state.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('❌ Failed to capture screenshot:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshot();
