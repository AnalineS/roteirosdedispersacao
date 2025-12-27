'use client';

import React from 'react';
import Image from 'next/image';
import { modernChatTheme } from '@/config/modernTheme';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { urls } from '@/utils/environmentUrls';
import {
  ChecklistIcon,
  GraduationIcon,
  TrophyIcon,
  SearchIcon,
  BookIcon,
  MailIcon,
  MicroscopeIcon,
  TargetIcon,
  PillIcon,
  HomeIcon,
  LightbulbIcon,
  FileDownloadIcon,
  LinkIcon,
  HospitalIcon,
  BloodIcon,
  UserIcon,
  CollaborationIcon,
  StarIcon
} from '@/components/icons/EducationalIcons';

/**
 * Página Equipe
 * Apresentação da equipe multidisciplinar do projeto Hanseníase PQT-U
 * Rota: /equipe
 */

export default function EquipePage() {
  return (
    <EducationalLayout>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${modernChatTheme.colors.background.primary}, ${modernChatTheme.colors.background.secondary})`,
        padding: modernChatTheme.spacing.xl
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
        {/* Header da Equipe */}
        <div style={{
          textAlign: 'center',
          marginBottom: modernChatTheme.spacing.xxl,
          padding: modernChatTheme.spacing.xl,
          background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.ga.primary}15)`,
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.emphasis,
          border: `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}30`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: modernChatTheme.spacing.lg,
            gap: modernChatTheme.spacing.md
          }}>
            <CollaborationIcon size={48} color={modernChatTheme.colors.personas.gasnelio.primary} />
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: modernChatTheme.colors.neutral.text,
              margin: 0
            }}>
              Conheça a Equipe
            </h1>
          </div>
          
          <h2 style={{
            fontSize: '24px',
            color: modernChatTheme.colors.personas.gasnelio.primary,
            fontWeight: '600',
            marginBottom: modernChatTheme.spacing.md,
            margin: '0 0 16px 0'
          }}>
            Roteiro para Dispensação – Hanseníase (PQT-U)
          </h2>
          
          <p style={{
            fontSize: '18px',
            color: modernChatTheme.colors.neutral.text,
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6',
            marginBottom: modernChatTheme.spacing.lg
          }}>
            Equipe multidisciplinar de pesquisadores especializada em farmácia clínica, 
            saúde pública e desenvolvimento de protocolos terapêuticos baseados em evidências 
            para o Sistema Único de Saúde.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: modernChatTheme.spacing.lg,
            marginTop: modernChatTheme.spacing.lg
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              background: 'white',
              borderRadius: modernChatTheme.borderRadius.md,
              boxShadow: modernChatTheme.shadows.subtle
            }}>
              <UserIcon size={20} color={modernChatTheme.colors.personas.gasnelio.primary} />
              <span style={{ fontWeight: '600', color: modernChatTheme.colors.neutral.text }}>
                6 Pesquisadores
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              background: 'white',
              borderRadius: modernChatTheme.borderRadius.md,
              boxShadow: modernChatTheme.shadows.subtle
            }}>
              <GraduationIcon size={20} color={modernChatTheme.colors.personas.gasnelio.primary} />
              <span style={{ fontWeight: '600', color: modernChatTheme.colors.neutral.text }}>
                Universidade de Brasília
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              background: 'white',
              borderRadius: modernChatTheme.borderRadius.md,
              boxShadow: modernChatTheme.shadows.subtle
            }}>
              <MicroscopeIcon size={20} color={modernChatTheme.colors.personas.gasnelio.primary} />
              <span style={{ fontWeight: '600', color: modernChatTheme.colors.neutral.text }}>
                Ciências Farmacêuticas
              </span>
            </div>
          </div>
        </div>

        {/* 1. Idealizador do Projeto */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl,
          border: `3px solid ${modernChatTheme.colors.personas.gasnelio.primary}40`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: modernChatTheme.spacing.lg,
            gap: modernChatTheme.spacing.md
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `4px solid ${modernChatTheme.colors.personas.gasnelio.primary}`
            }}>
              <Image 
                src="/images/author-photo.jpeg" 
                alt="Prof. Me. Nélio Gomes de Moura Júnior"
                width={200}
                height={200} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs,
                padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <StarIcon size={14} color="white" />
                IDEALIZADOR DO PROJETO
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                margin: '0 0 8px 0'
              }}>
                Nélio Gomes de Moura Júnior
              </h2>
              <p style={{
                fontSize: '18px',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                fontWeight: '600',
                margin: 0
              }}>
                Prof. Me. em Ciências Farmacêuticas
              </p>
            </div>
          </div>

          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <ChecklistIcon size={18} />
            Biografia e Resumo
          </h3>

          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            lineHeight: '1.6',
            marginBottom: modernChatTheme.spacing.md
          }}>
            Prof. Me. Nélio Gomes de Moura Júnior é farmacêutico com mestrado em Ciências Médicas pela UnB 
            e doutorando em Ciências Farmacêuticas. Especialista em cuidado farmacêutico no SUS, combina 
            experiência clínica na atenção primária com pesquisa científica focada em protocolos de dispensação 
            para doenças negligenciadas.
          </p>

          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            lineHeight: '1.6',
            marginBottom: modernChatTheme.spacing.md
          }}>
            Desenvolve sua tese de doutorado no projeto PROFARMA, avaliando serviços farmacêuticos na 
            Atenção Secundária, sob orientação dos professores Rafael Santos Santana e Debora Santos Lula Barros.
          </p>

        </div>

        {/* 2. Formação Acadêmica */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <GraduationIcon size={20} className="inline mr-2" />
            Formação Acadêmica
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: modernChatTheme.spacing.lg }}>
            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${modernChatTheme.colors.personas.gasnelio.primary}`,
              background: `${modernChatTheme.colors.personas.gasnelio.primary}08`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                Doutorado em Ciências Farmacêuticas
              </h3>
              <p style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                color: modernChatTheme.colors.neutral.textMuted,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <strong>Universidade de Brasília (UnB)</strong> • 2023 - Em andamento
              </p>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm,
                lineHeight: '1.5'
              }}>
                <strong>Projeto PROFARMA:</strong> Avaliação dos serviços farmacêuticos na Atenção Secundária
              </p>
              <div style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.textMuted,
                lineHeight: '1.4'
              }}>
                <strong>Orientador:</strong> Rafael Santos Santana<br/>
                <strong>Coorientadora:</strong> Debora Santos Lula Barros
              </div>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${modernChatTheme.colors.personas.ga.primary}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                Mestrado em Ciências Médicas
              </h3>
              <p style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                color: modernChatTheme.colors.neutral.textMuted,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <strong>Universidade de Brasília (UnB)</strong> • 2019 - 2022
              </p>
              <p style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.4'
              }}>
                Foco em microbiota e parasitos intestinais
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${modernChatTheme.colors.unb.secondary}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                Especialização em Estética Avançada
              </h3>
              <p style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                <strong>Nepuga Pós Graduação</strong> • 2023 - 2024
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${'#3B82F6'}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                Especialização em Farmácia Clínica e Hospitalar
              </h3>
              <p style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                <strong>Faculdade Unyleya</strong> • Concluído
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${'#10B981'}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                Graduação em Farmácia
              </h3>
              <p style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                color: modernChatTheme.colors.neutral.textMuted,
                marginBottom: modernChatTheme.spacing.xs
              }}>
                <strong>Universidade de Brasília (UnB)</strong> • 2017
              </p>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                fontStyle: 'italic'
              }}>
                TCC: <a href="https://bdm.unb.br/handle/10483/17543" target="_blank" rel="noopener noreferrer" style={{color: modernChatTheme.colors.personas.gasnelio.primary}}>
                  Anemia falciforme: um panorama atual da doença
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* 3. Atuação Profissional e Projetos */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <TrophyIcon size={20} className="inline mr-2" />
            Atuação Profissional e Projetos
          </h2>

          <div style={{ display: 'grid', gap: modernChatTheme.spacing.lg }}>
            {/* Sistema Único de Saúde */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md
              }}>
                <HomeIcon size={18} className="inline mr-2" />
                Atuação no Sistema Único de Saúde
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: modernChatTheme.spacing.lg,
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: modernChatTheme.spacing.xs }}>
                  <strong>Farmacêutico Comunitário:</strong> Experiência em Unidades Básicas de Saúde (UBS) e Núcleo de Apoio à Saúde da Família (NASF)
                </li>
                <li style={{ marginBottom: modernChatTheme.spacing.xs }}>
                  <strong>Componente Especializado da Assistência Farmacêutica (CEAF):</strong> Atuação em Formosa/GO
                </li>
                <li style={{ marginBottom: modernChatTheme.spacing.xs }}>
                  <strong>Participação na Campanha de Vacinação COVID-19:</strong> Contribuição durante a pandemia
                </li>
              </ul>
            </div>

            {/* Atividades de Ensino */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md
              }}>
                <GraduationIcon size={18} className="inline mr-2" />
                Atividades de Ensino
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: modernChatTheme.spacing.lg,
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.6'
              }}>
                <li style={{ marginBottom: modernChatTheme.spacing.xs }}>
                  <strong>Instrutor SENAC:</strong> Ministração de cursos técnicos na área de saúde
                </li>
                <li style={{ marginBottom: modernChatTheme.spacing.xs }}>
                  Desenvolvimento de metodologias educacionais para capacitação profissional
                </li>
              </ul>
            </div>

            {/* Projetos e Afiliações */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md
              }}>
                <MicroscopeIcon size={18} className="inline mr-2" />
                Projetos de Extensão e Pesquisa
              </h3>
              <div style={{
                padding: modernChatTheme.spacing.md,
                background: `${'#3B82F6'}10`,
                borderRadius: modernChatTheme.borderRadius.md,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <p style={{
                  fontSize: '14px',
                  color: modernChatTheme.colors.neutral.text,
                  margin: 0,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  <strong>Colaborador no PROFARMA-SUS (2024):</strong>
                </p>
                <p style={{
                  fontSize: '13px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  Protocolos de serviços farmacêuticos no Sistema Único de Saúde do Distrito Federal
                </p>
                <a 
                  href="https://sigaa.unb.br/sigaa/link/public/extensao/visualizacaoAcaoExtensao/11764" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: modernChatTheme.colors.personas.gasnelio.primary,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LinkIcon size={12} color={modernChatTheme.colors.personas.gasnelio.primary} />
                  Visualizar Ação de Extensão
                </a>
              </div>

              <div style={{
                padding: modernChatTheme.spacing.md,
                background: `${modernChatTheme.colors.personas.gasnelio.primary}10`,
                borderRadius: modernChatTheme.borderRadius.md
              }}>
                <p style={{
                  fontSize: '14px',
                  color: modernChatTheme.colors.neutral.text,
                  margin: 0,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  <strong>Membro do LEFAR-UnB:</strong>
                </p>
                <p style={{
                  fontSize: '13px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  Laboratório de Ensino e Pesquisa em Farmácia Social
                </p>
                <a 
                  href="https://www.lefarunb.com.br/membros" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: modernChatTheme.colors.personas.gasnelio.primary,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LinkIcon size={12} color={modernChatTheme.colors.personas.gasnelio.primary} />
                  Ver perfil no LEFAR
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Temas de Pesquisa */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <SearchIcon size={20} className="inline mr-2" />
            Temas de Pesquisa
          </h2>

          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            lineHeight: '1.6',
            marginBottom: modernChatTheme.spacing.md
          }}>
            Os principais eixos de pesquisa do Dr. Nélio concentram-se em:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: modernChatTheme.spacing.lg
          }}>
            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${modernChatTheme.colors.personas.gasnelio.primary}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <TargetIcon size={16} className="inline mr-2" />
                Cuidado Farmacêutico Baseado em Evidências
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.5',
                margin: 0
              }}>
                Sistematização de protocolos e diretrizes para prática profissional
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${'#F59E0B'}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${'#F59E0B'}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#F59E0B',
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <PillIcon size={16} className="inline mr-2" />
                Dispensação em Doenças Negligenciadas
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.5',
                margin: 0
              }}>
                Foco específico em hanseníase e poliquimioterapia única (PQT-U)
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${'#10B981'}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${'#10B981'}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#10B981',
                marginBottom: modernChatTheme.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <HospitalIcon size={16} color="#10B981" />
                Atenção Primária à Saúde
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.5',
                margin: 0
              }}>
                Análise da atuação farmacêutica no SUS
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${'#3B82F6'}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${'#3B82F6'}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#3B82F6',
                marginBottom: modernChatTheme.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BloodIcon size={16} color="#3B82F6" />
                Hematologia Clínica
              </h4>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.5',
                margin: 0
              }}>
                Estudos sobre anemias hereditárias, especialmente anemia falciforme
              </p>
            </div>
          </div>
        </div>

        {/* 5. Produções Científicas */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <BookIcon size={20} className="inline mr-2" />
            Produções Científicas
          </h2>

          <div style={{ display: 'grid', gap: modernChatTheme.spacing.lg }}>
            {/* Artigos Publicados */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileDownloadIcon size={18} color={modernChatTheme.colors.personas.gasnelio.primary} />
                Artigos Publicados
              </h3>

              <div style={{
                padding: modernChatTheme.spacing.lg,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md,
                marginBottom: modernChatTheme.spacing.md
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  Diretriz de manejo da febre no contexto do cuidado farmacêutico
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  <em>Jornal de Assistência Farmacêutica e Farmacoeconomia (JAFF)</em>, 2024
                </p>
                <a 
                  href="https://ojs.jaff.org.br/ojs/index.php/jaff/article/view/815/1165" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                    background: modernChatTheme.colors.personas.gasnelio.primary,
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.xs
                  }}
                >
                  <LinkIcon size={12} color="white" />
                  Acesse o artigo completo
                </a>
              </div>

              <div style={{
                padding: modernChatTheme.spacing.lg,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  O farmacêutico entre o trabalho prescrito e o real na Atenção Primária à Saúde
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  <em>Trabalho, Educação e Saúde</em> (Fiocruz), 2022
                </p>
                <a 
                  href="https://www.tes.epsjv.fiocruz.br/index.php/tes/article/view/279" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                    background: modernChatTheme.colors.personas.gasnelio.alpha,
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.xs
                  }}
                >
                  <LinkIcon size={12} color="white" />
                  Leia o artigo
                </a>
              </div>
            </div>

            {/* Trabalhos Acadêmicos */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <GraduationIcon size={18} color={modernChatTheme.colors.personas.gasnelio.primary} />
                Trabalhos Acadêmicos
              </h3>

              <div style={{
                padding: modernChatTheme.spacing.lg,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  Anemia falciforme: um panorama atual da doença
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  Trabalho de Conclusão de Curso, BDM UnB, 2017
                </p>
                <a 
                  href="https://bdm.unb.br/handle/10483/17543" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                    background: '#10B981',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.xs
                  }}
                >
                  <LinkIcon size={12} color="white" />
                  Acesse o TCC
                </a>
              </div>
            </div>

            {/* Projetos de Extensão */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CollaborationIcon size={18} color={modernChatTheme.colors.personas.gasnelio.primary} />
                Projetos de Extensão
              </h3>

              <div style={{
                padding: modernChatTheme.spacing.lg,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  Protocolos de serviços farmacêuticos no Sistema Único de Saúde do Distrito Federal (PROFARMA-SUS)
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  Projeto de Extensão UnB, 2024
                </p>
                <a 
                  href="https://sigaa.unb.br/sigaa/link/public/extensao/visualizacaoAcaoExtensao/11764" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                    background: '#3B82F6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.xs
                  }}
                >
                  <LinkIcon size={12} color="white" />
                  Visualizar Ação de Extensão
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Contato */}
        <div style={{
          background: modernChatTheme.colors.personas.gasnelio.primary,
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.emphasis,
          padding: modernChatTheme.spacing.xl,
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'white',
            marginBottom: modernChatTheme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <MailIcon size={20} className="inline mr-2" />
            Informações de Contato
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: modernChatTheme.spacing.lg,
            marginBottom: modernChatTheme.spacing.lg
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                <MailIcon size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '2px' }}>
                  Email
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  neliogmoura@gmail.com
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                <GraduationIcon size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '2px' }}>
                  Afiliação Institucional
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  Programa de Pós-graduação em Ciências Farmacêuticas, UnB
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: modernChatTheme.spacing.sm,
            justifyContent: 'center'
          }}>
            <a 
              href="http://lattes.cnpq.br/0153399544950744" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs,
                backdropFilter: 'blur(10px)'
              }}
            >
              <FileDownloadIcon size={14} color="white" />
              Currículo Lattes CNPq
            </a>
            <a 
              href="https://orcid.org/0000-0003-4695-0207" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs,
                backdropFilter: 'blur(10px)'
              }}
            >
              <LinkIcon size={14} color="white" />
              ORCID
            </a>
            <a 
              href="https://www.lefarunb.com.br/membros" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs,
                backdropFilter: 'blur(10px)'
              }}
            >
              <MicroscopeIcon size={14} color="white" />
              Perfil LEFAR-UnB
            </a>
          </div>

          <div style={{
            marginTop: modernChatTheme.spacing.lg,
            padding: modernChatTheme.spacing.md,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: modernChatTheme.borderRadius.md,
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              margin: 0,
              opacity: 0.95,
              lineHeight: '1.5'
            }}>
              <strong>Disponível para colaborações acadêmicas</strong><br/>
              Parcerias em pesquisa, orientações e desenvolvimento de projetos 
              relacionados à dispensação farmacêutica e doenças negligenciadas
            </p>
          </div>
        </div>

        {/* Como Citar */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <BookIcon size={20} />
            Como Citar
          </h2>

          <div style={{
            marginBottom: modernChatTheme.spacing.lg
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: modernChatTheme.colors.personas.gasnelio.primary,
              marginBottom: modernChatTheme.spacing.md
            }}>
              Citação Individual (ABNT)
            </h3>
            
            <div style={{
              background: '#f8fafc',
              padding: modernChatTheme.spacing.lg,
              borderRadius: modernChatTheme.borderRadius.md,
              border: '1px solid #e2e8f0',
              fontFamily: 'monospace',
              fontSize: '14px',
              marginBottom: modernChatTheme.spacing.md
            }}>
              MOURA JÚNIOR, Nélio Gomes de. <strong>Sistema Educacional PQT-U: Roteiros de Dispensação para Hanseníase</strong>. 
              2024. Tese (Doutorado em Ciências Farmacêuticas) - Universidade de Brasília, Brasília, 2024. 
              Disponível em: {urls.base()}. Acesso em: [data].
            </div>
          </div>

          <div style={{
            marginBottom: modernChatTheme.spacing.lg
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: modernChatTheme.colors.personas.ga.primary,
              marginBottom: modernChatTheme.spacing.md
            }}>
              Citação da Plataforma (ABNT)
            </h3>
            
            <div style={{
              background: '#f8fafc',
              padding: modernChatTheme.spacing.lg,
              borderRadius: modernChatTheme.borderRadius.md,
              border: '1px solid #e2e8f0',
              fontFamily: 'monospace',
              fontSize: '14px',
              marginBottom: modernChatTheme.spacing.md
            }}>
              MOURA JÚNIOR, N. G.; AKKATI, S. C. F.; FRANÇA, S. O. C.; BRANDÃO, L. B. G.; SODRÉ, B. M. C.; SANTANA, R. S. 
              <strong>Roteiros de Dispensação: Sistema Inteligente de Orientação para Hanseníase</strong>. Brasília: UnB, 2024. 
              Disponível em: {urls.base()}. Acesso em: [data].
            </div>
          </div>

          <div style={{
            padding: modernChatTheme.spacing.md,
            background: `${modernChatTheme.colors.personas.gasnelio.primary}10`,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`
          }}>
            <p style={{
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              margin: 0,
              lineHeight: '1.5'
            }}>
              <strong>Recomendação:</strong> Para citações específicas de conteúdo ou funcionalidades da plataforma, 
              inclua a seção específica utilizada e a data de acesso. Esta plataforma é resultado de pesquisa 
              de doutorado em desenvolvimento no Programa de Pós-graduação em Ciências Farmacêuticas da UnB.
            </p>
          </div>
        </div>

        {/* Equipe de Autores */}
        <div style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.subtle,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            <CollaborationIcon size={24} color={modernChatTheme.colors.personas.ga.primary} />
            Equipe de Autores
          </h2>

          <p style={{
            fontSize: '16px',
            color: modernChatTheme.colors.neutral.textMuted,
            textAlign: 'center',
            maxWidth: '600px',
            margin: `0 auto ${modernChatTheme.spacing.xl}`,
            lineHeight: '1.6'
          }}>
            Coautores especializados que contribuíram com expertise técnica e científica 
            para o desenvolvimento do roteiro de dispensação PQT-U
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: modernChatTheme.spacing.lg,
            marginTop: modernChatTheme.spacing.xl
          }}>
            {/* Sâmara Caroline Franco Akkati */}
            <div style={{
              background: `${modernChatTheme.colors.personas.ga.primary}08`,
              borderRadius: modernChatTheme.borderRadius.md,
              padding: modernChatTheme.spacing.lg,
              border: `2px solid ${modernChatTheme.colors.personas.ga.primary}20`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.ga.primary}, ${modernChatTheme.colors.personas.ga.alpha})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white'
              }}>
                SA
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                textAlign: 'center',
                margin: '0 0 8px 0'
              }}>
                Sâmara Caroline Franco Akkati
              </h3>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.personas.ga.primary,
                fontWeight: '600',
                textAlign: 'center',
                margin: '0 0 12px 0'
              }}>
                Farmacêutica Especialista
              </p>
              <p style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.textMuted,
                textAlign: 'center',
                lineHeight: '1.4',
                margin: 0
              }}>
                Especialização em farmácia clínica e atenção farmacêutica com foco em protocolos terapêuticos
              </p>
            </div>

            {/* Sabrina Oliveira Campos de França */}
            <div style={{
              background: `${modernChatTheme.colors.personas.gasnelio.primary}08`,
              borderRadius: modernChatTheme.borderRadius.md,
              padding: modernChatTheme.spacing.lg,
              border: `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}, ${modernChatTheme.colors.personas.gasnelio.alpha})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white'
              }}>
                SF
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                textAlign: 'center',
                margin: '0 0 8px 0'
              }}>
                Sabrina Oliveira Campos de França
              </h3>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                fontWeight: '600',
                textAlign: 'center',
                margin: '0 0 12px 0'
              }}>
                Pesquisadora em Ciências da Saúde
              </p>
              <p style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.textMuted,
                textAlign: 'center',
                lineHeight: '1.4',
                margin: 0
              }}>
                Expertise em metodologia científica e desenvolvimento de protocolos baseados em evidências
              </p>
            </div>

            {/* Laura Beatriz Gomes Brandão */}
            <div style={{
              background: `${modernChatTheme.colors.personas.ga.primary}08`,
              borderRadius: modernChatTheme.borderRadius.md,
              padding: modernChatTheme.spacing.lg,
              border: `2px solid ${modernChatTheme.colors.personas.ga.primary}20`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.ga.primary}, ${modernChatTheme.colors.personas.ga.alpha})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white'
              }}>
                LB
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                textAlign: 'center',
                margin: '0 0 8px 0'
              }}>
                Laura Beatriz Gomes Brandão
              </h3>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.personas.ga.primary,
                fontWeight: '600',
                textAlign: 'center',
                margin: '0 0 12px 0'
              }}>
                Farmacêutica Clínica
              </p>
              <p style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.textMuted,
                textAlign: 'center',
                lineHeight: '1.4',
                margin: 0
              }}>
                Especialista em cuidado farmacêutico e seguimento farmacoterapêutico
              </p>
            </div>

            {/* Barbara Manuela Cardoso Sodré */}
            <div style={{
              background: `${modernChatTheme.colors.personas.gasnelio.primary}08`,
              borderRadius: modernChatTheme.borderRadius.md,
              padding: modernChatTheme.spacing.lg,
              border: `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}, ${modernChatTheme.colors.personas.gasnelio.alpha})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white'
              }}>
                BM
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                textAlign: 'center',
                margin: '0 0 8px 0'
              }}>
                Barbara Manuela Cardoso Sodré
              </h3>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                fontWeight: '600',
                textAlign: 'center',
                margin: '0 0 12px 0'
              }}>
                Especialista em Saúde Pública
              </p>
              <p style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.textMuted,
                textAlign: 'center',
                lineHeight: '1.4',
                margin: 0
              }}>
                Foco em epidemiologia e controle de doenças negligenciadas no SUS
              </p>
            </div>

            {/* Rafael Santos Santana */}
            <div style={{
              background: `${modernChatTheme.colors.personas.ga.primary}08`,
              borderRadius: modernChatTheme.borderRadius.md,
              padding: modernChatTheme.spacing.lg,
              border: `2px solid ${modernChatTheme.colors.personas.ga.primary}20`,
              transition: 'all 0.3s ease',
              gridColumn: 'span 1'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.ga.primary}, ${modernChatTheme.colors.personas.ga.alpha})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white'
              }}>
                RS
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                textAlign: 'center',
                margin: '0 0 8px 0'
              }}>
                Rafael Santos Santana
              </h3>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.personas.ga.primary,
                fontWeight: '600',
                textAlign: 'center',
                margin: '0 0 12px 0'
              }}>
                Farmacêutico Pesquisador
              </p>
              <p style={{
                fontSize: '13px',
                color: modernChatTheme.colors.neutral.textMuted,
                textAlign: 'center',
                lineHeight: '1.4',
                margin: 0
              }}>
                Especialização em farmacologia clínica e desenvolvimento de diretrizes terapêuticas
              </p>
            </div>
          </div>

          {/* Nota sobre colaboração */}
          <div style={{
            marginTop: modernChatTheme.spacing.xl,
            padding: modernChatTheme.spacing.lg,
            background: `${modernChatTheme.colors.personas.gasnelio.primary}08`,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <CollaborationIcon size={32} color={modernChatTheme.colors.personas.gasnelio.primary} />
            </div>
            <p style={{
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              margin: 0,
              lineHeight: '1.5'
            }}>
              <strong>Trabalho Colaborativo:</strong> Esta equipe multidisciplinar combina expertise em farmácia clínica, 
              saúde pública e metodologia científica para desenvolver protocolos seguros e baseados em evidências 
              para o Sistema Único de Saúde.
            </p>
          </div>

          {/* Dicas Interativas - LightbulbIcon ativado */}
          <div style={{
            marginTop: modernChatTheme.spacing.xl,
            padding: modernChatTheme.spacing.lg,
            background: `linear-gradient(135deg, ${modernChatTheme.colors.unb.primary}08, ${modernChatTheme.colors.unb.secondary}08)`,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.unb.primary}30`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm,
              marginBottom: modernChatTheme.spacing.md
            }}>
              <LightbulbIcon size={24} color={modernChatTheme.colors.unb.primary} />
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                margin: 0
              }}>
                Dicas para Aproveitar Melhor a Plataforma
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gap: modernChatTheme.spacing.md,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
            }}>
              <div style={{
                padding: modernChatTheme.spacing.sm,
                background: 'white',
                borderRadius: modernChatTheme.borderRadius.sm,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <strong style={{ fontSize: '14px', color: modernChatTheme.colors.neutral.text }}>Chat Inteligente</strong>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Use perguntas específicas como "Como calcular dose para criança de 8 anos com 25kg?" para obter respostas mais precisas.
                </p>
              </div>

              <div style={{
                padding: modernChatTheme.spacing.sm,
                background: 'white',
                borderRadius: modernChatTheme.borderRadius.sm,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  <span style={{ fontSize: '16px' }}>🎮</span>
                  <strong style={{ fontSize: '14px', color: modernChatTheme.colors.neutral.text }}>Simulações Práticas</strong>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Complete os casos clínicos do simulador para ganhar XP e desbloquear conquistas educacionais.
                </p>
              </div>

              <div style={{
                padding: modernChatTheme.spacing.sm,
                background: 'white',
                borderRadius: modernChatTheme.borderRadius.sm,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  <span style={{ fontSize: '16px' }}>📱</span>
                  <strong style={{ fontSize: '14px', color: modernChatTheme.colors.neutral.text }}>Acesso Mobile</strong>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Instale a PWA no seu celular para acesso rápido durante consultas e dispensações.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </EducationalLayout>
  );
}