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
        {/* Subtle background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
          zIndex: 0
        }}></div>

        {/* Content */}
        <div className="container" style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: '4rem',
          paddingBottom: '4rem'
        }}>
          {/* Header Institucional */}
          <div className="flex items-center justify-start mb-5" style={{ 
            maxWidth: '900px', 
            margin: '0 auto 2rem',
            padding: '1.5rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Image 
                src={getUniversityLogo('unb_logo2')} 
                alt="Universidade de Brasília"
                width={80}
                height={80}
                style={{
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

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-lg mb-5" style={{ maxWidth: '800px', margin: '3rem auto' }}>
            <div className="text-center">
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f0f9ff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '1px solid #e0f2fe'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <path d="M9 11H3v9h6v-9zm5-7h-4v16h4V4zm5 3h-4v13h4V7z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Baseado em Evidências</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Diretrizes do Ministério da Saúde
              </p>
            </div>
            
            <div className="text-center">
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '1px solid #dcfce7'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Seguro e Confiável</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Validado por especialistas
              </p>
            </div>
            
            <div className="text-center">
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f0f9ff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '1px solid #e0f2fe'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Disponível 24/7</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Acesso sempre que precisar
              </p>
            </div>
          </div>

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
                Dois especialistas em IA, cada um desenvolvido para atender suas necessidades específicas no cuidado farmacêutico
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
                  e.currentTarget.style.borderColor = '#0284c7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e0f2fe';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(2, 132, 199, 0.2)';
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.outline = '3px solid #0284c7';
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
                aria-label="Selecionar Dr. Gasnelio - O Especialista Técnico"
                aria-describedby="gasnelio-description"
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src={getPersonaAvatar('dr_gasnelio')} 
                    alt="Dr. Gasnelio"
                    fill
                    style={{
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#0369a1',
                  marginBottom: '1rem'
                }}>
                  Dr. Gasnelio
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#0369a1', 
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  O Especialista Técnico
                </p>
                <ul 
                  id="gasnelio-description"
                  style={{ 
                    fontSize: '0.9rem', 
                    color: '#0369a1', 
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
                  color: '#0369a1',
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
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                  <Image 
                    src={getPersonaAvatar('ga')} 
                    alt="Gá"
                    fill
                    style={{
                      objectFit: 'cover'
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
            
            {/* Informação sobre os assistentes */}
            <div style={{ 
              marginTop: '2rem', 
              textAlign: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
              borderRadius: '12px',
              border: '1px solid #fef3c7'
            }}>
              <p style={{ 
                fontSize: '1rem', 
                color: '#92400e', 
                lineHeight: '1.6',
                margin: 0,
                fontWeight: '500'
              }}>
                <strong>Clique no assistente de sua preferência para iniciar.</strong><br/>
                Ambos foram treinados com o conteúdo completo da pesquisa de doutorado, 
                garantindo respostas baseadas em evidências científicas e diretrizes oficiais do Ministério da Saúde.
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
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
                  Baseado em diretrizes do Ministério da Saúde, da OMS e em evidências científicas, o roteiro estrutura o ato da dispensação de forma lógica e completa.
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
                  O roteiro prioriza a orientação sobre medicamentos, o manejo de reações adversas e a promoção da autonomia do paciente no tratamento.
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
                  Validação por Especialistas
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  lineHeight: '1.6',
                  flex: '1'
                }}>
                  Submetido a um rigoroso processo de validação, garantindo sua relevância e aplicabilidade clínica.
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
                color: '#1d4ed8',
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
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
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

          {/* Content Chunking Demo - ETAPA 2 */}
          <section className="hierarchy-section" style={{ 
            maxWidth: '1000px', 
            margin: '4rem auto' 
          }}>
            <ContentChunking
              groups={[
                {
                  id: 'getting-started',
                  title: 'Como Começar',
                  description: 'Informações essenciais organizadas para facilitar sua jornada de aprendizagem',
                  defaultExpanded: false,
                  layout: 'accordion',
                  chunks: [
                    createEducationalContentChunk(
                      'choose-assistant',
                      'Escolhendo seu Assistente Virtual',
                      'Entenda as diferenças entre Dr. Gasnelio e Gá para fazer a melhor escolha',
                      <div>
                        <HierarchyText size="normal">
                          <strong>Dr. Gasnelio</strong> é ideal para:
                        </HierarchyText>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
                          <li>Profissionais de saúde que precisam de informações técnicas detalhadas</li>
                          <li>Estudantes de farmácia ou medicina</li>
                          <li>Consultas sobre protocolos clínicos e diretrizes oficiais</li>
                          <li>Cálculos de dosagem e interações medicamentosas</li>
                        </ul>
                        
                        <HierarchyText size="normal" style={{ marginTop: '1rem' }}>
                          <strong>Gá</strong> é ideal para:
                        </HierarchyText>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
                          <li>Pacientes e familiares buscando informações acessíveis</li>
                          <li>Esclarecimento de dúvidas em linguagem simples</li>
                          <li>Orientações sobre qualidade de vida</li>
                          <li>Suporte emocional e motivacional durante o tratamento</li>
                        </ul>
                      </div>,
                      { priority: 'high', complexity: 'beginner', estimatedReadTime: '3 min' }
                    ),
                    
                    createMedicalContentChunk(
                      'pqt-overview',
                      'Protocolo PQT-U: Visão Geral',
                      'Informações essenciais sobre o tratamento poliquimioterápico para hanseníase',
                      <div>
                        <div className="medical-alert-info">
                          <strong>⚕️ Informação Médica:</strong> O PQT-U (Poliquimioterapia Única) é o protocolo padrão do Ministério da Saúde para tratamento da hanseníase.
                        </div>
                        
                        <HierarchyText size="normal" style={{ marginTop: '1rem' }}>
                          <strong>Duração do Tratamento:</strong>
                        </HierarchyText>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
                          <li><strong>Paucibacilar:</strong> 6 meses de tratamento</li>
                          <li><strong>Multibacilar:</strong> 12 meses de tratamento</li>
                        </ul>
                        
                        <HierarchyText size="normal" style={{ marginTop: '1rem' }}>
                          <strong>Medicamentos Utilizados:</strong>
                        </HierarchyText>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
                          <li><strong>Rifampicina:</strong> Antibiótico principal (dose supervisionada)</li>
                          <li><strong>Dapsona:</strong> Anti-inflamatório (autoadministração)</li>
                          <li><strong>Clofazimina:</strong> Antimicobacteriano (casos multibacilares)</li>
                        </ul>
                      </div>,
                      { priority: 'critical', complexity: 'intermediate', estimatedReadTime: '5 min' }
                    ),
                    
                    createEducationalContentChunk(
                      'platform-features',
                      'Recursos da Plataforma',
                      'Descubra todas as funcionalidades disponíveis para otimizar seu aprendizado',
                      <div>
                        <HierarchyText size="normal">
                          Nossa plataforma oferece diversos recursos para facilitar seu aprendizado:
                        </HierarchyText>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                          <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                            <strong>💬 Chat Inteligente</strong>
                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                              Converse com especialistas virtuais treinados especificamente para hanseníase
                            </p>
                          </div>
                          
                          <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
                            <strong>📚 Módulos Educativos</strong>
                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                              Conteúdo estruturado desde conceitos básicos até tópicos avançados
                            </p>
                          </div>
                          
                          <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                            <strong>🧮 Calculadoras</strong>
                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                              Ferramentas para cálculo de doses e verificação de protocolos
                            </p>
                          </div>
                          
                          <div style={{ padding: '1rem', background: '#f3e8ff', borderRadius: '8px', border: '1px solid #8b5cf6' }}>
                            <strong>📊 Acompanhamento</strong>
                            <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                              Monitore seu progresso e identifique áreas para aprofundamento
                            </p>
                          </div>
                        </div>
                      </div>,
                      { priority: 'medium', complexity: 'beginner', estimatedReadTime: '4 min' }
                    )
                  ]
                }
              ]}
              enableProgressiveMode={true}
              maxConcurrentChunks={2}
            />
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