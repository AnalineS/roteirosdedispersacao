'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import EducationalLayout from '@/components/layout/EducationalLayout';

/**
 * Página Sobre - Consolidada
 * Unifica: Visão Geral, Tese, Metodologia, Referências, Código Fonte
 * Rota: /sobre
 */

// Dados das referências
const referencias = [
  {
    categoria: "Diretrizes e Protocolos Oficiais",
    items: [
      {
        autores: "Ministério da Saúde",
        ano: "2022",
        titulo: "Protocolo Clínico e Diretrizes Terapêuticas para Hanseníase",
        fonte: "Brasília: Ministério da Saúde",
        link: "https://www.gov.br/saude/pt-br/assuntos/protocolos-clinicos-e-diretrizes-terapeuticas-pcdt"
      },
      {
        autores: "WHO - World Health Organization",
        ano: "2021",
        titulo: "WHO Guidelines for the diagnosis, treatment and prevention of leprosy",
        fonte: "Geneva: World Health Organization",
        link: "https://www.who.int/publications/i/item/9789290228509"
      },
      {
        autores: "Ministério da Saúde",
        ano: "2020",
        titulo: "Estratégia Nacional para o Enfrentamento da Hanseníase 2019-2022",
        fonte: "Brasília: Secretaria de Vigilância em Saúde",
        link: null
      }
    ]
  },
  {
    categoria: "Artigos Científicos sobre PQT-U",
    items: [
      {
        autores: "Penna GO, Buhrer-Sekula S, Kerr LRS, et al.",
        ano: "2017",
        titulo: "Uniform multidrug therapy for leprosy patients in Brazil (U-MDT/CT-BR)",
        fonte: "PLoS Negl Trop Dis. 2017;11(7):e0005725",
        link: "https://doi.org/10.1371/journal.pntd.0005725"
      },
      {
        autores: "Penna MLF, Penna GO, et al.",
        ano: "2020",
        titulo: "Long-term follow-up of leprosy patients treated with uniform multidrug therapy in Brazil",
        fonte: "Trans R Soc Trop Med Hyg. 2020;114(5):355-363",
        link: null
      }
    ]
  },
  {
    categoria: "Farmacologia e Dispensação",
    items: [
      {
        autores: "Rang HP, Dale MM, Ritter JM, Flower RJ, Henderson G",
        ano: "2020",
        titulo: "Rang & Dale Farmacologia",
        fonte: "8a ed. Rio de Janeiro: Elsevier",
        link: null
      },
      {
        autores: "Conselho Federal de Farmácia",
        ano: "2019",
        titulo: "Serviços farmacêuticos diretamente destinados ao paciente",
        fonte: "Brasília: CFF",
        link: "https://www.cff.org.br/userfiles/file/Profar_Arcabouco_TELA_FINAL.pdf"
      }
    ]
  },
  {
    categoria: "Educação em Saúde e Tecnologia",
    items: [
      {
        autores: "Freire P",
        ano: "2019",
        titulo: "Pedagogia do Oprimido",
        fonte: "71a ed. Rio de Janeiro: Paz e Terra",
        link: null
      },
      {
        autores: "Nielsen J, Budiu R",
        ano: "2013",
        titulo: "Mobile Usability",
        fonte: "Berkeley: New Riders",
        link: null
      }
    ]
  },
  {
    categoria: "Teses e Dissertações",
    items: [
      {
        autores: "Moura Junior, N.G.",
        ano: "2024",
        titulo: "Sistema Educacional para Orientação na Dispensação de Medicamentos PQT-U em Hanseníase",
        fonte: "Tese (Doutorado em Ciências Farmacêuticas) - Universidade de Brasília",
        link: null
      }
    ]
  }
];

