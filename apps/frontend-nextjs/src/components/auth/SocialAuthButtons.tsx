'use client';

import React, { useState } from 'react';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { AVAILABLE_PROVIDERS } from '@/lib/firebase/config';
import type { SocialAuthCredentials } from '@/lib/firebase/types';

interface SocialAuthButtonsProps {
  mode?: 'login' | 'register' | 'link';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  preferredProfileType?: 'professional' | 'student' | 'patient' | 'caregiver';
  showDivider?: boolean;
  compact?: boolean;
}

export default function SocialAuthButtons({ 
  mode = 'login',
  onSuccess,
  onError,
  className = '',
  preferredProfileType,
  showDivider = true,
  compact = false
}: SocialAuthButtonsProps) {
  const { loginWithSocial, linkSocialAccount, isLoading } = useSafeAuth();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialAuth = async (providerId: string) => {
    try {
      setLoadingProvider(providerId);

      let result;
      if (mode === 'link') {
        result = await linkSocialAccount(providerId);
      } else {
        const credentials: SocialAuthCredentials = {
          providerId: providerId as any,
          preferredProfileType
        };
        result = await loginWithSocial(credentials);
      }

      if (result.success) {
        onSuccess?.();
      } else {
        onError?.(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      onError?.(error.message || 'Erro durante autenticação social');
    } finally {
      setLoadingProvider(null);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google.com':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      case 'facebook.com':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'apple.com':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId);
    return provider?.name || providerId;
  };

  const getProviderColor = (providerId: string) => {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId);
    return provider?.color || '#666';
  };

  const getModeText = () => {
    switch (mode) {
      case 'register':
        return 'Criar conta com';
      case 'link':
        return 'Conectar';
      default:
        return 'Entrar com';
    }
  };

  const enabledProviders = AVAILABLE_PROVIDERS.filter(provider => provider.enabled);

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className={`social-auth-buttons ${className}`}>
      {showDivider && (
        <div className="social-divider">
          <span className="divider-line"></span>
          <span className="divider-text">ou</span>
          <span className="divider-line"></span>
        </div>
      )}

      <div className="social-buttons-container">
        {enabledProviders.map((provider) => {
          const isLoading = loadingProvider === provider.id;
          const isDisabled = isLoading || loadingProvider !== null;

          return (
            <button
              key={provider.id}
              onClick={() => handleSocialAuth(provider.id)}
              disabled={isDisabled}
              className={`social-auth-button ${compact ? 'compact' : ''}`}
              aria-label={`${getModeText()} ${provider.name}`}
              style={{
                '--provider-color': provider.color
              } as React.CSSProperties}
            >
              <div className="button-content">
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <div className="provider-icon">
                    {getProviderIcon(provider.id)}
                  </div>
                )}
                
                {!compact && (
                  <span className="provider-text">
                    {getModeText()} {provider.name}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {mode === 'login' && (
        <div className="social-disclaimer">
          <p>
            Ao fazer login, você concorda com nossos{' '}
            <a href="/termos" target="_blank" rel="noopener noreferrer">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer">
              Política de Privacidade
            </a>
          </p>
        </div>
      )}

      <style jsx>{`
        .social-auth-buttons {
          width: 100%;
        }

        .social-divider {
          display: flex;
          align-items: center;
          margin: var(--spacing-lg) 0;
          gap: var(--spacing-md);
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--color-gray-300);
        }

        .divider-text {
          color: var(--color-gray-500);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          padding: 0 var(--spacing-sm);
        }

        .social-buttons-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .social-auth-button {
          width: 100%;
          padding: var(--spacing-md);
          border: 2px solid var(--color-gray-300);
          border-radius: var(--radius-lg);
          background: white;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          position: relative;
          overflow: hidden;
        }

        .social-auth-button:hover:not(:disabled) {
          border-color: var(--provider-color);
          background: color-mix(in srgb, var(--provider-color) 5%, white);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .social-auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .social-auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .social-auth-button.compact {
          padding: var(--spacing-sm);
          width: auto;
          min-width: 48px;
          aspect-ratio: 1;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          color: var(--color-gray-700);
        }

        .provider-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .provider-text {
          white-space: nowrap;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--color-gray-200);
          border-top-color: var(--provider-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .social-disclaimer {
          margin-top: var(--spacing-lg);
          text-align: center;
        }

        .social-disclaimer p {
          font-size: var(--font-size-xs);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
          margin: 0;
        }

        .social-disclaimer a {
          color: var(--color-primary-600);
          text-decoration: none;
        }

        .social-disclaimer a:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark mode */
        [data-theme="dark"] .social-auth-button {
          background: var(--color-gray-800);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }

        [data-theme="dark"] .social-auth-button:hover:not(:disabled) {
          background: color-mix(in srgb, var(--provider-color) 15%, var(--color-gray-800));
        }

        [data-theme="dark"] .divider-line {
          background: var(--color-gray-600);
        }

        [data-theme="dark"] .divider-text {
          color: var(--color-gray-400);
        }

        [data-theme="dark"] .social-disclaimer p {
          color: var(--color-gray-400);
        }

        [data-theme="dark"] .social-disclaimer a {
          color: var(--color-primary-400);
        }

        /* Responsive */
        @media (min-width: 640px) {
          .social-buttons-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--spacing-md);
          }
        }

        /* Mobile optimization */
        @media (max-width: 480px) {
          .social-auth-button {
            padding: var(--spacing-lg);
            font-size: var(--font-size-base);
          }

          .provider-text {
            font-size: var(--font-size-sm);
          }
        }

        /* Focus states for accessibility */
        .social-auth-button:focus {
          outline: none;
          border-color: var(--provider-color);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--provider-color) 20%, transparent);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .social-auth-button {
            border-width: 3px;
          }
          
          .social-auth-button:hover:not(:disabled) {
            border-width: 3px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .social-auth-button {
            transition: none;
          }
          
          .loading-spinner {
            animation: none;
            border-top-color: var(--provider-color);
          }
          
          .social-auth-button:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}