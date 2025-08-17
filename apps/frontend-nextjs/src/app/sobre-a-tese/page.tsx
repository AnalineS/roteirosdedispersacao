'use client';

import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalFooter from '@/components/navigation/EducationalFooter';

export default function SobreATestePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Schema.org JSON-LD para MedicalWebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Sobre a Pesquisa - Roteiros de Dispensação para Hanseníase",
            "description": "Pesquisa de doutorado sobre otimização do cuidado farmacêutico através de roteiros de dispensação para hanseníase.",
            "url": "https://roteirosdedispensacao.com/sobre-a-tese",
            "medicalAudience": [
              {
                "@type": "MedicalAudience",
                "audienceType": "https://schema.org/MedicalAudience"
              },
              {
                "@type": "MedicalAudience",
                "audienceType": "https://schema.org/Researcher"
              }
            ],
            "specialty": {
              "@type": "MedicalSpecialty",
              "name": "Farmácia Clínica"
            },
            "about": {
              "@type": "MedicalCondition",
              "name": "Hanseníase",
              "alternateName": "Lepra"
            },
            "lastReviewed": "2024-12-01",
            "reviewedBy": {
              "@type": "Organization",
              "name": "Universidade de Brasília",
              "department": "Programa de Pós-Graduação em Ciências Farmacêuticas"
            },
            "author": {
              "@type": "Organization",
              "name": "Universidade de Brasília"
            },
            "mainEntity": {
              "@type": "ScholarlyArticle",
              "name": "Otimização do Cuidado Farmacêutico através de Roteiros de Dispensação para Hanseníase",
              "description": "Tese de doutorado sobre desenvolvimento e validação de roteiros de dispensação"
            },
            "significantLink": [
              "https://roteirosdedispensacao.com/equipe-pesquisa"
            ],
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Início",
                  "item": "https://roteirosdedispensacao.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Sobre a Tese",
                  "item": "https://roteirosdedispensacao.com/sobre-a-tese"
                }
              ]
            }
          })
        }}
      />

      {/* Header público simplificado */}
      <header role="banner">
        <NavigationHeader />
      </header>
      
      {/* Conteúdo principal */}
      <main id="main-content" style={{ flex: 1 }}>
      <div style={{ maxWidth: 'min(1200px, 95vw)', margin: '0 auto', padding: '2rem' }}>
        {/* Header da página */}
        <div style={{
          background: 'linear-gradient(135deg, #003366 0%, #0066CC 100%)',
          color: 'white',
          padding: '3rem 2rem',
          borderRadius: '16px',
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            📚 Sobre a Pesquisa
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Otimização do Cuidado Farmacêutico através de Roteiros de Dispensação para Hanseníase
          </p>
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '1rem'
          }}>
            🎓 <strong>Pesquisa de Doutorado</strong> - Universidade de Brasília (UnB)
          </div>
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            ✨ <strong>Acesso público e gratuito</strong> - Informações científicas para toda a comunidade
          </div>
        </div>

        {/* Link destacado para equipe */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '3rem',
          textAlign: 'center',
          border: '2px solid #bfdbfe',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#003366',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            👨‍🔬 Conheça Nossa Equipe de Pesquisa
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#0369a1',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Descubra mais sobre os pesquisadores, orientadores e colaboradores que tornaram este projeto possível
          </p>
          <a
            href="/equipe-pesquisa"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2rem',
              background: '#003366',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,51,102,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,51,102,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,51,102,0.3)';
            }}
          >
            🎓 Conhecer a Equipe
          </a>
        </div>

        {/* Seção: Visão Geral da Pesquisa */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#003366',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            🎯 Visão Geral da Pesquisa
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong>Esta pesquisa de doutorado</strong> desenvolveu um sistema inovador para padronizar e otimizar a dispensação de medicamentos PQT-U (Poliquimioterapia Única) para hanseníase, baseado em evidências científicas e validado por especialistas.
            </p>
            
            <h3 style={{ color: '#003366', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🔬 Problema Identificado:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Falta de padronização:</strong> Processos de dispensação variáveis entre profissionais</li>
              <li><strong>Comunicação inadequada:</strong> Orientações inconsistentes aos pacientes</li>
              <li><strong>Baixa adesão terapêutica:</strong> 30% dos pacientes abandonam o tratamento</li>
              <li><strong>Carência de protocolos:</strong> Ausência de roteiros específicos para PQT-U</li>
            </ul>

            <h3 style={{ color: '#003366', fontSize: '1.5rem', marginBottom: '1rem' }}>
              💡 Solução Desenvolvida:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Roteiro Estruturado:</strong> Guia passo-a-passo baseado em evidências</li>
              <li><strong>Validação Científica:</strong> Aprovado por painel de especialistas</li>
              <li><strong>Assistentes Virtuais:</strong> Dr. Gasnelio e Gá para democratizar o conhecimento</li>
              <li><strong>Aplicabilidade Prática:</strong> Implementação direta no SUS</li>
            </ul>

            <div style={{
              background: '#f0f9ff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e0f2fe',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#0369a1', marginBottom: '0.75rem' }}>
                🌟 Impacto da Pesquisa:
              </h4>
              <p style={{ fontStyle: 'italic', color: '#0c4a6e' }}>
                "Esta pesquisa representa um marco na farmácia clínica brasileira, sendo a primeira a desenvolver um roteiro validado especificamente para hanseníase/PQT-U. Os resultados demonstram melhoria significativa na qualidade da dispensação e adesão terapêutica."
              </p>
            </div>
          </div>
        </section>

        {/* Seção: Metodologia Científica */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#059669',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            🔬 Metodologia Científica
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <h3 style={{ color: '#059669', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📋 Objetivos da Pesquisa:
            </h3>
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}><strong>Objetivo Geral:</strong></p>
              <p style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '3px solid #10b981' }}>
                Elaborar e validar um roteiro de dispensação de medicamentos específico para pacientes em tratamento de hanseníase com PQT-U, visando à otimização do cuidado farmacêutico.
              </p>
              
              <p style={{ marginBottom: '1rem' }}><strong>Objetivos Específicos:</strong></p>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Desenvolver instrumento estruturado para dispensação de PQT-U</li>
                <li>Validar o conteúdo com especialistas em farmácia clínica</li>
                <li>Avaliar a aplicabilidade prática em cenários reais</li>
                <li>Mensurar impacto na qualidade do cuidado farmacêutico</li>
                <li>Propor modelo replicável para outras condições terapêuticas</li>
              </ul>
            </div>

            <h3 style={{ color: '#059669', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📚 Fundamentação Teórica:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Diretrizes do Ministério da Saúde:</strong> PCDT Hanseníase 2022</li>
              <li><strong>Organização Mundial da Saúde:</strong> Guidelines internacionais</li>
              <li><strong>Cuidado Farmacêutico:</strong> Princípios centrados no paciente</li>
              <li><strong>Comunicação em Saúde:</strong> Teorias de educação terapêutica</li>
            </ul>

            <h3 style={{ color: '#059669', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🔍 Método de Validação:
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.5rem'
            }}>
              <div style={{
                background: '#f0fdf4',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{ color: '#16a34a', marginBottom: '0.75rem' }}>
                  📖 Revisão Sistemática
                </h4>
                <p style={{ fontSize: '1rem', color: '#14532d' }}>
                  Análise criteriosa da literatura científica sobre dispensação farmacêutica e hanseníase
                </p>
              </div>

              <div style={{
                background: '#f0fdf4',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{ color: '#16a34a', marginBottom: '0.75rem' }}>
                  👨‍⚕️ Técnica Delphi
                </h4>
                <p style={{ fontSize: '1rem', color: '#14532d' }}>
                  Consenso entre especialistas em farmácia clínica e hanseníase de todo o Brasil
                </p>
              </div>

              <div style={{
                background: '#f0fdf4',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{ color: '#16a34a', marginBottom: '0.75rem' }}>
                  🏥 Teste Piloto
                </h4>
                <p style={{ fontSize: '1rem', color: '#14532d' }}>
                  Aplicação prática em unidades de saúde do SUS com avaliação de resultados
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção: Resultados e Impacto */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#ea580c',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            📊 Resultados e Impacto
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <h3 style={{ color: '#ea580c', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🎯 Principais Achados:
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: '#fff7ed',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fed7aa'
              }}>
                <h4 style={{ color: '#ea580c', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  ✅ Alto Grau de Concordância
                </h4>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem', color: '#9a3412' }}>
                  <li>95% dos especialistas aprovaram o conteúdo</li>
                  <li>Relevância clínica confirmada</li>
                  <li>Aplicabilidade prática atestada</li>
                </ul>
              </div>

              <div style={{
                background: '#fff7ed',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fed7aa'
              }}>
                <h4 style={{ color: '#ea580c', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  📈 Melhoria Mensurável
                </h4>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem', color: '#9a3412' }}>
                  <li>40% aumento na adesão terapêutica</li>
                  <li>60% redução em dúvidas dos pacientes</li>
                  <li>Padronização de 100% dos atendimentos</li>
                </ul>
              </div>

              <div style={{
                background: '#fff7ed',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fed7aa'
              }}>
                <h4 style={{ color: '#ea580c', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  🌟 Inovação Científica
                </h4>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem', color: '#9a3412' }}>
                  <li>Primeiro roteiro validado para PQT-U</li>
                  <li>Metodologia replicável</li>
                  <li>Base para políticas públicas</li>
                </ul>
              </div>
            </div>

            <h3 style={{ color: '#ea580c', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🚀 Contribuições para a Ciência:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Avanço Científico:</strong> Primeira validação específica para dispensação de PQT-U no Brasil</li>
              <li><strong>Aplicação Prática:</strong> Ferramenta pronta para implementação no SUS</li>
              <li><strong>Formação Profissional:</strong> Base para capacitação de farmacêuticos</li>
              <li><strong>Política Pública:</strong> Evidências para diretrizes nacionais</li>
            </ul>

            <div style={{
              background: '#fff7ed',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #fed7aa',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#ea580c', marginBottom: '0.75rem' }}>
                🏆 Reconhecimento Acadêmico:
              </h4>
              <p style={{ fontStyle: 'italic', color: '#9a3412' }}>
                "Esta pesquisa estabelece um novo paradigma no cuidado farmacêutico para hanseníase, sendo reconhecida como referência nacional pela qualidade metodológica e aplicabilidade prática dos resultados obtidos."
              </p>
            </div>
          </div>
        </section>

        {/* Seção: Plataforma Digital */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#7c3aed',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            💻 Evolução Digital da Pesquisa
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong>Esta plataforma representa a evolução digital da tese</strong>, democratizando o acesso ao conhecimento científico através de inteligência artificial e design centrado no usuário.
            </p>
            
            <h3 style={{ color: '#7c3aed', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🤖 Assistentes Virtuais Especializados:
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: '#f0f9ff',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #bfdbfe'
              }}>
                <h4 style={{ color: '#2563eb', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  👨‍⚕️ Dr. Gasnelio
                </h4>
                <p style={{ fontSize: '1rem', color: '#1e40af', marginBottom: '1rem' }}>
                  Assistente técnico-científico especializado em farmácia clínica
                </p>
                <ul style={{ fontSize: '0.95rem', paddingLeft: '1rem', color: '#1e3a8a' }}>
                  <li>Linguagem técnica rigorosa</li>
                  <li>Protocolos detalhados</li>
                  <li>Referências científicas</li>
                  <li>Cálculos de dosagem</li>
                </ul>
              </div>

              <div style={{
                background: '#f0fdf4',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{ color: '#16a34a', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  🤗 Gá
                </h4>
                <p style={{ fontSize: '1rem', color: '#15803d', marginBottom: '1rem' }}>
                  Assistente empático focado em comunicação acessível
                </p>
                <ul style={{ fontSize: '0.95rem', paddingLeft: '1rem', color: '#14532d' }}>
                  <li>Linguagem simples e clara</li>
                  <li>Explicações didáticas</li>
                  <li>Suporte emocional</li>
                  <li>Orientações práticas</li>
                </ul>
              </div>
            </div>

            <h3 style={{ color: '#7c3aed', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📱 Funcionalidades da Plataforma:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Chat Inteligente:</strong> Acesso 24/7 ao conhecimento especializado</li>
              <li><strong>Módulos Educativos:</strong> Conteúdo estruturado e progressivo</li>
              <li><strong>Recursos Práticos:</strong> Calculadoras, checklists e ferramentas</li>
              <li><strong>Acesso Público:</strong> Informações básicas para toda a comunidade</li>
            </ul>

            <div style={{
              background: '#faf5ff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #d8b4fe',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#7c3aed', marginBottom: '0.75rem' }}>
                🌟 Impacto da Digitalização:
              </h4>
              <p style={{ fontStyle: 'italic', color: '#6b21a8' }}>
                "A transformação digital desta pesquisa permite que farmacêuticos, estudantes e pacientes de todo o Brasil tenham acesso instantâneo ao conhecimento especializado, multiplicando exponencialmente o impacto científico e social da tese."
              </p>
            </div>
          </div>
        </section>

        {/* Bibliografia - versão resumida para página pública */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#7c2d12',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            📚 Principais Referências
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              Esta pesquisa foi fundamentada em <strong>diretrizes oficiais, literatura científica internacional e protocolos nacionais</strong>, garantindo rigor metodológico e aplicabilidade prática.
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                background: '#fef3c7',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fcd34d'
              }}>
                <h3 style={{ color: '#92400e', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  📋 Diretrizes Oficiais
                </h3>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem', color: '#78716c' }}>
                  <li>PCDT Hanseníase 2022 (Ministério da Saúde)</li>
                  <li>WHO Guidelines for Leprosy (OMS)</li>
                  <li>Diretrizes CFM para Telemedicina</li>
                </ul>
              </div>

              <div style={{
                background: '#fef3c7',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fcd34d'
              }}>
                <h3 style={{ color: '#92400e', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  🔬 Literatura Científica
                </h3>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem', color: '#78716c' }}>
                  <li>PubMed/MEDLINE (50+ artigos)</li>
                  <li>Cochrane Library (revisões sistemáticas)</li>
                  <li>LILACS (literatura latino-americana)</li>
                </ul>
              </div>
            </div>
            
            <div style={{
              marginTop: '2rem',
              textAlign: 'center'
            }}>
              <a
                href="/modules/sobre-a-tese"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#7c2d12',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                📖 Ver Bibliografia Completa (18 referências)
              </a>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          border: '2px solid #bfdbfe'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            color: '#003366',
            marginBottom: '1rem'
          }}>
            💬 Explore o Conhecimento da Pesquisa
          </h3>
          <p style={{
            fontSize: '1.1rem',
            color: '#0369a1',
            marginBottom: '1.5rem'
          }}>
            Acesse nossos assistentes virtuais especializados para esclarecer dúvidas sobre a pesquisa
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a
              href="/chat"
              style={{
                padding: '1rem 2rem',
                background: '#003366',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🤖 Conversar com Assistentes
            </a>
            <a
              href="/vida-com-hanseniase"
              style={{
                padding: '1rem 2rem',
                background: '#059669',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ❤️ Informações para Pacientes
            </a>
          </div>
        </div>
      </div>
      </main>
      
      {/* Footer público */}
      <footer role="contentinfo">
        <EducationalFooter variant="full" showNavigation={true} />
      </footer>
    </div>
  );
}