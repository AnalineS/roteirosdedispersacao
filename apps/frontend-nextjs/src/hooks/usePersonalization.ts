/**
 * Hook de Personalização para Sistema Médico
 * Gerencia preferências do usuário, recomendações e adaptações de interface
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserPersonalization, 
  PersonalizationContext,
  ContentRecommendation,
  MEDICAL_ROLE_PRESETS,
  COMPLEXITY_SETTINGS,
  MedicalRole,
  ExperienceLevel
} from '@/types/personalization';
import { medicalAnalytics } from '@/utils/medicalAnalytics';

const STORAGE_KEY = 'user_personalization';
const CONTEXT_KEY = 'personalization_context';

// Configuração padrão
const DEFAULT_PERSONALIZATION: UserPersonalization = {
  medicalRole: 'unknown',
  experienceLevel: 'beginner',
  specializationArea: 'general',
  preferredComplexity: 'basic',
  showTechnicalTerms: false,
  enableDetailedExplanations: true,
  preferredLayout: 'auto',
  fastAccessPriority: 'educational',
  enableQuickActions: true,
  learningPath: [],
  completedModules: [],
  bookmarkedContent: [],
  recentlyAccessed: [],
  emergencyAlerts: true,
  practiceReminders: true,
  contentUpdates: false,
  sessionCount: 0,
  totalTimeSpent: 0,
  averageSessionDuration: 0,
  lastAccess: new Date(),
  preferredPersona: 'auto',
  personaInteractionStyle: 'adaptive'
};

export function usePersonalization() {
  const [personalization, setPersonalization] = useState<UserPersonalization>(DEFAULT_PERSONALIZATION);
  const [context, setContext] = useState<PersonalizationContext>({
    currentSession: {
      startTime: new Date(),
      pageViews: 0,
      actionsPerformed: [],
      errorsEncountered: []
    },
    recentBehavior: {
      searchQueries: [],
      frequentlyAccessedSections: [],
      preferredContentTypes: [],
      averageEngagementTime: 0
    },
    adaptiveSettings: {
      autoAdjustComplexity: true,
      personalizedNavigation: true,
      contextualSuggestions: true,
      smartNotifications: true
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);

  // Carregar personalização do storage
  useEffect(() => {
    const loadPersonalization = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const storedContext = localStorage.getItem(CONTEXT_KEY);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          // Converter strings de data de volta para objetos Date
          if (parsed.lastAccess) {
            parsed.lastAccess = new Date(parsed.lastAccess);
          }
          setPersonalization({ ...DEFAULT_PERSONALIZATION, ...parsed });
        }
        
        if (storedContext) {
          const parsedContext = JSON.parse(storedContext);
          if (parsedContext.currentSession?.startTime) {
            parsedContext.currentSession.startTime = new Date(parsedContext.currentSession.startTime);
          }
          setContext(prev => ({ ...prev, ...parsedContext }));
        }
        
        // Inicializar nova sessão
        setContext(prev => ({
          ...prev,
          currentSession: {
            ...prev.currentSession,
            startTime: new Date(),
            pageViews: 0,
            actionsPerformed: [],
            errorsEncountered: []
          }
        }));
        
      } catch (error) {
        // Erro silencioso para não quebrar o carregamento
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonalization();
  }, []);

  // Salvar personalização no storage
  const savePersonalization = useCallback((newPersonalization: UserPersonalization) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPersonalization));
      localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
      
      // Analytics tracking
      medicalAnalytics.trackEvent({
        event: 'personalization_updated',
        event_category: 'user_preferences',
        custom_parameters: {
          user_role: newPersonalization.medicalRole,
          clinical_context: newPersonalization.fastAccessPriority === 'emergency' ? 'emergency' : 'routine'
        }
      });
    } catch (error) {
      // Erro silencioso para não quebrar o salvamento
    }
  }, [context]);

  // Atualizar personalização
  const updatePersonalization = useCallback((updates: Partial<UserPersonalization>) => {
    setPersonalization(prev => {
      const updated = { 
        ...prev, 
        ...updates,
        lastAccess: new Date()
      };
      savePersonalization(updated);
      return updated;
    });
  }, [savePersonalization]);

  // Aplicar preset baseado no papel médico
  const applyRolePreset = useCallback((role: MedicalRole) => {
    const preset = MEDICAL_ROLE_PRESETS[role];
    if (preset) {
      updatePersonalization(preset);
      
      medicalAnalytics.trackEvent({
        event: 'role_preset_applied',
        event_category: 'personalization',
        event_label: role,
        custom_parameters: {
          user_role: role
        }
      });
    }
  }, [updatePersonalization]);

  // Rastrear comportamento do usuário
  const trackUserBehavior = useCallback((action: string, actionContext: Record<string, unknown> = {}) => {
    setContext(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession,
        actionsPerformed: [...prev.currentSession.actionsPerformed.slice(-49), action],
        pageViews: action === 'page_view' ? prev.currentSession.pageViews + 1 : prev.currentSession.pageViews
      }
    }));

    // Atualizar métricas da sessão
    setPersonalization(prev => {
      const sessionDuration = Date.now() - context.currentSession.startTime.getTime();
      const newSessionCount = prev.sessionCount + (action === 'session_start' ? 1 : 0);
      const newTotalTime = prev.totalTimeSpent + (action === 'session_end' ? sessionDuration : 0);
      
      return {
        ...prev,
        sessionCount: newSessionCount,
        totalTimeSpent: newTotalTime,
        averageSessionDuration: newSessionCount > 0 ? newTotalTime / newSessionCount : 0
      };
    });

    // Analytics tracking específico para ações médicas
    if (action.includes('emergency') || action.includes('critical')) {
      medicalAnalytics.trackCriticalMedicalAction({
        type: action.includes('drug') ? 'drug_interaction' : 'protocol_access',
        success: !actionContext.error,
        timeToComplete: typeof actionContext.duration === 'number' ? actionContext.duration : 0,
        urgencyLevel: 'critical'
      });
    }
  }, [context.currentSession]);

  // Gerar recomendações personalizadas
  const generateRecommendations = useCallback((): ContentRecommendation[] => {
    const baseRecommendations: ContentRecommendation[] = [
      {
        id: 'roteiro-dispensacao',
        title: 'Roteiro de Dispensação PQT-U',
        description: 'Guia completo para dispensação de medicamentos para hanseníase',
        type: 'guide',
        urgency: 'high',
        relevanceScore: 0.9,
        estimatedTime: 15,
        prerequisites: [],
        tags: ['pharmacy', 'dispensing', 'pqt-u']
      },
      {
        id: 'drug-calculator',
        title: 'Calculadora de Doses',
        description: 'Ferramenta para cálculo preciso de dosagens medicamentosas',
        type: 'tool',
        urgency: 'medium',
        relevanceScore: 0.8,
        estimatedTime: 5,
        prerequisites: [],
        tags: ['calculation', 'dosage', 'safety']
      },
      {
        id: 'interaction-checker',
        title: 'Verificador de Interações',
        description: 'Identifica possíveis interações medicamentosas',
        type: 'tool',
        urgency: 'critical',
        relevanceScore: 0.95,
        estimatedTime: 3,
        prerequisites: [],
        tags: ['safety', 'interactions', 'emergency']
      }
    ];

    // Filtrar e ordenar baseado no perfil do usuário
    return baseRecommendations
      .filter(rec => {
        // Filtros baseados no papel médico
        if (personalization.medicalRole === 'pharmacy' && rec.tags.includes('pharmacy')) {
          return true;
        }
        if (personalization.medicalRole === 'student' && rec.type === 'guide') {
          return true;
        }
        return rec.urgency === 'critical' || rec.relevanceScore > 0.7;
      })
      .sort((a, b) => {
        // Priorizar por urgência e relevância
        const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aScore = urgencyWeight[a.urgency] * a.relevanceScore;
        const bScore = urgencyWeight[b.urgency] * b.relevanceScore;
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [personalization]);

  // Atualizar recomendações quando personalização mudar
  useEffect(() => {
    if (!isLoading) {
      const newRecommendations = generateRecommendations();
      setRecommendations(newRecommendations);
    }
  }, [personalization, isLoading, generateRecommendations]);

  // Obter configurações de complexidade
  const complexitySettings = useMemo(() => {
    return COMPLEXITY_SETTINGS[personalization.preferredComplexity];
  }, [personalization.preferredComplexity]);

  // Verificar se deve mostrar conteúdo avançado
  const shouldShowAdvancedContent = useMemo(() => {
    return personalization.experienceLevel === 'advanced' || 
           personalization.experienceLevel === 'expert' ||
           (personalization.medicalRole === 'pharmacy' && personalization.experienceLevel !== 'beginner');
  }, [personalization]);

  // Obter navegação personalizada
  const getPersonalizedNavigation = useCallback(() => {
    const baseNavigation = [
      { label: 'Início', href: '/', priority: 1 },
      { label: 'Chat IA', href: '/chat', priority: 2 },
      { label: 'Módulos', href: '/modules', priority: 3 },
      { label: 'Ferramentas', href: '/resources', priority: 4 }
    ];

    // Adicionar itens específicos por papel
    if (personalization.medicalRole === 'pharmacy') {
      baseNavigation.push(
        { label: 'Calculadora', href: '/resources/calculator', priority: 1.5 },
        { label: 'Interações', href: '/resources/interactions', priority: 1.8 }
      );
    }

    if (personalization.fastAccessPriority === 'emergency') {
      baseNavigation.unshift(
        { label: '🚨 Emergência', href: '/emergency', priority: 0.5 }
      );
    }

    return baseNavigation.sort((a, b) => a.priority - b.priority);
  }, [personalization]);

  // Exportar dados de personalização
  const exportPersonalizationData = useCallback(() => {
    return JSON.stringify({
      personalization,
      context,
      exportDate: new Date().toISOString()
    });
  }, [personalization, context]);

  // Importar dados de personalização
  const importPersonalizationData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.personalization) {
        updatePersonalization(parsed.personalization);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [updatePersonalization]);

  return {
    // Estado
    personalization,
    context,
    isLoading,
    recommendations,
    complexitySettings,
    shouldShowAdvancedContent,
    
    // Ações
    updatePersonalization,
    applyRolePreset,
    trackUserBehavior,
    generateRecommendations,
    getPersonalizedNavigation,
    exportPersonalizationData,
    importPersonalizationData,
    
    // Utilitários
    isPersonalized: personalization.medicalRole !== 'unknown',
    hasCompletedOnboarding: personalization.sessionCount > 0,
    sessionDuration: Date.now() - context.currentSession.startTime.getTime()
  };
}

export default usePersonalization;