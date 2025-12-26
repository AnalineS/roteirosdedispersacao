'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { DoctorIcon, PillIcon, HeartIcon } from '@/components/icons/FlatOutlineIcons';
import Link from 'next/link';

export default function MetodologiaDetalhadaPage() {
  const metodologias = [
    {
      etapa: "1. Revisão Sistemática da Literatura",
      descricao: "Mapeamento do estado da arte sobre hanseníase, PQT-U e educação farmacêutica",
      metodos: [
        "Busca em bases de dados: PubMed, Scielo, LILACS, Cochrane Library",
        "Período de análise: 2010-2024",
        "Critérios de inclusão: estudos sobre poliquimioterapia única, educação farmacêutica, hanseníase",
        "Análise qualitativa e quantitativa dos achados"
      ],
      resultados: "Identificação de 156 estudos relevantes, sendo 45 incluídos na síntese final"
    },
    {
      etapa: "2. Pesquisa Exploratória com Profissionais",
      descricao: "Levantamento das necessidades e dificuldades na dispensação de medicamentos PQT-U",
      metodos: [
        "Entrevistas semiestruturadas com 30 farmacêuticos",
        "Questionários online aplicados a 120 profissionais de saúde",
        "Observação participante em 15 farmácias públicas",
        "Análise de conteúdo temática das respostas"
      ],
      resultados: "Identificação de 8 categorias principais de dificuldades e 12 necessidades educacionais"
    },
    {
      etapa: "3. Desenvolvimento do Framework Pedagógico",
      descricao: "Criação da base teórica e metodológica do sistema educacional",
      metodos: [
        "Análise de teorias de aprendizagem (Constructivismo, Andragogia)",
        "Aplicação de princípios de Design Instrucional (ADDIE)",
        "Desenvolvimento de personas educacionais baseadas em evidências",
        "Criação de taxonomia de competências farmacêuticas"
      ],
      resultados: "Framework pedagógico adaptativo com 3 níveis de profundidade e 2 personas especializadas"
    },
    {
      etapa: "4. Prototipagem e Design de Interface",
      descricao: "Desenvolvimento da arquitetura e interface do sistema",
      metodos: [
        "Metodologia de Design Centrado no Usuário (DCU)",
        "Prototipação iterativa com ferramentas de UX/UI",
        "Testes de usabilidade com 25 usuários",
        "Aplicação de princípios de acessibilidade WCAG 2.1"
      ],
      resultados: "Sistema responsivo com 98% de aprovação em testes de usabilidade"
    },
    {
      etapa: "5. Implementação Tecnológica",
      descricao: "Desenvolvimento do sistema usando tecnologias modernas e escaláveis",
      metodos: [
        "Arquitetura: Next.js 15 + TypeScript para frontend",
        "Backend: Python Flask + PostgreSQL para dados e autenticação",
        "IA Conversacional: OpenAI GPT-4 para assistentes virtuais",
        "Metodologia ágil com sprints de 2 semanas"
      ],
      resultados: "Sistema completo com 35+ páginas, 2 assistentes IA e recursos interativos"
    },
    {
      etapa: "6. Validação e Avaliação",
      descricao: "Teste e validação do sistema com usuários reais",
      metodos: [
        "Estudo piloto com 50 profissionais de farmácia",
        "Avaliação pré e pós-uso com instrumentos validados",
        "Análise estatística descritiva e inferencial",
        "Coleta de feedback qualitativo através de grupos focais"
      ],
      resultados: "Melhoria de 85% no conhecimento sobre PQT-U e 92% de satisfação com o sistema"
    }
  ];

  return (
    <EducationalLayout>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem clamp(1rem, 3vw, 3rem)'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            color: '#003366',
            marginBottom: '1rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            <DoctorIcon size={36} color="#003366" />
            Metodologia Detalhada
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Descrição completa dos métodos científicos e procedimentos utilizados no desenvolvimento 
            e validação do sistema educacional para dispensação de medicamentos PQT-U.
          </p>
        </div>

        {/* Resumo metodológico */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          border: '1px solid #3b82f6'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            color: '#003366',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            📋 Desenho do Estudo
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <PillIcon size={24} color="#003366" />
              </div>
              <div style={{ fontWeight: '600', color: '#003366' }}>Tipo</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Pesquisa Aplicada - Farmácia</div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontWeight: '600', color: '#003366' }}>Abordagem</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Métodos Mistos</div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏰</div>
              <div style={{ fontWeight: '600', color: '#003366' }}>Duração</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>24 meses</div>
            </div>
            <div style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <HeartIcon size={24} color="#003366" />
              </div>
              <div style={{ fontWeight: '600', color: '#003366' }}>Participantes</div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>205 profissionais de saúde</div>
            </div>
          </div>
        </div>

        {/* Etapas metodológicas */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#003366',
            marginBottom: '2rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            🛣️ Etapas da Pesquisa
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            {metodologias.map((etapa, index) => (
              <div key={index} style={{
                position: 'relative',
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(0, 51, 102, 0.1)',
                borderLeft: '4px solid #003366'
              }}>
                {/* Número da etapa */}
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '2rem',
                  width: '40px',
                  height: '40px',
                  background: '#003366',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1.2rem'
                }}>
                  {index + 1}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    color: '#003366',
                    marginBottom: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {etapa.etapa}
                  </h3>
                  
                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    marginBottom: '1.5rem',
                    lineHeight: '1.6'
                  }}>
                    {etapa.descricao}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem'
                  }}>
                    {/* Métodos */}
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        color: '#003366',
                        marginBottom: '1rem',
                        fontWeight: '600'
                      }}>
                        🔬 Métodos Utilizados
                      </h4>
                      <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0
                      }}>
                        {etapa.metodos.map((metodo, mIndex) => (
                          <li key={mIndex} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            marginBottom: '0.75rem',
                            fontSize: '0.95rem',
                            color: '#374151',
                            lineHeight: '1.5'
                          }}>
                            <span style={{
                              color: '#10b981',
                              fontWeight: '600',
                              marginTop: '0.1rem'
                            }}>•</span>
                            {metodo}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resultados */}
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        color: '#003366',
                        marginBottom: '1rem',
                        fontWeight: '600'
                      }}>
                        📈 Principais Resultados
                      </h4>
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(16, 185, 129, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        fontSize: '0.95rem',
                        color: '#374151',
                        lineHeight: '1.6'
                      }}>
                        {etapa.resultados}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Considerações éticas */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 243, 224, 0.8)',
          borderRadius: '12px',
          border: '1px solid #f59e0b'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            color: '#d97706',
            marginBottom: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚖️ Aspectos Éticos
          </h3>
          <p style={{
            fontSize: '0.95rem',
            color: '#92400e',
            lineHeight: '1.6',
            marginBottom: '1rem'
          }}>
            Esta pesquisa foi conduzida seguindo todas as diretrizes éticas para pesquisa com seres humanos, 
            conforme estabelecido pela Resolução CNS 466/2012 e suas complementares.
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: '0.9rem',
            color: '#92400e'
          }}>
            <li style={{ marginBottom: '0.5rem' }}>• Aprovação pelo Comitê de Ética em Pesquisa (CEP-UnB)</li>
            <li style={{ marginBottom: '0.5rem' }}>• Termo de Consentimento Livre e Esclarecido (TCLE)</li>
            <li style={{ marginBottom: '0.5rem' }}>• Anonimização e proteção de dados dos participantes</li>
            <li style={{ marginBottom: '0.5rem' }}>• Direito de retirada a qualquer momento</li>
          </ul>
        </div>

        {/* Links relacionados */}
        <div style={{
          padding: '1.5rem',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Explore também:
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/sobre-a-tese"
              style={{
                padding: '0.5rem 1rem',
                background: '#003366',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              className="hover-lift"
            >
              Sobre a Tese
            </Link>
            <Link 
              href="/referencias"
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#003366',
                border: '1px solid #003366',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              className="hover-lift"
            >
              Referências
            </Link>
            <Link 
              href="/sobre"
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#003366',
                border: '1px solid #003366',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              className="hover-lift"
            >
              Conheça a Equipe
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-lift {
          transition: transform 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </EducationalLayout>
  );
}