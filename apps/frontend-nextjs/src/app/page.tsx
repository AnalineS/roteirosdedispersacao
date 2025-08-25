'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import EducationalLayout from '@/components/layout/EducationalLayout';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getPersonaAvatar } from '@/constants/avatars';
import type { UserProfile } from '@/hooks/useUserProfile';
import React, { Suspense } from 'react';
import { LazyOnScroll } from '@/components/optimization/LazyComponent';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Core components that need to load immediately
import PageTransition, { AnimatedSection } from '@/components/animations/PageTransition';
import { HierarchyHeading, HierarchyText } from '@/components/layout/VisualHierarchyOptimizer';
import { useMobileDetection } from '@/components/mobile/MobileFirstFramework';
import { InteractiveButton, useToast, ToastContainer } from '@/components/ui/MicroInteractions';
import TrustBadges from '@/components/home/TrustBadges';

// Critical components loaded directly to prevent homepage content disappearing
// Only non-essential analytics components remain lazy-loaded
const CognitiveLoadAuditor = React.lazy(() => import('@/components/analytics/CognitiveLoadAuditor').then(mod => ({ default: mod.CognitiveLoadAuditor })).catch(() => ({ default: () => null })));
const MobileUXAuditor = React.lazy(() => import('@/components/analytics/MobileUXAuditor').then(mod => ({ default: mod.MobileUXAuditor })).catch(() => ({ default: () => null })));

// Direct imports for critical components to ensure they always load
import QuickStartGuide from '@/components/onboarding/QuickStartGuide';
// Import helper functions (these are lightweight)
import { createEducationalContentChunk, createMedicalContentChunk } from '@/components/content/ContentChunkingStrategy';
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
import { 
  CheckIcon, 
  ChatIcon, 
  BookIcon, 
  SupportIcon, 
  TargetIcon, 
  DoctorIcon, 
  QuestionIcon,
  GovernmentIcon,
  HospitalIcon,
  UniversityIcon,
  AlertIcon,
  BulbIcon,
  HeartIcon,
  FamilyIcon,
  EmailIcon,
  ClipboardIcon,
  PillIcon
} from '@/components/icons/FlatOutlineIcons';
import { MedicalLoadingSpinner } from '@/components/ui/LoadingStates';
import dynamic from 'next/dynamic';


// Direct imports for personalization components to prevent rendering issues
import PersonalizationProvider from '@/components/personalization/PersonalizationProvider';
import PersonalizedDashboard from '@/components/personalization/PersonalizedDashboard';


