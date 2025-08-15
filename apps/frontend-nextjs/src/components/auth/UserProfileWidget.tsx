/**
 * UserProfileWidget - Widget de Perfil do Usuário
 * Componente que mostra o status de autenticação e permite acesso rápido às funções
 * Adapta-se ao tipo de usuário (anônimo, temporário, autenticado)
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SoftAuthModal } from './SoftAuthModal';

interface UserProfileWidgetProps {
  variant?: 'compact' | 'full' | 'header';
  showActions?: boolean;
  className?: string;
}

export function UserProfileWidget({ 
  variant = 'compact', 
  showActions = true,
  className = '' 
}: UserProfileWidgetProps) {
  const auth = useAuth();
  const userProfile = useUserProfile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const sessionType = auth.getSessionType();
  const displayName = auth.getUserDisplayName();
  const welcomeMessage = auth.getWelcomeMessage();

  const getStatusColor = () => {
    switch (sessionType) {
      case 'premium': return 'text-green-600 bg-green-50 border-green-200';
      case 'registered': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'temporary': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'guest': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (sessionType) {
      case 'premium': return '👨‍⚕️';
      case 'registered': return '🎓';
      case 'temporary': return '👤';
      case 'guest': return '👋';
      default: return '👤';
    }
  };

  const getStatusText = () => {
    switch (sessionType) {
      case 'premium': return 'Premium';
      case 'registered': return 'Autenticado';
      case 'temporary': return 'Temporário';
      case 'guest': return 'Visitante';
      default: return 'Carregando...';
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setShowDropdown(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Variant compact - para sidebars e espaços pequenos
  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <div className={`
          flex items-center p-3 rounded-lg border 
          ${getStatusColor()}
          transition-all duration-200
        `}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className="text-lg">{getStatusIcon()}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {displayName}
              </p>
              <p className="text-xs opacity-75">
                {getStatusText()}
              </p>
            </div>
          </div>
          
          {showActions && !auth.isAuthenticated && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="ml-2 px-2 py-1 text-xs font-medium bg-white/50 hover:bg-white/75 rounded transition-colors"
            >
              Login
            </button>
          )}
        </div>

        {showAuthModal && (
          <SoftAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            reason="Acesse funcionalidades completas criando uma conta gratuita"
          />
        )}
      </div>
    );
  }

  // Variant header - para headers de página
  if (variant === 'header') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg border 
            ${getStatusColor()}
            hover:shadow-sm transition-all duration-200
          `}
        >
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="text-sm font-medium">{displayName}</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <p className="font-medium text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
              {auth.user?.email && (
                <p className="text-xs text-gray-500 mt-1">{auth.user.email}</p>
              )}
            </div>

            <div className="p-2">
              {auth.isAuthenticated ? (
                <>
                  {auth.features.cloudSync && (
                    <div className="px-3 py-2 text-sm text-green-600">
                      ✅ Dados sincronizados na nuvem
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Fazer Login
                  </button>
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded"
                  >
                    Criar Conta Gratuita
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {showAuthModal && (
          <SoftAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            reason="Acesse todas as funcionalidades da plataforma"
          />
        )}
      </div>
    );
  }

  // Variant full - para dashboards e páginas dedicadas
  return (
    <div className={`${className}`}>
      <div className={`
        p-6 rounded-xl border 
        ${getStatusColor()}
        transition-all duration-200
      `}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getStatusIcon()}</div>
            <div>
              <h3 className="font-semibold text-lg">{welcomeMessage}</h3>
              <p className="text-sm opacity-75">{getStatusText()}</p>
            </div>
          </div>
          
          {showActions && (
            <div className="flex space-x-2">
              {auth.isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium bg-white/50 hover:bg-white/75 rounded-lg transition-colors"
                >
                  Sair
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 text-sm font-medium bg-white/50 hover:bg-white/75 rounded-lg transition-colors"
                >
                  Fazer Login
                </button>
              )}
            </div>
          )}
        </div>

        {/* Funcionalidades disponíveis */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm opacity-90">Funcionalidades:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`flex items-center space-x-2 ${auth.features.persistentConversations ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{auth.features.persistentConversations ? '✅' : '❌'}</span>
              <span>Conversas Salvas</span>
            </div>
            <div className={`flex items-center space-x-2 ${auth.features.cloudSync ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{auth.features.cloudSync ? '✅' : '❌'}</span>
              <span>Sync na Nuvem</span>
            </div>
            <div className={`flex items-center space-x-2 ${auth.features.certificateGeneration ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{auth.features.certificateGeneration ? '✅' : '❌'}</span>
              <span>Certificados</span>
            </div>
            <div className={`flex items-center space-x-2 ${auth.features.advancedAnalytics ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{auth.features.advancedAnalytics ? '✅' : '❌'}</span>
              <span>Analytics</span>
            </div>
          </div>
        </div>

        {/* Upgrade prompt para usuários não autenticados */}
        {!auth.isAuthenticated && showActions && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              🎯 Desbloquear Todas as Funcionalidades
            </button>
          </div>
        )}
      </div>

      {showAuthModal && (
        <SoftAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          reason="Desbloqueie o potencial completo da plataforma"
        />
      )}
    </div>
  );
}