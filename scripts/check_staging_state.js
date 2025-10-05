/**
 * Check Staging State - Debug PersonaSwitch
 * Verifica o estado da página em staging
 */

const { chromium } = require('playwright');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app';

async function checkStagingState() {
  console.log('🔍 Verificando estado da página em Staging\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Navegando para /chat...');
    await page.goto(`${STAGING_URL}/chat`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('✓ Página carregada\n');

    // Wait for React to hydrate
    await page.waitForTimeout(3000);

    console.log('Step 2: Extraindo estado da página...\n');

    // Check for LGPD consent
    const hasConsentBanner = await page.locator('text=/aceitar|consentimento|lgpd/i').count();
    console.log(`LGPD Banner presente: ${hasConsentBanner > 0 ? 'SIM' : 'NÃO'}`);

    if (hasConsentBanner > 0) {
      console.log('⚠️  Banner LGPD detectado - pode bloquear renderização do PersonaSwitch\n');
    }

    // Check for persona selection
    const hasPersonaSelection = await page.locator('[data-testid*="persona"]').count();
    console.log(`Elementos com "persona" no data-testid: ${hasPersonaSelection}`);

    // Check page HTML for PersonaSwitch
    const html = await page.content();
    const hasPersonaSwitchInHTML = html.includes('PersonaSwitch') || html.includes('persona-selector');
    console.log(`PersonaSwitch no HTML: ${hasPersonaSwitchInHTML ? 'SIM' : 'NÃO'}`);

    // Check for React hydration
    const hasReactRoot = html.includes('__NEXT_DATA__');
    console.log(`Next.js __NEXT_DATA__: ${hasReactRoot ? 'SIM' : 'NÃO'}`);

    // Extract visible text
    const pageText = await page.locator('body').textContent();
    const hasGasnelio = pageText?.includes('Gasnelio') || false;
    const hasGa = pageText?.includes('Gá') || false;

    console.log(`\nTexto visível:`);
    console.log(`  - Contém "Gasnelio": ${hasGasnelio ? 'SIM' : 'NÃO'}`);
    console.log(`  - Contém "Gá": ${hasGa ? 'SIM' : 'NÃO'}`);

    // Check localStorage (if accessible)
    const localStorageData = await page.evaluate(() => {
      try {
        return {
          selectedPersona: localStorage.getItem('selectedPersona'),
          lgpdConsent: localStorage.getItem('lgpd_consent_chat'),
          keys: Object.keys(localStorage)
        };
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log(`\nLocalStorage:`);
    console.log(`  - selectedPersona: ${localStorageData.selectedPersona || 'NULL'}`);
    console.log(`  - lgpd_consent_chat: ${localStorageData.lgpdConsent || 'NULL'}`);
    console.log(`  - Total keys: ${localStorageData.keys?.length || 0}`);

    // Take screenshot for visual inspection
    await page.screenshot({
      path: 'staging_state_debug.png',
      fullPage: false
    });
    console.log(`\n✓ Screenshot salvo: staging_state_debug.png`);

    // Check console errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (consoleMessages.length > 0) {
      console.log(`\n⚠️  Erros no console (${consoleMessages.length}):`);
      consoleMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.substring(0, 100)}`);
      });
    }

    await browser.close();

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await browser.close();
    process.exit(1);
  }
}

checkStagingState();
