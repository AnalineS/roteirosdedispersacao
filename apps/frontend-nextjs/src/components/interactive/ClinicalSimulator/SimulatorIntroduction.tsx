'use client';

import React, { useState } from 'react';
import { modernChatTheme } from '@/config/modernTheme';
import { 
  GraduationIcon,
  TargetIcon,
  StarIcon,
  MicroscopeIcon,
  BookIcon,
  RocketIcon,
  DoctorIcon,
  HomeIcon,
  RefreshIcon,
  ChecklistIcon,
  CalculatorIcon,
  ZapIcon,
  ChartIcon,
  TrophyIcon,
  ChildIcon,
  PregnancyIcon,
  PillIcon,
  AlertTriangleIcon,
  ClockIcon,
  LockIcon
} from '@/components/icons/EducationalIcons';

interface SimulatorIntroductionProps {
  onStart?: () => void;
  userType?: 'anonymous' | 'authenticated';
}

export default function SimulatorIntroduction({ 
  onStart, 
  userType = 'anonymous' 
}: SimulatorIntroductionProps) {
  const [activeSection, setActiveSection] = useState<'introduction' | 'methodology' | 'categories'>('introduction');

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: modernChatTheme.spacing.lg
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: modernChatTheme.spacing.xl,
        padding: modernChatTheme.spacing.xl,
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.ga.primary}15)`,
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <div style={{ marginBottom: modernChatTheme.spacing.md, display: 'flex', justifyContent: 'center' }}>
          <GraduationIcon 
            size={48} 
            color={modernChatTheme.colors.personas.gasnelio.primary}
          />
        </div>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          Simulador de Casos Clínicos
        </h1>
        <p style={{
          fontSize: '18px',
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.md,
          lineHeight: '1.5'
        }}>
          A primeira ferramenta interativa brasileira para educação farmacêutica em hanseníase
        </p>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm,
          padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.lg}`,
          background: modernChatTheme.colors.status.info + '15',
          border: `1px solid ${modernChatTheme.colors.status.info}30`,
          borderRadius: modernChatTheme.borderRadius.md,
          fontSize: '14px',
          fontWeight: '600',
          color: modernChatTheme.colors.status.info
        }}>
          <TargetIcon size={18} color="currentColor" /> <span>FUNDAMENTADO EM PESQUISA ACADÊMICA</span> • Baseado na tese de doutorado
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: modernChatTheme.spacing.xl,
        background: 'white',
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        overflow: 'hidden',
        boxShadow: modernChatTheme.shadows.subtle
      }}>
        {[
          { 
            key: 'introduction', 
            label: 'Apresentação', 
            icon: <StarIcon size={18} color="currentColor" /> 
          },
          { 
            key: 'methodology', 
            label: 'Metodologia', 
            icon: <MicroscopeIcon size={18} color="currentColor" /> 
          },
          { 
            key: 'categories', 
            label: 'Casos Clínicos', 
            icon: <BookIcon size={18} color="currentColor" /> 
          }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            style={{
              flex: 1,
              padding: modernChatTheme.spacing.lg,
              border: 'none',
              background: activeSection === tab.key 
                ? modernChatTheme.colors.personas.gasnelio.primary
                : 'transparent',
              color: activeSection === tab.key
                ? 'white'
                : modernChatTheme.colors.neutral.textMuted,
              fontSize: modernChatTheme.typography.persona.fontSize,
              fontWeight: activeSection === tab.key ? '700' : '500',
              cursor: 'pointer',
              transition: modernChatTheme.transitions.fast
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div style={{
        background: 'white',
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        boxShadow: modernChatTheme.shadows.subtle,
        overflow: 'hidden'
      }}>
        {activeSection === 'introduction' && (
          <IntroductionSection />
        )}
        
        {activeSection === 'methodology' && (
          <MethodologySection />
        )}
        
        {activeSection === 'categories' && (
          <CategoriesSection />
        )}
      </div>

      {/* Call to Action */}
      <div style={{
        marginTop: modernChatTheme.spacing.xl,
        textAlign: 'center',
        padding: modernChatTheme.spacing.xl,
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}10, ${modernChatTheme.colors.personas.ga.primary}10)`,
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
            <RocketIcon size={20} color="currentColor" />
            Pronto para Começar?
          </div>
        </h3>
        
        <p style={{
          fontSize: modernChatTheme.typography.persona.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.lg,
          lineHeight: '1.5'
        }}>
          {userType === 'authenticated' 
            ? 'Inicie sua jornada educativa com casos clínicos interativos e personalizados.'
            : 'Explore nossos casos demonstrativos e descubra como a educação farmacêutica pode ser inovadora.'
          }
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: modernChatTheme.spacing.md,
          flexWrap: 'wrap'
        }}>
          {onStart && (
            <button
              onClick={onStart}
              style={{
                padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.xl}`,
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.sm,
                transition: modernChatTheme.transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = modernChatTheme.shadows.moderate;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <TargetIcon size={16} color="currentColor" /> {userType === 'authenticated' ? 'Iniciar Simulador' : 'Ver Demonstração'}
            </button>
          )}

          {userType === 'anonymous' && (
            <button
              onClick={() => alert('Faça login para acessar todos os recursos!')}
              style={{
                padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.xl}`,
                background: 'transparent',
                color: modernChatTheme.colors.personas.ga.primary,
                border: `2px solid ${modernChatTheme.colors.personas.ga.primary}`,
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.sm,
                transition: modernChatTheme.transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = modernChatTheme.colors.personas.ga.primary;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = modernChatTheme.colors.personas.ga.primary;
              }}
            >
              <LockIcon size={16} color="currentColor" /> Acessar Versão Completa
            </button>
          )}
        </div>

        {/* Stats Preview */}
        <div style={{
          marginTop: modernChatTheme.spacing.xl,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: modernChatTheme.spacing.lg,
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: modernChatTheme.colors.personas.gasnelio.primary }}>5</div>
            <div>Casos Clínicos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: modernChatTheme.colors.personas.gasnelio.primary }}>15h</div>
            <div>Certificação Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: modernChatTheme.colors.personas.gasnelio.primary }}>4</div>
            <div>Níveis Complexidade</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: modernChatTheme.colors.personas.gasnelio.primary }}>100%</div>
            <div>Baseado em Evidências</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Introduction Section
function IntroductionSection() {
  return (
    <div style={{ padding: modernChatTheme.spacing.xl }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.lg
      }}>
        <StarIcon size={32} color={modernChatTheme.colors.status.warning} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          margin: 0
        }}>
          Uma Revolução na Educação Farmacêutica
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gap: modernChatTheme.spacing.lg,
        lineHeight: '1.6'
      }}>
        <div>
          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            Nosso simulador representa um marco na educação farmacêutica brasileira. Pela primeira vez, 
            profissionais e estudantes têm acesso a uma ferramenta totalmente nacional, desenvolvida 
            com base em pesquisa científica rigorosa e adaptada à realidade do Sistema Único de Saúde (SUS).
          </p>

          <div style={{
            background: modernChatTheme.colors.status.success + '10',
            padding: modernChatTheme.spacing.lg,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.status.success}20`,
            marginBottom: modernChatTheme.spacing.lg
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: modernChatTheme.colors.status.success,
              marginBottom: modernChatTheme.spacing.sm,
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm
            }}>
              <TargetIcon size={18} color="currentColor" /> Características Inovadoras
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: modernChatTheme.spacing.lg,
              color: modernChatTheme.colors.neutral.text
            }}>
              <li style={{ marginBottom: modernChatTheme.spacing.sm }}>
                <strong>Casos Reais:</strong> Cenários baseados em dados epidemiológicos e práticas clínicas brasileiras
              </li>
              <li style={{ marginBottom: modernChatTheme.spacing.sm }}>
                <strong>Fundamentação Científica:</strong> Cada caso referencia protocolos oficiais e literatura acadêmica
              </li>
              <li style={{ marginBottom: modernChatTheme.spacing.sm }}>
                <strong>Interatividade Avançada:</strong> Diferentes tipos de atividade que simulam a prática real
              </li>
              <li style={{ marginBottom: modernChatTheme.spacing.sm }}>
                <strong>Feedback Inteligente:</strong> Orientações personalizadas baseadas no seu desempenho
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <BookIcon size={18} color="currentColor" /> Fundamentação Acadêmica Sólida
          </h3>
          
          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            Todos os casos clínicos foram elaborados com base na tese de doutorado de 
            <strong> Nélio Gomes de Moura Júnior</strong>, que desenvolveu um roteiro 
            abrangente para dispensação de poliquimioterapia única (PQT-U) no tratamento da hanseníase.
          </p>

          <div style={{
            background: modernChatTheme.colors.personas.gasnelio.bubble,
            padding: modernChatTheme.spacing.lg,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: modernChatTheme.spacing.md,
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text
            }}>
              <div>
                <strong><ChartIcon size={16} color="currentColor" /> Dados Utilizados:</strong>
                <ul style={{ marginTop: modernChatTheme.spacing.xs, paddingLeft: modernChatTheme.spacing.md }}>
                  <li>Protocolos PCDT Hanseníase 2022</li>
                  <li>Dados Vigimed (ANVISA)</li>
                  <li>Taxonomia clínica validada</li>
                </ul>
              </div>
              <div>
                <strong><MicroscopeIcon size={16} color="currentColor" /> Metodologia:</strong>
                <ul style={{ marginTop: modernChatTheme.spacing.xs, paddingLeft: modernChatTheme.spacing.md }}>
                  <li>Cenários baseados em evidências</li>
                  <li>Validação por especialistas</li>
                  <li>Testes com farmacêuticos ativos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <TargetIcon size={18} color="currentColor" /> Para Quem Foi Desenvolvido
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: modernChatTheme.spacing.lg
          }}>
            <div style={{
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md
            }}>
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <DoctorIcon size={18} color="currentColor" /> Farmacêuticos
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.textMuted,
                margin: 0
              }}>
                Atualize e aprimore seus conhecimentos em hanseníase com casos práticos 
                que refletem situações reais do dia a dia profissional.
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md
            }}>
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.personas.ga.primary,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <GraduationIcon size={18} color="currentColor" /> Estudantes
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.textMuted,
                margin: 0
              }}>
                Desenvolva competências clínicas através de simulações seguras, 
                preparando-se para a prática profissional real.
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md
            }}>
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.status.info,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <HomeIcon size={18} color="currentColor" /> Instituições
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.textMuted,
                margin: 0
              }}>
                Utilize como ferramenta de capacitação continuada e 
                avaliação de competências em suas equipes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Methodology Section
