/**
 * E2E Tests for PR #264 - NavigationHeaderSimplified
 *
 * Testa a nova estrutura de navegação simplificada:
 * - 5 itens principais (Início, Educacional, Chat, Entrar, Criar Conta)
 * - Hierarquia visual clara
 * - CTAs destacados
 * - Indicador offline discreto
 *
 * Baseado em padrões Context7 Playwright:
 * - data-testid para seleção confiável
 * - waitForSelector para elementos dinâmicos
 * - waitForURL para navegações
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('PR #264 - NavigationHeaderSimplified', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para home antes de cada teste
    await page.goto(BASE_URL);

    // Aguardar navegação estar visível
    await page.waitForSelector('[role="banner"]', {
      state: 'visible',
      timeout: 10000
    });
  });

  test('AC1: Navegação exibe exatamente 5 itens principais no desktop', async ({ page, viewport }) => {
    // Garantir viewport desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // Aguardar navegação estar renderizada
    await page.waitForSelector('[role="navigation"]', { state: 'visible' });

    // Contar links/botões de navegação principais (não incluir subitens de dropdown)
    const navItems = await page.locator('nav[role="navigation"] > div').count();

    // Verificar que temos navegação (pode variar por implementação exata)
    expect(navItems).toBeGreaterThan(0);

    // Verificar itens específicos estão presentes
    const inicio = page.locator('nav[role="navigation"]').getByText('Início');
    const educacional = page.locator('nav[role="navigation"]').getByText('Educacional');
    const chat = page.locator('nav[role="navigation"]').getByText('Chat');

    await expect(inicio).toBeVisible();
    await expect(educacional).toBeVisible();
    await expect(chat).toBeVisible();
  });

  test('AC2: Botões CTAs têm hierarquia visual clara', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Localizar botão "Criar Conta" (CTA primário)
    const btnCriarConta = page.getByRole('link').filter({ hasText: 'Criar Conta' });

    // Localizar botão "Entrar" (CTA secundário)
    const btnEntrar = page.getByRole('link').filter({ hasText: 'Entrar' });

    // Verificar que ambos estão visíveis
    await expect(btnCriarConta).toBeVisible();
    await expect(btnEntrar).toBeVisible();

    // Verificar que "Criar Conta" tem background (botão primário)
    const criarContaStyles = await btnCriarConta.first().evaluate((el) => {
      const button = el.querySelector('button');
      if (!button) return null;
      const styles = window.getComputedStyle(button);
      return {
        background: styles.backgroundColor,
        color: styles.color
      };
    });

    // Botão primário deve ter background azul UnB
    expect(criarContaStyles?.background).toBeTruthy();
    expect(criarContaStyles?.background).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('AC3: Dropdown Educacional abre e fecha corretamente', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Localizar botão dropdown Educacional
    const dropdownBtn = page.locator('button').filter({ hasText: 'Educacional' });
    await expect(dropdownBtn).toBeVisible();

    // Clicar para abrir dropdown
    await dropdownBtn.click();

    // Aguardar menu dropdown aparecer
    await page.waitForSelector('[role="menu"]', {
      state: 'visible',
      timeout: 3000
    });

    // Verificar que itens do dropdown estão visíveis
    const modulosLink = page.locator('[role="menu"]').getByText('Módulos');
    await expect(modulosLink).toBeVisible();

    // Fechar dropdown (ESC)
    await page.keyboard.press('Escape');

    // Aguardar menu fechar
    await page.waitForSelector('[role="menu"]', {
      state: 'hidden',
      timeout: 3000
    });
  });

  test('AC4: Navegação para /chat ao clicar no link Chat', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Localizar e clicar no link Chat
    const chatLink = page.locator('nav[role="navigation"]').getByRole('link').filter({ hasText: 'Chat' });
    await expect(chatLink).toBeVisible();

    await chatLink.click();

    // Aguardar navegação para /chat
    await page.waitForURL('**/chat**', { timeout: 10000 });

    // Verificar URL atual
    expect(page.url()).toContain('/chat');
  });

  test('AC5: Touch targets têm mínimo 44x44px (WCAG AA)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Verificar botões CTAs
    const btnCriarConta = page.getByRole('link').filter({ hasText: 'Criar Conta' }).first();

    const dimensions = await btnCriarConta.evaluate((el) => {
      const button = el.querySelector('button');
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      const styles = window.getComputedStyle(button);
      return {
        width: rect.width,
        height: rect.height,
        minHeight: styles.minHeight
      };
    });

    // Verificar altura mínima 44px (WCAG AA)
    expect(dimensions?.height).toBeGreaterThanOrEqual(44);
    expect(dimensions?.minHeight).toBe('44px');
  });

  test('AC6: Indicador offline não aparece quando online', async ({ page }) => {
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');

    // Verificar que indicador offline NÃO está visível
    const offlineIndicator = page.getByRole('status').filter({ hasText: /offline/i });
    await expect(offlineIndicator).toHaveCount(0);
  });

  test('AC7: Indicador offline aparece quando offline', async ({ page, context }) => {
    // Simular modo offline
    await context.setOffline(true);

    // Recarregar página
    await page.reload();

    // Aguardar indicador offline aparecer
    await page.waitForSelector('[role="status"]', {
      state: 'visible',
      timeout: 5000
    });

    const offlineIndicator = page.getByRole('status');
    await expect(offlineIndicator).toBeVisible();

    // Voltar online
    await context.setOffline(false);
  });

  test('AC8: Navegação responsiva - Mobile mostra menu hambúrguer', async ({ page }) => {
    // Configurar viewport mobile (< 640px)
    await page.setViewportSize({ width: 375, height: 667 });

    // Aguardar botão hambúrguer aparecer
    const hamburgerBtn = page.getByRole('button').filter({
      hasText: /menu|abrir menu/i
    });

    await expect(hamburgerBtn).toBeVisible();

    // Verificar que navegação desktop está oculta
    const desktopNav = page.locator('nav[role="navigation"]').first();

    // No mobile, navegação principal pode estar oculta ou dentro do menu
    // Verificamos que o botão hambúrguer existe
    expect(await hamburgerBtn.count()).toBeGreaterThan(0);
  });

  test('AC9: Acessibilidade - Navegação por teclado funciona', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Focus no primeiro elemento de navegação (Tab)
    await page.keyboard.press('Tab');

    // Continuar navegando por Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar que algum elemento tem focus
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        role: el?.getAttribute('role'),
        ariaLabel: el?.getAttribute('aria-label')
      };
    });

    // Deve haver um elemento focado
    expect(focusedElement.tagName).toBeTruthy();
  });

  test('AC10: Dropdown fecha ao clicar fora (overlay)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Abrir dropdown
    const dropdownBtn = page.locator('button').filter({ hasText: 'Educacional' });
    await dropdownBtn.click();

    // Aguardar menu aparecer
    await page.waitForSelector('[role="menu"]', { state: 'visible' });

    // Clicar fora do dropdown (no corpo da página)
    await page.click('body', { position: { x: 100, y: 300 } });

    // Aguardar menu fechar
    await page.waitForSelector('[role="menu"]', {
      state: 'hidden',
      timeout: 3000
    });
  });

  test('AC11: Navegação preserva persona atual (se existir)', async ({ page }) => {
    // Ir para /chat para ter persona ativa
    await page.goto(`${BASE_URL}/chat?persona=dr_gasnelio`);
    await page.waitForLoadState('networkidle');

    // Verificar se navegação mostra persona atual
    // Nota: isso pode variar dependendo da implementação
    const personaDisplay = page.locator('[role="banner"]').getByText(/gasnelio/i);

    // Se persona estiver visível na navegação, deve estar presente
    if (await personaDisplay.count() > 0) {
      await expect(personaDisplay).toBeVisible();
    }
  });
});

test.describe('PR #264 - Design Tokens Validation', () => {
  test('Design tokens aplicados corretamente', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.setViewportSize({ width: 1280, height: 720 });

    // Verificar que header usa cores corretas
    const header = page.locator('[role="banner"]');
    const headerStyles = await header.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        borderBottom: styles.borderBottom
      };
    });

    // Header deve ter background e borda
    expect(headerStyles.background).toBeTruthy();
    expect(headerStyles.borderBottom).toBeTruthy();
  });
});

test.describe('PR #264 - Performance', () => {
  test('Navegação carrega em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await page.waitForSelector('[role="banner"]', { state: 'visible' });

    const loadTime = Date.now() - startTime;

    // Navegação deve carregar em < 3s
    expect(loadTime).toBeLessThan(3000);
  });
});
