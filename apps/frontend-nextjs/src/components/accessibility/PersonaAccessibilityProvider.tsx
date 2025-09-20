'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useCurrentPersona, usePersonaAnalytics } from '@/contexts/PersonaContext';
import type { ValidPersonaId } from '@/types/personas';
import { secureLogger } from '@/utils/secureLogger';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface PersonaAccessibilityConfig {
  /** Se deve anunciar mudanças de persona via screen reader */
  announceChanges: boolean;
  /** Se deve usar feedback sonoro (opcional) */
  enableSoundFeedback: boolean;
  /** Nível de detalhe dos anúncios */
  announcementLevel: 'minimal' | 'standard' | 'detailed';
  /** Se deve anunciar estatísticas */
  announceStats: boolean;
  /** Intervalo mínimo entre anúncios (ms) */
  announcementThrottle: number;
}

interface PersonaAccessibilityContextValue {
  config: PersonaAccessibilityConfig;
  updateConfig: (config: Partial<PersonaAccessibilityConfig>) => void;
  announcePersonaChange: (personaId: ValidPersonaId, isInitial?: boolean) => void;
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  currentAnnouncement: string;
}

// ============================================
// CONTEXTO
// ============================================

const PersonaAccessibilityContext = createContext<PersonaAccessibilityContextValue | null>(null);

interface PersonaAccessibilityProviderProps {
  children: React.ReactNode;
  config?: Partial<PersonaAccessibilityConfig>;
}