// Dados da metodologia
const metodologias = [
  {
    etapa: "1. Revisão Sistemática da Literatura",
    descricao: "Mapeamento do estado da arte sobre hanseníase, PQT-U e educação farmacêutica",
    metodos: [
      "Busca em bases de dados: PubMed, Scielo, LILACS, Cochrane Library",
      "Período de análise: 2010-2024",
      "Critérios de inclusão: estudos sobre poliquimioterapia única"
    ],
    resultados: "156 estudos relevantes, 45 incluídos na síntese final"
  },
  {
    etapa: "2. Pesquisa Exploratória com Profissionais",
    descricao: "Levantamento das necessidades na dispensação de medicamentos PQT-U",
    metodos: [
      "Entrevistas semiestruturadas com 30 farmacêuticos",
      "Questionários online aplicados a 120 profissionais",
      "Observação participante em 15 farmácias públicas"
    ],
    resultados: "8 categorias de dificuldades e 12 necessidades educacionais"
  },
  {
    etapa: "3. Desenvolvimento do Framework Pedagógico",
    descricao: "Criação da base teórica e metodológica do sistema educacional",
    metodos: [
      "Análise de teorias de aprendizagem (Constructivismo, Andragogia)",
      "Aplicação de princípios de Design Instrucional (ADDIE)",
      "Desenvolvimento de personas educacionais"
    ],
    resultados: "Framework adaptativo com 3 níveis e 2 personas especializadas"
  },
  {
    etapa: "4. Prototipagem e Design de Interface",
    descricao: "Desenvolvimento da arquitetura e interface do sistema",
    metodos: [
      "Metodologia de Design Centrado no Usuário (DCU)",
      "Testes de usabilidade com 25 usuários",
      "Aplicação de princípios de acessibilidade WCAG 2.1"
    ],
    resultados: "Sistema responsivo com 98% de aprovação em testes"
  },
  {
    etapa: "5. Implementação Tecnológica",
    descricao: "Desenvolvimento usando tecnologias modernas e escaláveis",
    metodos: [
      "Frontend: Next.js 15 + TypeScript",
      "Backend: Python Flask + PostgreSQL",
      "IA Conversacional: OpenRouter (Llama 3.2, Kimie K2)"
    ],
    resultados: "Sistema completo com 35+ páginas e 2 assistentes IA"
  },
  {
    etapa: "6. Validação e Avaliação",
    descricao: "Teste e validação do sistema com usuários reais",
    metodos: [
      "Estudo piloto com 50 profissionais de farmácia",
      "Avaliação pré e pós-uso com instrumentos validados",
      "Coleta de feedback qualitativo"
    ],
    resultados: "Melhoria de 85% no conhecimento e 92% de satisfação"
  }
];

// Seções do sumário
const sections = [
  { id: 'visao-geral', label: 'Visão Geral', icon: '🎯' },
  { id: 'tese', label: 'Sobre a Tese', icon: '📚' },
  { id: 'metodologia', label: 'Metodologia', icon: '🔬' },
  { id: 'referencias', label: 'Referências', icon: '📖' },
  { id: 'codigo-fonte', label: 'Código Fonte', icon: '💻' }
];

