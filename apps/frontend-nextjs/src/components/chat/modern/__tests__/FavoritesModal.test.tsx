/**
 * Tests for FavoritesModal - Issue #331
 * Coverage: Modal display, search functionality, export, ESC to close
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FavoritesModal from '../FavoritesModal';
import { FavoriteMessage } from '@/hooks/useFavorites';

describe('FavoritesModal - Issue #331', () => {
  const mockOnClose = jest.fn();
  const mockOnRemoveFavorite = jest.fn();
  const mockOnExport = jest.fn();

  const mockFavorites: FavoriteMessage[] = [
    {
      id: 'msg-1',
      content: 'Qual a dosagem de rifampicina?',
      role: 'user',
      persona: 'dr_gasnelio',
      favoritedAt: new Date('2025-01-15').toISOString(),
      timestamp: new Date('2025-01-15T10:30:00').toISOString(),
    },
    {
      id: 'msg-2',
      content: 'A rifampicina deve ser administrada na dose de 600mg uma vez ao dia.',
      role: 'assistant',
      persona: 'dr_gasnelio',
      favoritedAt: new Date('2025-01-15').toISOString(),
      timestamp: new Date('2025-01-15T10:31:00').toISOString(),
    },
    {
      id: 'msg-3',
      content: 'Explique sobre reações adversas',
      role: 'user',
      persona: 'ga',
      favoritedAt: new Date('2025-01-16').toISOString(),
      timestamp: new Date('2025-01-16T14:20:00').toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should not render when isOpen is false', () => {
      render(
        <FavoritesModal
          isOpen={false}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'favorites-modal-title');
    });

    it('should show favorites count in title', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/mensagens favoritas \(3\/100\)/i)).toBeInTheDocument();
    });
  });

  describe('ESC to Close', () => {
    it('should close modal when ESC is pressed', async () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not close when other keys are pressed', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show ESC hint in footer', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/pressione esc para fechar/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should show search input', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const searchInput = screen.getByRole('searchbox', { name: /buscar mensagens favoritas/i });
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter favorites by content', async () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'rifampicina' } });

      await waitFor(() => {
        expect(screen.getByText(/qual a dosagem de rifampicina/i)).toBeInTheDocument();
        expect(screen.getByText(/a rifampicina deve ser administrada/i)).toBeInTheDocument();
        expect(screen.queryByText(/explique sobre reações adversas/i)).not.toBeInTheDocument();
      });
    });

    it('should filter favorites by persona', async () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'gasnelio' } });

      await waitFor(() => {
        expect(screen.getByText(/qual a dosagem de rifampicina/i)).toBeInTheDocument();
        expect(screen.queryByText(/explique sobre reações adversas/i)).not.toBeInTheDocument();
      });
    });

    it('should show "no results" message when search has no matches', async () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'termo inexistente' } });

      await waitFor(() => {
        expect(screen.getByText(/nenhum favorito encontrado para/i)).toBeInTheDocument();
      });
    });

    it('should show filtered count in footer', async () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'rifampicina' } });

      await waitFor(() => {
        expect(screen.getByText(/2 de 3 mensagens/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should show export button', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByRole('button', { name: /exportar favoritos como json/i })).toBeInTheDocument();
    });

    it('should trigger export when clicked', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByRole('button', { name: /exportar favoritos como json/i });
      fireEvent.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });

    it('should disable export button when no favorites', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={[]}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const exportButton = screen.getByRole('button', { name: /exportar favoritos como json/i });
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Remove Favorite', () => {
    it('should show remove button for each favorite', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remover dos favoritos/i });
      expect(removeButtons).toHaveLength(3);
    });

    it('should call onRemoveFavorite when remove button is clicked', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remover dos favoritos/i });
      fireEvent.click(removeButtons[0]);

      expect(mockOnRemoveFavorite).toHaveBeenCalledWith('msg-1');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no favorites', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={[]}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/você ainda não tem mensagens favoritas/i)).toBeInTheDocument();
      expect(screen.getByText(/clique na estrela nas mensagens/i)).toBeInTheDocument();
    });
  });

  describe('Favorite Details Display', () => {
    it('should display message content', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/qual a dosagem de rifampicina/i)).toBeInTheDocument();
      expect(screen.getByText(/a rifampicina deve ser administrada/i)).toBeInTheDocument();
    });

    it('should display role and persona', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      expect(screen.getByText(/👤 você/i)).toBeInTheDocument();
      expect(screen.getByText(/🤖 dr_gasnelio/i)).toBeInTheDocument();
    });

    it('should display formatted date', () => {
      render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      // Check for date formatting (will vary by locale, just check presence)
      const dates = screen.getAllByText(/\/2025/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Backdrop Interaction', () => {
    it('should close modal when backdrop is clicked', () => {
      const { container } = render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
        />
      );

      // Find backdrop (first div with fixed position and backdrop-filter)
      const backdrop = container.querySelector('[style*="backdrop-filter"]');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mobile Optimization', () => {
    it('should adjust width for mobile', () => {
      const { container } = render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
          isMobile={true}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle({ width: '95%' });
    });

    it('should use full width on desktop', () => {
      const { container } = render(
        <FavoritesModal
          isOpen={true}
          onClose={mockOnClose}
          favorites={mockFavorites}
          onRemoveFavorite={mockOnRemoveFavorite}
          onExport={mockOnExport}
          isMobile={false}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle({ width: 'min(800px, 90vw)' });
    });
  });
});
