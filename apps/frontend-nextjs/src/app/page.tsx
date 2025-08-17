'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getPersonaAvatar } from '@/constants/avatars';
import type { UserProfile } from '@/hooks/useUserProfile';
import { CognitiveLoadAuditor } from '@/components/analytics/CognitiveLoadAuditor';
import { MobileUXAuditor } from '@/components/analytics/MobileUXAuditor';
import { HierarchyHeading, HierarchyText } from '@/components/layout/VisualHierarchyOptimizer';
import ContentChunking, { createEducationalContentChunk, createMedicalContentChunk } from '@/components/content/ContentChunkingStrategy';
import { MobileQuickActions } from '@/components/mobile/MedicalMobileComponents';
import { useMobileDetection } from '@/components/mobile/MobileFirstFramework';
import { InteractiveButton, useToast, ToastContainer } from '@/components/ui/MicroInteractions';
import { ScrollAnimation, CardReveal, PageTransition, MedicalAnimation } from '@/components/ui/AnimationSystem';
import { 
  HomeIcon, 
  ChatBotIcon, 
  ModulesIcon, 
  ResourcesIcon, 
  StarIcon, 
  UserCheckIcon, 
  HelpIcon, 
  PhoneIcon,
  getIconByEmoji 
} from '@/components/icons/NavigationIcons';
import { MedicalLoadingSpinner } from '@/components/ui/LoadingStates';
import dynamic from 'next/dynamic';

// Lazy load WelcomeWizard for better performance
const WelcomeWizard = dynamic(() => import('@/components/onboarding/WelcomeWizard'), {
  ssr: false,
  loading: () => null
});

// Lazy load personalization components
const PersonalizationProvider = dynamic(() => import('@/components/personalization/PersonalizationProvider'), {
  ssr: false,
  loading: () => null
});

