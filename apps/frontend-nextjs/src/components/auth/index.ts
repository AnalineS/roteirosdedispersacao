export { default as AuthButton } from './AuthButton';
export { default as AuthProviderWrapper, FeatureStatus, useAuthAvailability } from './AuthProviderWrapper';
export { AuthStateWrapper, useAuthVisibility } from './AuthStateWrapper';
// Usar a versão segura para SSG
export { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';

// Re-export auth types for convenience
export type {
  AuthUser,
  AuthState,
  LoginCredentials,
  RegisterData,
  UserProfile as BackendUserProfile,
  AuthUserProfile,
  AuthenticationState
} from '@/types/auth';