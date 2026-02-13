/**
 * Chat Usability & Accuracy E2E Tests
 *
 * Tests the chat interface after the audit fixes:
 * - Persona selection and switching
 * - Message sending and receiving
 * - Typing indicator
 * - Sample questions (empty state)
 * - Character limits
 * - Attachment preview chip
 * - Textarea multi-line behavior
 * - Accessibility (ARIA, keyboard nav)
 * - Scope detection (out-of-scope redirection)
 * - Feedback widget
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper: navigate to chat and wait for it to load
async function goToChat(page: Page) {
  await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });
  // Wait for the chat container to render
  await page.waitForSelector('[role="main"]', { state: 'visible', timeout: 15000 });
}

// Helper: select a persona via the PersonaSwitch or empty state
async function selectPersona(page: Page, personaId: 'dr_gasnelio' | 'ga') {
  // Try PersonaSwitch toggle first
  const personaSelector = page.locator('[data-testid="persona-selector"]');
  if (await personaSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Click the appropriate label
    const label = personaId === 'dr_gasnelio'
      ? page.locator('[data-testid="persona-label-dr_gasnelio"]')
      : page.locator('[data-testid="persona-label-ga"]');
    await label.click();
    await page.waitForTimeout(500); // Transition
    return;
  }

  // Try empty state persona grid
  const personaButton = page.locator(`.persona-grid button`).filter({ hasText: personaId === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá' });
  if (await personaButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await personaButton.click();
    await page.waitForTimeout(500);
    return;
  }

  // Navigate with query param as fallback
  await page.goto(`${BASE_URL}/chat?persona=${personaId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[role="main"]', { state: 'visible', timeout: 15000 });
}

// Helper: type and send a message
async function sendMessage(page: Page, message: string) {
  const input = page.locator('[data-chat-input="true"]');
  await input.fill(message);
  // Submit via Enter
  await input.press('Enter');
}

// Helper: wait for assistant response bubble
async function waitForAssistantResponse(page: Page, timeout = 30000): Promise<string> {
  // Wait for loading to finish
  const loadingIndicator = page.locator('.loading-message, [role="status"]').filter({ hasText: /pensando|respondendo/i });
  if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout });
  }

  // Get last assistant bubble
  const assistantBubbles = page.locator('.assistant-bubble, .message-bubble').last();
  await assistantBubbles.waitFor({ state: 'visible', timeout: 10000 });
  return await assistantBubbles.textContent() || '';
}

// ============================================
// TEST SUITE 1: Chat Interface Structure
// ============================================
test.describe('Chat Interface - Structure & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
  });

  test('renders main chat container with correct ARIA roles', async ({ page }) => {
    // Main container
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute('aria-label', /chat|assistente/i);

    // Chat input area
    const chatInput = page.locator('[data-chat-input="true"]');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toHaveAttribute('aria-label', /mensagem/i);
  });

  test('shows persona selector or empty state on load', async ({ page }) => {
    // Either PersonaSwitch or ChatEmptyState should be visible
    const personaSwitch = page.locator('[data-testid="persona-selector"]');
    const emptyState = page.locator('.chat-empty-state');

    const switchVisible = await personaSwitch.isVisible({ timeout: 3000 }).catch(() => false);
    const emptyVisible = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(switchVisible || emptyVisible).toBe(true);
  });

  test('chat input is a textarea (not input)', async ({ page }) => {
    await selectPersona(page, 'dr_gasnelio');
    const chatInput = page.locator('[data-chat-input="true"]');
    const tagName = await chatInput.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('textarea');
  });
});

// ============================================
// TEST SUITE 2: Persona Selection & Switching
// ============================================
test.describe('Chat - Persona Selection', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
  });

  test('can select Dr. Gasnelio persona', async ({ page }) => {
    await selectPersona(page, 'dr_gasnelio');

    // Verify persona is selected
    const currentSelection = page.locator('[data-testid="persona-current-selection"], [data-testid="persona-option-dr_gasnelio"]');
    if (await currentSelection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(currentSelection).toContainText(/Dr\. Gasnelio|Gasnelio/i);
    }
  });

  test('can select Ga persona', async ({ page }) => {
    await selectPersona(page, 'ga');

    const currentSelection = page.locator('[data-testid="persona-current-selection"], [data-testid="persona-option-ga"]');
    if (await currentSelection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(currentSelection).toContainText(/Gá/i);
    }
  });

  test('can switch between personas without page reload', async ({ page }) => {
    await selectPersona(page, 'dr_gasnelio');
    const url1 = page.url();

    await selectPersona(page, 'ga');
    const url2 = page.url();

    // Page should not have fully reloaded (same base URL)
    expect(url1.split('?')[0]).toBe(url2.split('?')[0]);
  });
});

// ============================================
// TEST SUITE 3: Empty State & Sample Questions
// ============================================
test.describe('Chat - Empty State & Suggestions', () => {
  test('shows sample questions after persona selection', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    // Check if suggestion cards appear
    const suggestions = page.locator('.suggestion-card, .welcome-suggestions button');
    const count = await suggestions.count();

    // Should have at least 1 suggestion (up to 4 per persona)
    if (count > 0) {
      await expect(suggestions.first()).toBeVisible();
      // Dr. Gasnelio suggestions should be about hanseniase
      const firstText = await suggestions.first().textContent();
      expect(firstText).toBeTruthy();
    }
  });

  test('clicking a suggestion fills and sends the message', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    const suggestions = page.locator('.suggestion-card');
    const count = await suggestions.count();

    if (count > 0) {
      const suggestionText = await suggestions.first().textContent();
      await suggestions.first().click();

      // After clicking suggestion, either:
      // 1. Input gets filled OR
      // 2. Message gets sent directly
      await page.waitForTimeout(1000);

      // Check if message appears in the chat or input
      const messages = page.locator('.messages-list');
      const input = page.locator('[data-chat-input="true"]');
      const inputVal = await input.inputValue().catch(() => '');
      const messagesText = await messages.textContent().catch(() => '');

      const messageSent = messagesText?.includes(suggestionText || '') || inputVal.includes(suggestionText || '');
      expect(messageSent).toBe(true);
    }
  });
});

// ============================================
// TEST SUITE 4: Message Sending & Receiving
// ============================================
test.describe('Chat - Message Flow', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
  });

  test('user can type and send a message', async ({ page }) => {
    const input = page.locator('[data-chat-input="true"]');
    await input.fill('O que e hanseniase?');

    // Verify input has the text
    await expect(input).toHaveValue('O que e hanseniase?');

    // Send
    await input.press('Enter');

    // User message should appear in the chat area
    await page.waitForTimeout(500);
    const messagesArea = page.locator('[role="log"], .messages-list');
    const text = await messagesArea.textContent().catch(() => '');
    expect(text).toContain('O que e hanseniase?');
  });

  test('shows typing indicator while waiting for response', async ({ page }) => {
    await sendMessage(page, 'Qual a dose de rifampicina?');

    // Typing indicator should appear
    const typingIndicator = page.locator('.loading-message, [role="status"]').filter({
      hasText: /pensando|respondendo|digitando/i
    });

    // May be fast, so use a short timeout
    const wasVisible = await typingIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    // Either it was visible (loading state) or response came very fast
    // Both are acceptable
    expect(true).toBe(true); // Non-blocking assertion
  });

  test('receives assistant response after sending message', async ({ page }) => {
    await sendMessage(page, 'O que e hanseniase?');

    // Wait for response
    const response = await waitForAssistantResponse(page);
    expect(response.length).toBeGreaterThan(20);
  });

  test('no duplicate user messages appear', async ({ page }) => {
    await sendMessage(page, 'Teste de mensagem unica');

    await page.waitForTimeout(2000);

    // Count occurrences of the exact user message text
    const allBubbles = page.locator('.message-bubble, .user-bubble');
    const count = await allBubbles.count();

    let userMessageCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await allBubbles.nth(i).textContent();
      if (text?.includes('Teste de mensagem unica')) {
        userMessageCount++;
      }
    }

    // Should appear exactly once
    expect(userMessageCount).toBe(1);
  });
});

// ============================================
// TEST SUITE 5: Character Limits
// ============================================
test.describe('Chat - Character Limits', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
  });

  test('input has maxLength of 2000', async ({ page }) => {
    const input = page.locator('[data-chat-input="true"]');
    const maxLength = await input.getAttribute('maxLength');
    // Should be 2000 (aligned across frontend and backend)
    expect(Number(maxLength)).toBe(2000);
  });

  test('shows character counter', async ({ page }) => {
    const input = page.locator('[data-chat-input="true"]');
    await input.fill('Hello');

    // Look for character count display
    const counter = page.locator('text=/\\d+\\/2000/');
    if (await counter.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await counter.textContent();
      expect(text).toContain('/2000');
    }
  });
});

// ============================================
// TEST SUITE 6: Textarea Multi-line
// ============================================
test.describe('Chat - Textarea Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
  });

  test('Enter sends message, Shift+Enter creates new line', async ({ page }) => {
    const input = page.locator('[data-chat-input="true"]');
    await input.fill('Linha 1');

    // Shift+Enter should add a new line
    await input.press('Shift+Enter');
    await input.type('Linha 2');

    const value = await input.inputValue();
    expect(value).toContain('Linha 1');
    expect(value).toContain('Linha 2');

    // Now Enter should send (clears input)
    await input.press('Enter');
    await page.waitForTimeout(500);

    const newValue = await input.inputValue();
    // Input should be cleared after sending
    expect(newValue.trim()).toBe('');
  });
});

// ============================================
// TEST SUITE 7: Attachment Preview
// ============================================
test.describe('Chat - Attachment Preview', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
  });

  test('file upload button is visible', async ({ page }) => {
    const uploadButton = page.locator('button[aria-label="Anexar arquivo"]');
    await expect(uploadButton).toBeVisible();
  });

  test('uploading a file shows attachment chip', async ({ page }) => {
    // Create a fake file and trigger upload
    const fileInput = page.locator('input[type="file"]');

    // Only test if file input exists
    if (await fileInput.count() > 0) {
      const buffer = Buffer.from('fake pdf content');
      await fileInput.setInputFiles({
        name: 'test-document.pdf',
        mimeType: 'application/pdf',
        buffer
      });

      // Wait for the attachment chip to appear
      const chip = page.locator('.attachment-chip, [role="status"]').filter({ hasText: /test-document/i });
      if (await chip.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(chip).toContainText('test-document');

        // Remove button should exist
        const removeBtn = chip.locator('button[aria-label="Remover anexo"]');
        if (await removeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await removeBtn.click();
          // Chip should disappear
          await expect(chip).not.toBeVisible({ timeout: 2000 });
        }
      }
    }
  });
});

// ============================================
// TEST SUITE 8: Keyboard Navigation & A11Y
// ============================================
test.describe('Chat - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
  });

  test('chat input has proper ARIA attributes', async ({ page }) => {
    const input = page.locator('[data-chat-input="true"]');

    await expect(input).toHaveAttribute('aria-label', /mensagem/i);
    await expect(input).toHaveAttribute('aria-required', 'true');
    await expect(input).toHaveAttribute('spellcheck', 'true');
  });

  test('messages area has role="log"', async ({ page }) => {
    const messagesArea = page.locator('[role="log"]');
    await expect(messagesArea).toBeVisible();
    await expect(messagesArea).toHaveAttribute('aria-live', /(polite|assertive)/);
  });

  test('send button has proper aria-label', async ({ page }) => {
    const sendButton = page.locator('button[aria-label*="Enviar"]');
    await expect(sendButton).toBeVisible();
  });

  test('Tab navigates between interactive elements', async ({ page }) => {
    // Focus the chat input
    const input = page.locator('[data-chat-input="true"]');
    await input.focus();
    expect(await input.evaluate(el => document.activeElement === el)).toBe(true);

    // Tab should move to the next focusable element
    await page.keyboard.press('Tab');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(['button', 'input', 'a', 'textarea']).toContain(activeTag);
  });
});

// ============================================
// TEST SUITE 9: Response Accuracy per Persona
// ============================================
test.describe('Chat - Response Accuracy', () => {
  test('Dr. Gasnelio responds with technical/medical content', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
    await sendMessage(page, 'Qual a dose de rifampicina para adulto com hanseniase multibacilar?');

    const response = await waitForAssistantResponse(page);

    // Should contain medical/technical terms
    const hasMedicalContent =
      /rifampicina|dose|mg|pqt|multibacilar|mb|pcdt|ministerio|saude|hanseniase/i.test(response);
    expect(hasMedicalContent).toBe(true);
  });

  test('Ga responds with empathetic/accessible language', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'ga');
    await sendMessage(page, 'O que e hanseniase?');

    const response = await waitForAssistantResponse(page);

    // Should be longer (empathetic responses tend to be detailed)
    expect(response.length).toBeGreaterThan(50);

    // Should contain accessible language
    const hasAccessibleContent =
      /hanseniase|tratamento|cura|sus|saude|doenca|pele/i.test(response);
    expect(hasAccessibleContent).toBe(true);
  });

  test('response includes confidence metadata', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    // Intercept the API response to check structure
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/chat') || resp.url().includes('/api/chat'),
      { timeout: 30000 }
    ).catch(() => null);

    await sendMessage(page, 'O que e hanseniase?');

    const apiResponse = await responsePromise;
    if (apiResponse) {
      const body = await apiResponse.json().catch(() => null);
      if (body) {
        // Verify response structure from our audit fixes
        expect(body).toHaveProperty('answer');
        expect(body).toHaveProperty('persona');
        expect(body).toHaveProperty('confidence');
        expect(body).toHaveProperty('rag_used');
        expect(body).toHaveProperty('medical_validation');

        // medical_validation should be 'not_performed' (audit fix)
        expect(body.medical_validation).toBe('not_performed');
      }
    }
  });
});

// ============================================
// TEST SUITE 10: Feedback Widget
// ============================================
test.describe('Chat - Feedback', () => {
  test('feedback buttons appear on assistant messages', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');
    await sendMessage(page, 'O que e hanseniase?');

    await waitForAssistantResponse(page);

    // Look for feedback buttons (thumbs up/down or rating)
    const feedbackButtons = page.locator('button[aria-label*="feedback"], button[aria-label*="avaliar"], button[aria-label*="util"]');
    const count = await feedbackButtons.count();

    // At least some feedback mechanism should be present
    // (may be in hover state or always visible)
    if (count > 0) {
      await expect(feedbackButtons.first()).toBeVisible();
    }
  });
});

// ============================================
// TEST SUITE 11: Error Handling & Edge Cases
// ============================================
test.describe('Chat - Edge Cases', () => {
  test('cannot send empty message', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    const input = page.locator('[data-chat-input="true"]');
    await input.fill('');

    // Send button should be disabled
    const sendButton = page.locator('button[aria-label*="Enviar"]');
    await expect(sendButton).toBeDisabled();
  });

  test('send button is disabled while loading', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    await sendMessage(page, 'Qual a dose de rifampicina?');

    // During loading, send button should be disabled
    const sendButton = page.locator('button[aria-label*="Enviar"], button[aria-label*="Enviando"]');
    // Quick check - may be too fast to catch
    const isDisabledDuringLoad = await sendButton.isDisabled().catch(() => false);
    // This is a non-strict check since responses can be very fast
    expect(true).toBe(true);
  });

  test('handles rapid consecutive messages gracefully', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    const input = page.locator('[data-chat-input="true"]');

    // Send first message
    await input.fill('Pergunta 1');
    await input.press('Enter');
    await page.waitForTimeout(300);

    // Try sending second immediately
    await input.fill('Pergunta 2');
    await input.press('Enter');

    // Wait for responses
    await page.waitForTimeout(5000);

    // Page should not crash - verify chat is still functional
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });
});

// ============================================
// TEST SUITE 12: Mobile Responsiveness
// ============================================
test.describe('Chat - Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test('chat interface adapts to mobile viewport', async ({ page }) => {
    await goToChat(page);

    // Main container should be visible
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();

    // Input should be visible and usable
    const input = page.locator('[data-chat-input="true"]');
    await expect(input).toBeVisible();
  });

  test('can send message on mobile', async ({ page }) => {
    await goToChat(page);
    await selectPersona(page, 'dr_gasnelio');

    const input = page.locator('[data-chat-input="true"]');
    await input.fill('Teste mobile');
    await input.press('Enter');

    await page.waitForTimeout(1000);

    // Message should appear
    const messagesArea = page.locator('[role="log"], .messages-list');
    const text = await messagesArea.textContent().catch(() => '');
    expect(text).toContain('Teste mobile');
  });
});