export default function SobrePage() {
  const [activeSection, setActiveSection] = useState('visao-geral');
  const [activeTab, setActiveTab] = useState('apresentacao');

  // Scroll spy para destacar seção ativa
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 150;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <EducationalLayout>
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
          padding: '3rem 2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            Sobre o Sistema
          </h1>
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.9,
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Roteiros de Dispensação - Hanseníase (PQT-U)
          </p>
        </div>

        {/* Sumario sticky */}
        <nav style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 100,
          padding: '0.75rem 1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
        aria-label="Navegação da página"
        >
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '20px',
                  background: activeSection === section.id ? '#003366' : '#f1f5f9',
                  color: activeSection === section.id ? 'white' : '#475569',
                  fontSize: '0.9rem',
                  fontWeight: activeSection === section.id ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                aria-current={activeSection === section.id ? 'true' : undefined}
              >
                {section.icon} {section.label}
              </button>
            ))}
          </div>
        </nav>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem clamp(1rem, 3vw, 2rem)'
        }}>
          {/* Seção: Visão Geral */}
          <section id="visao-geral" style={{ marginBottom: '4rem', scrollMarginTop: '120px' }}>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#003366',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🎯 Visão Geral
            </h2>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: '#374151',
                lineHeight: '1.8',
                marginBottom: '1.5rem'
              }}>
                Este sistema educacional foi desenvolvido como parte de uma pesquisa de doutorado
                no Programa de Pós-graduação em Ciências Farmacêuticas da Universidade de Brasília (UnB).
                O objetivo é fornecer orientação especializada para profissionais de saúde
                na dispensação de medicamentos do esquema PQT-U para tratamento de hanseníase.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  padding: '1rem',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                  <div style={{ fontWeight: '600', color: '#003366' }}>6 Pesquisadores</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Equipe multidisciplinar</div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
                  <div style={{ fontWeight: '600', color: '#003366' }}>2 Assistentes IA</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Dr. Gasnelio e Gá</div>
                </div>
                <div style={{
                  padding: '1rem',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <div style={{ fontWeight: '600', color: '#003366' }}>205 Profissionais</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Participantes da pesquisa</div>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <Link
                  href="/equipe"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#003366',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  👥 Conheça a Equipe Completa
                </Link>
              </div>
            </div>
          </section>

          {/* Seção: Sobre a Tese */}
          <section id="tese" style={{ marginBottom: '4rem', scrollMarginTop: '120px' }}>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#003366',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📚 Sobre a Tese - Roteiro PQT-U
            </h2>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {/* Tabs de navegação */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e2e8f0',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'apresentacao', label: 'Apresentações' },
                  { id: 'avaliacao', label: 'Avaliação' },
                  { id: 'orientacoes', label: 'Orientações' },
                  { id: 'seguranca', label: 'Segurança' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '1rem 1.5rem',
                      border: 'none',
                      background: activeTab === tab.id ? '#003366' : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#64748b',
                      fontWeight: activeTab === tab.id ? '600' : '400',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '2rem' }}>
                {/* Tab Apresentações */}
                {activeTab === 'apresentacao' && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#003366' }}>
                      Apresentações Disponíveis no SUS
                    </h3>

                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ color: '#3b82f6', marginBottom: '1rem' }}>PQT-U Adulto (maior 50kg)</h4>
                      <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Dose Mensal Supervisionada:</p>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                          <li>Rifampicina: 600 mg (2x 300mg)</li>
                          <li>Clofazimina: 300 mg (3x 100mg)</li>
                          <li>Dapsona: 100 mg</li>
                        </ul>
                      </div>
                      <div style={{
                        background: '#fef3c7',
                        padding: '1rem',
                        borderRadius: '8px'
                      }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Dose Diária Autoadministrada:</p>
                        <ul style={{ paddingLeft: '1.5rem' }}>
                          <li>Clofazimina 50mg - 1x ao dia</li>
                          <li>Dapsona 100mg - 1x ao dia</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: '#3b82f6', marginBottom: '1rem' }}>PQT-U Infantil (30-50kg)</h4>
                      <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '8px'
                      }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Dose Mensal Supervisionada:</p>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                          <li>Rifampicina: 450 mg</li>
                          <li>Clofazimina: 150 mg</li>
                          <li>Dapsona: 50 mg</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Avaliação */}
                {activeTab === 'avaliacao' && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#003366' }}>
                      Avaliação Inicial
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <h4 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Disponibilidade</h4>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '0.95rem' }}>
                          <li>Medicamento importado via OPAS</li>
                          <li>Disponível exclusivamente pelo SUS</li>
                          <li>Não possui similares ou genéricos</li>
                        </ul>
                      </div>

                      <div style={{
                        padding: '1.5rem',
                        background: '#dcfce7',
                        borderRadius: '8px',
                        border: '1px solid #86efac'
                      }}>
                        <h4 style={{ color: '#15803d', marginBottom: '1rem' }}>Duração do Tratamento</h4>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '0.95rem' }}>
                          <li><strong>Paucibacilar:</strong> 6 meses</li>
                          <li><strong>Multibacilar:</strong> 12 meses</li>
                          <li>Dispensação mensal obrigatória</li>
                        </ul>
                      </div>

                      <div style={{
                        padding: '1.5rem',
                        background: '#fef3c7',
                        borderRadius: '8px',
                        border: '1px solid #fcd34d'
                      }}>
                        <h4 style={{ color: '#92400e', marginBottom: '1rem' }}>Prescrição</h4>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', fontSize: '0.95rem' }}>
                          <li>Médico e enfermeiro podem prescrever</li>
                          <li>Pacientes menor 30kg: apenas médicos</li>
                          <li>Prescrição em duas vias</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Orientações */}
                {activeTab === 'orientacoes' && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#003366' }}>
                      Orientações Gerais
                    </h3>

                    <div style={{
                      background: '#f8fafc',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem'
                    }}>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '2', fontSize: '1rem' }}>
                        <li>Clofazimina e dapsona devem ser tomadas junto das refeições</li>
                        <li>NÃO ingerir com suco de laranja (diminui absorção)</li>
                        <li>Evitar bebidas alcoólicas durante o tratamento</li>
                        <li>Checar status vacinal/BCG</li>
                        <li>Não tomar dose autoadministrada no dia da supervisionada</li>
                        <li>Agendar consulta a cada 28 dias para nova dose supervisionada</li>
                      </ul>
                    </div>

                    <div style={{
                      padding: '1rem',
                      background: '#fee2e2',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5'
                    }}>
                      <strong>Doses Máximas:</strong> Rifampicina 600mg/dia | Clofazimina 300mg/dia | Dapsona 100mg/dia
                    </div>
                  </div>
                )}

                {/* Tab Segurança */}
                {activeTab === 'seguranca' && (
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                      Contraindicações e Segurança
                    </h3>

                    <div style={{
                      background: '#fee2e2',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      border: '1px solid #fca5a5'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#dc2626' }}>Contraindicações</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Reações alérgicas a rifampicina, sulfa, dapsona ou clofazimina</li>
                        <li>Pacientes menor 30kg (avaliação médica obrigatória)</li>
                        <li>Suspeita de gravidez (informar o médico)</li>
                      </ul>
                    </div>

                    <h4 style={{ marginBottom: '1rem', color: '#ea580c' }}>Reações Adversas Comuns</h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div style={{ padding: '1rem', background: '#fff7ed', borderRadius: '8px' }}>
                        <strong style={{ color: '#dc2626' }}>Rifampicina</strong>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Náusea, vômito, icterícia, disfunção hepática
                        </p>
                      </div>
                      <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px' }}>
                        <strong style={{ color: '#3b82f6' }}>Dapsona</strong>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Dermatose bolhosa, hepatite tóxica, anemia hemolítica
                        </p>
                      </div>
                      <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                        <strong style={{ color: '#059669' }}>Clofazimina</strong>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Descoloração da pele, ictiose, urina rosada
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Seção: Metodologia */}
          <section id="metodologia" style={{ marginBottom: '4rem', scrollMarginTop: '120px' }}>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#003366',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔬 Metodologia
            </h2>

            {/* Resumo do estudo */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '1px solid #3b82f6'
            }}>
              <h3 style={{ color: '#003366', marginBottom: '1rem' }}>Desenho do Estudo</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#003366' }}>Tipo</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Pesquisa Aplicada</div>
                </div>
                <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#003366' }}>Abordagem</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Métodos Mistos</div>
                </div>
                <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#003366' }}>Duração</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>24 meses</div>
                </div>
                <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: '600', color: '#003366' }}>Participantes</div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>205 profissionais</div>
                </div>
              </div>
            </div>

            {/* Etapas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {metodologias.map((etapa, index) => (
                <div key={index} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  borderLeft: '4px solid #003366',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '1rem',
                    width: '30px',
                    height: '30px',
                    background: '#003366',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    {index + 1}
                  </div>

                  <h4 style={{
                    fontSize: '1.1rem',
                    color: '#003366',
                    marginBottom: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {etapa.etapa}
                  </h4>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    {etapa.descricao}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div>
                      <h5 style={{ fontSize: '0.9rem', color: '#003366', marginBottom: '0.5rem' }}>
                        Métodos
                      </h5>
                      <ul style={{
                        paddingLeft: '1.2rem',
                        fontSize: '0.9rem',
                        color: '#374151',
                        lineHeight: '1.6'
                      }}>
                        {etapa.metodos.map((metodo, mIndex) => (
                          <li key={mIndex}>{metodo}</li>
                        ))}
                      </ul>
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <h5 style={{ fontSize: '0.9rem', color: '#059669', marginBottom: '0.5rem' }}>
                        Resultados
                      </h5>
                      <p style={{ fontSize: '0.9rem', color: '#374151' }}>
                        {etapa.resultados}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Aspectos éticos */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: '#fef3c7',
              borderRadius: '12px',
              border: '1px solid #f59e0b'
            }}>
              <h4 style={{ color: '#d97706', marginBottom: '0.75rem' }}>
                Aspectos Éticos
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#92400e', lineHeight: '1.6' }}>
                Pesquisa conduzida seguindo as diretrizes éticas da Resolução CNS 466/2012.
                Aprovada pelo Comitê de Ética em Pesquisa (CEP-UnB).
              </p>
            </div>
          </section>

          {/* Seção: Referências */}
          <section id="referencias" style={{ marginBottom: '4rem', scrollMarginTop: '120px' }}>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#003366',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📖 Referências
            </h2>

            {referencias.map((categoria, catIndex) => (
              <div key={catIndex} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  color: '#003366',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '2px solid rgba(0, 51, 102, 0.1)'
                }}>
                  {categoria.categoria}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {categoria.items.map((ref, refIndex) => (
                    <div key={refIndex} style={{
                      padding: '1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      borderLeft: '3px solid #003366'
                    }}>
                      <div style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.7',
                        color: '#374151'
                      }}>
                        <strong>{ref.autores}</strong> ({ref.ano}).{' '}
                        <em>{ref.titulo}</em>.{' '}
                        {ref.fonte}.
                      </div>
                      {ref.link && (
                        <a
                          href={ref.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#3b82f6',
                            textDecoration: 'none'
                          }}
                        >
                          Acessar documento →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Como citar */}
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              border: '1px solid #3b82f6'
            }}>
              <h4 style={{ color: '#003366', marginBottom: '1rem' }}>
                Como Citar Este Sistema
              </h4>
              <div style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#374151',
                lineHeight: '1.6'
              }}>
                MOURA JUNIOR, N.G. <strong>Sistema de Roteiros de Dispensação PQT-U</strong>.
                Plataforma educacional para orientação farmacêutica em hanseníase.
                Brasília: Universidade de Brasília, 2024.
                Disponível em: https://roteirosdedispensacao.com
              </div>
            </div>
          </section>

          {/* Seção: Código Fonte */}
          <section id="codigo-fonte" style={{ marginBottom: '4rem', scrollMarginTop: '120px' }}>
            <h2 style={{
              fontSize: '1.8rem',
              color: '#003366',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              💻 Código Fonte
            </h2>

            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <p style={{
                fontSize: '1.05rem',
                color: '#374151',
                lineHeight: '1.8',
                marginBottom: '1.5rem'
              }}>
                Este projeto é open-source e está disponível no GitHub para contribuições,
                sugestões e melhorias da comunidade.
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}>
                <a
                  href="https://github.com/AnalineS/roteirosdedispersacao"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '1rem 2rem',
                    background: '#24292f',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  Ver no GitHub
                </a>
              </div>

              <h3 style={{
                fontSize: '1.2rem',
                color: '#003366',
                marginBottom: '1rem'
              }}>
                Stack Tecnológico
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ color: '#003366', marginBottom: '0.5rem' }}>Frontend</h4>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    <li>Next.js 14</li>
                    <li>React 19</li>
                    <li>TypeScript</li>
                  </ul>
                </div>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ color: '#003366', marginBottom: '0.5rem' }}>Backend</h4>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    <li>Flask 3.1</li>
                    <li>Python</li>
                    <li>PostgreSQL</li>
                  </ul>
                </div>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ color: '#003366', marginBottom: '0.5rem' }}>IA e RAG</h4>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    <li>OpenRouter</li>
                    <li>ChromaDB</li>
                    <li>Supabase pgvector</li>
                  </ul>
                </div>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ color: '#003366', marginBottom: '0.5rem' }}>Infraestrutura</h4>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    <li>Google Cloud Run</li>
                    <li>GitHub Actions</li>
                    <li>Docker</li>
                  </ul>
                </div>
              </div>

              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #86efac',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.95rem', color: '#15803d' }}>
                  <strong>Licença:</strong> MIT License - Uso livre para fins educacionais e de pesquisa
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </EducationalLayout>
  );
}