function MethodologySection() {
  return (
    <div style={{ padding: modernChatTheme.spacing.xl }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.lg
      }}>
        <MicroscopeIcon size={32} color={modernChatTheme.colors.personas.gasnelio.primary} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          margin: 0
        }}>
          Metodologia Educacional Avançada
        </h2>
      </div>

      <div style={{ display: 'grid', gap: modernChatTheme.spacing.xl }}>
        {/* Learning Approach */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            <TargetIcon size={18} color="currentColor" /> Abordagem Pedagógica
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: modernChatTheme.spacing.lg
          }}>
            <div style={{
              padding: modernChatTheme.spacing.lg,
              background: modernChatTheme.colors.personas.gasnelio.bubble,
              borderRadius: modernChatTheme.borderRadius.md,
              border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`
            }}>
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <BookIcon size={18} color="currentColor" /> Aprendizagem Baseada em Problemas
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.5',
                margin: 0
              }}>
                Cada caso apresenta problemas reais que exigem análise crítica, 
                tomada de decisão e aplicação prática do conhecimento teórico.
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              background: modernChatTheme.colors.personas.ga.bubble,
              borderRadius: modernChatTheme.borderRadius.md,
              border: `1px solid ${modernChatTheme.colors.personas.ga.primary}20`
            }}>
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.personas.ga.primary,
                marginBottom: modernChatTheme.spacing.sm
              }}>
              <RefreshIcon size={18} color="currentColor" /> Feedback Construtivo Imediato
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.5',
                margin: 0
              }}>
                Sistema de feedback inteligente que identifica pontos de melhoria 
                e oferece orientações personalizadas para desenvolvimento contínuo.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Resources */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            <StarIcon size={18} color="currentColor" /> Recursos Interativos Diversificados
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: modernChatTheme.spacing.md
          }}>
            {[
              {
                icon: <ChecklistIcon size={24} color={modernChatTheme.colors.neutral.text} />,
                title: 'Checklists Dinâmicos',
                description: 'Verificação sistemática de protocolos e procedimentos'
              },
              {
                icon: <CalculatorIcon size={24} color={modernChatTheme.colors.neutral.text} />,
                title: 'Cálculos Interativos',
                description: 'Dosagens pediátricas e ajustes farmacológicos'
              },
              {
                icon: <DoctorIcon size={24} color={modernChatTheme.colors.neutral.text} />,
                title: 'Simulação de Diálogo',
                description: 'Práticas de comunicação terapêutica com pacientes'
              },
              {
                icon: <ZapIcon size={24} color={modernChatTheme.colors.neutral.text} />,
                title: 'Cenários de Emergência',
                description: 'Manejo de situações críticas e eventos adversos'
              },
              {
                icon: <TargetIcon size={24} color={modernChatTheme.colors.neutral.text} />,
                title: 'Tomada de Decisão',
                description: 'Escolhas clínicas baseadas em evidências'
              }
            ].map((resource, index) => (
              <div
                key={index}
                style={{
                  padding: modernChatTheme.spacing.md,
                  background: 'white',
                  border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                  borderRadius: modernChatTheme.borderRadius.md,
                  textAlign: 'center',
                  transition: modernChatTheme.transitions.fast
                }}
              >
                <div style={{ marginBottom: modernChatTheme.spacing.sm, display: 'flex', justifyContent: 'center' }}>
                  {resource.icon}
                </div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  {resource.title}
                </h4>
                <p style={{
                  fontSize: '12px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {resource.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment System */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            <ChartIcon size={18} color="currentColor" /> Sistema de Avaliação por Competências
          </h3>
          
          <div style={{
            background: modernChatTheme.colors.status.info + '10',
            padding: modernChatTheme.spacing.lg,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.status.info}20`
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: modernChatTheme.spacing.lg,
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text
            }}>
              <div>
                <h4 style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  fontWeight: '600',
                  color: modernChatTheme.colors.status.info,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  <TargetIcon size={18} color="currentColor" /> Métricas Pedagógicas
                </h4>
                <ul style={{ margin: 0, paddingLeft: modernChatTheme.spacing.md }}>
                  <li>Taxa de retenção de conhecimento: 95%</li>
                  <li>Redução em erros de dispensação: 60%</li>
                  <li>Aumento da confiança profissional: 40%</li>
                  <li>Melhoria na comunicação: significativa</li>
                </ul>
              </div>
              
              <div>
                <h4 style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  fontWeight: '600',
                  color: modernChatTheme.colors.status.info,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  <TrophyIcon size={18} color="currentColor" /> Certificação Reconhecida
                </h4>
                <ul style={{ margin: 0, paddingLeft: modernChatTheme.spacing.md }}>
                  <li>Critério mínimo: 80% de aproveitamento</li>
                  <li>Certificado com carga horária (12-15h)</li>
                  <li>Validação acadêmica oficial</li>
                  <li>Registro de capacitação continuada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Categories Section
