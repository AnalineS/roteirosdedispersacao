'use client';

import { useState, useEffect } from 'react';

export interface UserProfile {
  type: 'professional' | 'student' | 'patient' | 'caregiver';
  focus: 'technical' | 'practical' | 'effects' | 'general';
  confidence: number;
  explanation: string;
  selectedPersona?: string;
  preferences?: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  history?: {
    lastPersona: string;
    conversationCount: number;
    lastAccess: string;
    preferredTopics: string[];
  };
}

interface UserProfileHook {
  profile: UserProfile | null;
  isLoading: boolean;
  saveProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  getRecommendedPersona: () => string;
  hasProfile: boolean;
}

const STORAGE_KEY = 'userProfile';
const STORAGE_VERSION = '1.0';

const defaultPreferences = {
  language: 'simple' as const,
  notifications: true,
  theme: 'auto' as const
};

export function useUserProfile(): UserProfileHook {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar perfil salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        // Verificar versão para migração se necessário
        if (data.version === STORAGE_VERSION) {
          setProfile(data.profile);
        } else {
          // Migração de versão se necessário
          console.log('Migrando perfil para nova versão');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = (newProfile: UserProfile) => {
    try {
      // Adicionar timestamp e histórico
      const enrichedProfile: UserProfile = {
        ...newProfile,
        preferences: { ...defaultPreferences, ...newProfile.preferences },
        history: {
          lastPersona: newProfile.selectedPersona || 'ga',
          conversationCount: (profile?.history?.conversationCount || 0) + 1,
          lastAccess: new Date().toISOString(),
          preferredTopics: profile?.history?.preferredTopics || []
        }
      };

      const dataToSave = {
        version: STORAGE_VERSION,
        profile: enrichedProfile,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setProfile(enrichedProfile);
    } catch (error) {
      console.error('Erro ao salvar perfil do usuário:', error);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      ...updates,
      history: {
        lastPersona: updates.selectedPersona || profile.history?.lastPersona || 'ga',
        conversationCount: profile.history?.conversationCount || 0,
        lastAccess: new Date().toISOString(),
        preferredTopics: profile.history?.preferredTopics || []
      }
    };

    saveProfile(updatedProfile);
  };

  const clearProfile = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setProfile(null);
    } catch (error) {
      console.error('Erro ao limpar perfil do usuário:', error);
    }
  };

  const getRecommendedPersona = (): string => {
    if (!profile) return 'ga';

    // Lógica de recomendação baseada no perfil
    const { type, focus, history } = profile;

    // Considerar persona usada anteriormente
    if (history?.lastPersona && history.conversationCount > 2) {
      return history.lastPersona;
    }

    // Lógica baseada no tipo de usuário e foco
    if (type === 'professional' || type === 'student') {
      if (focus === 'technical') {
        return 'dr_gasnelio';
      } else if (focus === 'practical') {
        return 'ga';
      } else {
        return 'dr_gasnelio'; // Default para profissionais
      }
    } else {
      if (focus === 'technical') {
        return 'dr_gasnelio';
      } else {
        return 'ga'; // Default para pacientes/cuidadores
      }
    }
  };

  return {
    profile,
    isLoading,
    saveProfile,
    updateProfile,
    clearProfile,
    getRecommendedPersona,
    hasProfile: profile !== null
  };
}

// Hook específico para detectar perfil baseado em mensagens
export function useProfileDetection() {
  const technicalIndicators = [
    'posologia', 'farmacocinética', 'mecanismo de ação',
    'interações medicamentosas', 'farmacologia clínica',
    'protocolo', 'diretrizes técnicas', 'evidência científica',
    'dose', 'administração', 'monitorização', 'contraindicação'
  ];

  const empatheticIndicators = [
    'como tomar', 'efeitos', 'normal', 'preocupado',
    'posso', 'faz mal', 'é perigoso', 'vai passar',
    'medo', 'ansioso', 'família', 'cuidador',
    'ajudar', 'explicar', 'simples', 'entender'
  ];

  const detectProfile = (message: string): {
    recommended: string;
    confidence: number;
    explanation: string;
  } => {
    const lowerMessage = message.toLowerCase();
    
    const technicalScore = technicalIndicators.reduce((score, indicator) => {
      return score + (lowerMessage.includes(indicator) ? 1 : 0);
    }, 0);

    const empatheticScore = empatheticIndicators.reduce((score, indicator) => {
      return score + (lowerMessage.includes(indicator) ? 1 : 0);
    }, 0);

    const totalScore = technicalScore + empatheticScore;
    let recommended = 'ga';
    let confidence = 0.5;
    let explanation = 'Baseado no seu perfil, recomendo começar com Gá para uma abordagem mais acolhedora.';

    if (totalScore > 0) {
      if (technicalScore > empatheticScore) {
        recommended = 'dr_gasnelio';
        confidence = Math.min(0.9, 0.6 + (technicalScore / (totalScore + 2)));
        explanation = 'Detectei interesse em informações técnicas. Dr. Gasnelio é especialista em aspectos científicos.';
      } else if (empatheticScore > technicalScore) {
        recommended = 'ga';
        confidence = Math.min(0.9, 0.6 + (empatheticScore / (totalScore + 2)));
        explanation = 'Percebo que busca informações práticas e acolhedoras. Gá é ideal para esse tipo de orientação.';
      } else {
        // Empate - usar contexto adicional
        confidence = 0.5;
        explanation = 'Ambos especialistas podem ajudar. Gá oferece explicações mais simples, Dr. Gasnelio é mais técnico.';
      }
    }

    return { recommended, confidence, explanation };
  };

  return { detectProfile };
}

// Utility functions
export const profileUtils = {
  getProfileTypeLabel: (type: UserProfile['type']): string => {
    const labels = {
      professional: 'Profissional de Saúde',
      student: 'Estudante',
      patient: 'Paciente/Familiar',
      caregiver: 'Cuidador'
    };
    return labels[type];
  },

  getFocusLabel: (focus: UserProfile['focus']): string => {
    const labels = {
      technical: 'Informações Técnicas',
      practical: 'Orientações Práticas',
      effects: 'Efeitos dos Medicamentos',
      general: 'Dúvidas Gerais'
    };
    return labels[focus];
  },

  getPersonaCompatibility: (profile: UserProfile, personaId: string): number => {
    const { type, focus } = profile;
    
    if (personaId === 'dr_gasnelio') {
      if (type === 'professional' || type === 'student') {
        return focus === 'technical' ? 0.9 : 0.7;
      } else {
        return focus === 'technical' ? 0.6 : 0.4;
      }
    } else { // 'ga'
      if (type === 'patient' || type === 'caregiver') {
        return focus === 'practical' || focus === 'effects' ? 0.9 : 0.7;
      } else {
        return focus === 'technical' ? 0.4 : 0.6;
      }
    }
  }
};