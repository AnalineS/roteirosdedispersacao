'use client';

import { useState, useEffect } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'interaction' | 'general';
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    { keys: ['Tab'], description: 'Navegar para próximo elemento', category: 'navigation' },
    { keys: ['Shift', 'Tab'], description: 'Navegar para elemento anterior', category: 'navigation' },
    { keys: ['Enter'], description: 'Ativar link ou botão', category: 'navigation' },
    { keys: ['Space'], description: 'Ativar botão ou checkbox', category: 'navigation' },
    { keys: ['Escape'], description: 'Fechar menu/modal', category: 'navigation' },
    { keys: ['↑', '↓'], description: 'Navegar verticalmente nos menus', category: 'navigation' },
    { keys: ['←', '→'], description: 'Navegar horizontalmente', category: 'navigation' },
    { keys: ['Home'], description: 'Ir para o primeiro elemento', category: 'navigation' },
    { keys: ['End'], description: 'Ir para o último elemento', category: 'navigation' },
    
    // Interaction shortcuts
    { keys: ['Ctrl', 'K'], description: 'Abrir busca rápida', category: 'interaction' },
    { keys: ['Ctrl', 'H'], description: 'Ir para página inicial', category: 'interaction' },
    { keys: ['Ctrl', 'D'], description: 'Abrir dashboard', category: 'interaction' },
    { keys: ['Ctrl', 'M'], description: 'Abrir módulos educacionais', category: 'interaction' },
    
    // General shortcuts
    { keys: ['?'], description: 'Mostrar esta ajuda', category: 'general' },
    { keys: ['Ctrl', 'R'], description: 'Recarregar página', category: 'general' },
    { keys: ['F11'], description: 'Tela cheia', category: 'general' },
  ];

  const categoryNames = {
    navigation: '🧭 Navegação',
    interaction: '🎯 Interação',
    general: '⚙️ Geral'
  };

  const categoryColors = {
    navigation: '#1976d2',
    interaction: '#4caf50',
    general: '#ff9800'
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => Math.min(shortcuts.length - 1, prev + 1));
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        transform: 'translate3d(0, 0, 0)' // GPU optimization
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          transform: 'translate3d(0, 0, 0)' // GPU optimization
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <h2 id="shortcuts-title" style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1976d2'
          }}>
            ⌨️ Atalhos de Teclado
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              color: '#666'
            }}
            aria-label="Fechar ajuda de atalhos"
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            Use estes atalhos para navegar de forma mais eficiente pelo sistema educacional.
            Pressione <kbd style={{ 
              background: '#f0f0f0', 
              padding: '2px 6px', 
              borderRadius: '3px',
              border: '1px solid #ccc',
              fontSize: '0.85rem'
            }}>Escape</kbd> para fechar esta ajuda.
          </p>
        </div>

        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts], categoryIndex) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: categoryColors[category as keyof typeof categoryColors],
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {categoryNames[category as keyof typeof categoryNames]}
            </h3>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {categoryShortcuts.map((shortcut, index) => (
                <div
                  key={`${category}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    color: '#333',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {shortcut.description}
                  </span>
                  
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex} style={{ display: 'flex', alignItems: 'center' }}>
                        <kbd style={{
                          background: 'white',
                          border: '2px solid #dee2e6',
                          borderBottomColor: '#adb5bd',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          color: '#495057',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          minWidth: '24px',
                          textAlign: 'center'
                        }}>
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span style={{ 
                            margin: '0 6px', 
                            color: '#666', 
                            fontSize: '0.8rem' 
                          }}>
                            +
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#1565c0',
            lineHeight: '1.4'
          }}>
            💡 <strong>Dica:</strong> Mantenha a tecla <kbd style={{ 
              background: 'white', 
              padding: '2px 6px', 
              borderRadius: '3px',
              border: '1px solid #90caf9',
              fontSize: '0.8rem'
            }}>Tab</kbd> pressionada para ver os elementos focáveis na página.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook para controlar a visibilidade dos atalhos
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Mostrar ajuda com '?' ou Ctrl+?
      if ((event.key === '?' && !event.ctrlKey) || 
          (event.key === '?' && event.ctrlKey)) {
        event.preventDefault();
        setIsOpen(true);
      }
      
      // Implementar outros atalhos globais
      if (event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            window.location.href = '/';
            break;
          case 'd':
            event.preventDefault();
            window.location.href = '/dashboard';
            break;
          case 'm':
            event.preventDefault();
            window.location.href = '/modules';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}