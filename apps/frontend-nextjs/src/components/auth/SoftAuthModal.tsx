/**
 * SoftAuthModal - Modal de Autenticação Suave
 * Modal opcional e não-intrusivo para login/registro
 * Foca nos benefícios sem pressionar o usuário
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SoftAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  feature?: string;
  showRegister?: boolean;
}

export function SoftAuthModal({ 
  isOpen, 
  onClose, 
  reason, 
  feature,
  showRegister = false 
}: SoftAuthModalProps) {
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>(showRegister ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await auth.login({ email, password });
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erro no login');
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await auth.register({ 
        email, 
        password, 
        displayName: displayName || undefined 
      });
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erro no registro');
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await auth.continueAsGuest();
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erro ao continuar como visitante');
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const getBenefitsText = () => {
    switch (feature) {
      case 'advanced_calculator':
        return 'Calculadora avançada com histórico e recomendações personalizadas';
      case 'certificates':
        return 'Certificados de participação válidos para seu desenvolvimento profissional';
      case 'analytics':
        return 'Dashboard pessoal com progresso e insights de aprendizagem';
      case 'cloud_sync':
        return 'Sincronização na nuvem para acessar seus dados em qualquer dispositivo';
      default:
        return 'Funcionalidades avançadas e experiência personalizada';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'register' ? 'Criar Conta Gratuita' : 
                 mode === 'login' ? 'Fazer Login' : 'Continuar Aprendendo'}
              </h2>
              {reason && (
                <p className="text-sm text-gray-600 mt-1">{reason}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          {/* Benefícios */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              🎓 Com uma conta você ganha:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Histórico de conversas na nuvem</li>
              <li>✅ {getBenefitsText()}</li>
              <li>✅ Progresso sincronizado entre dispositivos</li>
              <li>✅ Sem anúncios ou limitações</li>
            </ul>
          </div>

          {/* Formulários */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sua senha"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome (opcional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Como prefere ser chamado"
                />
              </div>

              <div>
                <label htmlFor="email-register" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  id="email-register"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password-register" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha (mín. 6 caracteres)
                </label>
                <input
                  id="password-register"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Crie uma senha segura"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Criando conta...' : 'Criar Conta Gratuita'}
              </button>
            </form>
          )}

          {/* Navegação entre modos */}
          <div className="mt-6 space-y-3">
            {mode === 'login' ? (
              <div className="text-center">
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ainda não tem conta? Criar conta gratuita
                </button>
              </div>
            ) : mode === 'register' ? (
              <div className="text-center">
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Já tem conta? Fazer login
                </button>
              </div>
            ) : null}

            {/* Opção de continuar sem conta */}
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={handleContinueAsGuest}
                disabled={isLoading}
                className="w-full text-gray-600 hover:text-gray-700 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isLoading ? 'Carregando...' : '↗️ Continuar sem conta (limitado)'}
              </button>
            </div>
          </div>

          {/* Nota sobre privacidade */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              🔒 Seus dados são protegidos e nunca compartilhados. 
              <br />
              Plataforma educacional baseada em pesquisa acadêmica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}