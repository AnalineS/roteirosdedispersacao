/**
 * Painel Admin para Gerenciamento de Feature Flags
 * Interface protegida para controlar flags via Firebase Remote Config
 */

'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
import { 
  FeatureFlagsConfig, 
  FEATURE_FLAGS, 
  FLAG_ENVIRONMENTS,
  isDevelopmentEnvironment 
} from '@/utils/featureFlags';

interface FeatureFlagCardProps {
  flagKey: keyof FeatureFlagsConfig;
  isEnabled: boolean;
  onToggle: (key: keyof FeatureFlagsConfig, value: boolean | 'A' | 'B') => void;
  loading?: boolean;
}

function FeatureFlagCard({ flagKey, isEnabled, onToggle, loading }: FeatureFlagCardProps) {
  const flag = FEATURE_FLAGS[flagKey];
  
  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global': return '#1976D2'; // Azul
      case 'session': return '#F57C00'; // Laranja
      case 'user': return '#388E3C'; // Verde
      default: return '#757575'; // Cinza
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global': return '🌐';
      case 'session': return '👤';
      case 'user': return '⚙️';
      default: return '❓';
    }
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div>
          <h3 style={{
            margin: '0 0 4px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {flag.key}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '0.9rem' }}>
              {getScopeIcon(flag.scope)}
            </span>
            <span style={{
              fontSize: '0.8rem',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: getScopeColor(flag.scope),
              color: 'white',
              fontWeight: '500'
            }}>
              {flag.scope.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #1976D2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          
          {flagKey === 'ab_test_variant' ? (
            <select
              value={String(isEnabled)}
              onChange={(e) => onToggle(flagKey, e.target.value as 'A' | 'B')}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="A">Variante A</option>
              <option value="B">Variante B</option>
            </select>
          ) : (
            <button
              onClick={() => onToggle(flagKey, !isEnabled)}
              disabled={loading}
              style={{
                width: '60px',
                height: '30px',
                borderRadius: '15px',
                border: 'none',
                background: isEnabled ? '#4CAF50' : '#ccc',
                position: 'relative',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
                opacity: loading ? 0.6 : 1
              }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: isEnabled ? '32px' : '2px',
                transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{
        margin: '0 0 12px',
        fontSize: '0.9rem',
        color: '#666',
        lineHeight: '1.4'
      }}>
        {flag.description}
      </p>

      {/* Status Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderTop: '1px solid #f0f0f0',
        fontSize: '0.8rem',
        color: '#888'
      }}>
        <span>
          Status: <strong style={{ color: isEnabled ? '#4CAF50' : '#f44336' }}>
            {flagKey === 'ab_test_variant' ? isEnabled : (isEnabled ? 'ATIVO' : 'INATIVO')}
          </strong>
        </span>
        <span>
          Padrão: {flag.defaultValue?.toString()}
        </span>
      </div>
    </div>
  );
}

export default function AdminFeaturesPage() {
  const {
    flags,
    loading,
    error,
    lastFetch,
    updateFlag,
    refresh,
    isDebugMode
  } = useRemoteConfig();

  const [updating, setUpdating] = useState<Set<keyof FeatureFlagsConfig>>(new Set());
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Função para toggle de flag
  const handleToggleFlag = async (key: keyof FeatureFlagsConfig, value: boolean | 'A' | 'B') => {
    setUpdating(prev => new Set([...prev, key]));
    
    try {
      updateFlag(key, value);
      
      // Simular delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotification({
        type: 'success',
        message: `Flag "${key}" atualizada com sucesso!`
      });
      
      // Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'feature_flag_admin_toggle', {
          event_category: 'admin_actions',
          event_label: key,
          custom_parameters: {
            flag_value: value,
            admin_interface: true
          }
        });
      }
      
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Erro ao atualizar flag "${key}": ${err}`
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      
      // Limpar notificação após 3 segundos
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Função para aplicar preset de ambiente
  const applyEnvironmentPreset = (environment: keyof typeof FLAG_ENVIRONMENTS) => {
    const preset = FLAG_ENVIRONMENTS[environment];
    Object.entries(preset).forEach(([key, value]) => {
      updateFlag(key as keyof FeatureFlagsConfig, value);
    });
    
    setNotification({
      type: 'success',
      message: `Preset "${environment}" aplicado com sucesso!`
    });
  };

  // Verificar autenticação (simulada)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Em desenvolvimento, autenticar automaticamente
    if (isDevelopmentEnvironment()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    // Senha simples para desenvolvimento
    if (password === 'admin123' || isDevelopmentEnvironment()) {
      setIsAuthenticated(true);
      setNotification({
        type: 'success',
        message: 'Acesso liberado ao painel admin!'
      });
    } else {
      setNotification({
        type: 'error',
        message: 'Senha incorreta!'
      });
    }
  };

  // Página de login
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin - Feature Flags | Roteiros de Dispensação</title>
        </Head>
        
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h1 style={{
              textAlign: 'center',
              marginBottom: '30px',
              color: '#333'
            }}>
              🔐 Admin Access
            </h1>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#555'
              }}>
                Senha de acesso:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Digite a senha..."
                autoFocus
              />
            </div>
            
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1976D2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1565C0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1976D2'; }}
            >
              Entrar
            </button>
            
            {isDevelopmentEnvironment() && (
              <p style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: '#888',
                marginTop: '20px'
              }}>
                💡 Modo desenvolvimento: qualquer senha funciona
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Página principal do admin
  return (
    <>
      <Head>
        <title>Admin - Feature Flags | Roteiros de Dispensação</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.8rem',
                color: '#333'
              }}>
                🚩 Feature Flags Admin
              </h1>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={refresh}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  🔄 Refresh
                </button>
                
                <button
                  onClick={() => setIsAuthenticated(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🚪 Sair
                </button>
              </div>
            </div>

            {/* Status Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <div>
                <strong>Status:</strong> {loading ? '🔄 Carregando...' : '✅ Conectado'}
              </div>
              <div>
                <strong>Último fetch:</strong> {lastFetch ? new Date(lastFetch).toLocaleString() : 'Nunca'}
              </div>
              <div>
                <strong>Ambiente:</strong> {isDevelopmentEnvironment() ? '🛠️ Desenvolvimento' : '🚀 Produção'}
              </div>
              <div>
                <strong>Debug:</strong> {isDebugMode() ? '🐛 Ativo' : '🔒 Inativo'}
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '6px',
                color: '#c62828'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Environment Presets */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.3rem' }}>
              🎯 Presets de Ambiente
            </h2>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => applyEnvironmentPreset('development')}
                style={{
                  padding: '10px 20px',
                  background: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🛠️ Desenvolvimento
              </button>
              
              <button
                onClick={() => applyEnvironmentPreset('staging')}
                style={{
                  padding: '10px 20px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🧪 Staging
              </button>
              
              <button
                onClick={() => applyEnvironmentPreset('production')}
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🚀 Produção
              </button>
            </div>
          </div>

          {/* Feature Flags Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {Object.entries(flags).map(([key, value]) => (
              <FeatureFlagCard
                key={key}
                flagKey={key as keyof FeatureFlagsConfig}
                isEnabled={value}
                onToggle={handleToggleFlag}
                loading={updating.has(key as keyof FeatureFlagsConfig)}
              />
            ))}
          </div>

          {/* Notification */}
          {notification && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '16px 20px',
              background: notification.type === 'success' ? '#4CAF50' : '#f44336',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              animation: 'slideIn 0.3s ease'
            }}>
              {notification.type === 'success' ? '✅' : '❌'} {notification.message}
            </div>
          )}
        </div>

        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}