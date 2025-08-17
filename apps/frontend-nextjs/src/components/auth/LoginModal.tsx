'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUserProfile } from '@/hooks/useUserProfile';
import { USER_LEVEL_BENEFITS } from '@/types/auth';
import dynamic from 'next/dynamic';

// Lazy load WelcomeWizard for first-time users
const WelcomeWizard = dynamic(() => import('@/components/onboarding/WelcomeWizard'), {
  ssr: false,
  loading: () => null
});

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  showBenefits?: boolean;
}

export default function LoginModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  showBenefits = true 
}: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showWizard, setShowWizard] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    institution: '',
    specialization: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const { 
    loginWithGoogle, 
    loginWithEmail, 
    register, 
    isLoading, 
    error, 
    clearError,
    user 
  } = useAuth();
  
  const { showWizard: needsOnboarding, completeOnboarding } = useOnboarding();
  const { saveProfile } = useUserProfile();

  // Check if user needs onboarding after successful login
  useEffect(() => {
    if (user && needsOnboarding && isOpen) {
      // Show wizard for new users
      setShowWizard(true);
    }
  }, [user, needsOnboarding, isOpen]);

  if (!isOpen && !showWizard) return null;

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Don't close immediately - let the useEffect handle wizard display
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (mode === 'login') {
        await loginWithEmail(formData.email, formData.password);
      } else {
        if (!formData.acceptTerms || !formData.acceptPrivacy) {
          throw new Error('Aceite os termos e política de privacidade');
        }
        await register(formData);
      }
      // Don't close immediately - let the useEffect handle wizard display
    } catch (error) {
      console.error('Email auth failed:', error);
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (role: any) => {
    completeOnboarding(role);
    
    const userProfile = {
      type: role.id === 'medical' || role.id === 'student' ? 'professional' as const : 'patient' as const,
      focus: role.id === 'medical' ? 'technical' as const : 'general' as const,
      confidence: 0.9,
      explanation: `Selecionado através do onboarding: ${role.title}`,
      selectedPersona: role.recommendedPersona
    };
    
    saveProfile(userProfile);
    setShowWizard(false);
    onSuccess?.();
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Show Welcome Wizard as popup for new users
  if (showWizard) {
    return <WelcomeWizard onComplete={handleOnboardingComplete} />;
  }

  // Only show login modal if isOpen is true
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {mode === 'login' 
              ? 'Acesse sua conta para ter experiência completa'
              : 'Crie sua conta e desbloqueie todos os recursos'
            }
          </p>
        </div>

        {/* Benefits Section */}
        {showBenefits && (
          <div className="p-6 bg-blue-50 border-b">
            <h3 className="font-semibold text-blue-800 mb-3">
              ✨ Benefícios do Cadastro:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              {USER_LEVEL_BENEFITS.registered.features.slice(1, 5).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 mb-4"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Entrando...' : 'Continuar com Google'}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit}>
            {mode === 'register' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome completo"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instituição (opcional)
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hospital, Universidade, UBS..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialização (opcional)
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="farmacia">Farmácia</option>
                    <option value="medicina">Medicina</option>
                    <option value="enfermagem">Enfermagem</option>
                    <option value="dermatologia">Dermatologia</option>
                    <option value="saude-publica">Saúde Pública</option>
                    <option value="estudante">Estudante</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="mb-4 space-y-2">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="mt-1 mr-2"
                      required
                    />
                    <span className="text-sm text-gray-600">
                      Aceito os{' '}
                      <a href="/termos" target="_blank" className="text-blue-600 hover:underline">
                        Termos de Uso
                      </a>
                    </span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onChange={handleInputChange}
                      className="mt-1 mr-2"
                      required
                    />
                    <span className="text-sm text-gray-600">
                      Aceito a{' '}
                      <a href="/privacidade" target="_blank" className="text-blue-600 hover:underline">
                        Política de Privacidade
                      </a>
                    </span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {isLoading 
                ? (mode === 'login' ? 'Entrando...' : 'Criando conta...') 
                : (mode === 'login' ? 'Entrar' : 'Criar Conta')
              }
            </button>
          </form>

          {/* Switch Mode */}
          <div className="text-center text-sm">
            {mode === 'login' ? (
              <span>
                Não tem conta?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-blue-600 hover:underline"
                >
                  Criar uma agora
                </button>
              </span>
            ) : (
              <span>
                Já tem conta?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:underline"
                >
                  Fazer login
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}