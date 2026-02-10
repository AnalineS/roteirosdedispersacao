'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import StaticEducationalLayout from '@/components/layout/StaticEducationalLayout';
import ClientToastContainer from '@/components/ui/ClientToastContainer';
import ClientAnalytics from '@/components/analytics/ClientAnalytics';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { UserProfile } from '@/types/auth';

export default function HomePage() {
  const router = useRouter();
  const userProfileHook = useUserProfile();
  const { saveProfile = () => {} } = userProfileHook && typeof userProfileHook === 'object' ? userProfileHook : {};

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handlePersonaSelect = (personaId: 'dr_gasnelio' | 'ga') => {
    const userProfile: UserProfile = {
      uid: 'temp-' + Date.now(),
      type: personaId === 'dr_gasnelio' ? 'professional' : 'patient',
      focus: personaId === 'dr_gasnelio' ? 'technical' : 'empathetic',
      confidence: 0.9,
      explanation: `Selecionado diretamente - ${personaId}`,
      preferences: {
        language: personaId === 'dr_gasnelio' ? 'technical' : 'simple',
        notifications: true,
        theme: 'auto',
        emailUpdates: false,
        dataCollection: true,
        lgpdConsent: true
      },
      history: {
        lastPersona: personaId,
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
        favoritePersona: personaId,
        completionRate: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };
    saveProfile(userProfile);
    router.push('/chat');
  };

  const faqItems = [
    { question: 'Como escolher entre Dr. Gasnelio e Gá?', answer: 'Dr. Gasnelio é ideal para profissionais de saúde e estudantes que precisam de informações técnicas e referências científicas. Gá é recomendado para pacientes e familiares que preferem explicações simples e acolhimento emocional.' },
    { question: 'O tratamento PQT-U é gratuito no SUS?', answer: 'Sim, o tratamento da hanseníase com PQT-U (Poliquimioterapia Única) é totalmente gratuito pelo Sistema Único de Saúde (SUS) em todo o Brasil.' },
    { question: 'Posso parar o tratamento se me sentir melhor?', answer: 'Não. É essencial completar todo o tratamento prescrito, mesmo que os sintomas melhorem. Interromper o tratamento pode causar resistência bacteriana e recidiva da doença.' },
    { question: 'A hanseníase é contagiosa?', answer: 'A hanseníase tem baixa transmissibilidade. Após iniciar o tratamento, a pessoa deixa de transmitir a doença. O convívio social é seguro e o preconceito deve ser combatido.' },
    { question: 'Quais são os efeitos colaterais do PQT-U?', answer: 'Os efeitos mais comuns incluem alteração na cor da pele (clofazimina), urina avermelhada (rifampicina) e, raramente, anemia. A maioria é temporária e reversível.' },
    { question: 'Como os familiares devem se cuidar?', answer: 'Familiares devem fazer exame dermatológico periódico e podem receber quimioprofilaxia preventiva conforme orientação médica. O acompanhamento regular é importante.' }
  ];

  return (
    <StaticEducationalLayout>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        background: 'white'
      }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontWeight: '700',
          color: '#003366',
          marginBottom: '1rem'
        }}>
          Roteiros de Dispensação
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#374151',
          maxWidth: '700px',
          margin: '0 auto 0.5rem',
          lineHeight: '1.6'
        }}>
          Orientação farmacêutica gratuita para quem se trata no SUS, 24 h por dia.
        </p>
        <p style={{
          fontSize: '0.95rem',
          color: '#6b7280',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Plataforma baseada em pesquisa de doutorado que oferece orientações sobre a dispensação de medicamentos, baseada em fatos.
        </p>
      </section>

      {/* Assistentes Virtuais Section */}
      <section style={{
        background: '#f8fafc',
        padding: '3rem 1.5rem',
        borderRadius: '24px',
        margin: '0 1rem 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#003366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>👥</span>
            Conheça Seus Assistentes Virtuais
          </h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Dois assistentes virtuais, cada um desenvolvido para atender suas necessidades específicas no cuidado farmacêutico.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {/* Dr. Gasnelio Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #e0f2fe'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #003366 0%, #1e3a8a 100%)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                👨‍⚕️
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#003366', margin: '0' }}>
                Dr. Gasnelio
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
                O Farmacêutico Clínico
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
              {[
                'Respostas detalhadas e científicas',
                'Referências às diretrizes oficiais',
                'Ideal para profissionais e estudantes',
                'Foco em precisão clínica'
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0',
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  <span style={{ color: '#003366' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePersonaSelect('dr_gasnelio')}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#003366',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#001f42'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#003366'}
            >
              Conversar com Dr. Gasnelio
            </button>
          </div>

          {/* Gá Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '2px solid #d1fae5'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                💬
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669', margin: '0' }}>
                Gá
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
                O Assistente Acolhedor
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
              {[
                'Explicações claras e acessíveis',
                'Linguagem humanizada e empática',
                'Ideal para pacientes e familiares',
                'Foco no cuidado integral'
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0',
                  color: '#374151',
                  fontSize: '0.95rem'
                }}>
                  <span style={{ color: '#059669' }}>•</span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePersonaSelect('ga')}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#059669'}
            >
              Conversar com Gá
            </button>
          </div>
        </div>

        {/* Como Escolher */}
        <div style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          margin: '2.5rem auto 0'
        }}>
          <h3 style={{
            textAlign: 'center',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#003366',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span>💡</span> Como escolher?
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <h4 style={{ color: '#003366', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👨‍⚕️</span> Dr. Gasnelio para:
              </h4>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Profissionais de saúde • Estudantes • Linguagem técnica • Protocolos detalhados
              </p>
            </div>
            <div>
              <h4 style={{ color: '#059669', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💬</span> Gá para:
              </h4>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                Pacientes • Familiares • Linguagem simples • Apoio emocional
              </p>
            </div>
          </div>

          <p style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.85rem',
            marginTop: '1.5rem',
            fontStyle: 'italic'
          }}>
            💡 Dica: Você pode alternar entre os assistentes a qualquer momento durante a conversa.
          </p>
        </div>
      </section>

      {/* Sumário Executivo */}
      <section style={{
        padding: '2.5rem 1.5rem',
        background: 'white',
        margin: '0 1rem 2rem',
        borderRadius: '16px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#003366',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0
          }}>
            <span>📋</span> Sumário Executivo
          </h2>
          <Link href="/modules" style={{
            background: '#003366',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Seções relevantes
          </Link>
        </div>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Visão rápida do conteúdo mais relevante
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              title: 'Ajuda Imediata',
              time: 'Imediato+',
              level: 'Geral',
              description: 'Assistentes virtuais Dr. Gasnelio e Gá prontos para esclarecer dúvidas sobre hanseníase, medicamentos e direitos.',
              icon: '🆘',
              priority: true
            },
            {
              title: 'Vida com Hanseníase',
              time: '15 min+',
              level: 'Geral',
              description: 'Qualidade de vida, direitos legais, cuidados familiares e recursos de apoio para pacientes e familiares.',
              icon: '💚',
              priority: true
            },
            {
              title: 'Glossário Médico',
              time: '5 min+',
              level: 'Geral',
              description: 'Definições de termos técnicos, pronúncia e explicações simplificadas para melhor compreensão.',
              icon: '📖',
              priority: false
            }
          ].map((item, i) => (
            <div key={i} style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              {item.priority && (
                <span style={{
                  background: '#dc2626',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  display: 'inline-block'
                }}>
                  PRIORITÁRIO
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  {item.title}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>⏱️ {item.time}</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>• {item.level}</span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.85rem',
          marginTop: '1.5rem'
        }}>
          Tempo total estimado: 20 minutos de leitura
        </p>
      </section>

      {/* Sobre a Pesquisa */}
      <section style={{
        padding: '3rem 1.5rem',
        background: '#f8fafc',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#003366',
          marginBottom: '1.5rem'
        }}>
          Sobre a Pesquisa
        </h2>

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '1rem' }}>
            Essa tese nasceu de uma inquietação comum a muitos profissionais da farmácia: como tornar o momento da dispensação mais humano, seguro e eficaz?
          </p>
          <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '1rem' }}>
            Realizada no âmbito do Programa de Pós-Graduação em Ciências Farmacêuticas da Universidade de Brasília (UnB), a pesquisa propõe a elaboração e validação de um roteiro de dispensação de medicamentos específico para pacientes em tratamento.
          </p>
          <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '2rem' }}>
            Mais do que um guia técnico, é uma ferramenta que valoriza a escuta, a clareza nas orientações e o cuidado centrado no paciente. O objetivo é padronizar e aprimorar o cuidado farmacêutico, aumentando a adesão ao tratamento e a segurança do paciente através de uma comunicação clínica estruturada.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto 2rem'
        }}>
          {[
            {
              icon: '📚',
              title: 'Fundamentação Científica',
              description: 'Baseado em diretrizes do Ministério da Saúde, da OMS e em evidências científicas robustas. Sistema disponível 24/7, garantindo segurança e confiabilidade no ato de dispensação.'
            },
            {
              icon: '💚',
              title: 'Foco no Paciente',
              description: 'Abordagem centrada no paciente, priorizando orientações claras sobre medicamentos, manejo de reações adversas e promoção da autonomia no tratamento com acesso contínuo ao suporte.'
            },
            {
              icon: '✅',
              title: 'Validação Clínica',
              description: 'Rigoroso processo de validação multidisciplinar, assegurando relevância clínica, aplicabilidade prática e atualização constante com diretrizes oficiais.'
            }
          ].map((item, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>{item.icon}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#003366', marginBottom: '0.75rem' }}>
                {item.title}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Conheça mais sobre a pesquisa e equipe
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/sobre" style={{
            background: 'white',
            color: '#003366',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            border: '2px solid #003366',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📄 Ver Roteiro Completo
          </Link>
          <Link href="/equipe" style={{
            background: '#003366',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👥 Conhecer os Pesquisadores
          </Link>
        </div>
      </section>

      {/* Perguntas Frequentes */}
      <section style={{
        padding: '3rem 1.5rem',
        background: 'white',
        margin: '2rem 1rem',
        borderRadius: '16px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#003366',
          textAlign: 'center',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>❓</span> Perguntas Frequentes
        </h2>

        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {faqItems.map((item, i) => (
            <div key={i} style={{
              borderBottom: i < faqItems.length - 1 ? '1px solid #e5e7eb' : 'none'
            }}>
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                style={{
                  width: '100%',
                  padding: '1rem 0',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                aria-expanded={expandedFaq === i}
              >
                <span style={{ color: '#374151', fontWeight: '500', fontSize: '1rem' }}>
                  {item.question}
                </span>
                <span style={{
                  color: '#6b7280',
                  fontSize: '1.25rem',
                  transform: expandedFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </span>
              </button>
              {expandedFaq === i && (
                <div style={{
                  padding: '0 0 1rem',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Canais de Suporte */}
      <section style={{
        padding: '2.5rem 1.5rem',
        background: '#f8fafc'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#003366',
          textAlign: 'center',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>📞</span> Canais de Suporte
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto 2rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>🚨</span> Emergência Médica
            </h3>
            <p style={{ color: '#374151', margin: 0 }}>SAMU: 192</p>
            <p style={{ color: '#374151', margin: 0 }}>Disque Saúde: 136</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#003366', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>🏥</span> Unidade de Saúde
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
              Procure sua UBS ou ambulatório de referência para consultas e acompanhamento
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#003366', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span>🎓</span> Universidade de Brasília
            </h3>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
              Campus Darcy Ribeiro<br />
              Brasília - DF<br />
              CEP: 70910-900
            </p>
          </div>
        </div>

        <div style={{
          background: '#003366',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto 1.5rem'
        }}>
          <span style={{ marginRight: '0.5rem' }}>✉️</span>
          Informações da Pesquisa e Contato em <strong>roteirosdedispensacaounb@gmail.com</strong>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#dc2626',
          fontSize: '0.875rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          ⚠️ <strong>IMPORTANTE:</strong> Esta plataforma é educacional. Em caso de emergência médica, procure atendimento presencial imediatamente.
        </p>
      </section>

      {/* Toast Container */}
      <Suspense fallback={null}>
        <ClientToastContainer />
      </Suspense>

      {/* Analytics */}
      <ClientAnalytics />
    </StaticEducationalLayout>
  );
}
