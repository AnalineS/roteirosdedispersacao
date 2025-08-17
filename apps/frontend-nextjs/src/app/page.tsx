'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getUniversityLogo, getPersonaAvatar } from '@/constants/avatars';
import type { UserProfile } from '@/hooks/useUserProfile';
import { CognitiveLoadAuditor } from '@/components/analytics/CognitiveLoadAuditor';
import { MobileUXAuditor } from '@/components/analytics/MobileUXAuditor';
import { HierarchyHeading, HierarchyText } from '@/components/layout/VisualHierarchyOptimizer';
import ContentChunking, { createEducationalContentChunk, createMedicalContentChunk } from '@/components/content/ContentChunkingStrategy';
import { MobileQuickActions } from '@/components/mobile/MedicalMobileComponents';
import { useMobileDetection } from '@/components/mobile/MobileFirstFramework';
import { InteractiveButton, useToast, ToastContainer } from '@/components/ui/MicroInteractions';
import { ScrollAnimation, CardReveal, PageTransition, MedicalAnimation } from '@/components/ui/AnimationSystem';
import { MedicalLoadingSpinner } from '@/components/ui/LoadingStates';
import dynamic from 'next/dynamic';

// Lazy load WelcomeWizard for better performance
const WelcomeWizard = dynamic(() => import('@/components/onboarding/WelcomeWizard'), {
  ssr: false,
  loading: () => null
});

