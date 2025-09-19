/**
 * Email Preferences Component - Gerenciamento de Preferências de Email
 * Componente funcional baseado na nova arquitetura API
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { socialService } from '@/services/socialService';

interface EmailPreference {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  frequency: 'instant' | 'daily' | 'weekly' | 'monthly';
  category: 'system' | 'social' | 'educational' | 'promotional';
}

type EmailPreferencesData = Record<string, {
  enabled: boolean;
  frequency: EmailPreference['frequency'];
}>;

interface EmailPreferencesProps {
  className?: string;
  userId?: string;
  preferences?: EmailPreferencesData;
  onPreferencesChange?: (preferences: EmailPreferencesData) => Promise<boolean>;
}

export default function EmailPreferences({
  className = '',
  userId,
  preferences: externalPreferences,
  onPreferencesChange
}: EmailPreferencesProps) {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const [preferences, setPreferences] = useState<EmailPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferências padrão
  const defaultPreferences: EmailPreference[] = useMemo(() => [
    {
      id: 'system_notifications',
      title: 'Notificações do Sistema',
      description: 'Atualizações importantes sobre sua conta e segurança',
      enabled: true,
      frequency: 'instant',
      category: 'system'
    },
    {
      id: 'achievement_unlocked',
      title: 'Conquistas Desbloqueadas',
      description: 'Receba notificações quando desbloquear novas conquistas',
      enabled: true,
      frequency: 'instant',
      category: 'social'
    },
    {
      id: 'certificate_earned',
      title: 'Certificados Conquistados',
      description: 'Notificações sobre certificados obtidos',
      enabled: true,
      frequency: 'instant',
      category: 'educational'
    },
    {
      id: 'weekly_progress',
      title: 'Relatório Semanal de Progresso',
      description: 'Resumo semanal do seu progresso e atividades',
      enabled: false,
      frequency: 'weekly',
      category: 'educational'
    },
    {
      id: 'streak_reminders',
      title: 'Lembretes de Sequência',
      description: 'Lembretes para manter sua sequência de dias ativos',
      enabled: false,
      frequency: 'daily',
      category: 'social'
    },
    {
      id: 'new_content',
      title: 'Novos Conteúdos',
      description: 'Notificações sobre novos módulos e recursos disponíveis',
      enabled: false,
      frequency: 'weekly',
      category: 'educational'
    },
    {
      id: 'platform_updates',
      title: 'Atualizações da Plataforma',
      description: 'Novidades e melhorias na plataforma educacional',
      enabled: false,
      frequency: 'monthly',
      category: 'promotional'
    }
  ], []);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar preferências salvas do perfil do usuário
      if (profile?.preferences) {
        const savedPrefs = profile.preferences as Record<string, boolean | string | undefined>;
        const updatedPrefs: EmailPreference[] = defaultPreferences.map(pref => ({
          ...pref,
          enabled: savedPrefs[pref.id] !== undefined ? Boolean(savedPrefs[pref.id]) : pref.enabled,
          frequency: (savedPrefs[`${pref.id}_frequency`] as EmailPreference['frequency']) || pref.frequency
        }));
        setPreferences(updatedPrefs);
      } else {
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      // Silent error handling for preferences loading
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'email_preferences_load_error', {
          event_category: 'profile',
          event_label: 'preferences_load_failed'
        });
      }
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [profile, defaultPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [profile, loadPreferences]);

  const handlePreferenceChange = (prefId: string, enabled: boolean) => {
    setPreferences(prev => prev.map(pref =>
      pref.id === prefId ? { ...pref, enabled } : pref
    ));
  };

  const handleFrequencyChange = (prefId: string, frequency: EmailPreference['frequency']) => {
    setPreferences(prev => prev.map(pref =>
      pref.id === prefId ? { ...pref, frequency } : pref
    ));
  };

  const savePreferences = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage(null);

    try {
      // Converter preferências para formato do perfil
      const preferencesData: EmailPreferencesData = {};
      preferences.forEach(pref => {
        preferencesData[pref.id] = {
          enabled: pref.enabled,
          frequency: pref.frequency
        };
      });

      // Atualizar perfil com novas preferências
      try {
        await updateProfile({
          preferences: {
            language: profile?.preferences?.language || 'simple',
            notifications: profile?.preferences?.notifications ?? true,
            theme: profile?.preferences?.theme || 'auto',
            emailUpdates: preferences.some(p => p.enabled),
            dataCollection: profile?.preferences?.dataCollection ?? true,
            lgpdConsent: profile?.preferences?.lgpdConsent ?? true,
            ...preferencesData
          }
        });
        setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Erro ao salvar preferências.' });
      }

    } catch (error) {
      // Silent error handling for preferences saving
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'email_preferences_save_error', {
          event_category: 'profile',
          event_label: 'preferences_save_failed'
        });
      }
      setMessage({ type: 'error', text: 'Erro ao salvar preferências.' });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: EmailPreference['category']): string => {
    switch (category) {
      case 'system': return '⚙️';
      case 'social': return '🏆';
      case 'educational': return '📚';
      case 'promotional': return '📢';
      default: return '📧';
    }
  };

  const getCategoryColor = (category: EmailPreference['category']): string => {
    switch (category) {
      case 'system': return 'bg-red-50 border-red-200';
      case 'social': return 'bg-blue-50 border-blue-200';
      case 'educational': return 'bg-green-50 border-green-200';
      case 'promotional': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className={`text-center p-6 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-600">Faça login para gerenciar suas preferências de email</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Preferências de Email
        </h2>
        <p className="text-gray-600">
          Configure quais notificações você deseja receber por email
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando preferências...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className={`border rounded-lg p-4 transition-all ${getCategoryColor(pref.category)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{getCategoryIcon(pref.category)}</span>
                    <h3 className="font-medium text-gray-900">{pref.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{pref.description}</p>

                  {pref.enabled && (
                    <div className="flex items-center space-x-4">
                      <label className="text-sm text-gray-700">Frequência:</label>
                      <select
                        value={pref.frequency}
                        onChange={(e) => handleFrequencyChange(pref.id, e.target.value as EmailPreference['frequency'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="instant">Instantâneo</option>
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.enabled}
                      onChange={(e) => handlePreferenceChange(pref.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botões de ação */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => {
            setPreferences(prev => prev.map(pref => ({ ...pref, enabled: false })));
          }}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Desabilitar Tudo
        </button>

        <div className="space-x-3">
          <button
            onClick={loadPreferences}
            disabled={loading || saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={savePreferences}
            disabled={loading || saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            Salvar Preferências
          </button>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informações Importantes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Notificações do sistema são obrigatórias para segurança da conta</li>
          <li>• Você pode alterar suas preferências a qualquer momento</li>
          <li>• Links de descadastro estão disponíveis em todos os emails</li>
          <li>• Respeitamos sua privacidade conforme a LGPD</li>
        </ul>
      </div>
    </div>
  );
}