const PersonalizedDashboard = dynamic(() => import('@/components/personalization/PersonalizedDashboard'), {
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
    <PersonalizationProvider>
      {/* Dashboard Personalizado */}
      <PersonalizedDashboard className="mb-8" />
      
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
          
          /* Header responsivo - ajustar padding e margens */
          .container {
            padding-left: clamp(0.75rem, 3vw, 1rem) !important;
            padding-right: clamp(0.75rem, 3vw, 1rem) !important;
          }
          
          /* Navegação responsiva */
          nav {
            padding: 0.75rem 0 !important;
          }
          
          nav > div {
            gap: 1rem !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          
          nav a {
            font-size: 0.85rem !important;
            padding: 0.4rem 0.8rem !important;
          }
        }
      `}</style>
      
      {/* Schema.org JSON-LD para MedicalWebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Roteiros de Dispensação Hanseníase – Assistentes educacionais com IA",
            "description": "Plataforma gratuita validada pela UnB para orientar pacientes e profissionais na dispensação da PQT-U para hanseníase.",
            "url": "https://roteirosdedispensacao.com",
            "medicalAudience": [
              {
                "@type": "MedicalAudience",
                "audienceType": "https://schema.org/Patient"
              },
              {
                "@type": "MedicalAudience", 
                "audienceType": "https://schema.org/MedicalAudience",
                "requiredGender": "unisex",
                "requiredMinAge": 18,
                "suggestedMinAge": 18
              }
            ],
            "specialty": {
              "@type": "MedicalSpecialty",
              "name": "Farmácia Clínica"
            },
            "about": {
              "@type": "MedicalCondition",
              "name": "Hanseníase",
              "alternateName": "Lepra",
              "description": "Doença infecciosa crônica causada pelo Mycobacterium leprae",
              "medicalCode": {
                "@type": "MedicalCode",
                "code": "A30",
                "codingSystem": "ICD-10"
              }
            },
            "lastReviewed": "2024-12-01",
            "reviewedBy": {
              "@type": "Organization",
              "name": "Universidade de Brasília",
              "alternateName": "UnB",
              "department": "Programa de Pós-Graduação em Ciências Farmacêuticas"
            },
            "author": {
              "@type": "Organization",
              "name": "Universidade de Brasília",
              "url": "https://www.unb.br"
            },
            "publisher": {
              "@type": "Organization",
              "name": "UnB - Programa de Pós-Graduação em Ciências Farmacêuticas"
            },
            "mainEntity": {
              "@type": "MedicalTherapy",
              "name": "Poliquimioterapia Única para Hanseníase",
              "alternateName": "PQT-U",
              "description": "Tratamento medicamentoso padronizado para hanseníase",
              "administrationRoute": "Oral",
              "dosageForm": "Comprimido/Cápsula",
              "activeIngredient": [
                {
                  "@type": "Drug",
                  "name": "Rifampicina"
                },
                {
                  "@type": "Drug", 
                  "name": "Clofazimina"
                },
                {
                  "@type": "Drug",
                  "name": "Dapsona"
                }
              ]
            },
            "significantLink": [
              "https://roteirosdedispensacao.com/chat",
              "https://roteirosdedispensacao.com/vida-com-hanseniase",
              "https://roteirosdedispensacao.com/sobre-a-tese"
            ],
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Início",
                  "item": "https://roteirosdedispensacao.com"
                }
              ]
            }
          })
        }}
      />

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

        {/* Barra de Navegação Ligeira */}
        <nav style={{
          position: 'sticky',
          top: '0',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '1rem 0',
          zIndex: 100
        }}>
          <div style={{
            maxWidth: 'min(1200px, 95vw)',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <a
              href="#assistentes"
              style={{
                color: '#003366',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Assistentes
            </a>
            <a
              href="#faq"
              style={{
                color: '#003366',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Dúvidas
            </a>
            <a
              href="#suporte"
              style={{
                color: '#003366',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f9ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Suporte
            </a>
          </div>
        </nav>

        {/* Content */}
        <div className="container" style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: '0',
          paddingBottom: 'clamp(2rem, 8vw, 4rem)',
          paddingLeft: 'clamp(1rem, 4vw, 2rem)',
          paddingRight: 'clamp(1rem, 4vw, 2rem)'
        }}>
          {/* Header Institucional - Colado na navegação */}
          <div style={{ 
            maxWidth: 'min(1200px, 92vw)', 
            margin: '0 auto',
            marginBottom: '2rem',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            background: 'white',
            borderRadius: '0 0 clamp(8px, 2vw, 12px) clamp(8px, 2vw, 12px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            borderTop: 'none',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <HierarchyHeading level="h1" style={{ 
                textAlign: 'center',
                margin: 0
              }}>
                Roteiros de Dispensação
              </HierarchyHeading>
            </div>
          </div>
          
          {/* Introdução do Sistema */}
          <div className="text-center hierarchy-component">
            <HierarchyText size="large" className="hierarchy-element" style={{ 
              maxWidth: '700px',
              margin: '0 auto',
              textAlign: 'center'
            }}>
              Orientação farmacêutica gratuita para quem trata hanseníase no SUS, 24 h por dia.
              Plataforma baseada em pesquisa de doutorado que oferece orientações sobre a dispensação de medicamentos, baseada em fatos.
            </HierarchyText>
          </div>

          {/* Mobile Quick Actions - ETAPA 4 */}
          {isMobile && (
            <section className="hierarchy-component" style={{ 
              maxWidth: '600px', 
              margin: '2rem auto' 
            }}>
              <HierarchyHeading level="h3" style={{ 
                textAlign: 'center', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <ResourcesIcon size={24} variant="unb" />
                Acesso Rápido
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
            maxWidth: 'min(1400px, 95vw)', 
            margin: '3rem auto',
            padding: '2.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div className="text-center hierarchy-component">
              <HierarchyHeading level="h2" className="hierarchy-element" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <ChatBotIcon size={28} variant="unb" />
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
            <div id="assistentes" className="assistants-container" role="main" aria-label="Seleção de assistentes virtuais">
            
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
                    alt="Avatar do Dr. Gasnelio - Assistente farmacêutico técnico especializado"
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
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#003366',
                  marginBottom: '1rem'
                }}>
                  Dr. Gasnelio
                </h2>
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
                  padding: '1rem 1.5rem',
                  background: '#003366',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <ChatBotIcon size={16} variant="unb" />
                  Conversar com Dr. Gasnelio
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
                    alt="Avatar da Gá - Assistente acolhedora focada em comunicação empática"
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
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#16a34a',
                  marginBottom: '1rem'
                }}>
                  Gá
                </h2>
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
                  padding: '1rem 1.5rem',
                  background: '#059669',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <ChatBotIcon size={16} variant="unb" />
                  Conversar com Gá
                </div>
              </button>
            </div>
            
            
            {/* Perfil dos Assistentes e Guia de Escolha */}
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
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <UserCheckIcon size={24} variant="unb" />
                Perfil dos Assistentes - Qual Escolher?
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                {/* Dr. Gasnelio Profile & Guide */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #bfdbfe'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#003366',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <ChatBotIcon size={20} variant="persona-gasnelio" />
                      Dr. Gasnelio
                    </h4>
                    <p style={{
                      fontSize: '1rem',
                      color: '#0369a1',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Farmacêutico Clínico
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#0369a1', fontSize: '0.9rem' }}>CARACTERÍSTICAS:</strong>
                    <ul style={{
                      fontSize: '0.85rem',
                      color: '#0c4a6e',
                      lineHeight: '1.5',
                      marginLeft: '1rem',
                      marginTop: '0.25rem'
                    }}>
                      <li>Linguagem técnica e científica</li>
                      <li>Protocolos farmacêuticos detalhados</li>
                      <li>Referências a estudos clínicos</li>
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#0369a1', fontSize: '0.9rem' }}>IDEAL PARA:</strong>
                    <ul style={{
                      fontSize: '0.85rem',
                      color: '#0c4a6e',
                      lineHeight: '1.5',
                      marginLeft: '1rem',
                      marginTop: '0.25rem'
                    }}>
                      <li>Farmacêuticos e médicos</li>
                      <li>Estudantes de ciências da saúde</li>
                      <li>Protocolos clínicos detalhados</li>
                      <li>Cálculos de dosagem</li>
                    </ul>
                  </div>
                  
                  <div style={{
                    background: '#e0f2fe',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#0c4a6e',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    💡 Consultas técnicas e decisão clínica
                  </div>
                </div>

                {/* Gá Profile & Guide */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #bbf7d0'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#16a34a',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <ChatBotIcon size={20} variant="persona-ga" />
                      Gá
                    </h4>
                    <p style={{
                      fontSize: '1rem',
                      color: '#16a34a',
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      Assistente Educacional Empático
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>CARACTERÍSTICAS:</strong>
                    <ul style={{
                      fontSize: '0.85rem',
                      color: '#14532d',
                      lineHeight: '1.5',
                      marginLeft: '1rem',
                      marginTop: '0.25rem'
                    }}>
                      <li>Linguagem simples e acolhedora</li>
                      <li>Explicações didáticas e práticas</li>
                      <li>Comunicação humanizada</li>
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>IDEAL PARA:</strong>
                    <ul style={{
                      fontSize: '0.85rem',
                      color: '#14532d',
                      lineHeight: '1.5',
                      marginLeft: '1rem',
                      marginTop: '0.25rem'
                    }}>
                      <li>Pacientes e familiares</li>
                      <li>Cuidadores e comunidade</li>
                      <li>Orientações sobre qualidade de vida</li>
                      <li>Suporte emocional</li>
                    </ul>
                  </div>
                  
                  <div style={{
                    background: '#dcfce7',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#14532d',
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    💡 Esclarecimentos e apoio durante tratamento
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
                  ✨ <a href="#assistentes" style={{ color: '#003366', textDecoration: 'underline' }}>Clique no assistente de sua preferência acima</a> para iniciar a conversa
                </p>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#4a5568',
                  margin: 0
                }}>
                  Ambos foram treinados com o conteúdo completo da pesquisa de doutorado
                </p>
              </div>
            </div>
          </div>


          {/* Sobre a Pesquisa Section */}
          <section style={{
            maxWidth: 'min(1200px, 92vw)',
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
              <div style={{ textAlign: 'left', maxWidth: 'min(1000px, 90vw)', margin: '0 auto 2.5rem' }}>
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
                  color: '#4a5568',
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
                  color: '#4a5568',
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
                  color: '#4a5568',
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

          {/* Seção FAQ */}
          <section id="faq" style={{
            maxWidth: 'min(1200px, 92vw)',
            margin: '4rem auto',
            padding: '2.5rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#374151',
              textAlign: 'center',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <HelpIcon size={32} color="#374151" />
              Perguntas Frequentes
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '2rem'
            }}>
              <details style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#374151',
                  fontSize: '1.1rem',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  listStyle: 'none'
                }}>
                  Como escolher entre Dr. Gasnelio e Gá?
                  <span style={{
                    fontSize: '1.2rem',
                    transition: 'transform 0.3s ease',
                    color: '#6b7280'
                  }}>▼</span>
                </summary>
                <div style={{ 
                  paddingLeft: '0',
                  paddingRight: '2rem',
                  paddingBottom: '1rem'
                }}>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    Dr. Gasnelio é ideal para <strong>profissionais de saúde e estudantes</strong> que precisam de linguagem técnica, protocolos detalhados e referências científicas. Gá é perfeita para <strong>pacientes, familiares e comunidade</strong> que buscam explicações simples, acolhedoras e apoio emocional.
                  </p>
                </div>
              </details>

              <details style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#374151',
                  fontSize: '1.1rem',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  listStyle: 'none'
                }}>
                  O tratamento PQT-U é gratuito no SUS?
                  <span style={{
                    fontSize: '1.2rem',
                    transition: 'transform 0.3s ease',
                    color: '#6b7280'
                  }}>▼</span>
                </summary>
                <div style={{ 
                  paddingLeft: '0',
                  paddingRight: '2rem',
                  paddingBottom: '1rem'
                }}>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    <strong>Sim!</strong> O tratamento PQT-U (Poliquimioterapia Única) é 100% gratuito em todas as unidades de saúde do SUS. Inclui medicamentos, consultas, exames e acompanhamento completo durante os 6 meses de tratamento.
                  </p>
                </div>
              </details>

              <details style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#374151',
                  fontSize: '1.1rem',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  listStyle: 'none'
                }}>
                  Posso parar o tratamento se me sentir melhor?
                  <span style={{
                    fontSize: '1.2rem',
                    transition: 'transform 0.3s ease',
                    color: '#6b7280'
                  }}>▼</span>
                </summary>
                <div style={{ 
                  paddingLeft: '0',
                  paddingRight: '2rem',
                  paddingBottom: '1rem'
                }}>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    <strong>NUNCA pare o tratamento sem orientação médica!</strong> Mesmo que os sintomas melhorem, é essencial completar os 6 meses completos de PQT-U para garantir a cura e evitar resistência medicamentosa. A hanseníase tem cura, mas apenas com tratamento completo.
                  </p>
                </div>
              </details>

              <details style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#374151',
                  fontSize: '1.1rem',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  listStyle: 'none'
                }}>
                  A hanseníase é contagiosa?
                  <span style={{
                    fontSize: '1.2rem',
                    transition: 'transform 0.3s ease',
                    color: '#6b7280'
                  }}>▼</span>
                </summary>
                <div style={{ 
                  paddingLeft: '0',
                  paddingRight: '2rem',
                  paddingBottom: '1rem'
                }}>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    A hanseníase tem <strong>baixa transmissibilidade</strong> e ocorre apenas através de contato íntimo e prolongado com pessoa não tratada. <strong>Após iniciar o tratamento, a pessoa deixa de transmitir em poucos dias.</strong> Não se transmite por abraços, apertos de mão, objetos ou roupas.
                  </p>
                </div>
              </details>

              <details style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#374151',
                  fontSize: '1.1rem',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  listStyle: 'none'
                }}>
                  Quais são os efeitos colaterais do PQT-U?
                  <span style={{
                    fontSize: '1.2rem',
                    transition: 'transform 0.3s ease',
                    color: '#6b7280'
                  }}>▼</span>
                </summary>
                <div style={{ 
                  paddingLeft: '0',
                  paddingRight: '2rem',
                  paddingBottom: '1rem'
                }}>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    Os efeitos mais comuns incluem: escurecimento da pele (rifampicina), náuseas leves e raramente reações alérgicas. <strong>Todos os efeitos são monitorados pela equipe médica.</strong> Comunique sempre qualquer sintoma novo ao seu médico ou farmacêutico.
                  </p>
                </div>
              </details>

              <details style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '1rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#374151',
                  fontSize: '1.1rem',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  listStyle: 'none'
                }}>
                  Como os familiares devem se cuidar?
                  <span style={{
                    fontSize: '1.2rem',
                    transition: 'transform 0.3s ease',
                    color: '#6b7280'
                  }}>▼</span>
                </summary>
                <div style={{ 
                  paddingLeft: '0',
                  paddingRight: '2rem',
                  paddingBottom: '1rem'
                }}>
                  <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                    Familiares devem fazer <strong>exame dermatoneurológico anual por 5 anos</strong> e podem receber a vacina BCG como prevenção. O convívio normal é seguro - abraços, beijos e vida em família não oferecem risco após o início do tratamento.
                  </p>
                </div>
              </details>
            </div>

            {/* Canais de Suporte */}
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <PhoneIcon size={24} color="#374151" />
                Canais de Suporte
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <strong style={{ color: '#dc2626', fontSize: '1rem' }}>🚨 Emergência Médica</strong>
                  <div style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <strong>SAMU: 192</strong>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('192');
                          addToast({
                            type: 'success',
                            message: 'Número 192 copiado!',
                            duration: 2000
                          });
                        }}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6b7280';
                        }}
                        aria-label="Copiar número do SAMU"
                        title="Copiar número"
                      >
                        📋
                      </button>
                    </div>
                    <strong>Disque Saúde: 136</strong>
                  </div>
                </div>
                
                <div style={{
                  padding: '1rem',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db'
                }}>
                  <strong style={{ color: '#374151', fontSize: '1rem' }}>🏥 Unidade de Saúde</strong>
                  <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
                    Procure sua UBS ou ambulatório de referência para consultas e acompanhamento
                  </p>
                </div>
                
                <div style={{
                  padding: '1rem',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <strong style={{ color: '#374151', fontSize: '1rem' }}>💬 Chat da Plataforma</strong>
                  <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
                    Dr. Gasnelio e Gá disponíveis 24/7 para esclarecimentos
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/contato')}
                style={{
                  marginTop: '1.5rem',
                  padding: '1rem 2rem',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                📧 Mais Contatos e Suporte Técnico
              </button>
            </div>

            {/* Destaque Especial - Em Amarelo */}
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
              borderRadius: '12px',
              border: '2px solid #fbbf24'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: '#92400e',
                margin: 0,
                fontWeight: '700'
              }}>
                ⚠️ <strong>IMPORTANTE:</strong> Esta plataforma é educacional. Em caso de emergência médica, procure atendimento presencial imediatamente.
              </p>
            </div>
          </section>

        </div>
      </div>
      
      {/* UX Analytics Components - Apenas em desenvolvimento */}

      {process.env.NODE_ENV === 'development' && (
        <>
          <CognitiveLoadAuditor />
          <MobileUXAuditor />
        </>
      )}
      
      {/* Welcome Wizard - ETAPA 3 UX TRANSFORMATION */}
      {showWizard && (
        <WelcomeWizard onComplete={handleOnboardingComplete} />
      )}
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} />
    </EducationalLayout>
    </PersonalizationProvider>
  );
}