'use client';

/**
 * Intelligent Navigation Provider
 * Fornece navegação inteligente e sugestões adaptativas para toda a aplicação
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { usePersonas } from '@/hooks/usePersonas';
import { secureLogger } from '@/utils/secureLogger';

interface NavigationSuggestion {
  id: string;
  title: string;
  description: string;
  href: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  category: 'learning' | 'tool' | 'content' | 'interaction';
}

interface NavigationBehaviorAnalytics {
  currentPage: string;
  timeSpent: number;
  interactionCount: number;
  lastInteractionType: string;
  visitHistory: string[];
  preferredPersona?: string;
}

interface IntelligentNavigationContextType {
  suggestions: NavigationSuggestion[];
  analytics: NavigationBehaviorAnalytics;
  isAnalyzing: boolean;
  getSuggestionsForContext: (context: string) => NavigationSuggestion[];
  trackInteraction: (type: string, data?: Record<string, string | number>) => void;
  refreshSuggestions: () => void;
  isEnabled: boolean;
}

const IntelligentNavigationContext = createContext<IntelligentNavigationContextType | null>(null);

export const useIntelligentNavigation = () => {
  const context = useContext(IntelligentNavigationContext);
  if (!context) {
    throw new Error('useIntelligentNavigation deve ser usado dentro de IntelligentNavigationProvider');
  }
  return context;
};

interface IntelligentNavigationProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export default function IntelligentNavigationProvider({
  children,
  enabled = true
}: IntelligentNavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { personas } = usePersonas();

  const [suggestions, setSuggestions] = useState<NavigationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analytics, setAnalytics] = useState<NavigationBehaviorAnalytics>({
    currentPage: pathname || '/',
    timeSpent: 0,
    interactionCount: 0,
    lastInteractionType: 'page_load',
    visitHistory: [pathname || '/'],
    preferredPersona: undefined
  });

  const [pageStartTime, setPageStartTime] = useState(() => Date.now());

  // Intelligent routing para sugestões de persona
  const intelligentRouting = useIntelligentRouting(personas, {
    enabled,
    minConfidenceThreshold: 0.6
  });

  // Atualizar analytics quando página muda
  useEffect(() => {
    const now = Date.now();
    const timeOnPreviousPage = now - pageStartTime;

    setAnalytics(prev => ({
      ...prev,
      currentPage: pathname || '/',
      timeSpent: 0,
      visitHistory: [...prev.visitHistory.slice(-9), pathname || '/'], // Manter últimas 10 páginas
    }));

    // Log da mudança de página para analytics
    if (timeOnPreviousPage > 1000) { // Só logar se ficou mais de 1 segundo
      secureLogger.info('Page navigation', {
        from: analytics.currentPage,
        to: pathname,
        timeSpent: Math.round(timeOnPreviousPage / 1000),
        category: 'navigation'
      });
    }

    setPageStartTime(now);
  }, [pathname]);

  // Timer para tracking de tempo na página
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - pageStartTime) / 1000)
      }));
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [pageStartTime]);

  // Gerar sugestões baseadas no contexto atual
  const generateSuggestions = useCallback((context: string = pathname || '/'): NavigationSuggestion[] => {
    const suggestions: NavigationSuggestion[] = [];

    // Sugestões baseadas na página atual
    switch (context) {
      case '/':
        suggestions.push(
          {
            id: 'start-chat',
            title: 'Iniciar Conversa com IA',
            description: 'Tire dúvidas sobre hanseníase com Dr. Gasnelio ou Gá',
            href: '/chat',
            icon: '💬',
            priority: 'high',
            reason: 'Primeira experiência recomendada',
            category: 'interaction'
          },
          {
            id: 'explore-modules',
            title: 'Módulos Educacionais',
            description: 'Explore conteúdo estruturado sobre dispensação',
            href: '/dashboard',
            icon: '📚',
            priority: 'medium',
            reason: 'Aprendizado estruturado',
            category: 'learning'
          }
        );
        break;

      case '/chat':
        suggestions.push(
          {
            id: 'clinical-cases',
            title: 'Casos Clínicos',
            description: 'Pratique com simulações realistas',
            href: '/simulador',
            icon: '🏥',
            priority: 'high',
            reason: 'Aplicar conhecimento na prática',
            category: 'learning'
          },
          {
            id: 'progress-check',
            title: 'Ver Progresso',
            description: 'Acompanhe seu desenvolvimento',
            href: '/dashboard',
            icon: '📊',
            priority: 'medium',
            reason: 'Monitorar aprendizado',
            category: 'tool'
          }
        );
        break;

      case '/dashboard':
        suggestions.push(
          {
            id: 'certification',
            title: 'Certificação',
            description: 'Verifique elegibilidade para certificado',
            href: '/certificacao',
            icon: '🎓',
            priority: 'high',
            reason: 'Finalizar capacitação',
            category: 'learning'
          },
          {
            id: 'continue-chat',
            title: 'Continuar Conversas',
            description: 'Retomar diálogo com as personas',
            href: '/chat',
            icon: '💭',
            priority: 'medium',
            reason: 'Continuar aprendizado interativo',
            category: 'interaction'
          }
        );
        break;

      case '/certificacao':
        if (analytics.timeSpent > 30) { // Se passou mais de 30s na certificação
          suggestions.push({
            id: 'share-achievement',
            title: 'Compartilhar Conquista',
            description: 'Compartilhe seu progresso nas redes sociais',
            href: '/profile',
            icon: '🏆',
            priority: 'medium',
            reason: 'Celebrar conquista',
            category: 'tool'
          });
        }
        break;
    }

    // Sugestões baseadas em comportamento
    if (analytics.visitHistory.length > 3) {
      const hasVisitedChat = analytics.visitHistory.includes('/chat');
      const hasVisitedDashboard = analytics.visitHistory.includes('/dashboard');

      if (!hasVisitedChat && !suggestions.some(s => s.href === '/chat')) {
        suggestions.push({
          id: 'try-chat',
          title: 'Experimenter Chat com IA',
          description: 'Interação personalizada com personas especializadas',
          href: '/chat',
          icon: '🤖',
          priority: 'medium',
          reason: 'Funcionalidade não explorada',
          category: 'interaction'
        });
      }

      if (!hasVisitedDashboard && !suggestions.some(s => s.href === '/dashboard')) {
        suggestions.push({
          id: 'check-progress',
          title: 'Dashboard de Progresso',
          description: 'Visualize seu desenvolvimento no programa',
          href: '/dashboard',
          icon: '📈',
          priority: 'medium',
          reason: 'Acompanhar evolução',
          category: 'tool'
        });
      }
    }

    // Limitar a 4 sugestões e ordenar por prioridade
    return suggestions
      .sort((a, b) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      })
      .slice(0, 4);
  }, [pathname, analytics]);

  // Atualizar sugestões quando contexto muda
  useEffect(() => {
    if (enabled) {
      setIsAnalyzing(true);
      const newSuggestions = generateSuggestions();
      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
    }
  }, [pathname, analytics.timeSpent, enabled, generateSuggestions]);

  const getSuggestionsForContext = useCallback((context: string): NavigationSuggestion[] => {
    return generateSuggestions(context);
  }, [generateSuggestions]);

  const trackInteraction = useCallback((type: string, data?: Record<string, string | number>) => {
    setAnalytics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      lastInteractionType: type
    }));

    // Log da interação
    secureLogger.info('User interaction', {
      type,
      page: pathname,
      data: data || {},
      category: 'user_behavior'
    });
  }, [pathname]);

  const refreshSuggestions = useCallback(() => {
    if (enabled) {
      setIsAnalyzing(true);
      const newSuggestions = generateSuggestions();
      setSuggestions(newSuggestions);
      setIsAnalyzing(false);
    }
  }, [enabled, generateSuggestions]);

  return (
    <IntelligentNavigationContext.Provider
      value={{
        suggestions,
        analytics,
        isAnalyzing,
        getSuggestionsForContext,
        trackInteraction,
        refreshSuggestions,
        isEnabled: enabled
      }}
    >
      {children}
    </IntelligentNavigationContext.Provider>
  );
}

// Hook de conveniência para tracking simples
export const useNavigationTracking = () => {
  const { trackInteraction } = useIntelligentNavigation();

  return {
    trackClick: (elementId: string) => trackInteraction('click', { elementId }),
    trackScroll: (position: number) => trackInteraction('scroll', { position }),
    trackSearch: (query: string) => trackInteraction('search', { queryLength: query.length }),
    trackDownload: (filename: string) => trackInteraction('download', { filename }),
    trackShare: (platform: string) => trackInteraction('share', { platform })
  };
};