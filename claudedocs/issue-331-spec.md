## 🎯 Objetivo
Implementar ações rápidas contextuais para cada mensagem do chat (copiar, favoritar, explicar novamente), melhorando produtividade e retenção de informações valiosas pelos usuários.

---

## 📊 User Stories

### Histórias Principais
1. **Como** profissional de saúde em atendimento
   **Quero** copiar rapidamente respostas do Dr. Gasnelio para colar em prontuários
   **Para que** eu possa documentar orientações técnicas sem reescrever

2. **Como** estudante de farmácia
   **Quero** salvar respostas importantes como favoritos
   **Para que** eu possa revisar conteúdo educacional posteriormente

3. **Como** usuário que não entendeu completamente
   **Quero** pedir para o assistente explicar novamente de forma diferente
   **Para que** eu possa compreender melhor conceitos complexos

4. **Como** usuário de tecnologia assistiva
   **Quero** usar atalhos de teclado para ações rápidas
   **Para que** eu possa ser produtivo sem depender do mouse

---

## ✅ Critérios de Aceitação (Testáveis)

### 1. Botão "Copiar Resposta"
- [ ] Ícone de clipboard visível em hover/focus de mensagens do assistente
- [ ] Click copia conteúdo completo da mensagem para área de transferência
- [ ] Toast de confirmação: "Resposta copiada para área de transferência"
- [ ] Atalho de teclado: Ctrl+C (quando mensagem tem foco)
- [ ] Botão muda para checkmark (✓) por 2s após copiar
- [ ] Teste: Verificar que clipboard contém texto da mensagem

### 2. Botão "Favoritar"
- [ ] Ícone de estrela (outline vazio, filled quando favoritado)
- [ ] Click alterna entre favoritado/não favoritado
- [ ] Persistência via LocalStorage (chave: `chat-favorites`)
- [ ] Toast de confirmação: "Adicionado aos favoritos" / "Removido dos favoritos"
- [ ] Contador de favoritos visível no header: "★ 5 favoritos"
- [ ] Teste: Verificar que estado persiste após reload da página

### 3. Botão "Explicar Novamente"
- [ ] Ícone de refresh/repeat visível em mensagens do assistente
- [ ] Click envia prompt: "Pode explicar isso de outra forma mais simples?"
- [ ] Contexto da mensagem original mantido
- [ ] Nova resposta aparece no chat normalmente
- [ ] Limite: 3 re-explicações por mensagem (evitar loop infinito)
- [ ] Teste: Verificar que nova mensagem é enviada com contexto

### 4. Toast Notifications
- [ ] Componente de toast já existente reutilizado (`ErrorToast`)
- [ ] Duração: 3s (auto-dismiss)
- [ ] Posição: top-right (consistente com erros)
- [ ] Acessível via aria-live="polite"
- [ ] Teste: Verificar que toast aparece e desaparece

### 5. Atalhos de Teclado
- [ ] **Ctrl+C:** Copiar mensagem em foco
- [ ] **Ctrl+F:** Favoritar/desfavoritar mensagem em foco
- [ ] **Ctrl+E:** Explicar novamente (explain)
- [ ] Atalhos documentados em tooltip dos botões
- [ ] Teste: Validar que atalhos funcionam com keyboard navigation

### 6. Página/Modal de Favoritos
- [ ] Link "Ver Favoritos" no header (quando contador > 0)
- [ ] Modal/página lista todos os favoritos
- [ ] Cada favorito mostra: mensagem, timestamp, persona, botão remover
- [ ] Busca/filtro por texto dentro de favoritos
- [ ] Exportar favoritos como Markdown/PDF
- [ ] Teste: Adicionar 5 favoritos e visualizar na lista

---

## 🔧 Implementação Técnica Detalhada

### Arquivos a Criar/Modificar

