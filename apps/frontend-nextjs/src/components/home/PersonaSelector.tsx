'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { UserProfile } from '@/types/auth';
import { getPersonaAvatar } from '@/constants/avatars';
import { ChatBotIcon } from '@/components/icons/NavigationIcons';

export default function PersonaSelector() {
  const router = useRouter();
  const personasHook = usePersonas();
  const userProfileHook = useUserProfile();

  // Enhanced safety: Extract values with comprehensive fallbacks and validation
  const hookSafetyCheck = {
    personasValid: personasHook && typeof personasHook === 'object',
    userProfileValid: userProfileHook && typeof userProfileHook === 'object'
  };

  const { personas = {}, loading = false, error = null, getValidPersonasCount = () => 2 } = hookSafetyCheck.personasValid ? personasHook : {};
  const { saveProfile = () => {} } = hookSafetyCheck.userProfileValid ? userProfileHook : {};

  const handlePersonaSelect = (personaId: string, userProfile: UserProfile) => {
    try {
      const profileWithPersona = {
        ...userProfile,
        selectedPersona: personaId
      };
      
      saveProfile(profileWithPersona);
      router.push('/chat');
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'persona_selection_error', {
          event_category: 'medical_persona_interaction',
          event_label: 'persona_selection_failed',
          custom_parameters: {
            medical_context: 'persona_selector_interaction',
            persona_id: personaId,
            error_type: 'selection_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
      // Fallback: navegar sem salvar profile
      router.push('/chat');
    }
  };

  return (
    <div style={{ 
      maxWidth: 'min(1400px, 95vw)', 
      margin: '3rem auto',
      padding: '2.5rem',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div className="text-center hierarchy-component">
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          fontSize: '2rem',
          fontWeight: '700',
          color: '#003366',
          marginBottom: '1rem'
        }}>
          <ChatBotIcon size={28} variant="unb" />
          Conheça Seus Assistentes Virtuais
        </h2>
        <p style={{ 
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center',
          fontSize: '1.125rem',
          color: '#374151',
          lineHeight: '1.6'
        }}>
          Dois assistentes virtuais, cada um desenvolvido para atender suas necessidades específicas no cuidado farmacêutico
        </p>
      </div>
      
      {/* Cards dos Assistentes - Layout Flex Horizontal */}
      <div id="assistentes" className="assistants-container" role="main" aria-label="Seleção de assistentes virtuais" style={{
        display: 'flex',
        gap: '2rem',
        marginTop: '2rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
      
        {/* Dr. Gasnelio Card - Clickable */}
        <button
          onClick={() => {
            const userProfile: UserProfile = {
              uid: 'temp-' + Date.now(),
              type: 'professional' as const,
              focus: 'technical' as const,
              confidence: 0.9,
              explanation: 'Selecionado diretamente pelo perfil técnico',
              preferences: {
                language: 'technical' as const,
                notifications: true,
                theme: 'auto' as const,
                emailUpdates: false,
                dataCollection: true,
                lgpdConsent: true
              },
              history: {
                lastPersona: 'dr_gasnelio' as const,
                conversationCount: 0,
                lastAccess: new Date().toISOString(),
                preferredTopics: [],
                totalSessions: 0,
                totalTimeSpent: 0,
                completedModules: [],
                achievements: []
              },
              stats: {
                joinedAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                sessionCount: 0,
                messageCount: 0,
                averageSessionDuration: 0,
                favoritePersona: 'dr_gasnelio' as const,
                completionRate: 0
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: '1.0'
            };
            handlePersonaSelect('dr_gasnelio', userProfile);
          }}
          style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '400px',
            padding: '2rem',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '16px',
            border: '2px solid #e0f2fe',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(2, 132, 199, 0.2)';
            e.currentTarget.style.borderColor = '#003366';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e0f2fe';
          }}
          onFocus={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(2, 132, 199, 0.2)';
            e.currentTarget.style.borderColor = '#003366';
            e.currentTarget.style.outline = '3px solid #003366';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e0f2fe';
            e.currentTarget.style.outline = 'none';
          }}
          aria-label="Selecionar Dr. Gasnelio - Assistente Técnico para Profissionais de Saúde"
        >
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            margin: '0 auto 1rem',
            background: '#003366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white'
          }}>
            👨‍⚕️
          </div>
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#003366',
            marginBottom: '0.5rem'
          }}>
            Dr. Gasnelio
          </h3>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#059669',
            fontWeight: '600',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Assistente Técnico
          </p>
          
          <p style={{
            fontSize: '0.95rem',
            color: '#374151',
            lineHeight: '1.5',
            marginBottom: '1.5rem'
          }}>
            Especializado em aspectos técnicos, protocolos e diretrizes clínicas. Ideal para profissionais de saúde.
          </p>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            {['Protocolos', 'Farmacologia', 'Diretrizes'].map((tag) => (
              <span key={tag} style={{
                padding: '0.25rem 0.75rem',
                background: '#dbeafe',
                color: '#1e40af',
                fontSize: '0.75rem',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* GA Card - Clickable */}
        <button
          onClick={() => {
            const userProfile: UserProfile = {
              uid: 'temp-' + Date.now(),
              type: 'patient' as const,
              focus: 'empathetic' as const,
              confidence: 0.9,
              explanation: 'Selecionado diretamente pelo perfil empático',
              preferences: {
                language: 'simple' as const,
                notifications: true,
                theme: 'auto' as const,
                emailUpdates: false,
                dataCollection: true,
                lgpdConsent: true
              },
              history: {
                lastPersona: 'ga' as const,
                conversationCount: 0,
                lastAccess: new Date().toISOString(),
                preferredTopics: [],
                totalSessions: 0,
                totalTimeSpent: 0,
                completedModules: [],
                achievements: []
              },
              stats: {
                joinedAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                sessionCount: 0,
                messageCount: 0,
                averageSessionDuration: 0,
                favoritePersona: 'ga' as const,
                completionRate: 0
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: '1.0'
            };
            handlePersonaSelect('ga', userProfile);
          }}
          style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '400px',
            padding: '2rem',
            background: 'linear-gradient(135deg, #fef3e2 0%, #fde68a 100%)',
            borderRadius: '16px',
            border: '2px solid #fde68a',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.2)';
            e.currentTarget.style.borderColor = '#f59e0b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#fde68a';
          }}
          onFocus={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.2)';
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.outline = '3px solid #f59e0b';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#fde68a';
            e.currentTarget.style.outline = 'none';
          }}
          aria-label="Selecionar GA - Assistente Empático para Pacientes e Familiares"
        >
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            margin: '0 auto 1rem',
            background: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white'
          }}>
            💬
          </div>
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#92400e',
            marginBottom: '0.5rem'
          }}>
            GA
          </h3>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#059669',
            fontWeight: '600',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Assistente Empático
          </p>
          
          <p style={{
            fontSize: '0.95rem',
            color: '#374151',
            lineHeight: '1.5',
            marginBottom: '1.5rem'
          }}>
            Focado no cuidado humanizado e suporte emocional. Ideal para pacientes e familiares.
          </p>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            {['Acolhimento', 'Orientação', 'Suporte'].map((tag) => (
              <span key={tag} style={{
                padding: '0.25rem 0.75rem',
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '0.75rem',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}