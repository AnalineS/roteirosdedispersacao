'use client';

import { useRouter } from 'next/navigation';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import PersonaSelector from '@/components/personas/PersonaSelector';
import { getUniversityLogo, getPersonaAvatar } from '@/constants/avatars';
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
          {/* Header Institucional */}
          <div className="flex items-center justify-start mb-5" style={{ maxWidth: '900px', margin: '0 auto 2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <img 
                src={getUniversityLogo('unb_symbol')} 
                alt="Universidade de Brasília"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain'
                }}
              />
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ 
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0',
                  letterSpacing: '-0.02em'
                }}>
                  Roteiros de Dispensação
                </h1>
                <p style={{ 
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.5rem 0 0 0'
                }}>
                  Sistema Inteligente de Orientação • Hanseníase PQT-U
                </p>
              </div>
            </div>
          </div>
          
          {/* Introdução do Sistema */}
          <div className="text-center mb-5">
            <p style={{ 
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.75'
            }}>
              Plataforma baseada em pesquisa de doutorado que oferece orientação especializada 
              para dispensação de medicamentos do programa PQT-U para hanseníase
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

          {/* Seção Sobre a Pesquisa - MOVIDA PARA ANTES */}
          <div style={{ 
            maxWidth: '900px', 
            margin: '3rem auto',
            padding: '2.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div className="text-center" style={{ marginBottom: '2.5rem' }}>
              <h2 style={{
                fontSize: '2.25rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Conheça Seus Assistentes Virtuais
              </h2>
              <p style={{ 
                fontSize: '1.125rem',
                color: '#64748b',
                lineHeight: '1.75',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Dois especialistas em IA, cada um desenvolvido para atender suas necessidades específicas no cuidado farmacêutico
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg" style={{ marginBottom: '2.5rem' }}>
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
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '16px',
                  border: '2px solid #e0f2fe',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%'
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
                aria-label="Selecionar Dr. Gasnelio - O Especialista Técnico"
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                  <img 
                    src={getPersonaAvatar('dr_gasnelio')} 
                    alt="Dr. Gasnelio"
                    style={{
                      width: '100%',
                      height: '100%',
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
                <ul style={{ 
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
                  👨‍⚕️ Clique para conversar
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
                  padding: '2rem',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  borderRadius: '16px',
                  border: '2px solid #dcfce7',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%'
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
                aria-label="Selecionar Gá - A Assistente Acolhedora"
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                  <img 
                    src={getPersonaAvatar('ga')} 
                    alt="Gá"
                    style={{
                      width: '100%',
                      height: '100%',
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
                <ul style={{ 
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
                  🤗 Clique para conversar
                </div>
              </button>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
              borderRadius: '12px',
              border: '1px solid #fef3c7',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '1rem', 
                color: '#92400e', 
                lineHeight: '1.6',
                margin: 0,
                fontWeight: '500'
              }}>
                <strong>Ambos assistentes foram treinados</strong> com o conteúdo completo da pesquisa de doutorado, 
                garantindo respostas baseadas em evidências científicas e diretrizes oficiais do Ministério da Saúde.
              </p>
            </div>
          </div>

          {/* Personalização Avançada (Opcional) */}
          <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
            <p style={{ 
              fontSize: '0.95rem',
              color: '#64748b',
              marginBottom: '1.5rem'
            }}>
              Prefere um atendimento mais personalizado baseado no seu perfil?
            </p>
            
            <details style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'left'
            }}>
              <summary style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                ⚙️ Personalização Avançada
              </summary>
              
              <div style={{ marginTop: '1rem' }}>
                <PersonaSelector 
                  personas={personas}
                  onPersonaSelect={handlePersonaSelect}
                />
              </div>
            </details>
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
            <div className="text-center" style={{ marginBottom: '2.5rem' }}>
              <h2 style={{
                fontSize: '2.25rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Sobre a Pesquisa
              </h2>
              <p style={{
                fontSize: '1.125rem',
                color: '#64748b',
                lineHeight: '1.75',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Conheça os fundamentos científicos por trás desta plataforma educacional
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg" style={{ marginBottom: '2rem' }}>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '1rem'
                }}>
                  Fundamentação Científica
                </h3>
                <ul style={{
                  fontSize: '0.95rem',
                  color: '#475569',
                  lineHeight: '1.6',
                  paddingLeft: '1.5rem'
                }}>
                  <li>Baseado em tese de doutorado em Ciências Farmacêuticas</li>
                  <li>Seguindo diretrizes do PCDT Hanseníase 2022</li>
                  <li>Validado com protocolos do Ministério da Saúde</li>
                  <li>Desenvolvido com metodologia científica rigorosa</li>
                </ul>
              </div>

              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '1rem'
                }}>
                  Objetivos da Pesquisa
                </h3>
                <ul style={{
                  fontSize: '0.95rem',
                  color: '#475569',
                  lineHeight: '1.6',
                  paddingLeft: '1.5rem'
                }}>
                  <li>Melhorar a qualidade da dispensação farmacêutica</li>
                  <li>Reduzir erros relacionados ao PQT-U</li>
                  <li>Capacitar profissionais de saúde</li>
                  <li>Apoiar o cuidado centrado no paciente</li>
                </ul>
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
                📄 <strong>Acesse o conteúdo completo da pesquisa</strong>
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

          {/* Footer Institucional */}
          <footer style={{
            marginTop: '4rem',
            paddingTop: '3rem',
            borderTop: '2px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          }}>
            <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="flex items-center justify-center gap-lg mb-3" style={{ flexWrap: 'wrap' }}>
                <img 
                  src={getUniversityLogo('unb_symbol')} 
                  alt="UnB"
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain'
                  }}
                />
                <div style={{
                  width: '2px',
                  height: '40px',
                  backgroundColor: '#cbd5e1'
                }}></div>
                <img 
                  src={getUniversityLogo('ppgcf_logo')} 
                  alt="PPGCF"
                  style={{
                    width: '60px',
                    height: '50px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Tese de Doutorado - Programa de Pós-Graduação em Ciências Farmacêuticas
              </p>
              
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '1.5rem'
              }}>
                Universidade de Brasília (UnB) • 2025
              </p>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.1)',
                display: 'inline-block'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#3b82f6',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {(() => {
                    const count = getValidPersonasCount();
                    return count > 0 ? count : 2;
                  })()} assistentes especializados disponíveis
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </EducationalLayout>
  );
}