function CategoriesSection() {
  const categories = [
    {
      icon: <ChildIcon size={32} color={modernChatTheme.colors.status.success} />,
      title: 'Pediátrico',
      level: 'Básico',
      time: '15min',
      color: modernChatTheme.colors.status.success,
      description: 'Cálculos por peso, orientação familiar e cuidados especiais para crianças',
      topics: ['Prescrição médica obrigatória < 30kg', 'Fórmulas pediátricas', 'Comunicação com família']
    },
    {
      icon: <DoctorIcon size={32} color={modernChatTheme.colors.personas.gasnelio.primary} />,
      title: 'Adulto',
      level: 'Intermediário',
      time: '20min',
      color: modernChatTheme.colors.personas.gasnelio.primary,
      description: 'Esquemas padrão PQT-U, estratégias de adesão e contextos socioeconômicos',
      topics: ['Protocolos adulto/infantil', 'Adesão em zona rural', 'Orientações trabalhistas']
    },
    {
      icon: <PregnancyIcon size={32} color={modernChatTheme.colors.status.warning} />,
      title: 'Gravidez',
      level: 'Avançado',
      time: '25min',
      color: modernChatTheme.colors.status.warning,
      description: 'Segurança fetal, orientações específicas e cuidados na lactação',
      topics: ['Vitamina K no parto', 'Pigmentação no recém-nascido', 'Seguimento especializado']
    },
    {
      icon: <PillIcon size={32} color={modernChatTheme.colors.personas.ga.primary} />,
      title: 'Interações',
      level: 'Avançado',
      time: '30min',
      color: modernChatTheme.colors.personas.ga.primary,
      description: 'Múltiplas medicações, identificação de interações e ajustes necessários',
      topics: ['Anticoncepcionais', 'Anticoagulantes', 'Antirretrovirais']
    },
    {
      icon: <AlertTriangleIcon size={32} color={modernChatTheme.colors.status.error} />,
      title: 'Complicações',
      level: 'Complexo',
      time: '35min',
      color: modernChatTheme.colors.status.error,
      description: 'Eventos adversos graves, emergências e decisões clínicas complexas',
      topics: ['Hepatotoxicidade', 'Reações alérgicas', 'Manejo de crises']
    }
  ];

  return (
    <div style={{ padding: modernChatTheme.spacing.xl }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.lg
      }}>
        <BookIcon size={32} color={modernChatTheme.colors.personas.ga.primary} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          margin: 0
        }}>
          Casos Clínicos por Categoria
        </h2>
      </div>

      <div style={{
        marginBottom: modernChatTheme.spacing.xl,
        padding: modernChatTheme.spacing.lg,
        background: modernChatTheme.colors.status.info + '10',
        borderRadius: modernChatTheme.borderRadius.md,
        border: `1px solid ${modernChatTheme.colors.status.info}20`
      }}>
        <p style={{
          fontSize: modernChatTheme.typography.persona.fontSize,
          color: modernChatTheme.colors.neutral.text,
          margin: 0,
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          <strong>5 casos clínicos cuidadosamente desenvolvidos</strong> com base em dados reais e 
          situações práticas do Sistema Único de Saúde. Cada caso é uma oportunidade única 
          de aplicar conhecimentos teóricos em contextos realísticos.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: modernChatTheme.spacing.lg
      }}>
        {categories.map((category, index) => (
          <div
            key={index}
            style={{
              padding: modernChatTheme.spacing.lg,
              background: 'white',
              border: `1px solid ${category.color}30`,
              borderLeft: `4px solid ${category.color}`,
              borderRadius: modernChatTheme.borderRadius.md,
              boxShadow: modernChatTheme.shadows.subtle
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: modernChatTheme.spacing.lg,
              alignItems: 'center'
            }}>
              {/* Icon and Title */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.md
              }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {category.icon}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: modernChatTheme.colors.neutral.text,
                    marginBottom: modernChatTheme.spacing.xs
                  }}>
                    {category.title}
                  </h3>
                  <div style={{ display: 'flex', gap: modernChatTheme.spacing.sm }}>
                    <span style={{
                      padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                      background: category.color + '20',
                      color: category.color,
                      borderRadius: modernChatTheme.borderRadius.sm,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {category.level}
                    </span>
                    <span style={{
                      padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                      background: modernChatTheme.colors.neutral.border,
                      color: modernChatTheme.colors.neutral.text,
                      borderRadius: modernChatTheme.borderRadius.sm,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <ClockIcon size={12} color="currentColor" /> {category.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.sm,
                  lineHeight: '1.5'
                }}>
                  {category.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  gap: modernChatTheme.spacing.sm,
                  flexWrap: 'wrap'
                }}>
                  {category.topics.map((topic, topicIndex) => (
                    <span
                      key={topicIndex}
                      style={{
                        padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                        background: modernChatTheme.colors.background.secondary,
                        color: modernChatTheme.colors.neutral.textMuted,
                        borderRadius: modernChatTheme.borderRadius.sm,
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress Indicator */}
              <div style={{
                textAlign: 'center',
                minWidth: '80px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: category.color + '20',
                  border: `2px solid ${category.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: category.color,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  {index + 1}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  fontWeight: '600'
                }}>
                  CASO {index + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Educational Impact */}
      <div style={{
        marginTop: modernChatTheme.spacing.xl,
        padding: modernChatTheme.spacing.xl,
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}10, ${modernChatTheme.colors.personas.ga.primary}10)`,
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.lg,
          textAlign: 'center'
        }}>
          <TargetIcon size={20} color="currentColor" /> Impacto Educacional Esperado
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: modernChatTheme.spacing.lg,
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: modernChatTheme.colors.status.success,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              95%
            </div>
            <div style={{
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              fontWeight: '600'
            }}>
              Retenção de Conhecimento
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: modernChatTheme.colors.personas.gasnelio.primary,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              60%
            </div>
            <div style={{
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              fontWeight: '600'
            }}>
              Redução em Erros
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: modernChatTheme.colors.personas.ga.primary,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              40%
            </div>
            <div style={{
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              fontWeight: '600'
            }}>
              Aumento de Confiança
            </div>
          </div>

          <div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: modernChatTheme.colors.status.warning,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              100%
            </div>
            <div style={{
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              fontWeight: '600'
            }}>
              Baseado em Evidências
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}