#### 1. CRIAR: `apps/frontend-nextjs/src/hooks/useFavorites.ts`
```typescript
import { useState, useCallback, useEffect } from 'react';
import { safeLocalStorage } from '@/hooks/useClientStorage';
import { type ChatMessage } from '@/types/api';

const FAVORITES_STORAGE_KEY = 'chat-favorites';
const MAX_FAVORITES = 100; // Limite para evitar LocalStorage overflow

interface FavoriteMessage extends ChatMessage {
  favoritedAt: string; // ISO timestamp
  userNote?: string; // Nota opcional do usuário
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar favoritos do LocalStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = safeLocalStorage()?.getItem(FAVORITES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setFavorites(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Persistir no LocalStorage
  const persistFavorites = useCallback((newFavorites: FavoriteMessage[]) => {
    try {
      safeLocalStorage()?.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(newFavorites)
      );
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  }, []);

  // Verificar se mensagem está favoritada
  const isFavorite = useCallback((messageId: string) => {
    return favorites.some(fav => fav.id === messageId);
  }, [favorites]);

  // Adicionar aos favoritos
  const addFavorite = useCallback((message: ChatMessage) => {
    setFavorites(prev => {
      // Evitar duplicatas
      if (prev.some(fav => fav.id === message.id)) {
        return prev;
      }

      // Verificar limite
      if (prev.length >= MAX_FAVORITES) {
        console.warn(`Limite de ${MAX_FAVORITES} favoritos atingido`);
        return prev;
      }

      const favorite: FavoriteMessage = {
        ...message,
        favoritedAt: new Date().toISOString()
      };

      const updated = [favorite, ...prev]; // Mais recentes primeiro
      persistFavorites(updated);
      return updated;
    });
  }, [persistFavorites]);

  // Remover dos favoritos
  const removeFavorite = useCallback((messageId: string) => {
    setFavorites(prev => {
      const updated = prev.filter(fav => fav.id !== messageId);
      persistFavorites(updated);
      return updated;
    });
  }, [persistFavorites]);

  // Toggle favorito
  const toggleFavorite = useCallback((message: ChatMessage) => {
    if (isFavorite(message.id)) {
      removeFavorite(message.id);
      return false; // Removido
    } else {
      addFavorite(message);
      return true; // Adicionado
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Limpar todos os favoritos
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    safeLocalStorage()?.removeItem(FAVORITES_STORAGE_KEY);
  }, []);

  // Buscar favoritos
  const searchFavorites = useCallback((query: string) => {
    if (!query.trim()) return favorites;

    const lowerQuery = query.toLowerCase();
    return favorites.filter(fav =>
      fav.content.toLowerCase().includes(lowerQuery)
    );
  }, [favorites]);

  // Exportar favoritos como Markdown
  const exportAsMarkdown = useCallback(() => {
    const markdown = favorites.map(fav => {
      const date = new Date(fav.favoritedAt).toLocaleDateString('pt-BR');
      return `### ${fav.persona} - ${date}\n\n${fav.content}\n\n---\n`;
    }).join('\n');

    return `# Mensagens Favoritas - Roteiro de Dispensação\n\n${markdown}`;
  }, [favorites]);

  return {
    favorites,
    isLoading,
    favoriteCount: favorites.length,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearAllFavorites,
    searchFavorites,
    exportAsMarkdown
  };
}
```

#### 2. CRIAR: `apps/frontend-nextjs/src/components/chat/MessageActions.tsx`
```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Star, RefreshCw, Check } from 'lucide-react';
import { type ChatMessage } from '@/types/api';
import { useChatAccessibility } from '@/components/chat/accessibility/ChatAccessibilityProvider';

interface MessageActionsProps {
  message: ChatMessage;
  onCopy: () => void;
  onToggleFavorite: () => void;
  onExplainAgain: () => void;
  isFavorite: boolean;
  canExplainAgain: boolean; // Limite de 3 re-explicações
}

