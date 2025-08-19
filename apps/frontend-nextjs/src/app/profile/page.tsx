'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SocialAuthButtons } from '@/components/auth';

interface ProfileFormData {
  displayName: string;
  email: string;
  profileType: 'professional' | 'student' | 'patient' | 'caregiver';
  focus: 'general' | 'advanced' | 'research';
  preferences: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    emailUpdates: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { 
    user, 
    profile, 
    isAuthenticated, 
    loading: authLoading,
    updateUserProfile,
    linkSocialAccount,
    deleteAccount
  } = useAuth();

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    email: '',
    profileType: 'patient',
    focus: 'general',
    preferences: {
      language: 'simple',
      notifications: true,
      theme: 'auto',
      emailUpdates: true
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'privacy'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Carregar dados do perfil
  useEffect(() => {
    if (user && profile) {
      setFormData({
        displayName: user.displayName || profile.displayName || '',
        email: user.email || profile.email || '',
        profileType: profile.type || 'patient',
        focus: (profile.focus === 'technical' || profile.focus === 'practical' || profile.focus === 'effects') ? 'general' : (profile.focus || 'general'),
        preferences: {
          language: profile.preferences?.language || 'simple',
          notifications: profile.preferences?.notifications ?? true,
          theme: profile.preferences?.theme || 'auto',
          emailUpdates: profile.preferences?.emailUpdates ?? true
        }
      });
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await updateUserProfile({
        displayName: formData.displayName,
        type: formData.profileType,
        focus: formData.focus === 'advanced' ? 'technical' : formData.focus,
        preferences: formData.preferences
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro inesperado ao atualizar perfil' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: keyof ProfileFormData['preferences'], value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleSocialLink = (error: string) => {
    setMessage({ type: 'error', text: error });
  };

  const handleSocialSuccess = () => {
    setMessage({ type: 'success', text: 'Conta vinculada com sucesso!' });
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        router.push('/');
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao excluir conta' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro inesperado ao excluir conta' });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (authLoading) {
    return (
      <div className="profile-loading">
        <Loader2 className="spinner" size={32} />
        <span>Carregando perfil...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const connectedProviders = user?.providerData?.map(p => p.providerId) || [];

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <div className="profile-header">
          <h1 className="profile-title">Meu Perfil</h1>
          <p className="profile-subtitle">
            Gerencie suas informações e preferências da conta
          </p>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User size={20} />
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
          >
            <Settings size={20} />
            Conta
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
          >
            <Shield size={20} />
            Privacidade
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="profile-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-section">
                <h3 className="section-title">Informações Pessoais</h3>
                
                <div className="form-group">
                  <label htmlFor="displayName" className="form-label">
                    Nome de exibição
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="form-input"
                    placeholder="Como você gostaria de ser chamado"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    className="form-input"
                    disabled
                    title="E-mail não pode ser alterado"
                  />
                  <span className="form-help">
                    Para alterar o e-mail, entre em contato com o suporte
                  </span>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Perfil Profissional</h3>
                
                <div className="form-group">
                  <label htmlFor="profileType" className="form-label">
                    Tipo de perfil
                  </label>
                  <select
                    id="profileType"
                    value={formData.profileType}
                    onChange={(e) => handleInputChange('profileType', e.target.value)}
                    className="form-select"
                  >
                    <option value="professional">Profissional de Saúde</option>
                    <option value="student">Estudante</option>
                    <option value="patient">Paciente</option>
                    <option value="caregiver">Cuidador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="focus" className="form-label">
                    Nível de conhecimento
                  </label>
                  <select
                    id="focus"
                    value={formData.focus}
                    onChange={(e) => handleInputChange('focus', e.target.value)}
                    className="form-select"
                  >
                    <option value="general">Geral</option>
                    <option value="advanced">Avançado</option>
                    <option value="research">Pesquisa</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Preferências</h3>
                
                <div className="form-group">
                  <label htmlFor="language" className="form-label">
                    Linguagem preferida
                  </label>
                  <select
                    id="language"
                    value={formData.preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="form-select"
                  >
                    <option value="simple">Linguagem simples</option>
                    <option value="technical">Linguagem técnica</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="theme" className="form-label">
                    Tema da interface
                  </label>
                  <select
                    id="theme"
                    value={formData.preferences.theme}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                    className="form-select"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.preferences.notifications}
                      onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                      className="checkbox-input"
                    />
                    <span>Receber notificações na plataforma</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.preferences.emailUpdates}
                      onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
                      className="checkbox-input"
                    />
                    <span>Receber atualizações por e-mail</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="spinner" size={20} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="account-content">
              <div className="form-section">
                <h3 className="section-title">Contas Vinculadas</h3>
                <p className="section-description">
                  Vincule suas contas sociais para facilitar o acesso
                </p>

                <div className="connected-accounts">
                  {connectedProviders.length > 0 ? (
                    <div className="account-list">
                      {connectedProviders.map(provider => (
                        <div key={provider} className="account-item connected">
                          <div className="account-info">
                            <LinkIcon size={20} />
                            <span>{provider === 'google.com' ? 'Google' : 
                                   provider === 'facebook.com' ? 'Facebook' : 
                                   provider === 'apple.com' ? 'Apple' : provider}</span>
                          </div>
                          <span className="account-status">Conectado</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-accounts">Nenhuma conta social vinculada</p>
                  )}
                </div>

                <SocialAuthButtons 
                  mode="link"
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialLink}
                  showDivider={false}
                  compact={false}
                />
              </div>

              <div className="form-section danger-section">
                <h3 className="section-title danger">Zona de Perigo</h3>
                <p className="section-description">
                  Ações irreversíveis que afetam permanentemente sua conta
                </p>

                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className={`danger-button ${showDeleteConfirm ? 'confirm' : ''}`}
                >
                  <Trash2 size={20} />
                  {showDeleteConfirm ? 'Confirmar Exclusão' : 'Excluir Conta'}
                </button>

                {showDeleteConfirm && (
                  <div className="delete-warning">
                    <p>⚠️ Esta ação não pode ser desfeita. Todos os seus dados serão perdidos permanentemente.</p>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="cancel-button"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="privacy-content">
              <div className="form-section">
                <h3 className="section-title">Política de Privacidade</h3>
                <p className="section-description">
                  Como protegemos e utilizamos seus dados
                </p>

                <div className="privacy-info">
                  <div className="privacy-item">
                    <h4>🔒 Dados Pessoais</h4>
                    <p>Seus dados pessoais são criptografados e armazenados com segurança. Nunca compartilhamos informações pessoais com terceiros.</p>
                  </div>

                  <div className="privacy-item">
                    <h4>💬 Conversas</h4>
                    <p>Suas conversas com os assistentes são privadas e usadas apenas para melhorar sua experiência educacional.</p>
                  </div>

                  <div className="privacy-item">
                    <h4>📊 Dados de Uso</h4>
                    <p>Coletamos dados anônimos de uso para melhorar a plataforma e desenvolver novos recursos educacionais.</p>
                  </div>

                  <div className="privacy-item">
                    <h4>🎯 Personalização</h4>
                    <p>Utilizamos suas preferências para personalizar o conteúdo e tornar sua experiência mais relevante.</p>
                  </div>
                </div>

                <div className="privacy-links">
                  <a href="/privacidade" target="_blank" className="privacy-link">
                    Política de Privacidade Completa
                  </a>
                  <a href="/termos" target="_blank" className="privacy-link">
                    Termos de Uso
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          min-height: 100vh;
          background: var(--color-gray-50);
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .profile-wrapper {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .profile-header {
          padding: var(--spacing-2xl);
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
          color: white;
          text-align: center;
        }

        .profile-title {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-sm);
        }

        .profile-subtitle {
          font-size: var(--font-size-lg);
          opacity: 0.9;
        }

        .profile-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: var(--color-gray-600);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .profile-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-gray-200);
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          background: none;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          color: var(--color-gray-600);
          font-weight: var(--font-weight-medium);
        }

        .tab-button:hover {
          background: var(--color-gray-50);
          color: var(--color-primary-600);
        }

        .tab-button.active {
          background: var(--color-primary-50);
          color: var(--color-primary-600);
          border-bottom: 2px solid var(--color-primary-500);
        }

        .message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin: var(--spacing-lg);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          font-weight: var(--font-weight-medium);
        }

        .message.success {
          background: var(--color-green-50);
          color: var(--color-green-700);
          border: 1px solid var(--color-green-200);
        }

        .message.error {
          background: var(--color-red-50);
          color: var(--color-red-700);
          border: 1px solid var(--color-red-200);
        }

        .profile-content {
          padding: var(--spacing-2xl);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2xl);
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .section-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-sm);
        }

        .section-title.danger {
          color: var(--color-red-600);
        }

        .section-description {
          color: var(--color-gray-600);
          margin-bottom: var(--spacing-md);
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

        .form-input, .form-select {
          padding: var(--spacing-md);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          transition: all var(--transition-fast);
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--color-primary-500);
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .form-input:disabled {
          background: var(--color-gray-50);
          cursor: not-allowed;
        }

        .form-help {
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          color: var(--color-gray-700);
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: var(--color-primary-500);
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-xl);
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all var(--transition-base);
          align-self: flex-start;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .account-content, .privacy-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2xl);
        }

        .connected-accounts {
          margin-bottom: var(--spacing-lg);
        }

        .account-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .account-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-md);
        }

        .account-item.connected {
          background: var(--color-green-50);
          border-color: var(--color-green-200);
        }

        .account-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-gray-700);
        }

        .account-status {
          font-size: var(--font-size-sm);
          color: var(--color-green-600);
          font-weight: var(--font-weight-medium);
        }

        .no-accounts {
          color: var(--color-gray-500);
          font-style: italic;
        }

        .danger-section {
          border-top: 1px solid var(--color-gray-200);
          padding-top: var(--spacing-xl);
        }

        .danger-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--color-red-50);
          color: var(--color-red-600);
          border: 1px solid var(--color-red-200);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-weight: var(--font-weight-medium);
        }

        .danger-button:hover {
          background: var(--color-red-100);
          border-color: var(--color-red-300);
        }

        .danger-button.confirm {
          background: var(--color-red-600);
          color: white;
          border-color: var(--color-red-600);
        }

        .delete-warning {
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-red-50);
          border: 1px solid var(--color-red-200);
          border-radius: var(--radius-md);
        }

        .cancel-button {
          margin-top: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-gray-100);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .privacy-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .privacy-item {
          padding: var(--spacing-lg);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
        }

        .privacy-item h4 {
          margin-bottom: var(--spacing-sm);
          color: var(--color-gray-900);
        }

        .privacy-links {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        .privacy-link {
          color: var(--color-primary-600);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
        }

        .privacy-link:hover {
          text-decoration: underline;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .profile-container {
            padding: var(--spacing-md);
          }

          .profile-header {
            padding: var(--spacing-xl);
          }

          .profile-content {
            padding: var(--spacing-lg);
          }

          .tab-button {
            padding: var(--spacing-md);
            font-size: var(--font-size-sm);
          }

          .privacy-links {
            flex-direction: column;
          }
        }

        /* Dark mode */
        [data-theme="dark"] .profile-container {
          background: var(--color-gray-100);
        }

        [data-theme="dark"] .profile-wrapper {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .form-input,
        [data-theme="dark"] .form-select {
          background: var(--color-gray-100);
          border-color: var(--color-gray-400);
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .account-item {
          background: var(--color-gray-100);
          border-color: var(--color-gray-400);
        }

        [data-theme="dark"] .privacy-item {
          background: var(--color-gray-100);
        }
      `}</style>
    </div>
  );
}