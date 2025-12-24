/**
 * Hook para gerenciar mensagens favoritas - Issue #331
 *
 * Funcionalidades:
 * - Adicionar/remover favoritos
 * - Persistência em localStorage
 * - Limite máximo de 100 favoritos
 * - Exportar favoritos para JSON
 */

import { useState, useEffect, useCallback } from 'react';
import { type ChatMessage } from '@/types/api';
import { safeLocalStorage } from '@/hooks/useClientStorage';

const STORAGE_KEY = 'chat_favorites';
const MAX_FAVORITES = 100;

export interface FavoriteMessage extends ChatMessage {
  favoritedAt: string;
  tags?: string[];
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storage = safeLocalStorage();
    if (!storage) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = storage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FavoriteMessage[];
        setFavorites(parsed);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoading) return;

    const storage = safeLocalStorage();
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites, isLoading]);

  // Check if a message is favorited
  const isFavorite = useCallback((messageId: string): boolean => {
    return favorites.some(fav => fav.id === messageId);
  }, [favorites]);

  // Add message to favorites
  const addFavorite = useCallback((message: ChatMessage) => {
    setFavorites(prev => {
      // Check if already favorited
      if (prev.some(fav => fav.id === message.id)) {
        return prev;
      }

      // Check limit
      if (prev.length >= MAX_FAVORITES) {
        console.warn(`Limite de ${MAX_FAVORITES} favoritos atingido`);
        return prev;
      }

      // Add with timestamp
      const favorite: FavoriteMessage = {
        ...message,
        favoritedAt: new Date().toISOString()
      };

      return [favorite, ...prev]; // Add to beginning
    });
  }, []);

  // Remove message from favorites
  const removeFavorite = useCallback((messageId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== messageId));
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback((message: ChatMessage) => {
    if (isFavorite(message.id)) {
      removeFavorite(message.id);
    } else {
      addFavorite(message);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    if (window.confirm('Tem certeza que deseja remover todos os favoritos?')) {
      setFavorites([]);
    }
  }, []);

  // Export favorites to JSON file
  const exportFavorites = useCallback(() => {
    if (favorites.length === 0) {
      alert('Nenhum favorito para exportar');
      return;
    }

    try {
      const dataStr = JSON.stringify(favorites, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `favoritos-chat-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting favorites:', error);
      alert('Erro ao exportar favoritos');
    }
  }, [favorites]);

  // Get favorite by ID
  const getFavorite = useCallback((messageId: string): FavoriteMessage | undefined => {
    return favorites.find(fav => fav.id === messageId);
  }, [favorites]);

  // Search favorites by content
  const searchFavorites = useCallback((query: string): FavoriteMessage[] => {
    if (!query.trim()) return favorites;

    const lowerQuery = query.toLowerCase();
    return favorites.filter(fav =>
      fav.content.toLowerCase().includes(lowerQuery) ||
      (fav.persona && fav.persona.toLowerCase().includes(lowerQuery))
    );
  }, [favorites]);

  return {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    exportFavorites,
    getFavorite,
    searchFavorites,
    count: favorites.length,
    hasReachedLimit: favorites.length >= MAX_FAVORITES
  };
}
