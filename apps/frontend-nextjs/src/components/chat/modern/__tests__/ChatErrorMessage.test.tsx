/**
 * Tests for ChatErrorMessage - Issue #330
 * Coverage: ARIA announcements, keyboard shortcuts (Alt+R), screen reader compliance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatErrorMessage from '../ChatErrorMessage';
import { classifyError } from '@/utils/errorClassification';
import { ChatAccessibilityProvider } from '../../accessibility/ChatAccessibilityProvider';

// Mock useChatAccessibility
const mockAnnounceSystemStatus = jest.fn();
jest.mock('../../accessibility/ChatAccessibilityProvider', () => ({
  ChatAccessibilityProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useChatAccessibility: () => ({
    announceSystemStatus: mockAnnounceSystemStatus,
    announceMessage: jest.fn(),
    announceTypingStatus: jest.fn(),
  }),
}));

describe('ChatErrorMessage - Issue #330', () => {
  const mockOnRetry = jest.fn();
  const networkError = classifyError(new TypeError('Failed to fetch'));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ARIA Announcements (WCAG 4.1.3)', () => {
    it('should announce error via screen reader on mount', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={networkError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      expect(mockAnnounceSystemStatus).toHaveBeenCalledWith(
        expect.stringContaining('Erro:'),
        'error'
      );
    });

    it('should announce retry status when retrying', () => {
      const { rerender } = render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            retryCount={0}
            isRetrying={false}
          />
        </ChatAccessibilityProvider>
      );

      mockAnnounceSystemStatus.mockClear();

      rerender(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            retryCount={1}
            isRetrying={true}
            maxRetries={3}
          />
        </ChatAccessibilityProvider>
      );

      expect(mockAnnounceSystemStatus).toHaveBeenCalledWith(
        expect.stringContaining('Tentando novamente'),
        'info'
      );
    });

    it('should have role="alert" for screen readers', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={networkError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Keyboard Shortcuts - Alt+R', () => {
    it('should trigger retry when Alt+R is pressed', async () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={networkError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      fireEvent.keyDown(window, { key: 'r', altKey: true });

      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalledTimes(1);
      });
    });

    it('should not trigger retry when Alt+R is pressed if retrying', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            isRetrying={true}
          />
        </ChatAccessibilityProvider>
      );

      fireEvent.keyDown(window, { key: 'r', altKey: true });

      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('should not trigger retry when Alt+R is pressed if max retries reached', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            retryCount={3}
            maxRetries={3}
          />
        </ChatAccessibilityProvider>
      );

      fireEvent.keyDown(window, { key: 'r', altKey: true });

      expect(mockOnRetry).not.toHaveBeenCalled();
    });

    it('should show retry button with Alt+R hint in title', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={networkError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toHaveAttribute('title', expect.stringContaining('Alt+R'));
    });
  });

  describe('Error Display', () => {
    it('should display user-friendly error message', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={networkError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      expect(screen.getByText(networkError.userMessage)).toBeInTheDocument();
    });

    it('should show retry count when available', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            retryCount={2}
            maxRetries={3}
          />
        </ChatAccessibilityProvider>
      );

      expect(screen.getByText(/tentativa 2 de 3/i)).toBeInTheDocument();
    });

    it('should show max retries message when limit reached', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            retryCount={3}
            maxRetries={3}
          />
        </ChatAccessibilityProvider>
      );

      expect(screen.getByText(/falha após 3 tentativas/i)).toBeInTheDocument();
    });
  });

  describe('Retry Button States', () => {
    it('should show retry button when error can be retried', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={networkError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    });

    it('should disable retry button when retrying', () => {
      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage
            error={networkError}
            onRetry={mockOnRetry}
            isRetrying={true}
          />
        </ChatAccessibilityProvider>
      );

      const retryButton = screen.getByRole('button', { name: /tentando novamente/i });
      expect(retryButton).toBeDisabled();
    });

    it('should not show retry button when error cannot be retried', () => {
      const validationError = classifyError(new Error('Validation error'));
      validationError.canRetry = false;

      render(
        <ChatAccessibilityProvider>
          <ChatErrorMessage error={validationError} onRetry={mockOnRetry} />
        </ChatAccessibilityProvider>
      );

      expect(screen.queryByRole('button', { name: /tentar novamente/i })).not.toBeInTheDocument();
    });
  });
});
