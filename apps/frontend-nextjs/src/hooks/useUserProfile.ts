'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
import type { UserProfile as BaseUserProfile } from '@/types/auth';

// Features configuration
const FEATURES = {
  AUTH_ENABLED: true,
  FIRESTORE_ENABLED: false, // Disabled - using local storage
  OFFLINE_MODE: false,
};

// Use the central UserProfile type
export type { UserProfile } from '@/types/auth';

// Local UserProfile interface for hook compatibility
interface LocalUserProfile {
  type: 'admin' | 'professional' | 'student' | 'patient' | 'caregiver';
  focus: 'technical' | 'practical' | 'effects' | 'general' | 'empathetic';
  confidence: number;
  explanation: string;
  selectedPersona?: string;
  name?: string;
  professional?: boolean;
  sessionCount?: number;
  preferences?: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    emailUpdates: boolean;
    dataCollection: boolean;
    lgpdConsent: boolean;
  };
  history?: {
    lastPersona: 'ga' | 'dr_gasnelio';
    conversationCount: number;
    lastAccess: string;
    preferredTopics: string[];
  };
}

interface UserProfileHook {
  profile: LocalUserProfile | null;
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  saveProfile: (profile: LocalUserProfile) => Promise<void>;
  updateProfile: (updates: Partial<LocalUserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
  getRecommendedPersona: () => string;
  hasProfile: boolean;
  isUsingFirestore: boolean;
  forceSync: () => Promise<void>;
}

const STORAGE_KEY = 'userProfile';
const STORAGE_VERSION = '1.0';

const defaultPreferences = {
  language: 'simple' as const,
  notifications: true,
  theme: 'auto' as const,
  emailUpdates: false,
  dataCollection: false,
  lgpdConsent: false
};

export function useUserProfile(): UserProfileHook {
  const auth = useAuth();
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  
  // Flags para controlar o tipo de persistência
  const useFirestore = auth.isAuthenticated && FEATURES.FIRESTORE_ENABLED;
  const useLocalStorage = !useFirestore || !FEATURES.AUTH_ENABLED;

  // Carregar perfil (localStorage ou Firestore)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        if (useFirestore && auth.user) {
          // Carregar do Firestore
          await loadFromFirestore();
        } else if (useLocalStorage) {
          // Carregar do localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        
        // Fallback para localStorage em caso de erro do Firestore
        if (useFirestore) {
          loadFromLocalStorage();
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.isAuthenticated, useFirestore, useLocalStorage]);

  // ============================================
  // FUNÇÕES DE CARREGAMENTO
  // ============================================

  const loadFromLocalStorage = useCallback(() => {
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
      console.error('Erro ao carregar do localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      throw error;
    }
  }, []);

  const loadFromFirestore = useCallback(async () => {
    // Firestore disabled - only use localStorage
    if (useLocalStorage) {
      loadFromLocalStorage();
    }
    setSyncStatus('idle');
  }, [useLocalStorage, loadFromLocalStorage]);

  // ============================================
  // FUNÇÕES DE CONVERSÃO
  // ============================================

  // Conversion functions simplified for local storage only
  const convertFirestoreToLocal = useCallback((profile: BaseUserProfile): LocalUserProfile => {
    return {
      type: profile.type as any,
      focus: profile.focus as any,
      confidence: profile.confidence,
      explanation: profile.explanation,
      selectedPersona: profile.history?.lastPersona || 'ga',
      preferences: {
        language: profile.preferences?.language || 'simple',
        notifications: profile.preferences?.notifications || true,
        theme: profile.preferences?.theme || 'auto',
        emailUpdates: profile.preferences?.emailUpdates || false,
        dataCollection: profile.preferences?.dataCollection || false,
        lgpdConsent: profile.preferences?.lgpdConsent || false,
      },
      history: profile.history
    };
  }, []);

