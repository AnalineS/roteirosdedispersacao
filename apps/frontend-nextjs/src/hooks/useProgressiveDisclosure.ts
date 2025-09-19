/**
 * Progressive Disclosure Hook
 * Integrado com sistema de personas existente
 * Resetar a cada página conforme especificado
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserLevel, 
  DisclosureState, 
  DisclosureContent,
  USER_LEVELS,
  PERSONA_TO_LEVEL,
  CONTENT_PRIORITY 
} from '@/types/disclosure';

interface UseProgressiveDisclosureOptions {
  defaultLevel?: UserLevel;
  persistState?: boolean;
  resetOnPageChange?: boolean;
}

export function useProgressiveDisclosure(options: UseProgressiveDisclosureOptions = {}) {
  const {
    defaultLevel = 'paciente',
    persistState = true,
    resetOnPageChange = true
  } = options;

  const router = useRouter();
  const [currentPath, setCurrentPath] = useState('');

  // Estado principal
  const [state, setState] = useState<DisclosureState>({
    currentLevel: defaultLevel,
    expandedSections: [],
    preferredTerminology: 'simple',
    showAllContent: false,
    resetOnPageChange
  });

  // Detectar mudança de página e resetar se necessário
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newPath = window.location.pathname;
      if (resetOnPageChange && currentPath !== '' && currentPath !== newPath) {
        // Reset expandedSections ao mudar de página
        setState(prev => ({
          ...prev,
          expandedSections: USER_LEVELS[prev.currentLevel].defaultExpanded
        }));
      }
      setCurrentPath(newPath);
    }
  }, [resetOnPageChange, currentPath]);

  // Carregar estado do localStorage
  useEffect(() => {
    if (!persistState || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('progressive-disclosure-state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          ...parsedState,
          // Sempre usar defaultExpanded na primeira carga
          expandedSections: USER_LEVELS[(parsedState.currentLevel as UserLevel) || defaultLevel].defaultExpanded
        }));
      }
    } catch (error) {
      // Erro ao carregar estado do progressive disclosure
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao carregar estado do progressive disclosure: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'progressive_disclosure_load_error', {
          event_category: 'medical_disclosure_error',
          event_label: 'disclosure_state_load_failed',
          custom_parameters: {
            error_context: 'progressive_disclosure_loading',
            error_message: String(error)
          }
        });
      }
    }
  }, [persistState, defaultLevel]);

  // Salvar estado no localStorage
  const saveState = useCallback((newState: Partial<DisclosureState>) => {
    if (!persistState || typeof window === 'undefined') return;

    try {
      const stateToSave = { ...state, ...newState };
      localStorage.setItem('progressive-disclosure-state', JSON.stringify(stateToSave));
    } catch (error) {
      // Erro ao salvar estado do progressive disclosure
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao salvar estado do progressive disclosure: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'progressive_disclosure_save_error', {
          event_category: 'medical_disclosure_error',
          event_label: 'disclosure_state_save_failed',
          custom_parameters: {
            error_context: 'progressive_disclosure_saving',
            error_message: String(error)
          }
        });
      }
    }
  }, [state, persistState]);

  // Integração com sistema de personas
  const setLevelFromPersona = useCallback((personaId: string) => {
    const mappedLevel = PERSONA_TO_LEVEL[personaId] || defaultLevel;
    const levelConfig = USER_LEVELS[mappedLevel];
    
    const newState = {
      currentLevel: mappedLevel,
      expandedSections: levelConfig.defaultExpanded,
      preferredTerminology: levelConfig.terminology as 'simple' | 'technical'
    };

    setState(prev => ({ ...prev, ...newState }));
    saveState(newState);
  }, [defaultLevel, saveState]);

  // Detectar persona automaticamente (integração existente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Tenta detectar persona do localStorage ou contexto
      try {
        const userProfile = localStorage.getItem('user-profile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          if (profile.selectedPersona) {
            setLevelFromPersona(profile.selectedPersona);
          }
        }
      } catch (error) {
        // Erro ao detectar persona
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`❌ ERRO - Falha ao detectar persona: ${error}\n`);
        }
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'progressive_disclosure_persona_error', {
            event_category: 'medical_disclosure_error',
            event_label: 'persona_detection_failed',
            custom_parameters: {
              error_context: 'persona_detection',
              error_message: String(error)
            }
          });
        }
      }
    }
  }, [setLevelFromPersona]);

  // Configuração atual do nível
  const currentLevelConfig = useMemo(() => 
    USER_LEVELS[state.currentLevel], 
    [state.currentLevel]
  );

  // Filtrar conteúdo baseado no nível atual
  const filterContentByLevel = useCallback((content: DisclosureContent[]) => {
    return content
      .filter(item => item.level.includes(state.currentLevel))
      .sort((a, b) => {
        const priorityA = CONTENT_PRIORITY[state.currentLevel][a.contentType] || 5;
        const priorityB = CONTENT_PRIORITY[state.currentLevel][b.contentType] || 5;
        return priorityA - priorityB;
      });
  }, [state.currentLevel]);

  // Gerenciar seções expandidas
  const toggleSection = useCallback((sectionId: string) => {
    setState(prev => {
      const isExpanded = prev.expandedSections.includes(sectionId);
      const newExpanded = isExpanded
        ? prev.expandedSections.filter(id => id !== sectionId)
        : [...prev.expandedSections, sectionId];
      
      const newState = { expandedSections: newExpanded };
      saveState(newState);
      
      return { ...prev, ...newState };
    });
  }, [saveState]);

  // Expandir/recolher todas as seções
  const toggleAllSections = useCallback((expand: boolean) => {
    setState(prev => {
      const newState = {
        expandedSections: expand ? ['all'] : [],
        showAllContent: expand
      };
      saveState(newState);
      return { ...prev, ...newState };
    });
  }, [saveState]);

  // Mudar nível manualmente
  const changeLevel = useCallback((newLevel: UserLevel) => {
    const levelConfig = USER_LEVELS[newLevel];
    const newState = {
      currentLevel: newLevel,
      expandedSections: levelConfig.defaultExpanded,
      preferredTerminology: levelConfig.terminology as 'simple' | 'technical'
    };

    setState(prev => ({ ...prev, ...newState }));
    saveState(newState);
  }, [saveState]);

  // Verificar se seção está expandida
  const isSectionExpanded = useCallback((sectionId: string) => {
    return state.showAllContent || 
           state.expandedSections.includes('all') ||
           state.expandedSections.includes(sectionId);
  }, [state.expandedSections, state.showAllContent]);

  // Obter conteúdo apropriado baseado no nível
  const getContentForLevel = useCallback((content: DisclosureContent) => {
    const { terminology } = currentLevelConfig;
    
    switch (terminology) {
      case 'simple':
        return content.summary;
      case 'mixed':
        return content.detailed || content.summary;
      case 'technical':
        return content.technical || content.detailed || content.summary;
      case 'expert':
        return content.expert || content.technical || content.detailed || content.summary;
      default:
        return content.summary;
    }
  }, [currentLevelConfig]);

  // Verificar se conteúdo deve ser mostrado
  const shouldShowContent = useCallback((contentType: string) => {
    return currentLevelConfig.allowedContent.includes(contentType as ContentType);
  }, [currentLevelConfig]);

  return {
    // Estado atual
    currentLevel: state.currentLevel,
    currentLevelConfig,
    expandedSections: state.expandedSections,
    preferredTerminology: state.preferredTerminology,
    showAllContent: state.showAllContent,

    // Ações
    setLevelFromPersona,
    changeLevel,
    toggleSection,
    toggleAllSections,
    
    // Utilitários
    filterContentByLevel,
    isSectionExpanded,
    getContentForLevel,
    shouldShowContent,

    // Helpers para dosagem (simples → técnica)
    getSimpleDosage: (content: DisclosureContent) => content.summary,
    getTechnicalDosage: (content: DisclosureContent) => content.technical || content.detailed,
    
    // Estado para debugging
    debugState: process.env.NODE_ENV === 'development' ? state : undefined
  };
}

// Hook específico para terminologia médica
export function useMedicalTerminology() {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const showPopup = useCallback((termId: string) => {
    setActivePopup(termId);
  }, []);

  const hidePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  const showModal = useCallback((termId: string) => {
    setActiveModal(termId);
    setActivePopup(null); // Fecha popup ao abrir modal
  }, []);

  const hideModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return {
    activePopup,
    activeModal,
    showPopup,
    hidePopup,
    showModal,
    hideModal
  };
}

export default useProgressiveDisclosure;