'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGlobalTracking } from '@/hooks/useGlobalTracking';

/**
 * Global Tracking Provider - PR #176
 * Ativa automaticamente todas as 400+ funções de tracking
 * Deve ser adicionado no layout principal da aplicação
 */

interface GlobalTrackingContextType {
  trackOnboarding: (step: number, action: string, data?: Record<string, string | number>) => void;
  trackMedicalAction: (action: {
    type: 'drug_interaction' | 'contraindication' | 'emergency_dose' | 'protocol_access';
    success: boolean;
    timeToComplete: number;
    errorCount?: number;
    urgencyLevel?: 'critical' | 'important' | 'standard';
  }) => void;
  trackCustomEvent: (eventName: string, category: string, value?: number, parameters?: Record<string, string | number>) => void;
  getTrackingStats: () => {
    interactions: number;
    scrollDepth: number;
    errors: number;
    timeOnPage: number;
  };
}

const GlobalTrackingContext = createContext<GlobalTrackingContextType | null>(null);

export function GlobalTrackingProvider({ children }: { children: ReactNode }) {
  // Ativar tracking global com todas as features
  const tracking = useGlobalTracking({
    enableCognitiveLoad: true,
    enableMobileTracking: true,
    enableOnboarding: true,
    enableMedicalActions: true,
    enableEducational: true,
    enablePerformance: true,
    enableErrors: true,
  });

  return (
    <GlobalTrackingContext.Provider value={tracking}>
      {children}
    </GlobalTrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(GlobalTrackingContext);
  if (!context) {
    // Return dummy functions if provider not found
    return {
      trackOnboarding: () => {},
      trackMedicalAction: () => {},
      trackCustomEvent: () => {},
      getTrackingStats: () => ({
        interactions: 0,
        scrollDepth: 0,
        errors: 0,
        timeOnPage: 0
      })
    };
  }
  return context;
}