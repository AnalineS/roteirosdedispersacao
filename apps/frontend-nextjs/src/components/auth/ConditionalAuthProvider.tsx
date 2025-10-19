/**
 * ConditionalAuthProvider - Smart Authentication Wrapper
 * Only applies authentication logic to protected routes
 * Public routes bypass authentication entirely for faster loading
 */

'use client';

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProviderWrapper } from './AuthProviderWrapper';
import { AuthProvider } from '@/contexts/AuthContext';
import { isPublicRoute } from '@/config/routes';

interface ConditionalAuthProviderProps {
  children: ReactNode;
}

export function ConditionalAuthProvider({ children }: ConditionalAuthProviderProps) {
  const pathname = usePathname();

  // For public routes, provide minimal auth context without initialization checks
  if (pathname && isPublicRoute(pathname)) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  // For protected routes, use full AuthProviderWrapper with all checks
  return (
    <AuthProviderWrapper>
      {children}
    </AuthProviderWrapper>
  );
}