export default function MessageActions({
  message,
  onCopy,
  onToggleFavorite,
  onExplainAgain,
  isFavorite,
  canExplainAgain
}: MessageActionsProps) {
  const [showCopied, setShowCopied] = useState(false);
  const { announceMessage } = useChatAccessibility();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowCopied(true);
      announceMessage('Resposta copiada para área de transferência', 'polite');

      setTimeout(() => setShowCopied(false), 2000);
      onCopy();
    } catch (error) {
      console.error('Erro ao copiar:', error);
      announceMessage('Erro ao copiar resposta', 'polite');
    }
  }, [message.content, onCopy, announceMessage]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite();
    const action = isFavorite ? 'Removido dos' : 'Adicionado aos';
    announceMessage(`${action} favoritos`, 'polite');
  }, [onToggleFavorite, isFavorite, announceMessage]);

  const handleExplainAgain = useCallback(() => {
    if (!canExplainAgain) {
      announceMessage('Limite de re-explicações atingido para esta mensagem', 'polite');
      return;
    }
    onExplainAgain();
    announceMessage('Solicitando nova explicação', 'polite');
  }, [onExplainAgain, canExplainAgain, announceMessage]);

  // Apenas mostrar ações para mensagens do assistente
  if (message.role !== 'assistant') {
    return null;
  }

  return (
    <div
      className="message-actions"
      role="group"
      aria-label="Ações da mensagem"
      style={{
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
        opacity: 0,
        transition: 'opacity 0.2s ease'
      }}
    >
      {/* Botão Copiar */}
      <button
        onClick={handleCopy}
        aria-label={`Copiar resposta (Ctrl+C)`}
        title="Copiar resposta (Ctrl+C)"
        className="action-button"
        style={{
          padding: '6px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px',
          color: '#4B5563',
          transition: 'all 0.2s ease'
        }}
      >
        {showCopied ? (
          <>
            <Check size={16} color="#10B981" />
            <span style={{ color: '#10B981' }}>Copiado!</span>
          </>
        ) : (
          <>
            <Copy size={16} />
            <span>Copiar</span>
          </>
        )}
      </button>

      {/* Botão Favoritar */}
      <button
        onClick={handleToggleFavorite}
        aria-label={isFavorite ? 'Remover dos favoritos (Ctrl+F)' : 'Adicionar aos favoritos (Ctrl+F)'}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={isFavorite}
        className="action-button"
        style={{
          padding: '6px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          background: isFavorite ? '#FEF3C7' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px',
          color: isFavorite ? '#D97706' : '#4B5563',
          transition: 'all 0.2s ease'
        }}
      >
        <Star
          size={16}
          fill={isFavorite ? '#F59E0B' : 'none'}
          color={isFavorite ? '#F59E0B' : '#4B5563'}
        />
        <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
      </button>

      {/* Botão Explicar Novamente */}
      <button
        onClick={handleExplainAgain}
        disabled={!canExplainAgain}
        aria-label="Explicar novamente de forma diferente (Ctrl+E)"
        title={canExplainAgain ? 'Explicar novamente' : 'Limite de re-explicações atingido'}
        className="action-button"
        style={{
          padding: '6px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          background: 'white',
          cursor: canExplainAgain ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '14px',
          color: canExplainAgain ? '#4B5563' : '#9CA3AF',
          opacity: canExplainAgain ? 1 : 0.5,
          transition: 'all 0.2s ease'
        }}
      >
        <RefreshCw size={16} />
        <span>Explicar Novamente</span>
      </button>

      {/* CSS para hover */}
      <style jsx>{`
        .action-button:hover:not(:disabled) {
          background: #F3F4F6 !important;
          border-color: #9CA3AF !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .action-button:focus {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        /* Mostrar ações no hover ou focus do container */
        .message-bubble:hover .message-actions,
        .message-bubble:focus-within .message-actions {
          opacity: 1 !important;
        }

        /* Mobile: sempre visível */
        @media (max-width: 768px) {
          .message-actions {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
```

#### 3. MODIFICAR: `apps/frontend-nextjs/src/components/chat/accessibility/AccessibleMessageBubble.tsx`
```tsx
// Adicionar import
import MessageActions from '../MessageActions';
import { useFavorites } from '@/hooks/useFavorites';

// No componente AccessibleMessageBubble
export default function AccessibleMessageBubble({
  message,
  persona,
  // ... outras props
}: AccessibleMessageBubbleProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [explainAgainCount, setExplainAgainCount] = useState(0);

  const handleExplainAgain = useCallback(() => {
    if (explainAgainCount >= 3) return;

    // Enviar nova mensagem pedindo re-explicação
    const explainPrompt = `Pode explicar essa resposta de outra forma mais simples? Referência: "${message.content.substring(0, 100)}..."`;

    // Usar hook de chat para enviar mensagem
    sendMessage(explainPrompt, message.persona);

    setExplainAgainCount(prev => prev + 1);
  }, [message, explainAgainCount, sendMessage]);

  return (
    <div className="message-bubble">
      {/* Conteúdo da mensagem existente */}
      <div>{message.content}</div>

      {/* NOVO: Ações da mensagem */}
      <MessageActions
        message={message}
        onCopy={() => {/* Toast já é tratado no componente */}}
        onToggleFavorite={() => toggleFavorite(message)}
        onExplainAgain={handleExplainAgain}
        isFavorite={isFavorite(message.id)}
        canExplainAgain={explainAgainCount < 3}
      />
    </div>
  );
}
```

#### 4. CRIAR: `apps/frontend-nextjs/src/components/chat/FavoritesModal.tsx`
```tsx
'use client';

import React, { useState } from 'react';
import { X, Download, Search, Trash2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FavoritesModal({ isOpen, onClose }: FavoritesModalProps) {
  const {
    favorites,
    searchFavorites,
    removeFavorite,
    clearAllFavorites,
    exportAsMarkdown
  } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const displayedFavorites = searchFavorites(searchQuery);

  const handleExport = () => {
    const markdown = exportAsMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favoritos-chat-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorites-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 id="favorites-title" style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            Mensagens Favoritas ({favorites.length})
          </h2>

          <button
            onClick={onClose}
            aria-label="Fechar modal de favoritos"
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF'
              }}
            />
            <input
              type="search"
              placeholder="Buscar nos favoritos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }}>
          {displayedFavorites.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6B7280'
            }}>
              {searchQuery ? 'Nenhum favorito encontrado' : 'Nenhum favorito ainda'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayedFavorites.map(fav => (
                <div
                  key={fav.id}
                  style={{
                    padding: '16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {fav.persona} • {new Date(fav.favoritedAt).toLocaleDateString('pt-BR')}
                    </span>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      aria-label="Remover favorito"
                      style={{
                        padding: '4px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#EF4444'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                    {fav.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleExport}
            disabled={favorites.length === 0}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              background: 'white',
              cursor: favorites.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} />
            Exportar Markdown
          </button>

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja limpar todos os favoritos?')) {
                clearAllFavorites();
              }
            }}
            disabled={favorites.length === 0}
            style={{
              padding: '8px 16px',
              border: '1px solid #EF4444',
              borderRadius: '6px',
              background: '#FEE2E2',
              color: '#DC2626',
              cursor: favorites.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Limpar Todos
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 5. MODIFICAR: `apps/frontend-nextjs/src/components/chat/modern/ModernChatHeader.tsx`
```tsx
// Adicionar contador de favoritos
import { useFavorites } from '@/hooks/useFavorites';
import { Star } from 'lucide-react';

export default function ModernChatHeader({ /* ... props */ }) {
  const { favoriteCount } = useFavorites();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  return (
    <header className="chat-header">
      {/* ... conteúdo existente ... */}

      {/* Contador de Favoritos */}
      {favoriteCount > 0 && (
        <button
          onClick={() => setShowFavoritesModal(true)}
          aria-label={`Ver ${favoriteCount} mensagens favoritas`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            border: '1px solid #FDE68A',
            borderRadius: '20px',
            background: '#FEF3C7',
            color: '#D97706',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Star size={16} fill="#F59E0B" color="#F59E0B" />
          {favoriteCount} favorito{favoriteCount !== 1 ? 's' : ''}
        </button>
      )}

      <FavoritesModal
        isOpen={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
      />
    </header>
  );
}
```

---

## 🧪 Estratégia de Testes

### Testes Unitários
```typescript
// tests/hooks/useFavorites.test.ts
describe('useFavorites', () => {
  it('deve adicionar mensagem aos favoritos', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockMessage);
    });

    expect(result.current.isFavorite(mockMessage.id)).toBe(true);
    expect(result.current.favoriteCount).toBe(1);
  });

  it('deve remover favorito', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockMessage);
      result.current.removeFavorite(mockMessage.id);
    });

    expect(result.current.isFavorite(mockMessage.id)).toBe(false);
  });

  it('deve persistir favoritos após reload', () => {
    const { result, rerender } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockMessage);
    });

    rerender();

    expect(result.current.favoriteCount).toBe(1);
  });
});
```

### Testes E2E
```typescript
// tests/e2e/message-actions.spec.ts
test('deve copiar mensagem ao clicar em copiar', async ({ page }) => {
  await page.goto('/chat');
  await page.fill('[data-chat-input]', 'Teste');
  await page.press('[data-chat-input]', 'Enter');

  // Aguardar resposta
  await page.waitForSelector('.message-bubble:has-text("Resposta")');

  // Hover para mostrar ações
  await page.hover('.message-bubble');

  // Clicar em copiar
  await page.click('button:has-text("Copiar")');

  // Verificar clipboard (requer permissão)
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain('Resposta');

  // Verificar toast
  await expect(page.locator('text=copiada para área de transferência')).toBeVisible();
});

