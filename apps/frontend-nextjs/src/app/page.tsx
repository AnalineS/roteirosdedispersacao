'use client';

import { useRouter } from 'next/navigation';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import PersonaSelector from '@/components/personas/PersonaSelector';
import type { UserProfile } from '@/hooks/useUserProfile';

export default function HomePage() {
  const { personas, loading, error, getValidPersonasCount } = usePersonas();
  const { saveProfile } = useUserProfile();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              backgroundColor: '#e2e8f0',
              margin: '0 auto'
            }}></div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Carregando assistentes...</p>
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
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const handlePersonaSelect = (personaId: string, userProfile: UserProfile) => {
    const profileWithPersona = {
      ...userProfile,
      selectedPersona: personaId
    };
    
    saveProfile(profileWithPersona);
    router.push('/chat');
  };

  return (
    <EducationalLayout showSidebar={false} showBreadcrumbs={false}>
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
          {/* Logo/Header Section */}
          <div className="text-center mb-5">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              backgroundColor: '#0284c7',
              borderRadius: '16px',
              marginBottom: '2rem',
              boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.2)'
            }}>
              <span style={{ 
                color: 'white', 
                fontSize: '2rem', 
                fontWeight: '700'
              }}>RD</span>
            </div>
            
            <h1 style={{ 
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              Roteiros de Dispensação
            </h1>
            
            <p style={{ 
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.75'
            }}>
              Sistema inteligente de orientação para dispensação de medicamentos do programa PQT-U para hanseníase
            </p>
          </div>

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

          {/* Persona Selector with new styling */}
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 className="text-center" style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '2rem'
            }}>
              Escolha seu assistente virtual
            </h2>
            <PersonaSelector 
              personas={personas}
              onPersonaSelect={handlePersonaSelect}
            />
          </div>

          {/* About the Thesis Section */}
          <div style={{ 
            maxWidth: '900px', 
            margin: '4rem auto',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="text-center" style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Sobre a Pesquisa
              </h2>
              <p style={{ 
                fontSize: '1.125rem',
                color: '#64748b',
                lineHeight: '1.75'
              }}>
                Conheça a pesquisa de doutorado que fundamenta esta plataforma
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg" style={{ marginBottom: '2rem' }}>
              <div>
                <h4 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#0284c7',
                  marginBottom: '1rem'
                }}>
                  Motivação
                </h4>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#64748b', 
                  lineHeight: '1.6',
                  marginBottom: '1rem'
                }}>
                  Como tornar o momento da dispensação mais humano, seguro e eficaz? 
                  Esta tese nasceu da necessidade de padronizar e humanizar o cuidado farmacêutico.
                </p>
                <ul style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b', 
                  paddingLeft: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  <li>Padronização no processo de dispensação</li>
                  <li>Melhoria na comunicação farmacêutico-paciente</li>
                  <li>Protocolos específicos para hanseníase/PQT-U</li>
                </ul>
              </div>

              <div>
                <h4 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#0284c7',
                  marginBottom: '1rem'
                }}>
                  Resultados
                </h4>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: '#64748b', 
                  lineHeight: '1.6',
                  marginBottom: '1rem'
                }}>
                  Primeiro roteiro validado especificamente para PQT-U no Brasil, 
                  com impacto comprovado na qualidade do cuidado farmacêutico.
                </p>
                <ul style={{ 
                  fontSize: '0.9rem', 
                  color: '#64748b', 
                  paddingLeft: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  <li>Alto grau de concordância entre especialistas</li>
                  <li>Melhoria na adesão terapêutica</li>
                  <li>Ferramenta pronta para implementação no SUS</li>
                </ul>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              border: '1px solid #e0f2fe',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                color: '#0369a1',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Dr. Gasnelio - Assistente de IA
              </h3>
              <p style={{ 
                fontSize: '0.95rem', 
                color: '#0369a1', 
                lineHeight: '1.6',
                margin: 0
              }}>
                Esta plataforma representa a <strong>evolução digital da tese</strong>, 
                tornando o conhecimento científico acessível através de inteligência artificial. 
                Dr. Gasnelio foi treinado com todo conteúdo da pesquisa e oferece suporte 
                baseado em evidências para aprimorar a prática farmacêutica.
              </p>
            </div>

            <div className="text-center">
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem'
              }}>
                <strong>Tese de Doutorado</strong> - Programa de Pós-Graduação em Ciências Farmacêuticas
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#cbd5e1'
              }}>
                Universidade de Brasília (UnB) • 2025
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center" style={{
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#94a3b8',
              marginBottom: '0.5rem'
            }}>
              Desenvolvido pela Universidade de Brasília
            </p>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#cbd5e1'
            }}>
              {getValidPersonasCount()} assistentes especializados disponíveis
            </p>
          </div>
        </div>
      </div>
    </EducationalLayout>
  );
}