export default function HomePage() {
  // Always call hooks at the top level - React requirement
  const personasHook = usePersonas();
  const userProfileHook = useUserProfile();
  const mobileHook = useMobileDetection();
  const toastHook = useToast();
  const router = useRouter();

  // Enhanced safety: Extract values with comprehensive fallbacks and validation
  const hookSafetyCheck = {
    personasValid: personasHook && typeof personasHook === 'object',
    userProfileValid: userProfileHook && typeof userProfileHook === 'object',
    mobileValid: mobileHook && typeof mobileHook === 'object',
    toastValid: toastHook && typeof toastHook === 'object'
  };

  // Log hook validation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[HomePage] Hook Safety Check:', hookSafetyCheck);
  }

  const { personas = {}, loading = false, error = null, getValidPersonasCount = () => 2 } = hookSafetyCheck.personasValid ? personasHook : {};
  const { saveProfile = () => {} } = hookSafetyCheck.userProfileValid ? userProfileHook : {};
  const { isMobile = false } = hookSafetyCheck.mobileValid ? mobileHook : {};
  const { toasts = [], addToast = () => {} } = hookSafetyCheck.toastValid ? toastHook : {};

  // Always show content with enhanced validation
  const shouldShowContent = true;
  const hasValidHooks = Object.values(hookSafetyCheck).some(valid => valid);

  // Only show loading if we're actually loading AND hooks are completely broken
  if (loading && !shouldShowContent && !hasValidHooks) {
    return (
      <div className="flex items-center justify-center" style={{
        minHeight: '30vh',
        backgroundColor: 'transparent'
      }}>
        <div className="text-center">
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #003366',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Only show error if there's an error AND hooks are completely broken
  if (error && !shouldShowContent && !hasValidHooks) {
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
    try {
      const profileWithPersona = {
        ...userProfile,
        selectedPersona: personaId
      };
      
      if (addToast) {
        addToast({
          type: 'success',
          message: `Assistente ${personaId === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'} selecionado com sucesso!`,
          duration: 2000
        });
      }
      
      if (saveProfile) {
        saveProfile(profileWithPersona);
      }
      
      if (router && router.push) {
        setTimeout(() => router.push('/chat'), 800);
      }
    } catch (error) {
      console.error('Error in handlePersonaSelect:', error);
      // Fallback: Navigate directly
      if (typeof window !== 'undefined') {
        window.location.href = '/chat';
      }
    }
  };


  // Safe render with error boundary
  try {
    return (
      <EducationalLayout showBreadcrumbs={false}>
        <PageTransition>
          {/* PersonalizationProvider with error boundary */}
          <div>
            {(() => {
              try {
                return (
                  <PersonalizationProvider>
                    {/* Quick Start Guide - Direct loading for reliability */}
                    <div style={{ marginBottom: '1rem' }}>
                      {(() => {
                        try {
                          return (
                            <QuickStartGuide onComplete={() => {
                              if (typeof addToast === 'function') {
                                addToast({
                                  type: 'success',
                                  message: 'Guia concluído! Agora você está pronto para usar a plataforma.',
                                  duration: 3000
                                });
                              }
                            }} />
                          );
                        } catch (guideError) {
                          console.warn('[HomePage] QuickStartGuide failed to render:', guideError);
                          return null;
                        }
                      })()}
                    </div>

                    {/* Hero Section with error boundary */}
                    {(() => {
                      try {
                        return (
                          <AnimatedSection animation="fadeInUp" delay={200}>
                            <HeroSection />
                          </AnimatedSection>
                        );
                      } catch (heroError) {
                        console.warn('[HomePage] HeroSection failed to render:', heroError);
                        return (
                          <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', margin: '1rem 0' }}>
                            <h1 style={{ color: '#003366', fontSize: '2rem', marginBottom: '1rem' }}>Roteiros de Dispensação</h1>
                            <p style={{ color: '#0066cc' }}>Sistema de orientação para dispensação de medicamentos - Hanseníase</p>
                          </div>
                        );
                      }
                    })()}

                    {/* Features Section with error boundary */}
                    {(() => {
                      try {
                        return (
                          <AnimatedSection animation="fadeInUp" delay={400}>
                            <FeaturesSection />
                          </AnimatedSection>
                        );
                      } catch (featuresError) {
                        console.warn('[HomePage] FeaturesSection failed to render:', featuresError);
                        return null;
                      }
                    })()}

                    {/* Trust Badges with error boundary */}
                    {(() => {
                      try {
                        return (
                          <AnimatedSection animation="fadeInUp" delay={600}>
                            <TrustBadges />
                          </AnimatedSection>
                        );
                      } catch (trustError) {
                        console.warn('[HomePage] TrustBadges failed to render:', trustError);
                        return null;
                      }
                    })()}

                    {/* Dashboard Personalizado - With error boundary */}
                    {(() => {
                      try {
                        return (
                          <div className="mb-8">
                            <PersonalizedDashboard className="mb-8" />
                          </div>
                        );
                      } catch (dashboardError) {
                        console.warn('[HomePage] PersonalizedDashboard failed to render:', dashboardError);
                        return null;
                      }
                    })()}

                    {/* Main Assistants Section - Always display core content */}
                    <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
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
              background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
              zIndex: 0
            }}></div>

            {/* Content */}
            <div className="container" style={{
              position: 'relative',
              zIndex: 1,
              paddingTop: '0',
              paddingBottom: 'clamp(2rem, 8vw, 4rem)',
              paddingLeft: 'clamp(1rem, 4vw, 2rem)',
              paddingRight: 'clamp(1rem, 4vw, 2rem)'
            }}>
              {/* Header Institucional */}
              <div style={{ 
                maxWidth: 'min(1200px, 92vw)', 
                margin: '2rem auto',
                marginBottom: '2rem',
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: 'white',
                borderRadius: 'clamp(8px, 2vw, 12px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <HierarchyHeading level="h1" style={{ 
                    textAlign: 'center',
                    margin: 0,
                    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                    fontWeight: '800',
                    color: 'var(--accent-primary)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.2'
                  }}>
                    Roteiros de Dispensação
                  </HierarchyHeading>
                  <div style={{
                    fontSize: 'clamp(1rem, 2.2vw, 1.3rem)',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginTop: '0.5rem',
                    opacity: 0.9
                  }}>
                    Hanseníase • PQT-U • SUS
                  </div>
                </div>
                
                <div className="text-center hierarchy-component">
                  <HierarchyText size="large" className="hierarchy-element" style={{ 
                    maxWidth: '700px',
                    margin: '0 auto',
                    textAlign: 'center'
                  }}>
                    <strong>Assistentes virtuais especializados em hanseníase</strong> disponíveis 24h para esclarecer dúvidas sobre medicamentos, efeitos colaterais e cuidados durante o tratamento PQT-U no SUS.
                  </HierarchyText>
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default)',
                    fontSize: '0.9rem',
                    color: '#374151'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckIcon size={16} color="#059669" /> <strong>Baseado em pesquisa científica UnB</strong>
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckIcon size={16} color="#059669" /> <strong>Gratuito e seguro</strong>
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckIcon size={16} color="#059669" /> <strong>Linguagem clara e acessível</strong>
                      </span>
                    </span>
                  </div>
                  
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    border: '2px solid #0066cc',
                    fontSize: '0.85rem',
                    color: '#003366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GovernmentIcon size={16} color="#003366" /> Ministério da Saúde
                    </span>
                    <span>•</span>
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HospitalIcon size={16} color="#003366" /> Sistema Único de Saúde (SUS)
                    </span>
                    <span>•</span>
                    <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UniversityIcon size={16} color="#003366" /> Universidade de Brasília (UnB)
                    </span>
                  </div>
                </div>
              </div>

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
                      O Especialista em Medicamentos
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
                      <li>💊 Explica como tomar os remédios corretamente</li>
                      <li>📋 Usa informações oficiais do Ministério da Saúde</li>
                      <li>👨‍⚕️ Ideal para profissionais de saúde</li>
                      <li>🎯 Respostas precisas e baseadas em ciência</li>
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
                      justifyContent: 'center'
                    }}>
                      Conversar com Dr. Gasnelio
                    </div>
                  </button>

                  {/* Gá Card - Clickable */}
                  <button
                    onClick={() => {
                      const userProfile = {
                        type: 'patient' as const,
                        focus: 'empathetic' as const,
                        confidence: 0.9,
                        explanation: 'Selecionado diretamente pelo perfil empático'
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
                      e.currentTarget.style.borderColor = '#00aa44';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#dcfce7';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.2)';
                      e.currentTarget.style.borderColor = '#00aa44';
                      e.currentTarget.style.outline = '3px solid #00aa44';
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
                    aria-label="Selecionar Assistente Educadora - A Assistente Acolhedora"
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
                        alt="Avatar da Assistente Educadora - Assistente acolhedora e empática"
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
                      color: '#00aa44',
                      marginBottom: '1rem'
                    }}>
                      Assistente Educadora
                    </h2>
                    <p style={{ 
                      fontSize: '1rem', 
                      color: '#00aa44', 
                      fontWeight: '600',
                      marginBottom: '1rem'
                    }}>
                      A Companheira no Tratamento
                    </p>
                    <ul 
                      id="ga-description"
                      style={{ 
                        fontSize: '0.9rem', 
                        color: '#00aa44', 
                        textAlign: 'left',
                        paddingLeft: '1.5rem',
                        lineHeight: '1.6',
                        marginBottom: '1.5rem'
                      }}>
                      <li>🤗 Conversa com carinho e compreensão</li>
                      <li>💚 Ajuda a lidar com preocupações e medos</li>
                      <li>👨‍👩‍👧‍👦 Ideal para pacientes e familiares</li>
                      <li>🌸 Linguagem simples e acolhedora</li>
                    </ul>
                    
                    <div style={{
                      padding: '1rem 1.5rem',
                      background: '#00aa44',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      Conversar com Assistente Educadora
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Para Pacientes */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
            padding: '3rem 0',
            marginTop: '3rem'
          }}>
            <div style={{
              maxWidth: 'min(1200px, 95vw)',
              margin: '0 auto',
              padding: '0 1rem'
            }}>
              <HierarchyHeading level="h2" style={{
                textAlign: 'center',
                marginBottom: '2rem',
                color: '#00aa44',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <HeartIcon size={28} color="#00aa44" />
                Área do Paciente
              </HierarchyHeading>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Card: Primeiros Passos */}
                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0, 170, 68, 0.1)',
                  border: '2px solid #00aa4420'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <CheckIcon size={24} color="#00aa44" />
                    <h3 style={{ color: '#00aa44', fontSize: '1.1rem', margin: 0 }}>
                      Primeiros Passos
                    </h3>
                  </div>
                  <ul style={{
                    fontSize: '0.9rem',
                    color: '#4a5568',
                    paddingLeft: '1.5rem',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    <li>Converse com a Assistente Educadora</li>
                    <li>Entenda seu tratamento</li>
                    <li>Tire suas dúvidas sem medo</li>
                    <li>Acompanhe sua evolução</li>
                  </ul>
                </div>

                {/* Card: Apoio Emocional */}
                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0, 170, 68, 0.1)',
                  border: '2px solid #00aa4420'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <FamilyIcon size={24} color="#00aa44" />
                    <h3 style={{ color: '#00aa44', fontSize: '1.1rem', margin: 0 }}>
                      Apoio Emocional
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#4a5568',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Não está sozinho! Nossa assistente Gá oferece suporte emocional
                    e ajuda você a entender cada etapa do tratamento com carinho e paciência.
                  </p>
                </div>

                {/* Card: Vida Normal */}
                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0, 170, 68, 0.1)',
                  border: '2px solid #00aa4420'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <StarIcon size={24} color="#00aa44" />
                    <h3 style={{ color: '#00aa44', fontSize: '1.1rem', margin: 0 }}>
                      Vida Normal
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#4a5568',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Com o tratamento correto, você pode ter uma vida completamente normal.
                    Trabalhar, estudar e conviver com família e amigos sem restrições.
                  </p>
                </div>
              </div>

              {/* CTA para pacientes */}
              <div style={{
                textAlign: 'center',
                marginTop: '2rem'
              }}>
                <Link href="/chat?persona=ga" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #00aa44 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 14px rgba(0, 170, 68, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 170, 68, 0.4)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 170, 68, 0.3)';
                }}>
                  <HeartIcon size={20} color="white" />
                  Conversar com a Assistente Educadora
                </Link>
              </div>
            </div>
          </div>

          {/* Seção FAQ - Perguntas Frequentes (última seção antes do footer) */}
          <div style={{
            maxWidth: 'min(1200px, 95vw)',
            margin: '3rem auto',
            padding: '2rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <HierarchyHeading level="h2" style={{
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#003366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              <QuestionIcon size={28} color="#003366" />
              Perguntas Frequentes
            </HierarchyHeading>

            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {[
                {
                  pergunta: "O tratamento da hanseníase tem cura?",
                  resposta: "Sim! A hanseníase tem cura quando o tratamento PQT-U é seguido corretamente por 6 meses."
                },
                {
                  pergunta: "Posso parar de tomar os remédios se me sentir melhor?",
                  resposta: "Não! É fundamental completar todo o tratamento mesmo se os sintomas melhorarem."
                },
                {
                  pergunta: "Os assistentes virtuais substituem a consulta médica?",
                  resposta: "Não. Nossos assistentes são ferramentas educacionais que complementam, mas não substituem o acompanhamento médico."
                },
                {
                  pergunta: "É seguro compartilhar minhas dúvidas com os assistentes?",
                  resposta: "Sim! Suas conversas são privadas e protegidas. Não armazenamos dados pessoais identificáveis."
                },
                {
                  pergunta: "Como posso acessar o material educativo?",
                  resposta: "Clique em 'Material Educativo' no menu ou converse com nossos assistentes que podem direcionar você."
                },
                {
                  pergunta: "Preciso pagar para usar a plataforma?",
                  resposta: "Não! Nossa plataforma é 100% gratuita, desenvolvida como ferramenta educacional pública."
                }
              ].map((item, index) => (
                <div key={index} style={{
                  padding: '1.25rem',
                  background: index % 2 === 0 ? '#f0f9ff' : '#f0fdf4',
                  borderRadius: '8px',
                  border: `1px solid ${index % 2 === 0 ? '#0066cc20' : '#00aa4420'}`
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: index % 2 === 0 ? '#003366' : '#00aa44',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <QuestionIcon size={18} color={index % 2 === 0 ? '#003366' : '#00aa44'} />
                    {item.pergunta}
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#4a5568',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {item.resposta}
                  </p>
                </div>
              ))}
                  </div>
                </div>

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

          {/* UX Analytics Components - Apenas em desenvolvimento com error handling */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <Suspense fallback={null}>
                <CognitiveLoadAuditor />
              </Suspense>
              <Suspense fallback={null}>
                <MobileUXAuditor />
              </Suspense>
            </>
          )}
          
                  </PersonalizationProvider>
                );
              } catch (providerError) {
                console.warn('[HomePage] PersonalizationProvider failed:', providerError);
                // Return content without PersonalizationProvider wrapper
                return (
                  <div>
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', margin: '1rem 0' }}>
                      <h1 style={{ color: '#003366', fontSize: '2rem', marginBottom: '1rem' }}>Roteiros de Dispensação</h1>
                      <p style={{ color: '#0066cc' }}>Sistema de orientação para dispensação de medicamentos - Hanseníase</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} />
      </PageTransition>
    </EducationalLayout>
  );
  } catch (renderError) {
    console.error('Error rendering HomePage:', renderError);
    
    // Fallback simple homepage
    return (
      <div style={{ 
        minHeight: '100vh', 
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <header style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: '#003366',
            marginBottom: '1rem'
          }}>
            Roteiros de Dispensação
          </h1>
          <p style={{ 
            fontSize: '1.2rem',
            color: '#0066cc',
            fontWeight: '600'
          }}>
            Hanseníase • PQT-U • SUS
          </p>
        </header>
        
        <main style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '2rem',
            color: '#003366',
            marginBottom: '2rem'
          }}>
            Assistentes Virtuais Especializados
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '16px',
              border: '2px solid #e0f2fe'
            }}>
              <h3 style={{ color: '#003366', fontSize: '1.5rem' }}>Dr. Gasnelio</h3>
              <p style={{ color: '#0066cc' }}>O Especialista em Medicamentos</p>
              <a href="/chat?persona=dr_gasnelio" style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#003366',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                Conversar com Dr. Gasnelio
              </a>
            </div>
            
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '16px',
              border: '2px solid #dcfce7'
            }}>
              <h3 style={{ color: '#00aa44', fontSize: '1.5rem' }}>Assistente Educadora</h3>
              <p style={{ color: '#059669' }}>A Companheira no Tratamento</p>
              <a href="/chat?persona=ga" style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#00aa44',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                Conversar com Assistente Educadora
              </a>
            </div>
          </div>
          
          <p style={{ 
            color: '#666',
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}>
            Sistema temporariamente em modo simplificado. Funcionalidades básicas disponíveis.
          </p>
        </main>
      </div>
    );
  }
}