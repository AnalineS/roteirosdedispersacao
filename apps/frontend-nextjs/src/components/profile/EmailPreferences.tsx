'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, Bell, Trophy, TrendingUp, Users, 
  Clock, Check, X, AlertCircle,
  Send, TestTube, History
} from 'lucide-react';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import { useSocialProfile } from '@/hooks/useSocialProfile';
import { SocialService } from '@/services/socialService';

interface EmailPreferencesData {
  notifications: boolean;
  marketing: boolean;
  weeklyDigest: boolean;
  mentions: boolean;
}

interface NotificationHistory {
  type: string;
  subject: string;
  email: string;
  sent_at: string;
  success: boolean;
}

interface EmailPreferencesProps {
  userId: string;
  preferences?: EmailPreferencesData;
  onPreferencesChange?: (preferences: EmailPreferencesData) => Promise<boolean>;
  className?: string;
}

export default function EmailPreferences({
  userId,
  preferences: initialPreferences,
  onPreferencesChange,
  className = ''
}: EmailPreferencesProps) {
  const { profile, updateEmailPreferences } = useSocialProfile();
  const [preferences, setPreferences] = useState<EmailPreferencesData>({
    notifications: true,
    marketing: false,
    weeklyDigest: true,
    mentions: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [testingEmail, setTestingEmail] = useState<string | null>(null);

  const { success, error: hapticError, info } = useHapticFeedback();

  // Sincronizar preferências
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    } else if (profile?.emailPreferences) {
      setPreferences(profile.emailPreferences);
    }
    setIsLoading(false);
  }, [initialPreferences, profile]);


  // Salvar preferências
  const savePreferences = useCallback(async (newPreferences: EmailPreferencesData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      let successResult = false;
      if (onPreferencesChange) {
        successResult = await onPreferencesChange(newPreferences);
      } else {
        successResult = await updateEmailPreferences(newPreferences);
      }

      if (successResult) {
        setPreferences(newPreferences);
        setSuccessMessage('Preferências salvas com sucesso!');
        success();
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Erro ao salvar preferências');
        hapticError();
      }
    } catch (err: any) {
      setError('Erro de conexão');
      hapticError();
    } finally {
      setIsSaving(false);
    }
  }, [onPreferencesChange, updateEmailPreferences, success, hapticError]);

  // Carregar histórico
  const loadHistory = useCallback(async () => {
    try {
      const result = await SocialService.getUserNotifications(userId, 10);
      
      if (result.success && result.notifications) {
        const mappedHistory = result.notifications.map(n => ({
          type: n.category,
          subject: n.title,
          email: userId,
          sent_at: n.createdAt,
          success: n.status === 'sent'
        }));
        setHistory(mappedHistory);
      } else {
        console.error('Erro ao carregar histórico:', result.error);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  }, [userId]);

  // Enviar email de teste
  const sendTestEmail = useCallback(async (type: string) => {
    try {
      setTestingEmail(type);
      info();

      // Criar uma notificação de teste
      const result = await SocialService.createNotification({
        userId,
        type: 'email',
        category: type as any,
        title: `Teste - ${type}`,
        message: `Este é um email de teste do tipo ${type}`,
        status: 'pending'
      });

      if (result.success) {
        success();
        setSuccessMessage(`Email de teste (${type}) criado com sucesso!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        hapticError();
        setError(`Erro ao enviar email de teste: ${result.error}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) {
      hapticError();
      setError('Erro de conexão');
      setTimeout(() => setError(null), 3000);
    } finally {
      setTestingEmail(null);
    }
  }, [userId, info, success, hapticError]);

  // Manipuladores de mudança
  const handleToggleChange = useCallback((field: keyof EmailPreferencesData) => {
    const newPreferences = {
      ...preferences,
      [field]: !preferences[field]
    };
    
    // Se desabilitar notificações gerais, desabilitar todas as específicas
    if (field === 'notifications' && !newPreferences.notifications) {
      newPreferences.marketing = false;
      newPreferences.weeklyDigest = false;
      newPreferences.mentions = false;
    }
    
    info();
    savePreferences(newPreferences);
  }, [preferences, savePreferences, info]);


  // Mostrar/ocultar histórico
  const toggleHistory = useCallback(() => {
    if (!showHistory) {
      loadHistory();
    }
    setShowHistory(prev => !prev);
    info();
  }, [showHistory, loadHistory, info]);

  if (isLoading) {
    return (
      <div className={`email-preferences loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Carregando preferências de email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`email-preferences ${className}`}>
      {/* Header */}
      <div className="preferences-header">
        <div className="header-content">
          <Mail size={24} />
          <div className="header-text">
            <h2>Preferências de Email</h2>
            <p>Configure como e quando você quer receber notificações por email</p>
          </div>
        </div>
      </div>

      {/* Mensagens de status */}
      {error && (
        <div className="status-message error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-button">
            <X size={14} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="status-message success">
          <Check size={16} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="close-button">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Configuração principal */}
      <div className="preference-section">
        <div className="section-header">
          <Bell size={20} />
          <h3>Notificações Gerais</h3>
        </div>
        
        <div className="preference-item main-toggle">
          <div className="item-info">
            <label className="item-label">Receber emails de notificação</label>
            <p className="item-description">
              Ativar/desativar todas as notificações por email
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={() => handleToggleChange('notifications')}
              disabled={isSaving}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Tipos de notificação */}
      <div className="preference-section">
        <div className="section-header">
          <div className="section-icon">📧</div>
          <h3>Tipos de Notificação</h3>
        </div>
        
        <div className="preference-group">
          {/* Menções */}
          <div className="preference-item">
            <div className="item-info">
              <div className="item-header">
                <Trophy size={18} />
                <label className="item-label">Menções e Interações</label>
              </div>
              <p className="item-description">
                Notificações quando alguém interagir com seu conteúdo
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.mentions && preferences.notifications}
                onChange={() => handleToggleChange('mentions')}
                disabled={isSaving || !preferences.notifications}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Resumo Semanal */}
          <div className="preference-item">
            <div className="item-info">
              <div className="item-header">
                <TrendingUp size={18} />
                <label className="item-label">Resumo Semanal</label>
              </div>
              <p className="item-description">
                Resumo semanal das suas atividades e progressos
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.weeklyDigest && preferences.notifications}
                onChange={() => handleToggleChange('weeklyDigest')}
                disabled={isSaving || !preferences.notifications}
              />
              <span className="slider"></span>
            </label>
          </div>


          {/* Marketing */}
          <div className="preference-item">
            <div className="item-info">
              <div className="item-header">
                <Mail size={18} />
                <label className="item-label">Novidades e Dicas</label>
              </div>
              <p className="item-description">
                Emails com novidades do sistema e dicas educativas
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.marketing && preferences.notifications}
                onChange={() => handleToggleChange('marketing')}
                disabled={isSaving || !preferences.notifications}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>


      {/* Ações de teste */}
      <div className="preference-section">
        <div className="section-header">
          <TestTube size={20} />
          <h3>Testar Notificações</h3>
        </div>
        
        <div className="test-actions">
          <button
            onClick={() => sendTestEmail('achievement')}
            disabled={testingEmail === 'achievement' || !preferences.notifications}
            className="test-button"
          >
            {testingEmail === 'achievement' ? (
              <>
                <div className="loading-spinner small" />
                Enviando...
              </>
            ) : (
              <>
                <Trophy size={16} />
                Testar Conquista
              </>
            )}
          </button>

          <button
            onClick={() => sendTestEmail('progress')}
            disabled={testingEmail === 'progress' || !preferences.notifications}
            className="test-button"
          >
            {testingEmail === 'progress' ? (
              <>
                <div className="loading-spinner small" />
                Enviando...
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                Testar Progresso
              </>
            )}
          </button>

          <button
            onClick={() => sendTestEmail('welcome')}
            disabled={testingEmail === 'welcome' || !preferences.notifications}
            className="test-button"
          >
            {testingEmail === 'welcome' ? (
              <>
                <div className="loading-spinner small" />
                Enviando...
              </>
            ) : (
              <>
                <Send size={16} />
                Testar Boas-vindas
              </>
            )}
          </button>
        </div>
        
        <p className="test-note">
          Os emails de teste serão enviados para seu endereço cadastrado
        </p>
      </div>

      {/* Histórico */}
      <div className="preference-section">
        <button
          onClick={toggleHistory}
          className="section-toggle"
        >
          <History size={20} />
          <span>Histórico de Emails</span>
          <div className={`toggle-icon ${showHistory ? 'open' : ''}`}>▼</div>
        </button>
        
        {showHistory && (
          <div className="history-content">
            {history.length === 0 ? (
              <p className="no-history">Nenhum email enviado ainda</p>
            ) : (
              <div className="history-list">
                {history.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <span className="history-subject">{item.subject}</span>
                      <span className="history-date">
                        {new Date(item.sent_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className={`history-status ${item.success ? 'success' : 'failed'}`}>
                      {item.success ? <Check size={14} /> : <X size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isSaving && (
        <div className="saving-overlay">
          <div className="saving-content">
            <div className="loading-spinner" />
            <p>Salvando preferências...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .email-preferences {
          width: 100%;
          max-width: 800px;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .preferences-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: var(--spacing-xl);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .header-text h2 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
        }

        .header-text p {
          margin: 0;
          opacity: 0.9;
          font-size: var(--font-size-sm);
        }

        .status-message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          margin: var(--spacing-lg);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .status-message.success {
          background: var(--color-success-50);
          color: var(--color-success-700);
          border: 1px solid var(--color-success-200);
        }

        .status-message.error {
          background: var(--color-error-50);
          color: var(--color-error-700);
          border: 1px solid var(--color-error-200);
        }

        .close-button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          color: inherit;
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }

        .close-button:hover {
          opacity: 1;
        }

        .preference-section {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-gray-200);
        }

        .preference-section:last-child {
          border-bottom: none;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .section-header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .section-icon {
          font-size: var(--font-size-lg);
        }

        .preference-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--spacing-md);
          padding: var(--spacing-md) 0;
          border-bottom: 1px solid var(--color-gray-100);
        }

        .preference-item:last-child {
          border-bottom: none;
        }

        .preference-item.main-toggle {
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          border-bottom: none;
        }

        .item-info {
          flex: 1;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
        }

        .item-label {
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-800);
          cursor: pointer;
        }

        .item-description {
          margin: 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
          cursor: pointer;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-gray-300);
          transition: var(--transition-fast);
          border-radius: 28px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: var(--transition-fast);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        input:checked + .slider {
          background-color: var(--color-primary-600);
        }

        input:checked + .slider:before {
          transform: translateX(22px);
        }

        input:disabled + .slider {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .frequency-options {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .frequency-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border: 2px solid var(--color-gray-200);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .frequency-option:hover {
          border-color: var(--color-primary-300);
          background: var(--color-primary-50);
        }

        .frequency-option input {
          margin: 0;
        }

        .frequency-option:has(input:checked) {
          border-color: var(--color-primary-600);
          background: var(--color-primary-50);
        }

        .frequency-option:has(input:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .option-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .option-label {
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-800);
        }

        .option-description {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .test-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .test-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          color: var(--color-gray-700);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .test-button:hover:not(:disabled) {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
          color: var(--color-primary-700);
        }

        .test-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .test-note {
          margin: 0;
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
          font-style: italic;
        }

        .section-toggle {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-md) 0;
          border: none;
          background: none;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
          cursor: pointer;
          text-align: left;
        }

        .toggle-icon {
          margin-left: auto;
          transition: transform var(--transition-fast);
        }

        .toggle-icon.open {
          transform: rotate(180deg);
        }

        .history-content {
          margin-top: var(--spacing-md);
        }

        .no-history {
          text-align: center;
          color: var(--color-gray-500);
          font-style: italic;
          margin: var(--spacing-lg) 0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .history-subject {
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-800);
        }

        .history-date {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .history-status {
          display: flex;
          align-items: center;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
        }

        .history-status.success {
          color: var(--color-success-600);
          background: var(--color-success-50);
        }

        .history-status.failed {
          color: var(--color-error-600);
          background: var(--color-error-50);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(99, 102, 241, 0.2);
          border-top-color: var(--color-primary-600);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
        }

        .loading-content,
        .saving-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          color: var(--color-gray-600);
        }

        .saving-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .email-preferences.loading {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .test-actions {
            flex-direction: column;
          }

          .test-button {
            justify-content: center;
          }

          .frequency-option {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }

          .preference-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .toggle-switch {
            align-self: flex-start;
          }
        }

        /* Dark mode */
        [data-theme="dark"] .email-preferences {
          background: var(--color-gray-800);
          color: var(--color-gray-100);
        }

        [data-theme="dark"] .preference-section {
          border-color: var(--color-gray-700);
        }

        [data-theme="dark"] .item-label {
          color: var(--color-gray-100);
        }

        [data-theme="dark"] .item-description {
          color: var(--color-gray-300);
        }

        [data-theme="dark"] .frequency-option {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .test-button {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .toggle-switch .slider {
            border: 2px solid var(--color-gray-600);
          }

          .frequency-option {
            border-width: 3px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }

          .toggle-icon,
          .slider,
          .slider:before {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}