  const convertLocalToFirestore = useCallback((localProfile: LocalUserProfile): BaseUserProfile => {
    if (!auth.user) throw new Error('Usuário não autenticado');

    return {
      uid: auth.user.uid,
      email: auth.user.email || undefined,
      displayName: auth.user.displayName || undefined,
      type: (localProfile.type === 'caregiver' ? 'patient' : localProfile.type) as 'patient' | 'professional' | 'student' | 'admin',
      focus: localProfile.focus,
      confidence: localProfile.confidence,
      explanation: localProfile.explanation,
      preferences: {
        ...defaultPreferences,
        ...localProfile.preferences,
        emailUpdates: localProfile.preferences?.emailUpdates ?? defaultPreferences.emailUpdates,
        dataCollection: localProfile.preferences?.dataCollection ?? defaultPreferences.dataCollection,
        lgpdConsent: localProfile.preferences?.lgpdConsent ?? defaultPreferences.lgpdConsent
      },
      history: {
        lastPersona: (localProfile.history?.lastPersona || localProfile.selectedPersona || 'ga') as 'dr_gasnelio' | 'ga',
        conversationCount: localProfile.history?.conversationCount || 0,
        lastAccess: new Date().toISOString(),
        preferredTopics: localProfile.history?.preferredTopics || [],
        totalSessions: 0,
        totalTimeSpent: 0,
        completedModules: [],
        achievements: []
      },
      stats: {
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        sessionCount: localProfile.history?.conversationCount || 0,
        messageCount: 0,
        averageSessionDuration: 0,
        favoritePersona: (localProfile.selectedPersona as 'dr_gasnelio' | 'ga') || 'ga',
        completionRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '2.0'
    };
  }, [auth.user]);

  // ============================================
  // FUNÇÕES DE SALVAMENTO
  // ============================================

  const saveToLocalStorageOnly = useCallback((profileToSave: LocalUserProfile): void => {
    try {
      const enrichedProfile: LocalUserProfile = {
        ...profileToSave,
        preferences: { ...defaultPreferences, ...profileToSave.preferences },
        history: {
          lastPersona: (profileToSave.selectedPersona as 'ga' | 'dr_gasnelio') || 'ga',
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
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      throw error;
    }
  }, [profile]);

  const saveProfile = async (newProfile: LocalUserProfile): Promise<void> => {
    try {
      setSyncStatus('syncing');

      // Atualizar estado local imediatamente
      const enrichedProfile: LocalUserProfile = {
        ...newProfile,
        preferences: { ...defaultPreferences, ...newProfile.preferences },
        history: {
          lastPersona: (newProfile.selectedPersona as 'ga' | 'dr_gasnelio') || 'ga',
          conversationCount: (profile?.history?.conversationCount || 0) + 1,
          lastAccess: new Date().toISOString(),
          preferredTopics: profile?.history?.preferredTopics || []
        }
      };

      setProfile(enrichedProfile);

      // Salvar no localStorage se habilitado
      if (useLocalStorage) {
        saveToLocalStorageOnly(enrichedProfile);
      }

      // Save to auth service for JWT backend integration
      if (auth.user && auth.updateUserProfile) {
        try {
          const backendProfile = convertLocalToFirestore(enrichedProfile);
          await auth.updateUserProfile(backendProfile);
        } catch (error) {
          console.warn('Erro ao sincronizar com backend:', error);
          // Continue with local storage only
        }
      }

      setSyncStatus('idle');
    } catch (error) {
      console.error('Erro ao salvar perfil do usuário:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<LocalUserProfile>): Promise<void> => {
    if (!profile) {
      throw new Error('Nenhum perfil para atualizar');
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      history: {
        lastPersona: (updates.selectedPersona || profile.history?.lastPersona || 'ga') as 'dr_gasnelio' | 'ga',
        conversationCount: profile.history?.conversationCount || 0,
        lastAccess: new Date().toISOString(),
        preferredTopics: profile.history?.preferredTopics || []
      }
    };

    await saveProfile(updatedProfile);
  };

  const clearProfile = async (): Promise<void> => {
    try {
      setSyncStatus('syncing');

        // Clear from backend if available
      if (auth.user) {
        console.log('Backend profile clear not implemented yet');
      }

      // Limpar localStorage
      if (useLocalStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }

      setProfile(null);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Erro ao limpar perfil do usuário:', error);
      setSyncStatus('error');
      throw error;
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

  // Função de sincronização manual
  const forceSync = async (): Promise<void> => {
    if (useFirestore && auth.user) {
      await loadFromFirestore();
    }
  };

  return {
    profile,
    isLoading,
    syncStatus,
    saveProfile,
    updateProfile,
    clearProfile,
    getRecommendedPersona,
    hasProfile: profile !== null,
    isUsingFirestore: useFirestore,
    forceSync
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
  getProfileTypeLabel: (type: LocalUserProfile['type']): string => {
    const labels = {
      admin: 'Administrador',
      professional: 'Profissional de Saúde',
      student: 'Estudante',
      patient: 'Paciente/Familiar',
      caregiver: 'Cuidador'
    };
    return labels[type];
  },

  getFocusLabel: (focus: LocalUserProfile['focus']): string => {
    const labels = {
      technical: 'Informações Técnicas',
      practical: 'Orientações Práticas',
      effects: 'Efeitos dos Medicamentos',
      general: 'Dúvidas Gerais',
      empathetic: 'Suporte Emocional'
    };
    return labels[focus];
  },

  getPersonaCompatibility: (profile: LocalUserProfile, personaId: string): number => {
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