'use client';

import { useAuth } from '@/hooks/useAuth';
import { USER_LEVEL_BENEFITS, type AuthUser, type UserUsage } from '@/types/auth';
import { useState } from 'react';
import LoginModal from './LoginModal';

// Type guard para verificar se o user tem usage
function hasUsage(user: AuthUser): user is AuthUser & { usage: UserUsage } {
  return user && 'usage' in user && user.usage !== undefined;
}

interface UserBenefitsCardProps {
  showUpgradePrompt?: boolean;
  className?: string;
}

export default function UserBenefitsCard({ 
  showUpgradePrompt = true, 
  className = '' 
}: UserBenefitsCardProps) {
  const { user, isAuthenticated, getUserBenefits, getUserRole } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const currentBenefits = getUserBenefits();
  const currentRole = getUserRole();

  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        {/* Header com status atual */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{currentBenefits.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentBenefits.title}
              </h3>
              <p className="text-sm text-gray-600">
                {currentBenefits.description}
              </p>
            </div>
          </div>
          {currentRole !== 'admin' && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentRole === 'visitor' 
                ? 'bg-gray-100 text-gray-800'
                : currentRole === 'registered'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {currentBenefits.title}
            </div>
          )}
        </div>

        {/* Benefícios atuais */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">✨ Seus benefícios atuais:</h4>
          <ul className="space-y-2">
            {currentBenefits.features.map((feature, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Limitações (se houver) */}
        {currentBenefits.limitations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">⚠️ Limitações:</h4>
            <ul className="space-y-2">
              {currentBenefits.limitations.map((limitation, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-amber-500 mr-2 mt-0.5">●</span>
                  <span className="text-gray-600">{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Informações de uso (se logado) */}
        {user && hasUsage(user) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📊 Suas estatísticas:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Sessões:</span>
                <span className="font-medium ml-2">{user.usage.totalSessions || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">Mensagens:</span>
                <span className="font-medium ml-2">{user.usage.totalMessages || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">Módulos:</span>
                <span className="font-medium ml-2">{user.usage.totalModulesCompleted || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">Certificados:</span>
                <span className="font-medium ml-2">{user.usage.totalCertificatesEarned || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Call to action para upgrade */}
        {showUpgradePrompt && currentRole === 'visitor' && (
          <div className="border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Desbloqueie todos os recursos criando sua conta gratuita
              </p>
              <button
                onClick={handleUpgradeClick}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Criar Conta Gratuita
              </button>
            </div>
          </div>
        )}

        {/* Preview dos próximos níveis */}
        {(currentRole === 'visitor' || currentRole === 'registered') && (
          <div className="mt-6 border-t pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-blue-600">
                🔮 Ver próximos níveis
              </summary>
              <div className="mt-3 space-y-4">
                {currentRole === 'visitor' && (
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">👤</span>
                      <span className="font-medium text-blue-900">Usuário Cadastrado</span>
                    </div>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Histórico de conversas salvo</li>
                      <li>• Certificados de conclusão</li>
                      <li>• Dashboard pessoal</li>
                      <li>• Até 50 conversas por dia</li>
                    </ul>
                  </div>
                )}
                
                {(currentRole === 'visitor' || currentRole === 'registered') && (
                  <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">👑</span>
                      <span className="font-medium text-red-900">Administrador</span>
                    </div>
                    <ul className="text-xs text-red-800 space-y-1">
                      <li>• Todas as funcionalidades</li>
                      <li>• Dashboard administrativo</li>
                      <li>• Analytics completo</li>
                      <li>• Criação de conteúdo</li>
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Modal de Login */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
        }}
      />
    </>
  );
}

// Componente compacto para sidebar
export function UserBenefitsCompact() {
  const { getUserRole, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const role = getUserRole();
  const benefits = USER_LEVEL_BENEFITS[role];

  if (isAuthenticated && role !== 'visitor') {
    return null; // Não mostrar para usuários já logados
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <span className="text-lg mr-2">🎯</span>
          <span className="font-medium">Desbloqueie Mais!</span>
        </div>
        <p className="text-sm opacity-90 mb-3">
          Cadastre-se gratuitamente e tenha acesso a:
        </p>
        <ul className="text-xs space-y-1 mb-4">
          <li>• Histórico de conversas</li>
          <li>• Certificados oficiais</li>
          <li>• Dashboard pessoal</li>
          <li>• Módulos avançados</li>
        </ul>
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full bg-white text-blue-600 py-2 px-3 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Criar Conta Grátis
        </button>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </>
  );
}