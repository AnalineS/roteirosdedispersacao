'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SocialAuthButtons } from '@/components/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        // Login bem-sucedido - redirecionamento será feito pelo useEffect
        router.push('/dashboard');
      } else {
        setError(result.error || 'Erro durante o login. Tente novamente.');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSuccess = () => {
    // Login social bem-sucedido - redirecionamento será feito pelo useEffect
    router.push('/dashboard');
  };

  const handleSocialError = (error: string) => {
    setError(error);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Lado Esquerdo - Formulário */}
        <div className="login-form-section">
          <div className="login-form-container">
            {/* Logo e Título */}
            <div className="login-header">
              <Link href="/" className="login-logo">
                <div className="logo-icon">
                  <span>RD</span>
                </div>
                <span className="logo-text">Roteiros de Dispensação</span>
              </Link>
              
              <h1 className="login-title">Bem-vindo de volta</h1>
              <p className="login-subtitle">
                Entre com sua conta para acessar a plataforma
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  E-mail
                </label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span>Lembrar de mim</span>
                </label>
                
                <Link href="/esqueci-senha" className="forgot-link">
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* Login Social */}
            <SocialAuthButtons 
              mode="login"
              onSuccess={handleSocialSuccess}
              onError={handleSocialError}
              showDivider={true}
            />

            {/* Link para Cadastro */}
            <p className="signup-link">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="signup-link-action">
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </div>

        {/* Lado Direito - Ilustração */}
        <div className="login-illustration">
          <div className="illustration-content">
            <h2 className="illustration-title">
              Plataforma Educacional
            </h2>
            <p className="illustration-description">
              Ferramenta de apoio para profissionais de saúde no aprendizado
              sobre dispensação de medicamentos para hanseníase
            </p>
            
            <div className="illustration-features">
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Protocolos atualizados</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Assistentes especializados</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>Material educativo exclusivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-gray-50);
        }

        .login-wrapper {
          display: flex;
          width: 100%;
          max-width: 1400px;
          min-height: 90vh;
          background: white;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-2xl);
          overflow: hidden;
        }

        .login-form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-2xl);
        }

        .login-form-container {
          width: 100%;
          max-width: 420px;
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--spacing-2xl);
        }

        .login-logo {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          text-decoration: none;
          margin-bottom: var(--spacing-xl);
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: var(--font-size-lg);
        }

        .logo-text {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
        }

        .login-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-sm);
        }

        .login-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: #fee;
          border: 1px solid #fcc;
          border-radius: var(--radius-md);
          color: var(--color-error);
          margin-bottom: var(--spacing-lg);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .form-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: var(--spacing-md);
          color: var(--color-gray-400);
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: var(--spacing-md);
          padding-left: calc(var(--spacing-md) * 3);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          transition: all var(--transition-fast);
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .form-input:disabled {
          background: var(--color-gray-50);
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: var(--spacing-md);
          background: none;
          border: none;
          color: var(--color-gray-400);
          cursor: pointer;
          padding: var(--spacing-xs);
        }

        .password-toggle:hover {
          color: var(--color-gray-600);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          cursor: pointer;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
          accent-color: var(--color-primary-500);
        }

        .forgot-link {
          font-size: var(--font-size-sm);
          color: var(--color-primary-600);
          text-decoration: none;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }


        .signup-link {
          text-align: center;
          margin-top: var(--spacing-xl);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .signup-link-action {
          color: var(--color-primary-600);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
        }

        .signup-link-action:hover {
          text-decoration: underline;
        }

        .login-illustration {
          flex: 1;
          background: linear-gradient(135deg, 
            var(--color-primary-500), 
            var(--color-primary-600));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-2xl);
        }

        .illustration-content {
          max-width: 450px;
          color: white;
        }

        .illustration-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-lg);
        }

        .illustration-description {
          font-size: var(--font-size-lg);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-2xl);
          opacity: 0.95;
        }

        .illustration-features {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .feature-icon {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        /* Mobile */
        @media (max-width: 1024px) {
          .login-illustration {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .login-form-section {
            padding: var(--spacing-lg);
          }

          .login-wrapper {
            border-radius: 0;
            min-height: 100vh;
          }
        }

        /* Dark Mode */
        [data-theme="dark"] .login-container {
          background: var(--color-gray-100);
        }

        [data-theme="dark"] .login-wrapper {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .form-input {
          background: var(--color-gray-100);
          border-color: var(--color-gray-400);
          color: var(--color-gray-900);
        }
      `}</style>
    </div>
  );
}