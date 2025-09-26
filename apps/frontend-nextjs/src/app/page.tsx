import Link from 'next/link';
import StaticEducationalLayout from '@/components/layout/StaticEducationalLayout';
import HeroSection from '@/components/home/HeroSection';
import PersonaSelectorUnified from '@/components/home/PersonaSelectorUnified';
import TrustBadges from '@/components/home/TrustBadges';
import ClientToastContainer from '@/components/ui/ClientToastContainer';
import ClientAnalytics from '@/components/analytics/ClientAnalytics';
import React, { Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Server-side components
import { HierarchyHeading, HierarchyText } from '@/components/layout/VisualHierarchyOptimizer';

// Components are now imported directly

// Icons
import { 
  ChatIcon,
  BookIcon,
  GovernmentIcon,
  HospitalIcon,
  UniversityIcon,
  BulbIcon,
  HeartIcon,
  FamilyIcon,
  EmailIcon,
  ClipboardIcon,
  PillIcon
} from '@/components/icons/FlatOutlineIcons';

export default function HomePage() {
  return (
    <StaticEducationalLayout>
      {/* Hero Section with Search */}
      <HeroSection />
      
      {/* Trust Badges Section */}
      <section style={{ 
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '0',
        padding: '2rem 0',
        margin: '0'
      }}>
        <div style={{ 
          width: '100%',
          margin: '0 auto',
          padding: '0 clamp(1rem, 3vw, 4rem)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            fontSize: '0.9rem',
            color: '#6b7280'
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
      </section>

      {/* Persona Selector - Client Component */}
      <Suspense fallback={
        <div style={{ 
          width: '100%',
          margin: '3rem auto',
          padding: '2.5rem clamp(1rem, 3vw, 4rem)',
          textAlign: 'center'
        }}>
          <LoadingSpinner />
          <p>Carregando assistentes virtuais...</p>
        </div>
      }>
        <PersonaSelectorUnified />
      </Suspense>

      {/* Static Features Section */}
      <section style={{ 
        width: '100%',
        margin: '3rem auto',
        padding: '2rem clamp(1rem, 3vw, 4rem)'
      }}>
        <div className="text-center hierarchy-component" style={{ marginBottom: '3rem' }}>
          <HierarchyHeading level="h2" style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#003366',
            marginBottom: '1rem'
          }}>
            Recursos Educacionais
          </HierarchyHeading>
          <HierarchyText size="large" style={{ 
            maxWidth: '600px',
            margin: '0 auto',
            color: '#6b7280',
            fontSize: '1.125rem'
          }}>
            Ferramentas e conteúdo desenvolvidos para apoiar o cuidado farmacêutico na hanseníase
          </HierarchyText>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          {/* Módulos Educacionais */}
          <Link href="/modules" style={{
            display: 'block',
            padding: '2rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#003366',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BookIcon size={24} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#003366',
                margin: 0
              }}>
                Módulos Educacionais
              </h3>
            </div>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              Conteúdo estruturado sobre hanseníase, tratamento PQT-U e cuidado farmacêutico
            </p>
          </Link>

          {/* Recursos Práticos */}
          <Link href="/resources" style={{
            display: 'block',
            padding: '2rem',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '16px',
            border: '1px solid #e0f2fe',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#0284c7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClipboardIcon size={24} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#0284c7',
                margin: 0
              }}>
                Recursos Práticos
              </h3>
            </div>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              Calculadora de doses, checklist de dispensação e ferramentas práticas
            </p>
          </Link>

          {/* Chat Interativo */}
          <Link href="/chat" style={{
            display: 'block',
            padding: '2rem',
            background: 'linear-gradient(135deg, #fef3e2 0%, #fde68a 100%)',
            borderRadius: '16px',
            border: '1px solid #fde68a',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#f59e0b',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ChatIcon size={24} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#92400e',
                margin: 0
              }}>
                Chat Interativo
              </h3>
            </div>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0
            }}>
              Converse com assistentes virtuais especializados em hanseníase
            </p>
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Footer de Contato */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #003366 100%)',
        color: 'white',
        padding: '3rem 0',
        marginTop: '4rem'
      }}>
        <div style={{ 
          width: '100%',
          margin: '0 auto',
          padding: '0 clamp(1rem, 3vw, 4rem)',
          textAlign: 'center'
        }}>
          <HierarchyHeading level="h2" style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: 'white'
          }}>
            Precisa de Ajuda?
          </HierarchyHeading>
          <p style={{ 
            fontSize: '1.1rem',
            marginBottom: '2rem',
            color: '#cbd5e1'
          }}>
            Nossa equipe está disponível para apoiar profissionais de saúde
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <EmailIcon size={20} color="#cbd5e1" />
              <span>Disque Saúde: 136</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HospitalIcon size={20} color="#cbd5e1" />
              <span>Unidade de Saúde mais próxima</span>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Container - Client Component */}
      <Suspense fallback={null}>
        <ClientToastContainer />
      </Suspense>

      {/* Analytics Components - Development Only */}
      <ClientAnalytics />
    </StaticEducationalLayout>
  );
}