export default function HomePage() {
  const { personas, loading, error, getValidPersonasCount } = usePersonas();
  const { saveProfile } = useUserProfile();
  const { showWizard, completeOnboarding, skipOnboarding } = useOnboarding();
  const { isMobile } = useMobileDetection();
  const { toasts, addToast } = useToast();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div className="text-center">
          <MedicalLoadingSpinner 
            size="large" 
            variant="medical" 
          />
          <MedicalAnimation type="pulse" intensity="subtle" size={16} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div className="card text-center" style={{ maxWidth: '400px' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Erro ao carregar</h3>
          <p className="text-muted mb-4">{error}</p>
          <InteractiveButton 
            onClick={() => {
              addToast({
                type: 'loading',
                message: 'Recarregando página...',
                duration: 2000
              });
              setTimeout(() => window.location.reload(), 500);
            }}
            variant="primary"
            size="medium"
          >
            Tentar Novamente
          </InteractiveButton>
        </div>
      </div>
    );
  }

  const handlePersonaSelect = (personaId: string, userProfile: UserProfile) => {
    const profileWithPersona = {
      ...userProfile,
      selectedPersona: personaId
    };
    
    addToast({
      type: 'success',
      message: `Assistente ${personaId === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'} selecionado com sucesso!`,
      duration: 2000
    });
    
    saveProfile(profileWithPersona);
    setTimeout(() => router.push('/chat'), 800);
  };

  // Handle onboarding completion and navigate to chat
  const handleOnboardingComplete = (role: any) => {
    completeOnboarding(role);
    
    const userProfile = {
      type: role.id === 'medical' || role.id === 'student' ? 'professional' as const : 'patient' as const,
      focus: role.id === 'medical' ? 'technical' as const : 'general' as const,
      confidence: 0.9,
      explanation: `Selecionado através do onboarding: ${role.title}`
    };
    
    const profileWithPersona = {
      ...userProfile,
      selectedPersona: role.recommendedPersona
    };
    
    saveProfile(profileWithPersona);
    router.push('/chat');
  };

  return (
    <>
      {/* CSS para responsividade */}
      <style jsx>{`
        .assistants-container {
          display: flex;
          flex-direction: row;
          gap: 32px;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }
        
        .research-cards {
          display: flex;
          flex-direction: row;
          gap: 24px;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .assistants-container {
            flex-direction: column;
          }
          
          .research-cards {
            flex-direction: column;
          }
        }
      `}</style>
      
      <EducationalLayout showBreadcrumbs={false}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle responsive background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(40vh, 50%, 60vh)',
          background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
          zIndex: 0
        }}></div>

        {/* Content */}
        <div className="container" style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 'clamp(2rem, 8vw, 4rem)',
          paddingBottom: 'clamp(2rem, 8vw, 4rem)',
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)'
        }}>
          {/* Header Institucional */}
          <div className="flex items-center justify-start mb-5" style={{ 
            maxWidth: 'min(900px, 90vw)', 
            margin: '0 auto 2rem',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            background: 'white',
            borderRadius: 'clamp(8px, 2vw, 12px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 2vw, 1rem)',
              flexWrap: 'wrap'
            }}>
              <Image 
                src={getUniversityLogo('unb_logo2')} 
                alt="Universidade de Brasília"
                width={80}
                height={80}
                style={{
                  width: 'clamp(60px, 8vw, 80px)',
                  height: 'clamp(60px, 8vw, 80px)',
                  objectFit: 'contain',
                  borderRadius: '50%'
                }}
              />
              <div style={{ textAlign: 'left' }}>
                <HierarchyHeading level="h1">
                  Roteiros de Dispensação
                </HierarchyHeading>
                <HierarchyText size="large" style={{ 
                  color: '#64748b',
                  margin: '0.5rem 0 0 0'
                }}>
                  Sistema Inteligente de Orientação • Hanseníase
                </HierarchyText>
              </div>
            </div>
          </div>
          
          {/* Introdução do Sistema */}
          <div className="text-center hierarchy-component">
            <HierarchyText size="large" className="hierarchy-element" style={{ 
              maxWidth: '700px',
              margin: '0 auto',
              textAlign: 'center'
            }}>
              Plataforma baseada em pesquisa de doutorado que oferece orientação especializada 
              para dispensação de medicamentos do programa PQT-U para hanseníase
            </HierarchyText>
          </div>

          {/* Mobile Quick Actions - ETAPA 4 */}
          {isMobile && (
            <section className="hierarchy-component" style={{ 
              maxWidth: '600px', 
              margin: '2rem auto' 
            }}>
              <HierarchyHeading level="h3" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                🚀 Acesso Rápido
              </HierarchyHeading>
              
              <MobileQuickActions
                actions={[
                  {
                    id: 'chat',
                    label: 'Conversar com IA',
                    icon: '💬',
                    action: () => router.push('/chat')
                  },
                  {
                    id: 'calculator',
                    label: 'Calculadora PQT-U',
                    icon: '🧮',
                    action: () => router.push('/resources/calculator')
                  },
                  {
                    id: 'modules',
                    label: 'Módulos Educativos',
                    icon: '📚',
                    action: () => router.push('/modules')
                  },
                  {
                    id: 'emergency',
                    label: 'Emergência Médica',
                    icon: '🚨',
                    variant: 'emergency',
                    action: () => {
                      window.location.href = 'tel:192';
                    }
                  }
                ]}
              />
            </section>
          )}


          {/* Seção dos Assistentes Virtuais */}
          <div style={{ 
            maxWidth: '900px', 
            margin: '3rem auto',
            padding: '2.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div className="text-center hierarchy-component">
              <HierarchyHeading level="h2" className="hierarchy-element">
                Conheça Seus Assistentes Virtuais
              </HierarchyHeading>
              <HierarchyText size="large" className="hierarchy-element" style={{ 
                maxWidth: '600px',
                margin: '0 auto',
                textAlign: 'center'
              }}>
                Dois assistentes virtuais, cada um desenvolvido para atender suas necessidades específicas no cuidado farmacêutico
              </HierarchyText>
            </div>
            
            {/* Cards dos Assistentes - Layout Flex Horizontal */}
            <div className="assistants-container">
            
              {/* Dr. Gasnelio Card - Clickable */}
              <button
                onClick={() => {
                  const userProfile = {
                    type: 'professional' as const,
                    focus: 'technical' as const,
                    confidence: 0.9,
                    explanation: 'Selecionado diretamente pelo perfil técnico'
                  };
                  handlePersonaSelect('dr_gasnelio', userProfile);
                }}
                style={{
                  flex: '1',
                  minWidth: '300px',
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
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextButton = e.currentTarget.nextElementSibling as HTMLButtonElement;
                    nextButton?.focus();
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                tabIndex={0}
                aria-label="Selecionar Dr. Gasnelio - O Farmacêutico Técnico"
                aria-describedby="gasnelio-description"
              >
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}>
                  <Image 
                    src={getPersonaAvatar('dr_gasnelio')} 
                    alt="Dr. Gasnelio"
                    width={120}
                    height={120}
                    priority
                    quality={95}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#003366',
                  marginBottom: '1rem'
                }}>
                  Dr. Gasnelio
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#003366', 
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  O Farmacêutico Técnico
                </p>
                <ul 
                  id="gasnelio-description"
                  style={{ 
                    fontSize: '0.9rem', 
                    color: '#003366', 
                    textAlign: 'left',
                    paddingLeft: '1.5rem',
                    lineHeight: '1.6',
                    marginBottom: '1.5rem'
                  }}>
                  <li>Respostas detalhadas e científicas</li>
                  <li>Referências às diretrizes oficiais</li>
                  <li>Ideal para profissionais e estudantes</li>
                  <li>Foco em precisão clínica</li>
                </ul>
                
                <div style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(2, 132, 199, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  color: '#003366',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Clique para conversar
                </div>
              </button>

              {/* Gá Card - Clickable */}
              <button
                onClick={() => {
                  const userProfile = {
                    type: 'patient' as const,
                    focus: 'general' as const,
                    confidence: 0.9,
                    explanation: 'Selecionada diretamente pelo perfil acolhedor'
                  };
                  handlePersonaSelect('ga', userProfile);
                }}
                style={{
                  flex: '1',
                  minWidth: '300px',
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  borderRadius: '16px',
                  border: '2px solid #dcfce7',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.borderColor = '#22c55e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#dcfce7';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.outline = '3px solid #22c55e';
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#dcfce7';
                  e.currentTarget.style.outline = 'none';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevButton = e.currentTarget.previousElementSibling as HTMLButtonElement;
                    prevButton?.focus();
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                tabIndex={0}
                aria-label="Selecionar Gá - A Assistente Acolhedora"
                aria-describedby="ga-description"
              >
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}>
                  <Image 
                    src={getPersonaAvatar('ga')} 
                    alt="Gá"
                    width={120}
                    height={120}
                    priority
                    quality={95}
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#16a34a',
                  marginBottom: '1rem'
                }}>
                  Gá
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#16a34a', 
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  A Assistente Acolhedora
                </p>
                <ul 
                  id="ga-description"
                  style={{ 
                    fontSize: '0.9rem', 
                    color: '#16a34a', 
                    textAlign: 'left',
                    paddingLeft: '1.5rem',
                    lineHeight: '1.6',
                    marginBottom: '1.5rem'
                  }}>
                  <li>Explicações claras e acessíveis</li>
                  <li>Linguagem humanizada e empática</li>
                  <li>Ideal para pacientes e familiares</li>
                  <li>Foco no cuidado integral</li>
                </ul>
                
                <div style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#16a34a',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Clique para conversar
                </div>
              </button>
            </div>
            
            {/* Informações Detalhadas dos Assistentes */}
            <div style={{ 
              marginTop: '3rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {/* Detalhes Dr. Gasnelio */}
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '16px',
                border: '2px solid #e0f2fe'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#003366',
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}>
                  DR. GASNELIO
                </h3>
                <p style={{
                  fontSize: '1.125rem',
                  color: '#003366',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}>
                  Farmacêutico Clínico
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#003366',
                    marginBottom: '0.75rem'
                  }}>
                    CARACTERÍSTICAS:
                  </h4>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#003366',
                    lineHeight: '1.6',
                    paddingLeft: '1.25rem',
                    margin: 0
                  }}>
                    <li>Linguagem técnica e científica rigorosa</li>
                    <li>Protocolos farmacêuticos detalhados</li>
                    <li>Referências a estudos clínicos atualizados</li>
                    <li>Foco em interações medicamentosas</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#003366',
                    marginBottom: '0.75rem'
                  }}>
                    PÚBLICO-ALVO:
                  </h4>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#003366',
                    lineHeight: '1.6',
                    paddingLeft: '1.25rem',
                    margin: 0
                  }}>
                    <li>Farmacêuticos e técnicos em farmácia</li>
                    <li>Médicos e enfermeiros</li>
                    <li>Estudantes de ciências da saúde</li>
                    <li>Residentes e profissionais da saúde</li>
                  </ul>
                </div>
              </div>
              
              {/* Detalhes Gá */}
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderRadius: '16px',
                border: '2px solid #dcfce7'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#16a34a',
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}>
                  GÁ
                </h3>
                <p style={{
                  fontSize: '1.125rem',
                  color: '#16a34a',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}>
                  Assistente Educacional Empático
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#14532d',
                    marginBottom: '0.75rem'
                  }}>
                    CARACTERÍSTICAS:
                  </h4>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#16a34a',
                    lineHeight: '1.6',
                    paddingLeft: '1.25rem',
                    margin: 0
                  }}>
                    <li>Linguagem simples e acolhedora</li>
                    <li>Explicações didáticas e práticas</li>
                    <li>Orientações para o cotidiano</li>
                    <li>Comunicação humanizada e empática</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#14532d',
                    marginBottom: '0.75rem'
                  }}>
                    PÚBLICO-ALVO:
                  </h4>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#16a34a',
                    lineHeight: '1.6',
                    paddingLeft: '1.25rem',
                    margin: 0
                  }}>
                    <li>Pacientes e familiares</li>
                    <li>Cuidadores e comunidade</li>
                    <li>Agentes comunitários de saúde</li>
                    <li>Público em geral interessado</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Guia de Escolha do Assistente */}
            <div style={{
              marginTop: '2rem',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#003366',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                🤔 Qual Assistente Escolher?
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                {/* Dr. Gasnelio Guide */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #bfdbfe'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#0369a1',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    👨‍⚕️ Dr. Gasnelio é para você se:
                  </h4>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#0c4a6e',
                    lineHeight: '1.6',
                    marginLeft: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <li>É profissional de saúde (médico, farmacêutico, enfermeiro)</li>
                    <li>Estuda medicina, farmácia ou áreas da saúde</li>
                    <li>Precisa de protocolos clínicos detalhados</li>
                    <li>Quer cálculos de dosagem e interações</li>
                    <li>Busca linguagem técnica e científica</li>
                  </ul>
                  <div style={{
                    background: '#e0f2fe',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#0c4a6e',
                    fontStyle: 'italic'
                  }}>
                    💡 Ideal para consultas técnicas e tomada de decisão clínica
                  </div>
                </div>

                {/* Gá Guide */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #bbf7d0'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#16a34a',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    🤗 Gá é para você se:
                  </h4>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#14532d',
                    lineHeight: '1.6',
                    marginLeft: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <li>É paciente ou familiar de pessoa com hanseníase</li>
                    <li>Prefere explicações em linguagem simples</li>
                    <li>Busca orientações sobre qualidade de vida</li>
                    <li>Precisa de suporte emocional e motivacional</li>
                    <li>Quer informações acessíveis sobre o tratamento</li>
                  </ul>
                  <div style={{
                    background: '#dcfce7',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#14532d',
                    fontStyle: 'italic'
                  }}>
                    💡 Ideal para esclarecimentos e apoio durante o tratamento
                  </div>
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#003366',
                  margin: '0 0 0.5rem 0',
                  fontWeight: '600'
                }}>
                  ✨ Clique no assistente de sua preferência acima para iniciar a conversa
                </p>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                  margin: 0
                }}>
                  Ambos foram treinados com o conteúdo completo da pesquisa de doutorado
                </p>
              </div>
            </div>
          </div>

          {/* FAQ e Suporte - Primeira Dobra */}
          <div style={{
            maxWidth: '1000px',
            margin: '3rem auto',
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
            borderRadius: '16px',
            padding: '2rem',
            border: '2px solid #fbbf24'
          }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#92400e',
              textAlign: 'center',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              🆘 Precisa de Ajuda?
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              {/* FAQ Rápido */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fbbf24',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ❓ FAQ Rápido
                </h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <details style={{ marginBottom: '0.75rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#92400e' }}>
                      Como escolher entre Dr. Gasnelio e Gá?
                    </summary>
                    <p style={{ marginTop: '0.5rem', color: '#78716c' }}>
                      Dr. Gasnelio para profissionais/estudantes (linguagem técnica). Gá para pacientes/familiares (linguagem simples).
                    </p>
                  </details>
                  <details style={{ marginBottom: '0.75rem' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#92400e' }}>
                      O PQT-U é gratuito no SUS?
                    </summary>
                    <p style={{ marginTop: '0.5rem', color: '#78716c' }}>
                      Sim! O tratamento PQT-U é 100% gratuito em todas as unidades de saúde do SUS.
                    </p>
                  </details>
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#92400e' }}>
                      Posso parar o tratamento se melhorar?
                    </summary>
                    <p style={{ marginTop: '0.5rem', color: '#78716c' }}>
                      NUNCA pare sem orientação médica. O tratamento completo é essencial para cura.
                    </p>
                  </details>
                </div>
                <button
                  onClick={() => router.push('/faq')}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    width: '100%'
                  }}
                >
                  Ver Mais Perguntas
                </button>
              </div>

              {/* Canais de Suporte */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fbbf24',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📞 Canais de Suporte
                </h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    border: '1px solid #fcd34d'
                  }}>
                    <strong style={{ color: '#92400e' }}>🚨 Emergência Médica</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#78716c' }}>
                      <strong>SAMU: 192</strong> | <strong>Disque Saúde: 136</strong>
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#92400e' }}>🏥 Unidade de Saúde</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#78716c' }}>
                      Procure sua UBS ou ambulatório de referência
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#92400e' }}>💬 Chat da Plataforma</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#78716c' }}>
                      Dr. Gasnelio e Gá disponíveis 24/7
                    </p>
                  </div>
                  
                  <div>
                    <strong style={{ color: '#92400e' }}>📧 Contato Técnico</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#78716c' }}>
                      Problemas com a plataforma
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/contato')}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    width: '100%'
                  }}
                >
                  Mais Contatos
                </button>
              </div>

              {/* Ajuda Rápida */}
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fbbf24',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#92400e',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ⚡ Ajuda Rápida
                </h3>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#92400e' }}>🎯 Primeiros Passos:</strong>
                    <ol style={{ marginLeft: '1rem', marginTop: '0.5rem', color: '#78716c' }}>
                      <li>Escolha seu assistente virtual</li>
                      <li>Faça uma pergunta no chat</li>
                      <li>Explore os módulos educativos</li>
                    </ol>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#92400e' }}>📱 No seu celular:</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#78716c' }}>
                      Adicione à tela inicial para acesso rápido
                    </p>
                  </div>
                  
                  <div>
                    <strong style={{ color: '#92400e' }}>🔧 Problemas técnicos:</strong>
                    <p style={{ margin: '0.25rem 0 0', color: '#78716c' }}>
                      Recarregue a página ou limpe o cache
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/guia')}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    width: '100%'
                  }}
                >
                  Guia Completo
                </button>
              </div>
            </div>

            {/* Destaque Especial */}
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '8px',
              border: '2px solid #dc2626'
            }}>
              <p style={{
                fontSize: '1rem',
                color: '#dc2626',
                margin: 0,
                fontWeight: '700'
              }}>
                ⚠️ <strong>IMPORTANTE:</strong> Esta plataforma é educacional. Em caso de emergência médica, procure atendimento presencial imediatamente.
              </p>
            </div>
          </div>

          {/* Sobre a Pesquisa Section */}
          <section style={{
            maxWidth: '900px',
            margin: '4rem auto',
            padding: '2.5rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div className="text-center hierarchy-component">
              <HierarchyHeading level="h2" className="hierarchy-element">
                Sobre a Pesquisa
              </HierarchyHeading>
              
              {/* Parágrafos introdutórios */}
              <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto 2.5rem' }}>
                <p style={{
                  fontSize: '1.125rem',
                  color: '#374151',
                  lineHeight: '1.75',
                  marginBottom: '1.5rem'
                }}>
                  Essa tese nasceu de uma inquietação comum a muitos profissionais da farmácia: como tornar o momento da dispensação mais humano, seguro e eficaz?
                </p>
                
                <p style={{
                  fontSize: '1.125rem',
                  color: '#374151',
                  lineHeight: '1.75',
                  marginBottom: '1.5rem'
                }}>
                  Realizada no âmbito do Programa de Pós-Graduação em Ciências Farmacêuticas da Universidade de Brasília (UnB), a pesquisa propõe a elaboração e validação de um roteiro de dispensação de medicamentos específico para pacientes em tratamento.
                </p>
                
                <p style={{
                  fontSize: '1.125rem',
                  color: '#374151',
                  lineHeight: '1.75',
                  marginBottom: '2.5rem'
                }}>
                  Mais do que um guia técnico, é uma ferramenta que valoriza a escuta, a clareza nas orientações e o cuidado centrado no paciente. O objetivo é padronizar e aprimorar o cuidado farmacêutico, aumentando a adesão ao tratamento e a segurança do paciente através de uma comunicação clínica estruturada.
                </p>
              </div>
            </div>

            {/* Três Cards Horizontais */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Card 1: Fundamentação Científica */}
              <div style={{
                padding: '2rem',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '0.75rem'
                }}>
                  Fundamentação Científica
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  lineHeight: '1.6',
                  flex: '1'
                }}>
                  Baseado em diretrizes do Ministério da Saúde, da OMS e em evidências científicas robustas. Sistema disponível 24/7, garantindo segurança e confiabilidade no ato da dispensação.
                </p>
              </div>

              {/* Card 2: Foco no Paciente */}
              <div style={{
                padding: '2rem',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '0.75rem'
                }}>
                  Foco no Paciente
                </h3>
                <div style={{ height: '0.75rem' }}></div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  lineHeight: '1.6',
                  flex: '1'
                }}>
                  Abordagem centrada no paciente, priorizando orientações claras sobre medicamentos, manejo de reações adversas e promoção da autonomia no tratamento com acesso contínuo ao suporte.
                </p>
              </div>

              {/* Card 3: Validação por Especialistas */}
              <div style={{
                padding: '2rem',
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fff7ed',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '0.75rem'
                }}>
                  Validação Clínica
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  lineHeight: '1.6',
                  flex: '1'
                }}>
                  Rigoroso processo de validação multidisciplinar, assegurando relevância clínica, aplicabilidade prática e atualização constante com diretrizes oficiais.
                </p>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '1rem',
                color: '#003366',
                lineHeight: '1.6',
                margin: '0 0 1rem 0',
                fontWeight: '500'
              }}>
                <strong>Acesse o conteúdo completo da pesquisa</strong>
              </p>
              <a
                href="/resources"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  background: '#003366',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#002244';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#003366';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                Ver Roteiro Completo
              </a>
            </div>
          </section>

        </div>
      </div>
      
      {/* UX Analytics Components - ETAPA 1 */}
      <CognitiveLoadAuditor />
      <MobileUXAuditor />
      
      {/* Welcome Wizard - ETAPA 3 UX TRANSFORMATION */}
      {showWizard && (
        <WelcomeWizard onComplete={handleOnboardingComplete} />
      )}
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} />
    </EducationalLayout>
    </>
  );
}