'use client';

import React, { type ReactNode } from 'react';
import { useSafeAuth } from '@/hooks/useSafeAuth';

interface AuthStateWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  showLoadingState?: boolean;
}

/**
 * Wrapper que gerencia estados de autenticação de forma robusta
 * Compatível com SSG e fornece loading states apropriados
 */
export function AuthStateWrapper({
  children,
  fallback = null,
  requireAuth = false,
  requireAdmin = false,
  showLoadingState = true
}: AuthStateWrapperProps) {
  const auth = useSafeAuth();

  // Durante SSG ou enquanto não hidratou, mostrar fallback ou children
  if (!auth.isHydrated) {
    return showLoadingState ? (
      <div className="auth-loading-state">
        {/* Estado neutro durante SSG */}
        {children}
      </div>
    ) : (
      <>{children}</>
    );
  }

  // Loading state no client-side
  if (auth.isLoading && showLoadingState) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );
  }

  // Verificações de autorização
  if (requireAdmin && !auth.isAdmin) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="text-center p-4 text-gray-500">
        Acesso restrito a administradores
      </div>
    );
  }

  if (requireAuth && !auth.isAuthenticated) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="text-center p-4">
        <button
          onClick={() => auth.login()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Fazer Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook para componentes condicionais baseados em auth
 */
export function useAuthVisibility() {
  const auth = useSafeAuth();

  return {
    showForAnonymous: auth.isHydrated && auth.isAnonymous,
    showForAuthenticated: auth.isHydrated && auth.isAuthenticated,
    showForAdmin: auth.isHydrated && auth.isAdmin,
    showAlways: auth.isHydrated,
    isHydrated: auth.isHydrated
  };
}