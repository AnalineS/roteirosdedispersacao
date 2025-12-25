/**
 * Tests for MessageActions - Issue #331
 * Coverage: Keyboard shortcuts (Ctrl+Shift+C/F/E), focus tracking, accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageActions from '../MessageActions';

describe('MessageActions - Issue #331', () => {
  const mockOnCopy = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnRegenerate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should trigger copy when Ctrl+Shift+C is pressed while focused', async () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      expect(actionsContainer).toBeInTheDocument();

      // Focus the container
      fireEvent.mouseEnter(actionsContainer!);

      // Press Ctrl+Shift+C
      fireEvent.keyDown(window, {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledTimes(1);
      });
    });

    it('should toggle favorite when Ctrl+Shift+F is pressed while focused', async () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      fireEvent.mouseEnter(actionsContainer!);

      fireEvent.keyDown(window, {
        key: 'f',
        ctrlKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1);
      });
    });

    it('should trigger regenerate when Ctrl+Shift+E is pressed and available', async () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          canRegenerate={true}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      fireEvent.mouseEnter(actionsContainer!);

      fireEvent.keyDown(window, {
        key: 'e',
        ctrlKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(mockOnRegenerate).toHaveBeenCalledTimes(1);
      });
    });

    it('should not trigger shortcuts when not focused', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      // Press Ctrl+Shift+C without focusing
      fireEvent.keyDown(window, {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(mockOnCopy).not.toHaveBeenCalled();
    });

    it('should not trigger regenerate shortcut when canRegenerate is false', async () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          canRegenerate={false}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      fireEvent.mouseEnter(actionsContainer!);

      fireEvent.keyDown(window, {
        key: 'e',
        ctrlKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        expect(mockOnRegenerate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Focus Tracking', () => {
    it('should track focus on mouse enter', () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      fireEvent.mouseEnter(actionsContainer!);

      // After focus, shortcuts should work
      fireEvent.keyDown(window, {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(mockOnCopy).toHaveBeenCalled();
    });

    it('should untrack focus on mouse leave', () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      fireEvent.mouseEnter(actionsContainer!);
      fireEvent.mouseLeave(actionsContainer!);

      // After losing focus, shortcuts should not work
      fireEvent.keyDown(window, {
        key: 'c',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(mockOnCopy).not.toHaveBeenCalled();
    });
  });

  describe('Copy Button', () => {
    it('should show "Copiar" button', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByRole('button', { name: /copiar resposta/i })).toBeInTheDocument();
    });

    it('should show "Copiado!" after clicking copy', async () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copiar resposta/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copiado!/i)).toBeInTheDocument();
      });
    });

    it('should include keyboard shortcut hint in title', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copiar resposta/i });
      expect(copyButton).toHaveAttribute('title', expect.stringContaining('Ctrl+Shift+C'));
    });
  });

  describe('Favorite Button', () => {
    it('should show "Favoritar" when not favorited', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByRole('button', { name: /adicionar aos favoritos/i })).toBeInTheDocument();
      expect(screen.getByText(/favoritar/i)).toBeInTheDocument();
    });

    it('should show "Favoritado" when favorited', () => {
      render(
        <MessageActions
          isFavorite={true}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      expect(screen.getByRole('button', { name: /remover dos favoritos/i })).toBeInTheDocument();
      expect(screen.getByText(/favoritado/i)).toBeInTheDocument();
    });

    it('should have aria-pressed attribute reflecting favorite state', () => {
      const { rerender } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /adicionar aos favoritos/i });
      expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

      rerender(
        <MessageActions
          isFavorite={true}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const favoritedButton = screen.getByRole('button', { name: /remover dos favoritos/i });
      expect(favoritedButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should include keyboard shortcut hint in title', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const favoriteButton = screen.getByRole('button', { name: /adicionar aos favoritos/i });
      expect(favoriteButton).toHaveAttribute('title', expect.stringContaining('Ctrl+Shift+F'));
    });
  });

  describe('Regenerate Button', () => {
    it('should show regenerate button when canRegenerate is true', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          canRegenerate={true}
        />
      );

      expect(screen.getByRole('button', { name: /explicar novamente/i })).toBeInTheDocument();
    });

    it('should not show regenerate button when canRegenerate is false', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          canRegenerate={false}
        />
      );

      expect(screen.queryByRole('button', { name: /explicar novamente/i })).not.toBeInTheDocument();
    });

    it('should include keyboard shortcut hint in title', () => {
      render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          canRegenerate={true}
        />
      );

      const regenerateButton = screen.getByRole('button', { name: /explicar novamente/i });
      expect(regenerateButton).toHaveAttribute('title', expect.stringContaining('Ctrl+Shift+E'));
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for action group', () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const actionsGroup = container.querySelector('[role="group"]');
      expect(actionsGroup).toBeInTheDocument();
      expect(actionsGroup).toHaveAttribute('aria-label', 'Ações da mensagem');
    });

    it('should show actions on hover (CSS)', () => {
      const { container } = render(
        <MessageActions
          isFavorite={false}
          onToggleFavorite={mockOnToggleFavorite}
          onCopy={mockOnCopy}
        />
      );

      const actionsContainer = container.querySelector('.message-actions');
      expect(actionsContainer).toHaveStyle({ opacity: 0 });
    });
  });
});
