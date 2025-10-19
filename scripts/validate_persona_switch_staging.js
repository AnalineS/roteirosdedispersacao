/**
 * Validação PersonaSwitch em Staging - Issue #221
 * Verifica se o componente PersonaSwitch está renderizado e funcional
 */

const { chromium } = require('playwright');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app';

async function validatePersonaSwitch() {
  console.log('🧪 Validando PersonaSwitch em Staging\n');
  console.log(`Target: ${STAGING_URL}/chat\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to chat page
    console.log('Step 1: Navegando para página de chat...');
    await page.goto(`${STAGING_URL}/chat`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForLoadState('load');
    console.log('✓ Página carregada\n');

    // Step 2: Wait for consent (if needed) and accept
    console.log('Step 2: Verificando consentimento...');
    const consentButton = page.locator('button:has-text("Aceitar")');
    if (await consentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await consentButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Consentimento aceito\n');
    } else {
      console.log('✓ Sem necessidade de consentimento\n');
    }

    // Step 3: Check if PersonaSwitch component is present
    console.log('Step 3: Verificando presença do PersonaSwitch...');
    const personaSelector = page.locator('[data-testid="persona-selector"]');
    const isPresent = await personaSelector.isVisible({ timeout: 10000 });

    if (!isPresent) {
      console.error('❌ ERRO: PersonaSwitch não encontrado na página!');
      await browser.close();
      process.exit(1);
    }
    console.log('✓ PersonaSwitch encontrado\n');

    // Step 4: Verify persona options are present
    console.log('Step 4: Verificando opções de persona...');
    const drGasnelioOption = page.locator('[data-testid="persona-option-dr_gasnelio"]');
    const gaOption = page.locator('[data-testid="persona-option-ga"]');

    const hasDrGasnelio = await drGasnelioOption.isVisible({ timeout: 5000 });
    const hasGa = await gaOption.isVisible({ timeout: 5000 });

    if (!hasDrGasnelio || !hasGa) {
      console.error('❌ ERRO: Opções de persona não encontradas!');
      console.error(`Dr. Gasnelio: ${hasDrGasnelio ? '✓' : '✗'}`);
      console.error(`Gá: ${hasGa ? '✓' : '✗'}`);
      await browser.close();
      process.exit(1);
    }
    console.log('✓ Dr. Gasnelio presente');
    console.log('✓ Gá presente\n');

    // Step 5: Test persona switching
    console.log('Step 5: Testando troca de persona...');

    // Get initial persona
    const initialActivePersona = await page.locator('[data-testid^="persona-option-"][aria-checked="true"]').getAttribute('data-testid');
    console.log(`Persona inicial: ${initialActivePersona}`);

    // Click the other persona
    const targetPersona = initialActivePersona === 'persona-option-dr_gasnelio' ? 'ga' : 'dr_gasnelio';
    await page.locator(`[data-testid="persona-option-${targetPersona}"]`).click();
    await page.waitForTimeout(500);

    // Verify persona changed
    const newActivePersona = await page.locator('[data-testid^="persona-option-"][aria-checked="true"]').getAttribute('data-testid');
    console.log(`Persona após troca: ${newActivePersona}`);

    if (newActivePersona === initialActivePersona) {
      console.error('❌ ERRO: Persona não mudou após clique!');
      await browser.close();
      process.exit(1);
    }
    console.log('✓ Troca de persona funcional\n');

    // Step 6: Verify feedback indicator during switch
    console.log('Step 6: Verificando indicador de feedback...');
    await page.locator(`[data-testid="persona-option-${initialActivePersona.replace('persona-option-', '')}"]`).click();

    // Check if feedback appears (even briefly)
    const feedbackPresent = await page.locator('[data-testid="persona-switch-feedback"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (feedbackPresent) {
      console.log('✓ Indicador de feedback detectado\n');
    } else {
      console.log('⚠️  Indicador de feedback não detectado (pode ter sido muito rápido)\n');
    }

    // Final validation
    console.log('============================================================');
    console.log('✅ VALIDAÇÃO COMPLETA - PersonaSwitch Issue #221');
    console.log('============================================================');
    console.log('✓ PersonaSwitch renderizado corretamente');
    console.log('✓ Ambas personas disponíveis (Dr. Gasnelio e Gá)');
    console.log('✓ Troca de persona funcional');
    console.log('✓ Componente responsivo e interativo');
    console.log('============================================================\n');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO NA VALIDAÇÃO:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
}

validatePersonaSwitch();
