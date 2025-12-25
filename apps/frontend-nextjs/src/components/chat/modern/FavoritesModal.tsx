'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { modernChatTheme } from '@/config/modernTheme';
import { type FavoriteMessage } from '@/hooks/useFavorites';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteMessage[];
  onRemoveFavorite: (messageId: string) => void;
  onExport: () => void;
  isMobile?: boolean;
}

export default function FavoritesModal({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onExport,
  isMobile = false
}: FavoritesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter favorites based on search
  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favorites;

    const term = searchTerm.toLowerCase();
    return favorites.filter(fav =>
      fav.content.toLowerCase().includes(term) ||
      (fav.persona && fav.persona.toLowerCase().includes(term))
    );
  }, [favorites, searchTerm]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: isMobile ? '95%' : 'min(800px, 90vw)',
          maxHeight: '85vh',
          backgroundColor: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: modernChatTheme.spacing.lg,
            borderBottom: '1px solid var(--color-gray-200, #e5e7eb)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2
            id="favorites-modal-title"
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-gray-900, #111827)'
            }}
          >
            ⭐ Mensagens Favoritas ({favorites.length}/100)
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              padding: modernChatTheme.spacing.xs,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--color-gray-500, #6b7280)',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Search and Actions */}
        <div
          style={{
            padding: modernChatTheme.spacing.md,
            borderBottom: '1px solid var(--color-gray-200, #e5e7eb)',
            display: 'flex',
            gap: modernChatTheme.spacing.sm,
            flexWrap: 'wrap'
          }}
        >
          <input
            type="search"
            placeholder="Buscar em favoritos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar mensagens favoritas"
            style={{
              flex: 1,
              minWidth: '200px',
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              border: '1px solid var(--color-gray-300, #d1d5db)',
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: '0.875rem'
            }}
          />
          <button
            onClick={onExport}
            disabled={favorites.length === 0}
            aria-label="Exportar favoritos como JSON"
            style={{
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              backgroundColor: favorites.length === 0 ? 'var(--color-gray-300, #d1d5db)' : 'var(--color-primary, #0066cc)',
              color: 'white',
              border: 'none',
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: favorites.length === 0 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            📥 Exportar JSON
          </button>
        </div>

        {/* Favorites List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: modernChatTheme.spacing.md
          }}
        >
          {filteredFavorites.length === 0 ? (
            <div
              style={{
                padding: modernChatTheme.spacing.xl,
                textAlign: 'center',
                color: 'var(--color-gray-500, #6b7280)'
              }}
            >
              {searchTerm ? (
                <>
                  <p style={{ margin: 0, fontSize: '1rem' }}>
                    Nenhum favorito encontrado para "{searchTerm}"
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: '3rem' }}>☆</p>
                  <p style={{ margin: '1rem 0 0', fontSize: '1rem' }}>
                    Você ainda não tem mensagens favoritas.
                  </p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                    Clique na estrela nas mensagens para salvá-las aqui!
                  </p>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: modernChatTheme.spacing.md
              }}
            >
              {filteredFavorites.map((favorite) => (
                <div
                  key={favorite.id}
                  style={{
                    padding: modernChatTheme.spacing.md,
                    backgroundColor: 'var(--color-gray-50, #f9fafb)',
                    border: '1px solid var(--color-gray-200, #e5e7eb)',
                    borderRadius: modernChatTheme.borderRadius.md,
                    position: 'relative'
                  }}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveFavorite(favorite.id)}
                    aria-label="Remover dos favoritos"
                    style={{
                      position: 'absolute',
                      top: modernChatTheme.spacing.sm,
                      right: modernChatTheme.spacing.sm,
                      padding: modernChatTheme.spacing.xs,
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      color: 'var(--color-gray-400, #9ca3af)',
                      lineHeight: 1
                    }}
                    title="Remover dos favoritos"
                  >
                    ⭐
                  </button>

                  {/* Metadata */}
                  <div
                    style={{
                      display: 'flex',
                      gap: modernChatTheme.spacing.sm,
                      marginBottom: modernChatTheme.spacing.sm,
                      fontSize: '0.75rem',
                      color: 'var(--color-gray-500, #6b7280)'
                    }}
                  >
                    <span>{favorite.role === 'user' ? '👤 Você' : `🤖 ${favorite.persona || 'Assistente'}`}</span>
                    <span>•</span>
                    <span>{new Date(favorite.favoritedAt).toLocaleDateString('pt-BR')}</span>
                    {favorite.timestamp && (
                      <>
                        <span>•</span>
                        <span>{new Date(favorite.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      color: 'var(--color-gray-700, #374151)',
                      whiteSpace: 'pre-wrap',
                      paddingRight: '2rem' // Space for remove button
                    }}
                  >
                    {favorite.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: modernChatTheme.spacing.md,
            borderTop: '1px solid var(--color-gray-200, #e5e7eb)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-gray-500, #6b7280)'
          }}
        >
          <span>
            {filteredFavorites.length !== favorites.length && (
              `${filteredFavorites.length} de ${favorites.length} mensagens`
            )}
          </span>
          <span>
            Pressione Esc para fechar
          </span>
        </div>
      </div>

      {/* Keyboard shortcut: ESC to close */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
