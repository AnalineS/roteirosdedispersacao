'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Link, Unlink, Check, X, AlertTriangle, 
  Shield, Clock, UserCheck, RefreshCw,
  Eye, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';
import Image from 'next/image';
import { useHapticFeedback } from '@/utils/hapticFeedback';

interface ConnectedAccount {
  provider: 'google.com';
  providerId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  connectedAt: string;
  lastUsed: string;
  isVerified: boolean;
  isPrimary: boolean;
  permissions: string[];
}

interface ConnectedAccountsProps {
  userId?: string;
  onAccountUpdate?: (accounts: ConnectedAccount[]) => void;
  className?: string;
}

export default function ConnectedAccounts({
  userId,
  onAccountUpdate,
  className = ''
}: ConnectedAccountsProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingAccount, setDisconnectingAccount] = useState<string | null>(null);

  const { success, error: hapticError, info } = useHapticFeedback();

  const loadConnectedAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/connected-accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts || []);
        onAccountUpdate?.(data.accounts || []);
      } else {
        setError(data.error || 'Erro ao carregar contas conectadas');
        hapticError();
      }
    } catch (err: Error | unknown) {
      setError('Erro de conexão');
      hapticError();
    } finally {
      setIsLoading(false);
    }
  }, [onAccountUpdate, hapticError]);

  // Carregar contas conectadas na inicialização
  useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);

  // Conectar nova conta Google
  const connectGoogleAccount = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      info();

      // Redirecionar para auth do Google
      const response = await fetch('/api/auth/connect-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        if (data.authUrl) {
          // Redirecionar para OAuth
          window.location.href = data.authUrl;
        } else {
          // Conta já conectada
          success();
          await loadConnectedAccounts();
        }
      } else {
        setError(data.error || 'Erro ao conectar conta Google');
        hapticError();
      }
    } catch (err: Error | unknown) {
      setError('Erro ao conectar conta');
      hapticError();
    } finally {
      setIsConnecting(false);
    }
  }, [info, success, hapticError, loadConnectedAccounts]);

  // Desconectar conta
  const disconnectAccount = useCallback(async (providerId: string) => {
    const account = accounts.find(acc => acc.providerId === providerId);
    if (!account) return;

    // Confirmar se é a conta primária
    if (account.isPrimary) {
      const confirmed = window.confirm(
        'Esta é sua conta principal. Desconectá-la pode afetar seu acesso ao sistema. Tem certeza que deseja continuar?'
      );
      if (!confirmed) return;
    }

    try {
      setDisconnectingAccount(providerId);
      setError(null);

      const response = await fetch('/api/auth/disconnect-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId })
      });

      const data = await response.json();

      if (data.success) {
        success();
        await loadConnectedAccounts();
      } else {
        setError(data.error || 'Erro ao desconectar conta');
        hapticError();
      }
    } catch (err: Error | unknown) {
      setError('Erro ao desconectar conta');
      hapticError();
    } finally {
      setDisconnectingAccount(null);
    }
  }, [accounts, success, hapticError, loadConnectedAccounts]);

  // Toggle detalhes da conta
  const toggleDetails = useCallback((providerId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
    info();
  }, [info]);

  // Atualizar permissões da conta
  const refreshAccount = useCallback(async (providerId: string) => {
    try {
      info();

      const response = await fetch('/api/auth/refresh-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId })
      });

      const data = await response.json();

      if (data.success) {
        success();
        await loadConnectedAccounts();
      } else {
        setError(data.error || 'Erro ao atualizar conta');
        hapticError();
      }
    } catch (err: Error | unknown) {
      setError('Erro ao atualizar conta');
      hapticError();
    }
  }, [info, success, hapticError, loadConnectedAccounts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google.com':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      default:
        return <UserCheck size={24} />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google.com':
        return 'Google';
      default:
        return provider;
    }
  };

  if (isLoading) {
    return (
      <div className={`connected-accounts loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Carregando contas conectadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`connected-accounts ${className}`}>
      {/* Header */}
      <div className="accounts-header">
        <div className="header-content">
          <Link size={24} />
          <div className="header-text">
            <h2>Contas Conectadas</h2>
            <p>Gerencie suas contas de login social conectadas</p>
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Lista de contas conectadas */}
      <div className="accounts-list">
        {accounts.length === 0 ? (
          <div className="no-accounts">
            <UserCheck size={48} />
            <h3>Nenhuma conta conectada</h3>
            <p>Conecte sua conta Google para facilitar o login</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.providerId} className="account-card">
              {/* Header da conta */}
              <div className="account-header">
                <div className="account-info">
                  <div className="provider-icon">
                    {getProviderIcon(account.provider)}
                  </div>
                  
                  <div className="account-details">
                    <div className="account-name">
                      {account.displayName}
                      {account.isPrimary && (
                        <span className="primary-badge">Principal</span>
                      )}
                    </div>
                    <div className="account-email">{account.email}</div>
                    <div className="account-provider">
                      {getProviderName(account.provider)}
                      {account.isVerified && (
                        <span className="verified-badge">
                          <Check size={12} />
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="account-actions">
                  <button
                    onClick={() => toggleDetails(account.providerId)}
                    className="details-button"
                    aria-label="Ver detalhes da conta"
                  >
                    {showDetails[account.providerId] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  <button
                    onClick={() => refreshAccount(account.providerId)}
                    className="refresh-button"
                    aria-label="Atualizar informações da conta"
                  >
                    <RefreshCw size={16} />
                  </button>

                  <button
                    onClick={() => disconnectAccount(account.providerId)}
                    disabled={disconnectingAccount === account.providerId}
                    className="disconnect-button"
                    aria-label="Desconectar conta"
                  >
                    {disconnectingAccount === account.providerId ? (
                      <div className="loading-spinner small" />
                    ) : (
                      <Unlink size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Detalhes expandidos */}
              {showDetails[account.providerId] && (
                <div className="account-details-expanded">
                  <div className="details-section">
                    <h4>
                      <Clock size={16} />
                      Informações de Acesso
                    </h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Conectado em:</span>
                        <span className="value">{formatDate(account.connectedAt)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Último acesso:</span>
                        <span className="value">{formatDate(account.lastUsed)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Status:</span>
                        <span className={`value status ${account.isVerified ? 'verified' : 'unverified'}`}>
                          {account.isVerified ? (
                            <>
                              <Check size={12} />
                              Verificado
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} />
                              Não verificado
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {account.permissions && account.permissions.length > 0 && (
                    <div className="details-section">
                      <h4>
                        <Shield size={16} />
                        Permissões Concedidas
                      </h4>
                      <div className="permissions-list">
                        {account.permissions.map((permission, index) => (
                          <span key={index} className="permission-tag">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {account.photoURL && (
                    <div className="details-section">
                      <h4>Foto do Perfil</h4>
                      <div className="profile-photo">
                        <Image 
                          src={account.photoURL} 
                          alt={`Foto de perfil de ${account.displayName}`}
                          className="account-photo"
                          width={80}
                          height={80}
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Conectar nova conta */}
      <div className="connect-section">
        <h3>Conectar Nova Conta</h3>
        <p>Adicione mais opções de login para sua conta</p>
        
        <button
          onClick={connectGoogleAccount}
          disabled={isConnecting || accounts.some(acc => acc.provider === 'google.com')}
          className="connect-button google"
        >
          {isConnecting ? (
            <>
              <div className="loading-spinner small" />
              Conectando...
            </>
          ) : accounts.some(acc => acc.provider === 'google.com') ? (
            <>
              <Check size={20} />
              Google Conectado
            </>
          ) : (
            <>
              {getProviderIcon('google.com')}
              Conectar Google
            </>
          )}
        </button>
      </div>

      {/* Informações de segurança */}
      <div className="security-info">
        <div className="info-header">
          <Shield size={20} />
          <h3>Informações de Segurança</h3>
        </div>
        <div className="security-tips">
          <div className="tip-item">
            <Check size={16} />
            <span>Suas credenciais são criptografadas e armazenadas com segurança</span>
          </div>
          <div className="tip-item">
            <Check size={16} />
            <span>Você pode desconectar contas a qualquer momento</span>
          </div>
          <div className="tip-item">
            <Check size={16} />
            <span>Recomendamos manter pelo menos uma conta conectada</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .connected-accounts {
          width: 100%;
          max-width: 800px;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .accounts-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
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

        .error-message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          margin: var(--spacing-lg);
          background: var(--color-error-50);
          border: 1px solid var(--color-error-200);
          border-radius: var(--radius-md);
          color: var(--color-error-700);
          font-size: var(--font-size-sm);
        }

        .close-error {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }

        .close-error:hover {
          opacity: 1;
        }

        .accounts-list {
          padding: var(--spacing-lg);
        }

        .no-accounts {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--color-gray-500);
        }

        .no-accounts h3 {
          margin: var(--spacing-lg) 0 var(--spacing-md) 0;
          font-size: var(--font-size-lg);
          color: var(--color-gray-700);
        }

        .no-accounts p {
          margin: 0;
          font-size: var(--font-size-sm);
        }

        .account-card {
          border: 1px solid var(--color-gray-200);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-lg);
          overflow: hidden;
          transition: shadow var(--transition-fast);
        }

        .account-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          background: var(--color-gray-50);
        }

        .account-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .provider-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          background: white;
          border: 1px solid var(--color-gray-200);
        }

        .account-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .account-name {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .primary-badge {
          background: var(--color-primary-100);
          color: var(--color-primary-700);
          padding: 2px var(--spacing-xs);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .account-email {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .account-provider {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .verified-badge {
          display: flex;
          align-items: center;
          gap: 2px;
          background: var(--color-success-100);
          color: var(--color-success-700);
          padding: 2px var(--spacing-xs);
          border-radius: var(--radius-sm);
          font-weight: var(--font-weight-medium);
        }

        .account-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .details-button,
        .refresh-button,
        .disconnect-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          color: var(--color-gray-600);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .details-button:hover,
        .refresh-button:hover {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
          color: var(--color-primary-700);
        }

        .disconnect-button:hover:not(:disabled) {
          border-color: var(--color-error-500);
          background: var(--color-error-50);
          color: var(--color-error-700);
        }

        .disconnect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .account-details-expanded {
          padding: var(--spacing-lg);
          background: white;
          border-top: 1px solid var(--color-gray-200);
        }

        .details-section {
          margin-bottom: var(--spacing-lg);
        }

        .details-section:last-child {
          margin-bottom: 0;
        }

        .details-section h4 {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .detail-item .label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-gray-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-item .value {
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
        }

        .detail-item .value.status {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .detail-item .value.status.verified {
          color: var(--color-success-700);
        }

        .detail-item .value.status.unverified {
          color: var(--color-warning-700);
        }

        .permissions-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .permission-tag {
          background: var(--color-gray-100);
          color: var(--color-gray-700);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .profile-photo {
          display: flex;
          justify-content: flex-start;
        }

        .account-photo {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 2px solid var(--color-gray-200);
        }

        .connect-section {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--color-gray-200);
          background: var(--color-gray-50);
        }

        .connect-section h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .connect-section p {
          margin: 0 0 var(--spacing-lg) 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .connect-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg);
          border: 2px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          color: var(--color-gray-700);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .connect-button:hover:not(:disabled) {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
          color: var(--color-primary-700);
        }

        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .connect-button.google:not(:disabled) {
          border-color: #4285f4;
          color: #4285f4;
        }

        .connect-button.google:hover:not(:disabled) {
          background: rgba(66, 133, 244, 0.1);
        }

        .security-info {
          padding: var(--spacing-lg);
          background: var(--color-success-50);
          border-top: 1px solid var(--color-success-200);
        }

        .info-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }

        .info-header h3 {
          margin: 0;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-success-800);
        }

        .security-tips {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-success-700);
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          min-height: 300px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-primary-200);
          border-top-color: var(--color-primary-600);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-lg);
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .account-header {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: flex-start;
          }

          .account-actions {
            align-self: stretch;
            justify-content: flex-end;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .connect-button {
            width: 100%;
            justify-content: center;
          }
        }

        /* Dark mode */
        [data-theme="dark"] .connected-accounts {
          background: var(--color-gray-800);
          color: var(--color-gray-100);
        }

        [data-theme="dark"] .account-header {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .account-card {
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .account-details-expanded {
          background: var(--color-gray-800);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .connect-section {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .provider-icon,
        [data-theme="dark"] .connect-button {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }

        [data-theme="dark"] .permission-tag {
          background: var(--color-gray-700);
          color: var(--color-gray-200);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .account-card,
          .connect-button {
            border-width: 2px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }

          .account-card,
          .connect-button,
          .details-button,
          .refresh-button,
          .disconnect-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}