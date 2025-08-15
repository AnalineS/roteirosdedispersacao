/**
 * Auth Components - Sistema de Autenticação "Soft"
 * Exportações de todos os componentes relacionados à autenticação
 */

// Componentes principais
export { SoftAuthModal } from './SoftAuthModal';
export { SoftAuthPrompt } from './SoftAuthPrompt';
export { UserProfileWidget } from './UserProfileWidget';
export { AuthProviderWrapper, FeatureStatus } from './AuthProviderWrapper';

// Hooks utilitários
export { 
  useFeatureAccessPrompt, 
  useProgressMilestonePrompt, 
  useSessionEngagementPrompt 
} from './SoftAuthPrompt';

export { useAuthAvailability } from './AuthProviderWrapper';

// Re-export dos hooks principais
export { useAuth, useSoftAuthPrompt, useFeatureAccess } from '@/hooks/useAuth';
export { useFirebaseSync } from '@/hooks/useFirebaseSync';

// Tipos úteis
export type { 
  LoginCredentials, 
  RegisterData, 
  AuthState,
  FirestoreUserProfile 
} from '@/lib/firebase/types';