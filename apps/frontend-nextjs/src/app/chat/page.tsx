'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { usePersonas } from '@/hooks/usePersonas';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const { personas, loading: personasLoading, error: personasError } = usePersonas();
  const { messages, loading: chatLoading, error: chatError, sendMessage, clearMessages } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar persona selecionada do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPersona = localStorage.getItem('selectedPersona');
      if (storedPersona && personas[storedPersona]) {
        setSelectedPersona(storedPersona);
      }
    }
  }, [personas]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensagem de boas-vindas quando persona for selecionada
  useEffect(() => {
    if (selectedPersona && personas[selectedPersona] && messages.length === 0) {
      const persona = personas[selectedPersona];
      const welcomeMessage = `Olá! Eu sou ${persona.name}, ${persona.description}. Como posso ajudá-lo hoje com questões sobre hanseníase e PQT-U?`;
      
      // Simular mensagem de boas-vindas
      setTimeout(() => {
        sendMessage('_welcome_', selectedPersona);
      }, 500);
    }
  }, [selectedPersona, personas, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedPersona || chatLoading) return;

    const messageText = inputValue.trim();
    setInputValue('');
    
    await sendMessage(messageText, selectedPersona);
  };

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersona(personaId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPersona', personaId);
    }
    clearMessages(); // Limpar histórico ao trocar persona
  };

  if (personasLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p>Carregando chat...</p>
        </div>
      </div>
    );
  }

  if (personasError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⚠️</div>
          <p>Erro ao carregar chat: {personasError}</p>
          <Link href="/" style={{ color: '#1976d2', textDecoration: 'underline' }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  return (
    <>
      <Navigation currentPersona={currentPersona?.name} />
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }} className="main-content">
      {/* Header */}
      <div style={{
        background: '#1976d2',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
            ←
          </Link>
          {currentPersona && (
            <>
              <span style={{ fontSize: '2rem' }}>{currentPersona.avatar}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{currentPersona.name}</h2>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                  {currentPersona.personality}
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Seletor de Persona */}
        <select
          value={selectedPersona || ''}
          onChange={(e) => handlePersonaChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: '0.9rem'
          }}
        >
          <option value="">Escolher assistente...</option>
          {Object.entries(personas).map(([id, persona]) => (
            <option key={id} value={id} style={{ color: 'black' }}>
              {persona.avatar} {persona.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {!selectedPersona && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '12px',
            margin: '20px'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              Selecione um assistente virtual no menu acima para começar a conversa
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={`${message.role}-${message.timestamp}`}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px',
                background: message.role === 'user' 
                  ? '#1976d2' 
                  : 'white',
                color: message.role === 'user' ? 'white' : '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}
            >
              {message.role === 'assistant' && currentPersona && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.7, 
                  marginBottom: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {currentPersona.avatar} {currentPersona.name}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {chatLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '10px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ccc', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ccc', animation: 'pulse 1.5s infinite 0.5s' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ccc', animation: 'pulse 1.5s infinite 1s' }}></div>
                <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#666' }}>
                  {currentPersona?.name} está pensando...
                </span>
              </div>
            </div>
          </div>
        )}

        {chatError && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#ffebee',
            color: '#c62828',
            textAlign: 'center',
            margin: '10px 0'
          }}>
            Erro: {chatError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '20px',
          background: 'white',
          borderTop: '1px solid #eee',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={selectedPersona ? `Pergunte ao ${currentPersona?.name}...` : "Selecione um assistente primeiro..."}
          disabled={!selectedPersona || chatLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '25px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            outline: 'none',
            background: selectedPersona ? 'white' : '#f5f5f5'
          }}
        />
        <button
          type="submit"
          disabled={!selectedPersona || !inputValue.trim() || chatLoading}
          style={{
            padding: '12px 20px',
            borderRadius: '25px',
            border: 'none',
            background: (!selectedPersona || !inputValue.trim() || chatLoading) ? '#ccc' : '#1976d2',
            color: 'white',
            cursor: (!selectedPersona || !inputValue.trim() || chatLoading) ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {chatLoading ? '⏳' : '➤'}
        </button>
      </form>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
    </>
  );
}