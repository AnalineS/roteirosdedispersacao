'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import PersonaAvatar from './PersonaAvatar';
import { Persona } from '@/services/api';

// Constantes para responsividade
const MOBILE_BREAKPOINT = 768;
const SIDEBAR_WIDTH = 320;
const MOBILE_SIDEBAR_WIDTH = '100vw';

interface ConversationSummary {
  id: string;
  personaId: string;
  title: string;
  lastMessage: string;
  lastActivity: number;
  messageCount: number;
}

interface ConversationHistoryProps {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  personas: Record<string, Persona>;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: (personaId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export default function ConversationHistory({
  conversations,
  currentConversationId,
  personas,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isVisible,
  onToggle
}: ConversationHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const formatLastActivity = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    
    return new Date(timestamp).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const startEditing = (conversation: ConversationSummary) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const saveEditing = () => {
    if (editingId && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const groupedConversations = useMemo(() => {
    return conversations.reduce((groups, conv) => {
      const personaId = conv.personaId;
      if (!groups[personaId]) {
        groups[personaId] = [];
      }
      groups[personaId].push(conv);
      return groups;
    }, {} as Record<string, ConversationSummary[]>);
  }, [conversations]);

  // Handlers memoizados para evitar re-renders
  const handleNewConversation = useCallback((personaId: string) => {
    onNewConversation(personaId);
  }, [onNewConversation]);

  const handleConversationSelect = useCallback((conversationId: string) => {
    onConversationSelect(conversationId);
  }, [onConversationSelect]);

  return (
    <>

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isVisible ? 0 : (isMobile ? '-100%' : '-320px'),
          width: isMobile ? '85vw' : '320px',
          maxWidth: '320px',
          height: '100vh',
          background: 'white',
          borderRight: '1px solid #e0e0e0',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
          zIndex: 999,
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          background: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.2rem',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💬 Conversas
          </h3>
          <p style={{
            margin: '5px 0 0 0',
            fontSize: '0.85rem',
            color: '#666'
          }}>
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 0'
        }}>
          {Object.entries(groupedConversations).map(([personaId, personaConversations]) => {
            const persona = personas[personaId];
            if (!persona) return null;

            return (
              <div key={personaId} style={{ marginBottom: '20px' }}>
                {/* Persona Header */}
                <div style={{
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#f5f7fa',
                  borderBottom: '1px solid #e8eaf0'
                }}>
                  <PersonaAvatar 
                    persona={persona}
                    personaId={personaId}
                    size="small"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {persona.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#666'
                    }}>
                      {personaConversations.length} conversa{personaConversations.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleNewConversation(personaId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1976d2',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    title="Nova conversa"
                  >
                    +
                  </button>
                </div>

                {/* Conversations for this persona */}
                {personaConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      background: conversation.id === currentConversationId ? '#e3f2fd' : 'transparent',
                      borderLeft: conversation.id === currentConversationId ? '4px solid #1976d2' : '4px solid transparent',
                      position: 'relative'
                    }}
                    onMouseEnter={() => setHoveredId(conversation.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    {editingId === conversation.id ? (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          onBlur={saveEditing}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            border: '1px solid #1976d2',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: conversation.id === currentConversationId ? '600' : 'normal',
                          color: '#333',
                          marginBottom: '4px',
                          wordBreak: 'break-word'
                        }}>
                          {conversation.title}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          marginBottom: '4px',
                          wordBreak: 'break-word'
                        }}>
                          {conversation.lastMessage}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#999'
                          }}>
                            {formatLastActivity(conversation.lastActivity)}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#999',
                            background: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: '10px'
                          }}>
                            {conversation.messageCount} msg
                          </span>
                        </div>

                        {/* Action buttons */}
                        {hoveredId === conversation.id && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            display: 'flex',
                            gap: '4px'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(conversation);
                              }}
                              style={{
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                              title="Renomear"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Deseja excluir esta conversa?')) {
                                  onDeleteConversation(conversation.id);
                                }
                              }}
                              style={{
                                background: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                color: '#d32f2f'
                              }}
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {conversations.length === 0 && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</div>
              <p>Nenhuma conversa ainda</p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Comece uma nova conversa selecionando uma persona
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isVisible && isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            touchAction: 'none'
          }}
          onClick={onToggle}
        />
      )}
    </>
  );
}