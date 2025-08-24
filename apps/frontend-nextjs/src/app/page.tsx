'use client';

import { useRouter } from 'next/navigation';
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

// Heavy components loaded lazily using React.lazy
const TrustBadges = React.lazy(() => import('@/components/home/TrustBadges'));
const QuickStartGuide = React.lazy(() => import('@/components/onboarding/QuickStartGuide'));
const ExecutiveSummary = React.lazy(() => import('@/components/summary/ExecutiveSummary'));
const CognitiveLoadAuditor = React.lazy(() => import('@/components/analytics/CognitiveLoadAuditor').then(mod => ({ default: mod.CognitiveLoadAuditor })));
const MobileUXAuditor = React.lazy(() => import('@/components/analytics/MobileUXAuditor').then(mod => ({ default: mod.MobileUXAuditor })));

// Content and animation components for lower sections
const ContentChunking = React.lazy(() => import('@/components/content/ContentChunkingStrategy'));
const MobileQuickActions = React.lazy(() => import('@/components/mobile/MedicalMobileComponents').then(mod => ({ default: mod.MobileQuickActions })));
const ScrollAnimation = React.lazy(() => import('@/components/ui/AnimationSystem').then(mod => ({ default: mod.ScrollAnimation })));
const CardReveal = React.lazy(() => import('@/components/ui/AnimationSystem').then(mod => ({ default: mod.CardReveal })));
const MedicalAnimation = React.lazy(() => import('@/components/ui/AnimationSystem').then(mod => ({ default: mod.MedicalAnimation })));
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
  const { isMobile } = useMobileDetection();
  const { toasts, addToast } = useToast();
  const router = useRouter();

  if (loading) {
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


  return (
    <EducationalLayout showBreadcrumbs={false}>
      <PageTransition>
        <PersonalizationProvider>
          {/* Quick Start Guide - Only load when needed */}
          <Suspense fallback={<div />}>
            <QuickStartGuide onComplete={() => {
              addToast({
                type: 'success',
                message: 'Guia concluído! Agora você está pronto para usar a plataforma.',
                duration: 3000
              });
            }} />
          </Suspense>

          {/* Hero Section */}
          <AnimatedSection animation="fadeInUp" delay={200}>
            <HeroSection />
          </AnimatedSection>

          {/* Features Section */}
          <AnimatedSection animation="fadeInUp" delay={400}>
            <FeaturesSection />
          </AnimatedSection>

        {/* Trust Badges - Lazy loaded */}
        <LazyOnScroll 
          fallback={<div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner size="lg" message="Carregando seção de credibilidade..." />
          </div>}
          rootMargin="100px"
        >
          <AnimatedSection animation="fadeInUp" delay={600}>
            <Suspense fallback={<LoadingSpinner size="lg" message="Carregando badges..." />}>
              <TrustBadges />
            </Suspense>
          </AnimatedSection>
        </LazyOnScroll>

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

          {/* UX Analytics Components - Apenas em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <CognitiveLoadAuditor />
              <MobileUXAuditor />
            </>
          )}
          
          {/* Toast Container */}
          <ToastContainer toasts={toasts} />
        </PersonalizationProvider>
      </PageTransition>
    </EducationalLayout>
  );
}