export function PersonaAccessibilityProvider({ 
  children, 
  config: initialConfig = {} 
}: PersonaAccessibilityProviderProps) {
  
  // Configuração padrão
  const defaultConfig: PersonaAccessibilityConfig = {
    announceChanges: true,
    enableSoundFeedback: false, // Desabilitado por padrão para não incomodar
    announcementLevel: 'standard',
    announceStats: false,
    announcementThrottle: 1000
  };

  const [config, setConfig] = useState<PersonaAccessibilityConfig>({
    ...defaultConfig,
    ...initialConfig
  });

  const [currentAnnouncement, setCurrentAnnouncement] = useState('');
  const [lastAnnouncementTime, setLastAnnouncementTime] = useState(0);

  // Refs para ARIA live regions
  const politeRegionRef = useRef<HTMLDivElement>(null);
  const assertiveRegionRef = useRef<HTMLDivElement>(null);
  const statusRegionRef = useRef<HTMLDivElement>(null);

  // Hooks dos dados
  const { persona: currentPersona, config: personaConfig } = useCurrentPersona();
  const { history, stats } = usePersonaAnalytics();

  // ============================================
  // FUNÇÕES DE ANÚNCIO
  // ============================================

  // Função principal para anunciar mensagens
  const announceMessage = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const now = Date.now();
    
    // Throttling para evitar spam de anúncios
    if (now - lastAnnouncementTime < config.announcementThrottle) {
      return;
    }

    setLastAnnouncementTime(now);
    setCurrentAnnouncement(message);

    // Selecionar região apropriada
    const targetRef = priority === 'assertive' ? assertiveRegionRef : politeRegionRef;
    
    if (targetRef.current) {
      // Limpar e definir nova mensagem
      targetRef.current.textContent = '';
      
      // Pequeno delay para garantir que o screen reader detecte a mudança
      setTimeout(() => {
        if (targetRef.current) {
          targetRef.current.textContent = message;
        }
      }, 100);
    }

    secureLogger.debug('PersonaAccessibility announcement', { 
      priority, 
      messageLength: message.length,
      component: 'PersonaAccessibilityProvider'
    });
  }, [config.announcementThrottle, lastAnnouncementTime]);

  // Função para feedback sonoro (experimental)
  const playPersonaChangeSound = useCallback((personaId: ValidPersonaId) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      // Usar Web Speech API para feedback sonoro sutil
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0.1; // Muito baixo
      utterance.rate = 2; // Rápido
      utterance.pitch = personaId === 'dr_gasnelio' ? 0.8 : 1.2; // Tom diferente por persona

      // Som muito curto
      utterance.text = personaId === 'dr_gasnelio' ? 'Dr.' : 'Gá';

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'persona_sound_feedback_error', {
          event_category: 'accessibility',
          event_label: 'audio_error',
          custom_parameters: { personaId }
        });
      }
    }
  }, []);

  // Função para anunciar mudanças de persona
  const announcePersonaChange = useCallback((personaId: ValidPersonaId, isInitial: boolean = false) => {
    if (!config.announceChanges) return;

    const personaNames = {
      'dr_gasnelio': 'Dr. Gasnelio',
      'ga': 'Gá'
    };

    const personaName = personaNames[personaId] || personaId;
    
    let message = '';
    
    switch (config.announcementLevel) {
      case 'minimal':
        message = isInitial 
          ? `Assistente ${personaName} ativo`
          : `Mudou para ${personaName}`;
        break;
        
      case 'standard':
        message = isInitial 
          ? `Assistente virtual ${personaName} está ativo e pronto para conversar`
          : `Assistente virtual mudou para ${personaName}`;
        break;
        
      case 'detailed':
        const description = personaConfig?.description || '';
        const audience = personaConfig?.target_audience || '';
        
        message = isInitial 
          ? `Assistente virtual ${personaName} está ativo. ${description}. Ideal para ${audience}`
          : `Assistente virtual mudou para ${personaName}. ${description}`;
        
        if (config.announceStats && stats.totalChanges > 0) {
          message += `. Esta é sua ${stats.totalChanges + 1}ª mudança de assistente nesta sessão`;
        }
        break;
    }

    announceMessage(message, isInitial ? 'polite' : 'assertive');

    // Feedback sonoro opcional
    if (config.enableSoundFeedback) {
      playPersonaChangeSound(personaId);
    }
  }, [config, personaConfig, stats, announceMessage, playPersonaChangeSound]);

  // ============================================
  // EFEITOS
  // ============================================

  // Monitorar mudanças de persona
  useEffect(() => {
    if (!currentPersona) return;

    // Determinar se é mudança inicial ou troca
    const isInitial = history.length <= 1;
    
    announcePersonaChange(currentPersona, isInitial);
  }, [currentPersona, announcePersonaChange, history.length]);

  // Carregar configuração do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedConfig = localStorage.getItem('personaAccessibilityConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'accessibility_config_load_error', {
          event_category: 'accessibility',
          event_label: 'config_error'
        });
      }
    }
  }, []);

  // Salvar configuração no localStorage
  const updateConfig = useCallback((newConfig: Partial<PersonaAccessibilityConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('personaAccessibilityConfig', JSON.stringify(updatedConfig));
      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'accessibility_config_save_error', {
            event_category: 'accessibility',
            event_label: 'storage_error'
          });
        }
      }
    }
  }, [config]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue: PersonaAccessibilityContextValue = {
    config,
    updateConfig,
    announcePersonaChange,
    announceMessage,
    currentAnnouncement
  };

  return (
    <PersonaAccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* ARIA Live Regions - invisíveis mas acessíveis */}
      <div 
        ref={politeRegionRef}
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
      
      <div 
        ref={statusRegionRef}
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
        role="log"
      />

      {/* CSS para screen readers */}
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
      `}</style>
    </PersonaAccessibilityContext.Provider>
  );
}

// ============================================
// HOOKS CUSTOMIZADOS
// ============================================

export function usePersonaAccessibility() {
  const context = useContext(PersonaAccessibilityContext);
  
  if (!context) {
    throw new Error('usePersonaAccessibility deve ser usado dentro de PersonaAccessibilityProvider');
  }
  
  return context;
}

// Hook para configurações de acessibilidade
export function usePersonaAccessibilityConfig() {
  const { config, updateConfig } = usePersonaAccessibility();
  
  return {
    config,
    updateConfig,
    // Helpers para configurações comuns
    enableAnnouncements: () => updateConfig({ announceChanges: true }),
    disableAnnouncements: () => updateConfig({ announceChanges: false }),
    setAnnouncementLevel: (level: PersonaAccessibilityConfig['announcementLevel']) => 
      updateConfig({ announcementLevel: level }),
    toggleSoundFeedback: () => updateConfig({ enableSoundFeedback: !config.enableSoundFeedback })
  };
}

// Hook para anúncios personalizados
export function usePersonaAnnouncements() {
  const { announceMessage, announcePersonaChange } = usePersonaAccessibility();
  
  return {
    announce: announceMessage,
    announcePersonaChange,
    // Anúncios pré-configurados
    announceConversationStart: (personaName: string) => 
      announceMessage(`Conversa iniciada com ${personaName}. Digite sua pergunta ou use Tab para navegar pelas opções.`),
    announceConversationEnd: () => 
      announceMessage('Conversa encerrada. Você pode iniciar uma nova conversa ou escolher outro assistente.'),
    announceError: (error: string) => 
      announceMessage(`Erro: ${error}`, 'assertive'),
    announceSuccess: (message: string) => 
      announceMessage(message, 'polite')
  };
}

// ============================================
// COMPONENTE DE CONFIGURAÇÃO
// ============================================

interface PersonaAccessibilitySettingsProps {
  className?: string;
}

export function PersonaAccessibilitySettings({ className }: PersonaAccessibilitySettingsProps) {
  const { config, updateConfig } = usePersonaAccessibilityConfig();

  return (
    <div className={className} role="group" aria-labelledby="accessibility-settings-title">
      <h3 id="accessibility-settings-title" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Configurações de Acessibilidade
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Toggle para anúncios */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={config.announceChanges}
            onChange={(e) => updateConfig({ announceChanges: e.target.checked })}
            aria-describedby="announce-changes-desc"
          />
          <span>Anunciar mudanças de assistente</span>
        </label>
        <p id="announce-changes-desc" style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '-0.5rem' }}>
          Informa via screen reader quando você troca de assistente
        </p>

        {/* Nível de detalhamento */}
        <div>
          <label htmlFor="announcement-level">Nível de detalhamento:</label>
          <select 
            id="announcement-level"
            value={config.announcementLevel}
            onChange={(e) => updateConfig({ 
              announcementLevel: e.target.value as PersonaAccessibilityConfig['announcementLevel'] 
            })}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          >
            <option value="minimal">Mínimo</option>
            <option value="standard">Padrão</option>
            <option value="detailed">Detalhado</option>
          </select>
        </div>

        {/* Feedback sonoro */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={config.enableSoundFeedback}
            onChange={(e) => updateConfig({ enableSoundFeedback: e.target.checked })}
            aria-describedby="sound-feedback-desc"
          />
          <span>Feedback sonoro (experimental)</span>
        </label>
        <p id="sound-feedback-desc" style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '-0.5rem' }}>
          Som sutil quando troca de assistente
        </p>
      </div>
    </div>
  );
}

export default PersonaAccessibilityProvider;