test('deve favoritar mensagem', async ({ page }) => {
  await page.goto('/chat');
  await page.fill('[data-chat-input]', 'Teste');
  await page.press('[data-chat-input]', 'Enter');

  await page.waitForSelector('.message-bubble');
  await page.click('button:has-text("Favoritar")');

  // Verificar contador no header
  await expect(page.locator('text=1 favorito')).toBeVisible();

  // Reload e verificar persistência
  await page.reload();
  await expect(page.locator('text=1 favorito')).toBeVisible();
});

test('atalho Ctrl+C deve copiar mensagem', async ({ page }) => {
  await page.goto('/chat');
  await page.fill('[data-chat-input]', 'Teste');
  await page.press('[data-chat-input]', 'Enter');

  await page.waitForSelector('.message-bubble');

  // Focar mensagem e usar atalho
  await page.focus('.message-bubble');
  await page.keyboard.press('Control+C');

  await expect(page.locator('text=Copiado')).toBeVisible();
});
```

---

## 🎯 Cenários de Edge Cases

### 1. LocalStorage Cheio
**Solução:** Limite de 100 favoritos + aviso quando próximo do limite
```typescript
if (favorites.length >= MAX_FAVORITES - 10) {
  showToast('Você está próximo do limite de favoritos (100)');
}
```

### 2. Mensagem Muito Longa (>10k chars)
**Solução:** Truncar preview em favoritos, manter conteúdo completo
```tsx
<p>{fav.content.length > 500
  ? fav.content.substring(0, 500) + '...'
  : fav.content}
