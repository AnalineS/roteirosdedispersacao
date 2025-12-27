'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  Phone,
  MapPin,
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';

type UserProfile = 'farmaceutico' | 'enfermeiro' | 'medico' | 'estudante' | 'outro';

interface ProfileOption {
  value: UserProfile;
  label: string;
  description: string;
  icon: React.ElementType;
}

const profileOptions: ProfileOption[] = [
  {
    value: 'farmaceutico',
    label: 'Farmacêutico',
    description: 'Profissional responsável pela dispensação',
    icon: UserCheck
  },
  {
    value: 'enfermeiro',
    label: 'Enfermeiro',
    description: 'Profissional de enfermagem',
    icon: User
  },
  {
    value: 'medico',
    label: 'Médico',
    description: 'Profissional médico',
    icon: User
  },
  {
    value: 'estudante',
    label: 'Estudante',
    description: 'Estudante da área da saúde',
    icon: User
  },
  {
    value: 'outro',
    label: 'Outro',
    description: 'Outro profissional de saúde',
    icon: User
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profile: '' as UserProfile,
    crf: '',
    institution: '',
    city: '',
    state: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [step, setStep] = useState(1);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const { name, email, password, confirmPassword } = formData;
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return false;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const { profile, phone } = formData;
    
    if (!profile || !phone) {
      setError('Perfil e telefone são obrigatórios');
      return false;
    }
    
    if (!acceptTerms) {
      setError('Você deve aceitar os termos de uso');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep2()) return;
    
    setIsLoading(true);

    try {
      // TODO: Implementar registro com backend API
      console.log('Registro:', formData);
      
      // Simulação de registro
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirecionar após registro bem-sucedido
      router.push('/login?registered=true');
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // TODO: Implementar registro com Google
      console.log('Registro com Google');
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch {
      setError('Erro ao criar conta com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-form-section">
          <div className="register-form-container">
            {/* Header */}
            <div className="register-header">
              <Link href="/" className="register-logo">
                <div className="logo-icon">
                  <span>RD</span>
                </div>
                <span className="logo-text">Roteiros de Dispensação</span>
              </Link>
              
              <h1 className="register-title">Criar conta</h1>
              <p className="register-subtitle">
                Junte-se à nossa plataforma educacional
              </p>
              
              {/* Progress */}
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(step / 2) * 100}%` }}
                  />
                </div>
                <div className="progress-steps">
                  <span className={step >= 1 ? 'active' : ''}>Dados básicos</span>
                  <span className={step >= 2 ? 'active' : ''}>Perfil profissional</span>
                </div>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Formulário - Step 1 */}
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {step === 1 && (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Nome completo
                    </label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={20} />
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="form-input"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      E-mail
                    </label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={20} />
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
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
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
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

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmar senha
                    </label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={20} />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className="form-input"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                        aria-label={showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="submit-button">
                    Continuar
                  </button>

                  {/* Divisor */}
                  <div className="divider">
                    <span>ou</span>
                  </div>

                  {/* Login Social */}
                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={isLoading}
                    className="google-button"
                  >
                    <svg className="google-icon" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Criar conta com Google
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="form-step">
                  <div className="form-group">
                    <label className="form-label">
                      Perfil profissional
                    </label>
                    <div className="profile-options">
                      {profileOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <label
                            key={option.value}
                            className={`profile-option ${formData.profile === option.value ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name="profile"
                              value={option.value}
                              checked={formData.profile === option.value}
                              onChange={(e) => handleInputChange('profile', e.target.value as UserProfile)}
                              className="profile-radio"
                            />
                            <div className="profile-content">
                              <Icon size={24} />
                              <div>
                                <div className="profile-label">{option.label}</div>
                                <div className="profile-description">{option.description}</div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Telefone
                      </label>
                      <div className="input-wrapper">
                        <Phone className="input-icon" size={20} />
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="form-input"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {formData.profile === 'farmaceutico' && (
                      <div className="form-group">
                        <label htmlFor="crf" className="form-label">
                          CRF
                        </label>
                        <div className="input-wrapper">
                          <UserCheck className="input-icon" size={20} />
                          <input
                            id="crf"
                            type="text"
                            value={formData.crf}
                            onChange={(e) => handleInputChange('crf', e.target.value)}
                            placeholder="12345"
                            className="form-input"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="institution" className="form-label">
                      Instituição (opcional)
                    </label>
                    <div className="input-wrapper">
                      <MapPin className="input-icon" size={20} />
                      <input
                        id="institution"
                        type="text"
                        value={formData.institution}
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        placeholder="Hospital, UBS, Farmácia..."
                        className="form-input"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="terms-section">
                    <label className="terms-label">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="terms-checkbox"
                      />
                      <span>
                        Aceito os{' '}
                        <Link href="/termos" className="terms-link">
                          termos de uso
                        </Link>{' '}
                        e{' '}
                        <Link href="/privacidade" className="terms-link">
                          política de privacidade
                        </Link>
                      </span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="back-button"
                      disabled={isLoading}
                    >
                      Voltar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="submit-button"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="spinner" size={20} />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Criar conta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Link para Login */}
            <p className="login-link">
              Já tem uma conta?{' '}
              <Link href="/login" className="login-link-action">
                Entrar
              </Link>
            </p>
          </div>
        </div>

        {/* Lado Direito - Benefícios */}
        <div className="register-illustration">
          <div className="illustration-content">
            <h2 className="illustration-title">
              Ferramenta Educacional
            </h2>
            <p className="illustration-description">
              Cadastre-se e tenha acesso a conteúdo especializado sobre
              dispensação de medicamentos para hanseníase
            </p>
            
            <div className="benefits-list">
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span>Baseado em diretrizes do MS</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span>Assistentes IA educacionais</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span>Material didático especializado</span>
              </div>
              <div className="benefit-item">
                <CheckCircle className="benefit-icon" />
                <span>Acesso gratuito e aberto</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-gray-50);
          padding: var(--spacing-lg) 0;
        }

        .register-wrapper {
          display: flex;
          width: 100%;
          max-width: 1400px;
          min-height: 95vh;
          background: white;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-2xl);
          overflow: hidden;
        }

        .register-form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
        }

        .register-form-container {
          width: 100%;
          max-width: 480px;
        }

        .register-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .register-logo {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          text-decoration: none;
          margin-bottom: var(--spacing-lg);
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

        .register-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-sm);
        }

        .register-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-lg);
        }

        .progress-container {
          margin-bottom: var(--spacing-lg);
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--color-gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--spacing-sm);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600));
          transition: width var(--transition-base);
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
        }

        .progress-steps span.active {
          color: var(--color-primary-600);
          font-weight: var(--font-weight-medium);
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

        .form-step {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
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

        .profile-options {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .profile-option {
          display: flex;
          align-items: center;
          padding: var(--spacing-md);
          border: 2px solid var(--color-gray-200);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .profile-option:hover {
          border-color: var(--color-primary-300);
        }

        .profile-option.selected {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
        }

        .profile-radio {
          display: none;
        }

        .profile-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          width: 100%;
        }

        .profile-label {
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-900);
        }

        .profile-description {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .terms-section {
          padding: var(--spacing-md);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
        }

        .terms-label {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
          cursor: pointer;
        }

        .terms-checkbox {
          margin-top: 2px;
          accent-color: var(--color-primary-500);
        }

        .terms-link {
          color: var(--color-primary-600);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
        }

        .terms-link:hover {
          text-decoration: underline;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .back-button {
          flex: 1;
          padding: var(--spacing-md);
          background: white;
          color: var(--color-gray-600);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .back-button:hover:not(:disabled) {
          background: var(--color-gray-50);
        }

        .back-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-button {
          flex: 2;
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

        .divider {
          display: flex;
          align-items: center;
          margin: var(--spacing-lg) 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-gray-300);
        }

        .divider span {
          padding: 0 var(--spacing-md);
          color: var(--color-gray-500);
          font-size: var(--font-size-sm);
        }

        .google-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-md);
          background: white;
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-700);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .google-button:hover:not(:disabled) {
          background: var(--color-gray-50);
          border-color: var(--color-gray-400);
        }

        .google-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .google-icon {
          width: 20px;
          height: 20px;
        }

        .login-link {
          text-align: center;
          margin-top: var(--spacing-xl);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .login-link-action {
          color: var(--color-primary-600);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
        }

        .login-link-action:hover {
          text-decoration: underline;
        }

        .register-illustration {
          flex: 1;
          background: linear-gradient(135deg, 
            var(--color-secondary-500), 
            var(--color-secondary-600));
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

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .benefit-icon {
          width: 24px;
          height: 24px;
          color: white;
          flex-shrink: 0;
        }

        /* Mobile */
        @media (max-width: 1024px) {
          .register-illustration {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .register-form-section {
            padding: var(--spacing-md);
          }

          .register-wrapper {
            border-radius: 0;
            min-height: 100vh;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }

        /* Dark Mode */
        [data-theme="dark"] .register-container {
          background: var(--color-gray-100);
        }

        [data-theme="dark"] .register-wrapper {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .form-input {
          background: var(--color-gray-100);
          border-color: var(--color-gray-400);
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .profile-option {
          border-color: var(--color-gray-400);
          background: var(--color-gray-100);
        }

        [data-theme="dark"] .profile-option.selected {
          background: var(--color-primary-100);
        }

        [data-theme="dark"] .terms-section {
          background: var(--color-gray-300);
        }
      `}</style>
    </div>
  );
}