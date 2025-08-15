/**
 * SoftAuthPrompt - Prompt Suave de Autenticação
 * Componente não-intrusivo que sugere autenticação baseado no contexto
 * Aparece em momentos estratégicos da jornada do usuário
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useSoftAuthPrompt } from '@/hooks/useAuth';

interface SoftAuthPromptProps {
  trigger: 'feature_access' | 'progress_milestone' | 'session_duration' | 'value_demonstration';
  feature?: string;
  context?: string;
  className?: string;
  onDismiss?: () => void;
}

export function SoftAuthPrompt({ 
  trigger, 
  feature, 
  context, 
  className = '',
  onDismiss 
}: SoftAuthPromptProps) {
  const auth = useAuth();
  const { showPrompt, hasShownPrompt } = useSoftAuthPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Não mostrar se já está autenticado ou se já foi mostrado
  useEffect(() => {
    if (auth.isAuthenticated || isDismissed || hasShownPrompt(feature || trigger)) {
      setIsVisible(false);
      return;
    }

    // Lógica de timing baseada no trigger
    let delay = 0;
    switch (trigger) {
      case 'feature_access':
        delay = 0; // Mostrar imediatamente quando tentar acessar funcionalidade
        break;
      case 'progress_milestone':
        delay = 2000; // 2 segundos após alcançar milestone
        break;
      case 'session_duration':
        delay = 60000; // 1 minuto de sessão
        break;
      case 'value_demonstration':
        delay = 5000; // 5 segundos para mostrar valor
        break;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [auth.isAuthenticated, trigger, feature, isDismissed, hasShownPrompt]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (feature) {
      showPrompt(feature, getPromptMessage());
    }
    onDismiss?.();
  };

  const getPromptMessage = (): string => {
    switch (trigger) {
      case 'feature_access':
        return `Para acessar ${feature || 'esta funcionalidade'}, considere criar uma conta gratuita`;
      case 'progress_milestone':
        return 'Parabéns pelo progresso! Que tal salvar sua evolução criando uma conta?';
      case 'session_duration':
        return 'Notamos que você está engajado! Quer salvar seu progresso na nuvem?';
      case 'value_demonstration':
        return 'Está gostando da plataforma? Desbloqueie recursos avançados gratuitamente';
      default:
        return 'Crie uma conta gratuita para uma experiência completa';
    }
  };

  const getPromptTitle = (): string => {
    switch (trigger) {
      case 'feature_access':
        return '🔓 Funcionalidade Premium';
      case 'progress_milestone':
        return '🏆 Progresso Detectado';
      case 'session_duration':
        return '⏰ Sessão Ativa';
      case 'value_demonstration':
        return '✨ Experiência Completa';
      default:
        return '💡 Dica de Melhoria';
    }
  };

  const getBenefits = (): string[] => {
    const baseBenefits = [
      'Histórico salvo na nuvem',
      'Progresso sincronizado',
      'Sem limitações'
    ];

    switch (feature) {
      case 'advanced_calculator':
        return ['Calculadora com histórico', 'Recomendações personalizadas', ...baseBenefits];
      case 'certificates':
        return ['Certificados válidos', 'Download em PDF', ...baseBenefits];
      case 'analytics':
        return ['Dashboard pessoal', 'Insights de aprendizagem', ...baseBenefits];
      default:
        return ['Funcionalidades completas', ...baseBenefits];
    }
  };

  if (!isVisible || auth.isAuthenticated) {
    return null;
  }

  return (
    <div className={`
      bg-gradient-to-r from-blue-50 to-indigo-50 
      border border-blue-200 rounded-xl p-4 
      shadow-sm transition-all duration-300
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-sm font-semibold text-blue-900">
              {getPromptTitle()}
            </h3>
          </div>
          
          <p className="text-sm text-blue-800 mb-3">
            {getPromptMessage()}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {getBenefits().slice(0, 3).map((benefit, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                ✓ {benefit}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                auth.promptAuthForFeature(feature || trigger, context);
                handleDismiss();
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Conta Gratuita
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              Agora Não
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-3 text-blue-400 hover:text-blue-600 text-lg font-bold"
          aria-label="Dispensar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ============================================
// HOOKS DE CONVENIÊNCIA
// ============================================

/**
 * Hook para mostrar prompt de autenticação baseado em acesso a funcionalidades
 */
export function useFeatureAccessPrompt() {
  const auth = useAuth();
  
  const promptForFeature = (feature: string, context?: string) => {
    if (!auth.isAuthenticated && auth.shouldShowUpgradePrompt(feature)) {
      // Aqui você pode implementar a lógica para mostrar o modal de auth
      console.log(`Prompting auth for feature: ${feature}`, context);
    }
  };

  return { promptForFeature };
}

/**
 * Hook para monitorar milestones de progresso e sugerir autenticação
 */
export function useProgressMilestonePrompt() {
  const auth = useAuth();
  const [milestonesReached, setMilestonesReached] = useState<string[]>([]);

  const markMilestone = (milestone: string) => {
    if (!auth.isAuthenticated && !milestonesReached.includes(milestone)) {
      setMilestonesReached(prev => [...prev, milestone]);
      
      // Lógica para decidir quando mostrar prompt
      const shouldPrompt = milestonesReached.length >= 2 || 
                          milestone === 'completed_conversation' ||
                          milestone === 'used_calculator';
      
      if (shouldPrompt) {
        console.log(`Progress milestone reached: ${milestone}`);
      }
    }
  };

  return { markMilestone, milestonesReached };
}

/**
 * Hook para monitorar tempo de sessão e engajamento
 */
export function useSessionEngagementPrompt() {
  const auth = useAuth();
  const [sessionStartTime] = useState(Date.now());
  const [engagementActions, setEngagementActions] = useState(0);

  const trackAction = (action: string) => {
    if (!auth.isAuthenticated) {
      setEngagementActions(prev => prev + 1);
      
      const sessionDuration = Date.now() - sessionStartTime;
      const shouldPromptByTime = sessionDuration > 300000; // 5 minutos
      const shouldPromptByActions = engagementActions >= 10; // 10 ações
      
      if (shouldPromptByTime || shouldPromptByActions) {
        console.log(`High engagement detected: ${action}`, {
          duration: sessionDuration,
          actions: engagementActions
        });
      }
    }
  };

  return { trackAction, engagementActions };
}