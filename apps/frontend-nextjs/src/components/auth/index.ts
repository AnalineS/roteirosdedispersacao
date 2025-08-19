export { default as AuthButton } from './AuthButton';
export { default as AuthProviderWrapper, FeatureStatus, useAuthAvailability } from './AuthProviderWrapper';
export { default as SocialAuthButtons } from './SocialAuthButtons';
export { useAuth } from '@/contexts/AuthContext';

// Re-export auth context for convenience
export type { 
  AuthUser, 
  AuthState, 
  LoginCredentials, 
  RegisterData,
  FirestoreUserProfile 
} from '@/lib/firebase/types';