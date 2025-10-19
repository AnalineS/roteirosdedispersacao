'use client';

import React, { useState, useEffect } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';

interface LGPDNoticeProps {
  context: 'chat' | 'registration' | 'data-collection' | 'general';
  onAccept?: () => void;
  onDecline?: () => void;
  className?: string;
}

export default function LGPDCompliance({ 
  context, 
  onAccept, 
  onDecline, 
  className = '' 
}: LGPDNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const unbColors = getUnbColors();

  useEffect(() => {
    // Verificar se usuário já deu consentimento para este contexto
    const consentKey = `lgpd-consent-${context}`;
    const existingConsent = safeLocalStorage()?.getItem(consentKey);
    
    if (!existingConsent && context !== 'general') {
      setIsVisible(true);
    } else if (existingConsent) {
      setHasConsented(true);
    }
  }, [context]);

  const handleAccept = () => {
    const consentKey = `lgpd-consent-${context}`;
    const consentData = {
      context,
      timestamp: new Date().toISOString(),
      version: '1.0',
      accepted: true
    };
    
    safeLocalStorage()?.setItem(consentKey, JSON.stringify(consentData));
    setHasConsented(true);
    setIsVisible(false);
    
    if (onAccept) {
      onAccept();
    }
  };

  const handleDecline = () => {
    setIsVisible(false);
    if (onDecline) {
      onDecline();
    }
  };

  const getContextMessage = () => {
    const messages = {
      chat: {
        title: '🔒 Proteção de Dados Sensíveis de Saúde',
        description: 'Durante nossa conversa, você pode compartilhar informações sobre sua saúde ou tratamento médico. Estas informações são consideradas dados sensíveis pela LGPD.',
        dataTypes: [
          'Informações sobre diagnósticos médicos',
          'Medicamentos em uso',
          'Sintomas e condições de saúde',
          'Histórico de tratamentos'
        ],
        processing: 'Os dados serão processados apenas para fornecer orientações educacionais sobre hanseníase e não substituem consulta médica.',
        retention: 'Conversas são mantidas localmente em seu dispositivo e podem ser excluídas a qualquer momento.',
        warning: '⚠️ Não compartilhe documentos pessoais, CPF ou dados que possam identificá-lo diretamente.'
      },
      registration: {
        title: '📋 Coleta de Dados para Cadastro',
        description: 'Para personalizar sua experiência educacional, coletamos algumas informações básicas sobre seu perfil profissional.',
        dataTypes: [
          'Nome e email',
          'Área de atuação profissional',
          'Instituição de ensino/trabalho',
          'Preferências de conteúdo'
        ],
        processing: 'Dados utilizados para personalização de conteúdo educacional e comunicação sobre atualizações da plataforma.',
        retention: 'Dados mantidos enquanto sua conta estiver ativa. Exclusão disponível a qualquer momento.',
        warning: ''
      },
      'data-collection': {
        title: '📊 Coleta de Dados de Uso',
        description: 'Coletamos dados anônimos sobre como você usa a plataforma para melhorar a experiência educacional.',
        dataTypes: [
          'Páginas visitadas e tempo de permanência',
          'Módulos educacionais acessados',
          'Padrões de navegação',
          'Informações técnicas do dispositivo'
        ],
        processing: 'Dados utilizados para análise estatística e melhoria da plataforma educacional.',
        retention: 'Dados anônimos mantidos por período indeterminado para fins de pesquisa académica.',
        warning: ''
      },
      general: {
        title: '🛡️ Política de Privacidade - LGPD',
        description: 'Esta plataforma está em conformidade com a Lei Geral de Proteção de Dados (LGPD).',
        dataTypes: [
          'Dados de identificação e contato',
          'Dados de saúde (quando fornecidos voluntariamente)',
          'Dados de navegação e uso da plataforma',
          'Cookies e tecnologias similares'
        ],
        processing: 'Processamento baseado em consentimento, interesse legítimo para fins educacionais e cumprimento de obrigação legal.',
        retention: 'Períodos de retenção variam conforme o tipo de dado e finalidade.',
        warning: ''
      }
    };
    
    return messages[context];
  };

  const contextData = getContextMessage();

  // Para contexto geral, sempre mostrar (não é modal)
  if (context === 'general') {
    return (
      <div className={`lgpd-general-info ${className}`} style={{
        background: 'white',
        border: `2px solid ${unbColors.primary}`,
        borderRadius: '16px',
        padding: '2rem',
        margin: '2rem 0'
      }}>
        <h2 style={{
          color: unbColors.primary,
          fontSize: '1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {contextData.title}
        </h2>
        
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
          {contextData.description}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#374151', marginBottom: '1rem' }}>📋 Dados Coletados:</h3>
            <ul style={{ paddingLeft: '1rem', lineHeight: '1.6' }}>
              {contextData.dataTypes.map((type, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>{type}</li>
              ))}
            </ul>
          </div>

          <div style={{
            background: '#f0f9ff',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e0f2fe'
          }}>
            <h3 style={{ color: '#0369a1', marginBottom: '1rem' }}>⚙️ Como Processamos:</h3>
            <p style={{ lineHeight: '1.6', margin: 0 }}>{contextData.processing}</p>
          </div>
        </div>

        <div style={{
          background: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #fcd34d',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ color: '#92400e', marginBottom: '1rem' }}>⏰ Retenção de Dados:</h3>
          <p style={{ lineHeight: '1.6', margin: 0 }}>{contextData.retention}</p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Link
            href="/privacidade"
            style={{
              background: unbColors.primary,
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            📋 Política Completa
          </Link>
          <Link
            href="/termos"
            style={{
              background: 'white',
              color: unbColors.primary,
              border: `2px solid ${unbColors.primary}`,
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            📝 Termos de Uso
          </Link>
        </div>
      </div>
    );
  }

  // Modal para contextos específicos
  if (!isVisible || hasConsented) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        {/* Modal */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{
            color: unbColors.primary,
            fontSize: '1.3rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {contextData.title}
          </h2>
          
          <p style={{ marginBottom: '1.5rem', lineHeight: '1.6', color: '#374151' }}>
            {contextData.description}
          </p>

          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              📋 Tipos de dados envolvidos:
            </h4>
            <ul style={{ paddingLeft: '1rem', lineHeight: '1.5', fontSize: '0.9rem' }}>
              {contextData.dataTypes.map((type, index) => (
                <li key={index} style={{ marginBottom: '0.25rem' }}>{type}</li>
              ))}
            </ul>
          </div>

          <div style={{
            background: '#f0f9ff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #e0f2fe'
          }}>
            <h4 style={{ color: '#0369a1', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              ⚙️ Finalidade do processamento:
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              {contextData.processing}
            </p>
          </div>

          <div style={{
            background: '#f0fdf4',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{ color: '#16a34a', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              🗄️ Período de retenção:
            </h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              {contextData.retention}
            </p>
          </div>

          {contextData.warning && (
            <div style={{
              background: '#fef2f2',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #fecaca'
            }}>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0, color: '#dc2626' }}>
                {contextData.warning}
              </p>
            </div>
          )}

          <div style={{
            fontSize: '0.85rem',
            color: '#6b7280',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            <strong>Seus direitos LGPD:</strong> acesso, correção, exclusão, portabilidade, 
            revogação de consentimento. Contato: <Link href="/privacidade" style={{ color: unbColors.primary }}>página de privacidade</Link>.
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleDecline}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Não Aceito
            </button>
            <button
              onClick={handleAccept}
              style={{
                background: unbColors.primary,
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ✅ Aceito os Termos
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook para verificar consentimento
export function useLGPDConsent(context: 'chat' | 'registration' | 'data-collection') {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const consentKey = `lgpd-consent-${context}`;
    const existingConsent = safeLocalStorage()?.getItem(consentKey);
    
    if (existingConsent) {
      try {
        const consentData = JSON.parse(existingConsent);
        setHasConsent(consentData.accepted === true);
      } catch (error) {
        setHasConsent(false);
      }
    }
    
    setIsLoading(false);
  }, [context]);

  const giveConsent = () => {
    const consentKey = `lgpd-consent-${context}`;
    const consentData = {
      context,
      timestamp: new Date().toISOString(),
      version: '1.0',
      accepted: true
    };
    
    safeLocalStorage()?.setItem(consentKey, JSON.stringify(consentData));
    setHasConsent(true);
  };

  const revokeConsent = () => {
    const consentKey = `lgpd-consent-${context}`;
    safeLocalStorage()?.removeItem(consentKey);
    setHasConsent(false);
  };

  return {
    hasConsent,
    isLoading,
    giveConsent,
    revokeConsent
  };
}