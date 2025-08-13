'use client';

import React from 'react';
import { modernChatTheme } from '@/config/modernTheme';

/**
 * Página Sobre o Pesquisador
 * Currículo e contribuições acadêmicas do Dr. Nélio Gomes de Moura Júnior
 */

export default function SobrePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${modernChatTheme.colors.background.primary}, ${modernChatTheme.colors.background.secondary})`,
      padding: modernChatTheme.spacing.xl
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: modernChatTheme.spacing.xxl,
          padding: modernChatTheme.spacing.xl,
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: modernChatTheme.shadows.emphasis
        }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: modernChatTheme.colors.personas.gasnelio.primary,
            margin: '0 auto 24px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: 'white'
          }}>
            👨‍⚕️
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.sm
          }}>
            Nélio Gomes de Moura Júnior
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: modernChatTheme.colors.personas.gasnelio.primary,
            fontWeight: '600',
            marginBottom: modernChatTheme.spacing.md
          }}>
            Doutorando em Ciências Farmacêuticas
          </p>
          
          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.textMuted,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Pesquisador especializado em cuidado farmacêutico baseado em evidências, 
            com sólida experiência no Sistema Único de Saúde e desenvolvimento de 
            protocolos para doenças negligenciadas, especialmente hanseníase.
          </p>
        </div>

        {/* 1. Biografia/Resumo */}
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
            📋 Biografia e Resumo
          </h2>

          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            lineHeight: '1.6',
            marginBottom: modernChatTheme.spacing.md
          }}>
            Nélio Gomes de Moura Júnior é doutorando em Ciências Farmacêuticas pela Universidade de Brasília (UnB), 
            com sólida formação acadêmica e experiência prática na área farmacêutica, especialmente voltada para a 
            saúde pública e atenção primária. Sua trajetória profissional combina atuação clínica no Sistema Único 
            de Saúde (SUS), pesquisa científica e atividades de ensino, consolidando-se como especialista em cuidado 
            farmacêutico baseado em evidências.
          </p>

          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.text,
            lineHeight: '1.6',
            marginBottom: modernChatTheme.spacing.md
          }}>
            Atualmente desenvolve pesquisa de doutorado focada na otimização de protocolos de dispensação farmacêutica 
            para hanseníase, contribuindo para o aprimoramento das práticas profissionais no contexto brasileiro.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: modernChatTheme.spacing.sm,
            marginTop: modernChatTheme.spacing.md
          }}>
            <a 
              href="http://lattes.cnpq.br/0153399544950744" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                textDecoration: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              📄 Currículo Lattes
            </a>
            <a 
              href="https://orcid.org/0000-0003-4695-0207" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: modernChatTheme.colors.personas.gasnelio.alpha,
                color: 'white',
                textDecoration: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              🔗 ORCID
            </a>
          </div>
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
            🎓 Formação Acadêmica
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: modernChatTheme.spacing.lg }}>
            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${modernChatTheme.colors.personas.gasnelio.primary}`
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
                marginBottom: modernChatTheme.spacing.xs
              }}>
                <strong>Universidade de Brasília (UnB)</strong> • Em andamento
              </p>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                fontStyle: 'italic'
              }}>
                Linha de pesquisa: Dispensação farmacêutica em hanseníase e desenvolvimento de protocolos baseados em evidências
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${modernChatTheme.colors.personas.gasnelio.primary}`
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
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                <strong>Universidade de Brasília (UnB)</strong> • Concluído
              </p>
            </div>

            <div style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              borderLeft: `4px solid ${modernChatTheme.colors.status.info}`
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
              borderLeft: `4px solid ${modernChatTheme.colors.status.success}`
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
            💼 Atuação Profissional e Projetos
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
                🏥 Atuação no Sistema Único de Saúde
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
                🎓 Atividades de Ensino
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
                🔬 Projetos de Extensão e Pesquisa
              </h3>
              <div style={{
                padding: modernChatTheme.spacing.md,
                background: `${modernChatTheme.colors.status.info}10`,
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
                    textDecoration: 'none'
                  }}
                >
                  🔗 Visualizar Ação de Extensão
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
                    textDecoration: 'none'
                  }}
                >
                  🔗 Ver perfil no LEFAR
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
            🔍 Temas de Pesquisa
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
                🎯 Cuidado Farmacêutico Baseado em Evidências
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
              border: `1px solid ${modernChatTheme.colors.status.warning}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${modernChatTheme.colors.status.warning}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#F59E0B',
                marginBottom: modernChatTheme.spacing.sm
              }}>
                💊 Dispensação em Doenças Negligenciadas
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
              border: `1px solid ${modernChatTheme.colors.status.success}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${modernChatTheme.colors.status.success}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: modernChatTheme.colors.status.success,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                🏥 Atenção Primária à Saúde
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
              border: `1px solid ${modernChatTheme.colors.status.info}30`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: `${modernChatTheme.colors.status.info}05`
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: modernChatTheme.colors.status.info,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                🩸 Hematologia Clínica
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
            📚 Produções Científicas
          </h2>

          <div style={{ display: 'grid', gap: modernChatTheme.spacing.lg }}>
            {/* Artigos Publicados */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md
              }}>
                📄 Artigos Publicados
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
                  🔗 Acesse o artigo completo
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
                  🔗 Leia o artigo
                </a>
              </div>
            </div>

            {/* Trabalhos Acadêmicos */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md
              }}>
                🎓 Trabalhos Acadêmicos
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
                    background: modernChatTheme.colors.status.success,
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
                  🔗 Acesse o TCC
                </a>
              </div>
            </div>

            {/* Projetos de Extensão */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                marginBottom: modernChatTheme.spacing.md
              }}>
                🤝 Projetos de Extensão
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
                    background: modernChatTheme.colors.status.info,
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
                  🔗 Visualizar Ação de Extensão
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
            📧 Informações de Contato
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
                📧
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
                🎓
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
              📄 Currículo Lattes CNPq
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
              🔗 ORCID
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
              🔬 Perfil LEFAR-UnB
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
      </div>
    </div>
  );
}