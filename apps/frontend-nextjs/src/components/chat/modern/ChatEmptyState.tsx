/**
 * Componente especializado para estado vazio do chat
 * Otimizado para performance com React.memo
 */

'use client';

import React, { memo } from 'react';
import { Persona } from '@/services/api';
import { ChatIcon } from '@/components/icons';

interface ChatEmptyStateProps {
  personas: Record<string, Persona>;
  selectedPersona: string | null;
  onPersonaChange: (personaId: string) => void;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const ChatEmptyState = memo(function ChatEmptyState({
  personas,
  selectedPersona,
  onPersonaChange,
  suggestions = [],
  onSuggestionClick
}: ChatEmptyStateProps) {
  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  return (
    <div className="chat-empty-state">
      <div className="welcome-content">
        <div className="welcome-icon">
          <ChatIcon size={64} />
        </div>
        
        <h2 className="welcome-title">
          Bem-vindo ao Sistema de Consulta
        </h2>
        
        <p className="welcome-description">
          Escolha uma persona especializada para começar sua consulta sobre hanseníase.
        </p>

        {/* Seleção de Persona */}
        <div className="persona-selection">
          <h3>Escolha sua assistente:</h3>
          <div className="persona-grid">
            {Object.entries(personas).map(([id, persona]) => (
              <button
                key={id}
                className={`persona-card ${selectedPersona === id ? 'selected' : ''}`}
                onClick={() => onPersonaChange(id)}
                aria-label={`Selecionar ${persona.name}`}
              >
                <div className="persona-avatar">
                  {persona.avatar}
                </div>
                <div className="persona-info">
                  <h4>{persona.name}</h4>
                  <p>{persona.description}</p>
                  <span className="persona-style">{persona.response_style}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sugestões de início */}
        {selectedPersona && suggestions.length > 0 && (
          <div className="welcome-suggestions">
            <h3>Sugestões para começar:</h3>
            <div className="suggestions-grid">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-card"
                  onClick={() => onSuggestionClick?.(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Informações da persona selecionada */}
        {currentPersona && (
          <div className="persona-details">
            <h3>Sobre {currentPersona.name}:</h3>
            <div className="persona-capabilities">
              <div className="capability-section">
                <h4>Especialidades:</h4>
                <ul>
                  {currentPersona.expertise?.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
              
              <div className="capability-section">
                <h4>Estilo de comunicação:</h4>
                <p>{currentPersona.response_style}</p>
              </div>
              
              <div className="capability-section">
                <h4>Público-alvo:</h4>
                <p>{currentPersona.target_audience}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          height: 100%;
          min-height: 400px;
          text-align: center;
          background: linear-gradient(135deg, #f8fffe 0%, #f0f9ff 100%);
        }

        .welcome-content {
          max-width: 600px;
          width: 100%;
        }

        .welcome-icon {
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }

        .welcome-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }

        .welcome-description {
          font-size: 1.1rem;
          color: #64748b;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .persona-selection h3,
        .welcome-suggestions h3,
        .persona-details h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 1rem;
        }

        .persona-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .persona-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .persona-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .persona-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .persona-avatar {
          font-size: 2rem;
          margin-right: 1rem;
          flex-shrink: 0;
        }

        .persona-info h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .persona-info p {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
        }

        .persona-style {
          font-size: 0.8rem;
          color: #3b82f6;
          font-weight: 500;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .suggestion-card {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          text-align: left;
        }

        .suggestion-card:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .persona-details {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          text-align: left;
        }

        .persona-capabilities {
          display: grid;
          gap: 1rem;
        }

        .capability-section h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .capability-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .capability-section li {
          padding: 0.25rem 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .capability-section li:before {
          content: "•";
          color: #3b82f6;
          margin-right: 0.5rem;
        }

        .capability-section p {
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .chat-empty-state {
            padding: 1rem;
          }
          
          .persona-grid {
            grid-template-columns: 1fr;
          }
          
          .suggestions-grid {
            grid-template-columns: 1fr;
          }
          
          .welcome-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
});

export default ChatEmptyState;