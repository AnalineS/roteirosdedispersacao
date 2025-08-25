'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SocialAuthButtons from './SocialAuthButtons';

interface AuthButtonProps {
  variant?: 'header' | 'inline' | 'mobile';
  className?: string;
}

export default function AuthButton({ variant = 'header', className = '' }: AuthButtonProps) {
  const { user, isAuthenticated, isAnonymous, logout, loading, profile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/cadastro');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  // Loading state
  if (loading) {
    return (
      <div className={`auth-button auth-button--${variant} ${className}`}>
        <div className="loading-spinner">
          <style jsx>{`
            .loading-spinner {
              width: 20px;
              height: 20px;
              border: 2px solid var(--color-gray-200);
              border-top-color: var(--color-primary-500);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // User is authenticated
  if (isAuthenticated && !isAnonymous) {
    const displayName = user?.displayName || profile?.displayName || user?.email?.split('@')[0] || 'Usuário';
    
    return (
      <div className={`auth-button auth-button--${variant} auth-button--authenticated ${className}`}>
        {variant === 'header' && (
          <>
            <button 
              onClick={handleProfile}
              className="user-info-btn"
              aria-label="Ver perfil do usuário"
            >
              <div className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{displayName}</span>
            </button>
            
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="logout-btn"
              aria-label="Fazer logout"
            >
              {isLoggingOut ? '...' : 'Sair'}
            </button>
          </>
        )}

        {variant === 'mobile' && (
          <div className="mobile-user-menu">
            <button onClick={handleProfile} className="mobile-profile-btn">
              <div className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{displayName}</span>
                <span className="user-status">Autenticado</span>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mobile-logout-btn"
            >
              {isLoggingOut ? 'Saindo...' : 'Logout'}
            </button>
          </div>
        )}

        <style jsx>{`
          .auth-button {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
          }

          .auth-button--header {
            gap: var(--spacing-md);
          }

          .user-info-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-xs) var(--spacing-sm);
            background: transparent;
            border: 1px solid var(--color-gray-300);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-fast);
            color: var(--color-gray-700);
            font-size: var(--font-size-sm);
          }

          .user-info-btn:hover {
            background: var(--color-gray-50);
            border-color: var(--color-primary-300);
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--color-primary-500);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: var(--font-weight-bold);
            font-size: var(--font-size-sm);
          }

          .user-name {
            font-weight: var(--font-weight-medium);
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .logout-btn {
            padding: var(--spacing-xs) var(--spacing-md);
            background: var(--color-gray-100);
            border: 1px solid var(--color-gray-300);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-fast);
            color: var(--color-gray-700);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
          }

          .logout-btn:hover:not(:disabled) {
            background: var(--color-red-50);
            border-color: var(--color-red-300);
            color: var(--color-red-700);
          }

          .logout-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* Mobile variant */
          .mobile-user-menu {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
            width: 100%;
          }

          .mobile-profile-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            background: var(--color-gray-50);
            border: 1px solid var(--color-gray-200);
            border-radius: var(--radius-lg);
            cursor: pointer;
            transition: all var(--transition-fast);
            width: 100%;
          }

          .mobile-profile-btn:hover {
            background: var(--color-gray-100);
          }

          .user-details {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex: 1;
          }

          .user-status {
            font-size: var(--font-size-xs);
            color: var(--color-gray-500);
          }

          .mobile-logout-btn {
            padding: var(--spacing-md);
            background: var(--color-red-50);
            border: 1px solid var(--color-red-200);
            border-radius: var(--radius-md);
            color: var(--color-red-700);
            cursor: pointer;
            transition: all var(--transition-fast);
            font-weight: var(--font-weight-medium);
          }

          .mobile-logout-btn:hover:not(:disabled) {
            background: var(--color-red-100);
            border-color: var(--color-red-300);
          }

          /* Dark mode */
          [data-theme="dark"] .user-info-btn,
          [data-theme="dark"] .logout-btn {
            border-color: var(--color-gray-600);
            color: var(--color-gray-300);
          }

          [data-theme="dark"] .user-info-btn:hover {
            background: var(--color-gray-800);
            border-color: var(--color-primary-400);
          }

          [data-theme="dark"] .logout-btn {
            background: var(--color-gray-800);
          }

          [data-theme="dark"] .logout-btn:hover:not(:disabled) {
            background: var(--color-red-900);
            border-color: var(--color-red-400);
            color: var(--color-red-300);
          }

          /* Responsive */
          @media (max-width: 768px) {
            .auth-button--header .user-name {
              display: none;
            }
            
            .user-info-btn {
              padding: var(--spacing-xs);
            }
            
            .logout-btn {
              padding: var(--spacing-xs) var(--spacing-sm);
              font-size: var(--font-size-xs);
            }
          }
        `}</style>
      </div>
    );
  }

  // User is anonymous or not authenticated
  return (
    <div className={`auth-button auth-button--${variant} auth-button--guest ${className}`}>
      {variant === 'header' && (
        <>
          <button 
            onClick={handleLogin}
            className="login-btn"
            aria-label="Fazer login"
          >
            Entrar
          </button>
          
          <button 
            onClick={handleRegister}
            className="register-btn"
            aria-label="Criar conta"
          >
            Criar Conta
          </button>
        </>
      )}

      {variant === 'mobile' && (
        <div className="mobile-guest-menu">
          <button onClick={handleLogin} className="mobile-login-btn">
            Fazer Login
          </button>
          <button onClick={handleRegister} className="mobile-register-btn">
            Criar Conta
          </button>
        </div>
      )}

      {variant === 'inline' && (
        <div className="inline-auth-actions">
          <div className="auth-message">
            <span className="auth-prompt">Para salvar seu progresso e sincronizar entre dispositivos:</span>
          </div>
          
          <div className="auth-options">
            <button onClick={handleLogin} className="inline-login-btn">
              Entrar
            </button>
            <button onClick={handleRegister} className="inline-register-btn">
              Criar conta grátis
            </button>
          </div>

          <SocialAuthButtons 
            mode="login"
            compact={false}
            showDivider={true}
            onSuccess={() => {
              // Login social bem-sucedido
            }}
            onError={(error) => {
              console.error('Erro no login social:', error);
            }}
            className="inline-social-auth"
          />
        </div>
      )}

      <style jsx>{`
        .auth-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .auth-button--header {
          gap: var(--spacing-md);
        }

        .login-btn, .register-btn {
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .login-btn {
          background: transparent;
          border: 1px solid var(--color-primary-500);
          color: var(--color-primary-500);
        }

        .login-btn:hover {
          background: var(--color-primary-50);
        }

        .register-btn {
          background: var(--color-primary-500);
          border: 1px solid var(--color-primary-500);
          color: white;
        }

        .register-btn:hover {
          background: var(--color-primary-600);
          border-color: var(--color-primary-600);
        }

        /* Mobile variant */
        .mobile-guest-menu {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          width: 100%;
        }

        .mobile-login-btn, .mobile-register-btn {
          padding: var(--spacing-md);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-weight: var(--font-weight-medium);
          width: 100%;
        }

        .mobile-login-btn {
          background: transparent;
          border: 2px solid var(--color-primary-500);
          color: var(--color-primary-500);
        }

        .mobile-login-btn:hover {
          background: var(--color-primary-50);
        }

        .mobile-register-btn {
          background: var(--color-primary-500);
          border: 2px solid var(--color-primary-500);
          color: white;
        }

        .mobile-register-btn:hover {
          background: var(--color-primary-600);
        }

        /* Inline variant */
        .inline-auth-actions {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: var(--color-blue-50);
          border: 1px solid var(--color-blue-200);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-sm);
        }

        .auth-message {
          text-align: center;
        }

        .auth-options {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .auth-prompt {
          color: var(--color-gray-700);
          font-weight: var(--font-weight-medium);
        }

        .inline-login-btn, .inline-register-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .inline-login-btn {
          background: transparent;
          border: 1px solid var(--color-primary-500);
          color: var(--color-primary-500);
        }

        .inline-login-btn:hover {
          background: var(--color-primary-50);
        }

        .inline-register-btn {
          background: var(--color-primary-500);
          border: 1px solid var(--color-primary-500);
          color: white;
        }

        .inline-register-btn:hover {
          background: var(--color-primary-600);
        }

        /* Dark mode */
        [data-theme="dark"] .login-btn {
          border-color: var(--color-primary-400);
          color: var(--color-primary-400);
        }

        [data-theme="dark"] .login-btn:hover {
          background: var(--color-primary-900);
        }

        [data-theme="dark"] .inline-auth-actions {
          background: var(--color-gray-800);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .auth-prompt {
          color: var(--color-gray-300);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .auth-button--header {
            gap: var(--spacing-sm);
          }
          
          .login-btn, .register-btn {
            padding: var(--spacing-xs) var(--spacing-sm);
            font-size: var(--font-size-xs);
          }
          
          .auth-options {
            flex-direction: column;
            gap: var(--spacing-md);
          }
          
          .inline-login-btn, .inline-register-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .inline-auth-actions {
            padding: var(--spacing-md);
          }
          
          .auth-options {
            width: 100%;
          }
          
          .inline-login-btn, .inline-register-btn {
            width: 100%;
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
}