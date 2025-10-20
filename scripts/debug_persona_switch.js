/**
 * Debug PersonaSwitch em Staging
 * Tira screenshot e extrai HTML para análise
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app';

async function debugPersonaSwitch() {
  console.log('🔍 Debug PersonaSwitch em Staging\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${STAGING_URL}/chat`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Accept consent if present
    const consentButton = page.locator('button:has-text("Aceitar")');
    if (await consentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consentButton.click();
      await page.waitForTimeout(2000);
    }

    // Take screenshot
    const screenshotPath = path.join(__dirname, '..', 'chat_page_debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Screenshot salvo: ${screenshotPath}\n`);

    // Extract HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, '..', 'chat_page_debug.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`✓ HTML salvo: ${htmlPath}\n`);

    // Check for PersonaSwitch
    console.log('Procurando por PersonaSwitch...\n');

    const personaSelector = await page.locator('[data-testid="persona-selector"]').count();
    console.log(`[data-testid="persona-selector"]: ${personaSelector} elementos`);

    const personaOptionDrGasnelio = await page.locator('[data-testid="persona-option-dr_gasnelio"]').count();
    console.log(`[data-testid="persona-option-dr_gasnelio"]: ${personaOptionDrGasnelio} elementos`);

    const personaOptionGa = await page.locator('[data-testid="persona-option-ga"]').count();
    console.log(`[data-testid="persona-option-ga"]: ${personaOptionGa} elementos\n`);

    // Check for any elements with "persona" in data-testid
    const allPersonaElements = await page.locator('[data-testid*="persona"]').count();
    console.log(`Elementos com "persona" no data-testid: ${allPersonaElements}`);

    if (allPersonaElements > 0) {
      const personaTestIds = await page.locator('[data-testid*="persona"]').evaluateAll(
        elements => elements.map(el => el.getAttribute('data-testid'))
      );
      console.log('Test IDs encontrados:', personaTestIds);
    }

    // Check page text content
    const pageText = await page.textContent('body');
    const hasGasnelio = pageText.includes('Gasnelio');
    const hasGa = pageText.includes('Gá');

    console.log(`\nTexto da página contém "Gasnelio": ${hasGasnelio}`);
    console.log(`Texto da página contém "Gá": ${hasGa}\n`);

    await browser.close();

  } catch (error) {
    console.error('ERRO:', error.message);
    await browser.close();
    process.exit(1);
  }
}

debugPersonaSwitch();
