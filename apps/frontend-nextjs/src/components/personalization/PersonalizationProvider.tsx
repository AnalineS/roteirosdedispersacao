/**
 * Provider de Personalização
 * Contexto global para personalização e componente de onboarding
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
import { UserPersonalization } from '@/types/personalization';

interface PersonalizationContextType {
  personalization: UserPersonalization;
  updatePersonalization: (updates: Partial<UserPersonalization>) => void;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  isPersonalized: boolean;
  shouldShowAdvancedContent: boolean;
}

const PersonalizationContext = createContext<PersonalizationContextType | null>(null);

interface PersonalizationProviderProps {
  children: React.ReactNode;
}

export function PersonalizationProvider({ children }: PersonalizationProviderProps) {
  const personalizationHook = usePersonalization();
  const { flags } = useRemoteConfig();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Verificar se deve mostrar onboarding automaticamente
  useEffect(() => {
    if (flags?.personalization_system && 
        personalizationHook.personalization.medicalRole === 'unknown' &&
        !personalizationHook.hasCompletedOnboarding) {
      // Aguardar um pouco antes de mostrar o onboarding
      const timer = setTimeout(() => {
        setShowOnboardingModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [flags?.personalization_system, personalizationHook.personalization.medicalRole, personalizationHook.hasCompletedOnboarding]);

  const contextValue: PersonalizationContextType = {
    personalization: personalizationHook.personalization,
    updatePersonalization: personalizationHook.updatePersonalization,
    showOnboarding: () => setShowOnboardingModal(true),
    hideOnboarding: () => setShowOnboardingModal(false),
    isPersonalized: personalizationHook.isPersonalized,
    shouldShowAdvancedContent: personalizationHook.shouldShowAdvancedContent
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    personalizationHook.trackUserBehavior('onboarding_completed');
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false);
    personalizationHook.trackUserBehavior('onboarding_skipped');
  };

  return (
    <PersonalizationContext.Provider value={contextValue}>
      {children}
      
    </PersonalizationContext.Provider>
  );
}

export function usePersonalizationContext(): PersonalizationContextType {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalizationContext must be used within a PersonalizationProvider');
  }
  return context;
}

export default PersonalizationProvider;