</p>
```

### 3. Clipboard API Não Disponível (Safari antigo)
**Solução:** Fallback para seleção de texto
```typescript
if (!navigator.clipboard) {
  // Fallback: selecionar texto manualmente
  const textArea = document.createElement('textarea');
  textArea.value = message.content;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}
```

---

## 📊 Performance Considerations

### Impacto
- **MessageActions render:** +10ms por mensagem
- **LocalStorage read/write:** +5ms (síncrono)
- **Ícones (lucide-react):** Bundle +2KB

### Otimizações
- Lazy load do `FavoritesModal` (não carregar até usuário abrir)
- Debounce de busca em favoritos (300ms)
- Virtualização de lista de favoritos se > 50 items

---

## 🔐 Considerações de Segurança

### XSS Prevention
Sanitizar conteúdo antes de copiar/exportar:
```typescript
import DOMPurify from 'dompurify';
const safeCopy = DOMPurify.sanitize(message.content);
```

### LocalStorage Limits
- Max 5-10MB por domínio
- Implementar rotação automática (FIFO) quando próximo do limite

---

## 📈 Métricas de Sucesso

### Quantitativas
- [ ] Taxa de uso de "Copiar": > 20% das mensagens
- [ ] Média de favoritos por usuário: 5-10
- [ ] Taxa de uso de "Explicar Novamente": < 5% (indica clareza das respostas)

### Qualitativas
- [ ] Feedback positivo sobre produtividade
- [ ] Usuários reportam menos necessidade de fazer screenshots

---

## 🚀 Plano de Rollout

**Total estimado: 2 dias de trabalho**

### Fase 1: Desenvolvimento (1.5 dias)
1. Criar `useFavorites` hook
2. Implementar `MessageActions` component
3. Criar `FavoritesModal`
4. Integrar em `AccessibleMessageBubble`

### Fase 2: Testes (0.5 dia)
1. Testes unitários
2. Testes E2E
3. Testes de acessibilidade

---

## 🏷️ Labels
`ux` `enhancement` `high-impact` `low-effort` `productivity` `a11y`

🤖 Enhanced specification generated with Claude Code - Requirements Analysis Mode
