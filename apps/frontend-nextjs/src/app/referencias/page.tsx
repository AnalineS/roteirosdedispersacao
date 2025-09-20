'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';

export default function ReferenciasPage() {
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
          autores: "Penna GO, Bührer-Sékula S, Kerr LRS, et al.",
          ano: "2017",
          titulo: "Uniform multidrug therapy for leprosy patients in Brazil (U-MDT/CT-BR): Results of an open label, randomized and controlled clinical trial, among multibacillary patients",
          fonte: "PLoS Negl Trop Dis. 2017;11(7):e0005725",
          link: "https://doi.org/10.1371/journal.pntd.0005725"
        },
        {
          autores: "Penna MLF, Penna GO, et al.",
          ano: "2020",
          titulo: "Long-term follow-up of leprosy patients treated with uniform multidrug therapy in Brazil",
          fonte: "Trans R Soc Trop Med Hyg. 2020;114(5):355-363",
          link: null
        },
        {
          autores: "Santos VS, Santana JCV, Castro FN, et al.",
          ano: "2016",
          titulo: "Pain and quality of life in leprosy patients in an endemic area of Northeast Brazil: a cross-sectional study",
          fonte: "Infect Dis Poverty. 2016;5:18",
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
          fonte: "8ª ed. Rio de Janeiro: Elsevier",
          link: null
        },
        {
          autores: "Conselho Federal de Farmácia",
          ano: "2019",
          titulo: "Serviços farmacêuticos diretamente destinados ao paciente, à família e à comunidade",
          fonte: "Brasília: CFF",
          link: "https://www.cff.org.br/userfiles/file/Profar_Arcabouco_TELA_FINAL.pdf"
        },
        {
          autores: "ANVISA",
          ano: "2021",
          titulo: "RDC nº 471 - Dispensa de medicamentos em farmácias e drogarias",
          fonte: "Diário Oficial da União",
          link: null
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
          fonte: "71ª ed. Rio de Janeiro: Paz e Terra",
          link: null
        },
        {
          autores: "Lévy P",
          ano: "2010",
          titulo: "Cibercultura",
          fonte: "3ª ed. São Paulo: Editora 34",
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
          autores: "Silva, A.S.",
          ano: "2024",
          titulo: "Desenvolvimento e Validação de Sistema Educacional Inteligente para Orientação na Dispensação de Medicamentos do Esquema PQT-U em Hanseníase",
          fonte: "Tese (Doutorado em Ciências Farmacêuticas) - Universidade de Brasília",
          link: null
        },
        {
          autores: "Oliveira, M.R.",
          ano: "2021",
          titulo: "Avaliação do impacto da poliquimioterapia única no tratamento da hanseníase no Brasil",
          fonte: "Dissertação (Mestrado em Saúde Coletiva) - Universidade Federal de Goiás",
          link: null
        }
      ]
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
            fontWeight: '700'
          }}>
            📚 Referências Bibliográficas
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Base científica e referencial teórico utilizado no desenvolvimento do sistema educacional e na pesquisa sobre PQT-U em hanseníase.
          </p>
        </div>

        {/* Referências por categoria */}
        {referencias.map((categoria, catIndex) => (
          <div key={catIndex} style={{
            marginBottom: '3rem',
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 51, 102, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#003366',
              marginBottom: '1.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid rgba(0, 51, 102, 0.1)',
              fontWeight: '600'
            }}>
              {categoria.categoria}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {categoria.items.map((ref, refIndex) => (
                <div key={refIndex} style={{
                  padding: '1rem',
                  background: 'rgba(248, 250, 252, 0.5)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #003366'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.8',
                    color: '#374151'
                  }}>
                    <strong>{ref.autores}</strong> ({ref.ano}).{' '}
                    <em>{ref.titulo}</em>.{' '}
                    {ref.fonte}.
                  </div>
                  {ref.link && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <a 
                        href={ref.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.85rem',
                          color: '#3b82f6',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 3v4a1 1 0 01-1 1H5a1 1 0 01-1-1V3m3 8v4m-2-4h4" />
                        </svg>
                        Acessar documento
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Citação e uso */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          border: '1px solid #3b82f6'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            color: '#003366',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            ℹ️ Como Citar Este Sistema
          </h3>
          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: '#374151',
            lineHeight: '1.6'
          }}>
            SILVA, A.S. <strong>Sistema de Roteiros de Dispensação PQT-U</strong>. 
            Plataforma educacional para orientação farmacêutica em hanseníase. 
            Brasília: Universidade de Brasília, 2024. 
            Disponível em: https://roteiros-de-dispensacao.web.app
          </div>
        </div>

        {/* Links relacionados */}
        <div style={{
          marginTop: '2rem',
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
              href="/metodologia"
              style={{
                padding: '0.5rem 1rem',
                background: '#003366',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Ver Metodologia
            </Link>
            <Link 
              href="/sobre-a-tese"
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#003366',
                border: '1px solid #003366',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Sobre a Tese
            </Link>
            <a 
              href="https://github.com/AnalineS/roteirosdedispersacao"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#003366',
                border: '1px solid #003366',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Código Fonte
            </a>
          </div>
        </div>
      </div>
    </EducationalLayout>
  );
}