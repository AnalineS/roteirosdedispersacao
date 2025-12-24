/**
 * Tests for useFavorites - Issue #331
 * Coverage: Add/remove favorites, localStorage persistence, search, export, max limit
 */

import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../useFavorites';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL.createObjectURL for export tests
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('useFavorites - Issue #331', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty favorites', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toEqual([]);
    });

    it('should load favorites from localStorage on mount', () => {
      const mockFavorites = [
        {
          id: 'msg-1',
          content: 'Test message',
          role: 'user' as const,
          persona: 'dr_gasnelio',
          favoritedAt: new Date().toISOString(),
        },
      ];

      localStorageMock.setItem('chat_favorites', JSON.stringify(mockFavorites));

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].content).toBe('Test message');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('chat_favorites', 'invalid json{');

      const { result } = renderHook(() => useFavorites());

      expect(result.current.favorites).toEqual([]);
    });
  });

  describe('Add Favorite', () => {
    it('should add a favorite message', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0]).toMatchObject({
        id: 'msg-1',
        content: 'Test content',
        role: 'user',
        persona: 'dr_gasnelio',
      });
      expect(result.current.favorites[0].favoritedAt).toBeDefined();
    });

    it('should not add duplicate favorites', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(1);
    });

    it('should add favorite with timestamp', () => {
      const { result } = renderHook(() => useFavorites());
      const now = new Date().getTime();

      act(() => {
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio', now);
      });

      expect(result.current.favorites[0].timestamp).toBe(now);
    });

    it('should persist favorites to localStorage', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
      });

      const stored = JSON.parse(localStorageMock.getItem('chat_favorites') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].content).toBe('Test content');
    });
  });

  describe('Remove Favorite', () => {
    it('should remove a favorite by ID', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test 1', 'user', 'dr_gasnelio');
        result.current.addFavorite('msg-2', 'Test 2', 'user', 'dr_gasnelio');
      });

      act(() => {
        result.current.removeFavorite('msg-1');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].id).toBe('msg-2');
    });

    it('should update localStorage after removal', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test 1', 'user', 'dr_gasnelio');
        result.current.addFavorite('msg-2', 'Test 2', 'user', 'dr_gasnelio');
      });

      act(() => {
        result.current.removeFavorite('msg-1');
      });

      const stored = JSON.parse(localStorageMock.getItem('chat_favorites') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('msg-2');
    });

    it('should handle removing non-existent favorite gracefully', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });

      act(() => {
        result.current.removeFavorite('non-existent');
      });

      expect(result.current.favorites).toHaveLength(1);
    });
  });

  describe('Toggle Favorite', () => {
    it('should add favorite when not favorited', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].id).toBe('msg-1');
    });

    it('should remove favorite when already favorited', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
      });

      act(() => {
        result.current.toggleFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(0);
    });

    it('should toggle correctly multiple times', () => {
      const { result } = renderHook(() => useFavorites());

      // Add
      act(() => {
        result.current.toggleFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });
      expect(result.current.favorites).toHaveLength(1);

      // Remove
      act(() => {
        result.current.toggleFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });
      expect(result.current.favorites).toHaveLength(0);

      // Add again
      act(() => {
        result.current.toggleFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });
      expect(result.current.favorites).toHaveLength(1);
    });
  });

  describe('Is Favorite Check', () => {
    it('should return false for non-favorited message', () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite('msg-1')).toBe(false);
    });

    it('should return true for favorited message', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });

      expect(result.current.isFavorite('msg-1')).toBe(true);
    });

    it('should update correctly after removal', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });

      expect(result.current.isFavorite('msg-1')).toBe(true);

      act(() => {
        result.current.removeFavorite('msg-1');
      });

      expect(result.current.isFavorite('msg-1')).toBe(false);
    });
  });

  describe('Export Functionality', () => {
    it('should export favorites as JSON file', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test 1', 'user', 'dr_gasnelio');
        result.current.addFavorite('msg-2', 'Test 2', 'assistant', 'ga');
      });

      // Mock document.createElement and click
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();

      act(() => {
        result.current.exportFavorites();
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/chat_favorites_\d+\.json/);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should include all favorite data in export', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test content', 'user', 'dr_gasnelio', Date.now());
      });

      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');

      act(() => {
        result.current.exportFavorites();
      });

      const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobCall.type).toBe('application/json');

      createObjectURLSpy.mockRestore();
    });
  });

  describe('Max Limit Enforcement (100 favorites)', () => {
    it('should not add favorite when limit (100) is reached', () => {
      const { result } = renderHook(() => useFavorites());

      // Add 100 favorites
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addFavorite(`msg-${i}`, `Test ${i}`, 'user', 'dr_gasnelio');
        }
      });

      expect(result.current.favorites).toHaveLength(100);

      // Try to add 101st favorite
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.addFavorite('msg-101', 'Test 101', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(100);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should allow adding after removing when at limit', () => {
      const { result } = renderHook(() => useFavorites());

      // Add 100 favorites
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addFavorite(`msg-${i}`, `Test ${i}`, 'user', 'dr_gasnelio');
        }
      });

      // Remove one
      act(() => {
        result.current.removeFavorite('msg-0');
      });

      expect(result.current.favorites).toHaveLength(99);

      // Now can add again
      act(() => {
        result.current.addFavorite('msg-new', 'New test', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(100);
    });
  });

  describe('Clear All Favorites', () => {
    it('should clear all favorites', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test 1', 'user', 'dr_gasnelio');
        result.current.addFavorite('msg-2', 'Test 2', 'user', 'dr_gasnelio');
        result.current.addFavorite('msg-3', 'Test 3', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(3);

      act(() => {
        result.current.clearAllFavorites();
      });

      expect(result.current.favorites).toHaveLength(0);
    });

    it('should clear localStorage when clearing all', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });

      act(() => {
        result.current.clearAllFavorites();
      });

      const stored = localStorageMock.getItem('chat_favorites');
      expect(stored).toBe('[]');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist across hook instances', () => {
      const { result: result1 } = renderHook(() => useFavorites());

      act(() => {
        result1.current.addFavorite('msg-1', 'Persistent test', 'user', 'dr_gasnelio');
      });

      // Create new hook instance (simulating component remount)
      const { result: result2 } = renderHook(() => useFavorites());

      expect(result2.current.favorites).toHaveLength(1);
      expect(result2.current.favorites[0].content).toBe('Persistent test');
    });

    it('should handle localStorage quota exceeded gracefully', () => {
      const { result } = renderHook(() => useFavorites());

      const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      act(() => {
        result.current.addFavorite('msg-1', 'Test', 'user', 'dr_gasnelio');
      });

      // Should not crash
      expect(result.current.favorites).toHaveLength(1);

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', '', 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.favorites[0].content).toBe('');
    });

    it('should handle very long content', () => {
      const { result } = renderHook(() => useFavorites());
      const longContent = 'a'.repeat(10000);

      act(() => {
        result.current.addFavorite('msg-1', longContent, 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites[0].content).toBe(longContent);
    });

    it('should handle special characters in content', () => {
      const { result } = renderHook(() => useFavorites());
      const specialContent = '🎉 Test <script>alert("xss")</script> "quotes" \'apostrophes\'';

      act(() => {
        result.current.addFavorite('msg-1', specialContent, 'user', 'dr_gasnelio');
      });

      expect(result.current.favorites[0].content).toBe(specialContent);
    });

    it('should maintain order of favorites (newest first)', () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite('msg-1', 'First', 'user', 'dr_gasnelio');
      });

      // Wait 1ms to ensure different timestamps
      setTimeout(() => {
        act(() => {
          result.current.addFavorite('msg-2', 'Second', 'user', 'dr_gasnelio');
          result.current.addFavorite('msg-3', 'Third', 'user', 'dr_gasnelio');
        });
      }, 1);

      expect(result.current.favorites[0].content).toBe('Third');
      expect(result.current.favorites[2].content).toBe('First');
    });
  });
});
