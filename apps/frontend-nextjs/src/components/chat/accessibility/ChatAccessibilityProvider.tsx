'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';

interface ChatAccessibilityContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  announceNewMessage: (role: 'user' | 'assistant', content: string, persona?: string) => void;
  announceSystemStatus: (status: string, type?: 'info' | 'warning' | 'error') => void;
  focusMessageInput: () => void;
  focusLastMessage: () => void;
  skipToContent: () => void;
  manageFocus: (elementId: string) => void;
}

const ChatAccessibilityContext = createContext<ChatAccessibilityContextType | null>(null);

interface ChatAccessibilityProviderProps {
  children: React.ReactNode;
}

export function ChatAccessibilityProvider({ children }: ChatAccessibilityProviderProps) {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const assertiveRegionRef = useRef<HTMLDivElement>(null);
  const inputFocusRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const messagesFocusRef = useRef<HTMLDivElement | null>(null);

  // Announce messages to screen readers
  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = priority === 'assertive' ? assertiveRegionRef.current : liveRegionRef.current;
    if (region) {
      // Clear and set new message to ensure it's announced
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }, []);

  // Announce new messages with appropriate context
  const announceNewMessage = useCallback((role: 'user' | 'assistant', content: string, persona?: string) => {
    const speaker = role === 'user' ? 'Você' : (persona || 'Assistente');
    const announcement = role === 'user' 
      ? `Você disse: ${content}`
      : `${speaker} respondeu: ${content}`;
    
    announceMessage(announcement, role === 'assistant' ? 'assertive' : 'polite');
  }, [announceMessage]);

  // Announce system status changes
  const announceSystemStatus = useCallback((status: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const priority = type === 'error' || type === 'warning' ? 'assertive' : 'polite';
    const prefix = type === 'error' ? 'Erro: ' : type === 'warning' ? 'Atenção: ' : '';
    announceMessage(`${prefix}${status}`, priority);
  }, [announceMessage]);

  // Focus management functions
  const focusMessageInput = useCallback(() => {
    if (inputFocusRef.current) {
      inputFocusRef.current.focus();
    } else {
      // Fallback: try to find input in DOM
      const input = document.querySelector('[data-chat-input]') as HTMLInputElement | HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }
  }, []);

  const focusLastMessage = useCallback(() => {
    if (messagesFocusRef.current) {
      messagesFocusRef.current.focus();
    } else {
      // Fallback: try to find messages area in DOM
      const messagesArea = document.querySelector('[role="log"]') as HTMLDivElement;
      if (messagesArea) {
        messagesArea.focus();
        // Scroll to bottom
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
    }
  }, []);

  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector('#main-content') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const manageFocus = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
    }
  }, []);

  // Register focus references when components mount
  useEffect(() => {
    // Set up input reference
    const inputElement = document.querySelector('[data-chat-input]') as HTMLInputElement | HTMLTextAreaElement;
    if (inputElement) {
      inputFocusRef.current = inputElement;
    }

    // Set up messages area reference
    const messagesElement = document.querySelector('[role="log"]') as HTMLDivElement;
    if (messagesElement) {
      messagesFocusRef.current = messagesElement;
    }
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + M: Focus message input
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        focusMessageInput();
        announceMessage('Focando no campo de mensagem');
      }
      
      // Alt + H: Focus message history
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        focusLastMessage();
        announceMessage('Focando no histórico de mensagens');
      }

      // Alt + S: Skip to main content
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        skipToContent();
        announceMessage('Pulando para conteúdo principal');
      }

      // Escape: Clear focus from current element (return to document body)
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
          activeElement.blur();
          announceMessage('Foco removido');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [announceMessage, focusMessageInput, focusLastMessage, skipToContent]);

  const contextValue: ChatAccessibilityContextType = {
    announceMessage,
    announceNewMessage,
    announceSystemStatus,
    focusMessageInput,
    focusLastMessage,
    skipToContent,
    manageFocus
  };

  return (
    <ChatAccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Live regions for screen reader announcements */}
      <div 
        ref={liveRegionRef}
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      <div 
        ref={assertiveRegionRef}
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
      
      {/* Skip links for keyboard navigation */}
      <div className="skip-links">
        <button 
          onClick={skipToContent}
          className="skip-link"
          onFocus={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          onBlur={(e) => e.currentTarget.style.transform = 'translateY(-100px)'}
        >
          Pular para conteúdo principal
        </button>
        <button 
          onClick={focusMessageInput}
          className="skip-link"
          onFocus={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          onBlur={(e) => e.currentTarget.style.transform = 'translateY(-100px)'}
        >
          Ir para campo de mensagem
        </button>
        <button 
          onClick={focusLastMessage}
          className="skip-link"
          onFocus={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          onBlur={(e) => e.currentTarget.style.transform = 'translateY(-100px)'}
        >
          Ir para mensagens
        </button>
      </div>

      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .skip-links {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
        }

        .skip-link {
          position: absolute;
          top: 0;
          left: 0;
          background: #003366;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border: none;
          border-radius: 0 0 4px 4px;
          font-size: 14px;
          font-weight: 600;
          transform: translateY(-100px);
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .skip-link:focus {
          transform: translateY(0) !important;
          outline: 2px solid #fff;
          outline-offset: 2px;
        }

        .skip-link:hover:focus {
          background: #0066cc;
        }
      `}</style>
    </ChatAccessibilityContext.Provider>
  );
}

export function useChatAccessibility() {
  const context = useContext(ChatAccessibilityContext);
  if (!context) {
    throw new Error('useChatAccessibility must be used within a ChatAccessibilityProvider');
  }
  return context;
}

// Hook for components to register themselves for focus management
export function useAccessibleFocus(elementRef: React.RefObject<HTMLElement | null>, type: 'input' | 'messages') {
  useEffect(() => {
    if (elementRef.current) {
      if (type === 'input') {
        elementRef.current.setAttribute('data-chat-input', 'true');
      } else if (type === 'messages') {
        elementRef.current.setAttribute('data-chat-messages', 'true');
      }
    }
  }, [elementRef, type]);
}