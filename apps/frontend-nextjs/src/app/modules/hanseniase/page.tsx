'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';
import { HanseníaseModuleStructuredData } from '@/components/seo/MedicalStructuredData';

export default function HanseníaseModulePage() {
  const moduleContent = {
    title: 'Sobre a Hanseníase',
    subtitle: 'Conceitos fundamentais e epidemiologia',
    duration: '10 minutos',
    level: 'Básico',
    category: 'Fundamentos',
    description: 'Conheça os aspectos básicos da hanseníase: histórico, epidemiologia, transmissão e prevenção.',
    
    sections: [
      {
        id: 'historia',
        title: '📜 História da Hanseníase',
        content: `
          A hanseníase é uma das doenças mais antigas conhecidas pela humanidade, com registros datando de mais de 4.000 anos.
          
          **Marcos históricos:**
          • 600 a.C. - Primeiros registros na Índia
          • 1873 - Descoberta do Mycobacterium leprae por Gerhard Hansen
          • 1940 - Início do tratamento com sulfonas
          • 1981 - Introdução da poliquimioterapia (PQT)
          • 2016 - Implementação da PQT-U no Brasil
        `,
        keyPoints: [
          'Doença milenar com grande estigma social',
          'Descoberta do agente causador revolucionou o tratamento',
          'Evolução terapêutica: sulfonas → PQT → PQT-U'
        ]
      },
      {
        id: 'epidemiologia',
        title: '🌍 Epidemiologia Global',
        content: `
          A hanseníase permanece um problema de saúde pública em vários países, especialmente em regiões tropicais.
          
          **Situação mundial:**
          • 200.000+ novos casos anuais globalmente
          • Brasil: 2º país em número absoluto de casos
          • Prevalência: < 1/10.000 habitantes (meta OMS atingida)
          • Distribuição: concentrada em bolsões de pobreza
        `,
        keyPoints: [
          'Brasil é o 2º país com mais casos no mundo',
          'Doença negligenciada associada à pobreza',
          'Meta de eliminação como problema de saúde pública atingida'
        ]
      },
      {
        id: 'transmissao',
        title: '🦠 Transmissão e Contágio',
        content: `
          A transmissão da hanseníase ocorre principalmente através das vias aéreas superiores.
          
          **Mecanismo de transmissão:**
          • Via: Gotículas respiratórias (tosse, espirro, fala)
          • Fonte: Pacientes multibacilares não tratados
          • Porta de entrada: Mucosa nasal e trato respiratório
          • Período de incubação: 2-7 anos (média 5 anos)
          
          **Fatores de risco:**
          • Contato domiciliar prolongado
          • Condições socioeconômicas precárias
          • Baixa imunidade individual
          • Fatores genéticos
        `,
        keyPoints: [
          'Transmissão respiratória - não há contágio por toque',
          'Longo período de incubação dificulta rastreamento',
          'Pacientes em tratamento não transmitem a doença'
        ]
      },
      {
        id: 'prevencao',
        title: '🛡️ Prevenção e Controle',
        content: `
          A prevenção da hanseníase baseia-se na detecção precoce e tratamento adequado dos casos.
          
          **Estratégias de prevenção:**
          • Busca ativa de casos
          • Exame de contatos domiciliares
          • Tratamento precoce e adequado
          • Educação em saúde
          • Melhoria das condições socioeconômicas
          
          **Vigilância de contatos:**
          • Exame anual por 5 anos após o diagnóstico
          • BCG para contatos suscetíveis
          • Orientação sobre sinais e sintomas
        `,
        keyPoints: [
          'Diagnóstico precoce é a melhor forma de prevenção',
          'Vigilância de contatos é fundamental',
          'Educação em saúde combate o estigma'
        ]
      }
    ],
    
    quiz: [
      {
        question: 'Qual é o principal mecanismo de transmissão da hanseníase?',
        options: [
          'Contato físico direto com o paciente',
          'Gotículas respiratórias de pacientes não tratados',
          'Contato com objetos contaminados',
          'Picada de insetos vetores'
        ],
        correct: 1,
        explanation: 'A hanseníase é transmitida principalmente através de gotículas respiratórias eliminadas por pacientes multibacilares não tratados.'
      },
      {
        question: 'Qual foi o marco mais importante para o tratamento da hanseníase?',
        options: [
          'Descoberta do M. leprae em 1873',
          'Introdução da PQT em 1981',
          'Uso das sulfonas em 1940',
          'Implementação da PQT-U em 2016'
        ],
        correct: 1,
        explanation: 'A introdução da poliquimioterapia (PQT) em 1981 revolucionou o tratamento, tornando-o mais eficaz e reduzindo o tempo de terapia.'
      }
    ]
  };

  return (
    <>
      <HanseníaseModuleStructuredData
        moduleTitle={moduleContent.title}
        moduleDescription={moduleContent.description}
        moduleType="educational"
        duration={moduleContent.duration}
        level={moduleContent.level}
        category={moduleContent.category}
      />
      <EducationalLayout>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Module Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <span style={{ fontSize: '3rem' }}>🔬</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 'bold' }}>
                {moduleContent.title}
              </h1>
              <p style={{ margin: '5px 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
                {moduleContent.subtitle}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              📊 {moduleContent.level}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              ⏱️ {moduleContent.duration}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              📚 {moduleContent.category}
            </span>
          </div>
          
          <p style={{ margin: '15px 0 0', fontSize: '1rem', opacity: 0.9 }}>
            {moduleContent.description}
          </p>
        </div>

        {/* Module Content */}
        {moduleContent.sections.map((section, index) => (
          <div key={section.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#1976d2',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {section.title}
            </h2>
            
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#444',
              marginBottom: '20px',
              whiteSpace: 'pre-line'
            }}>
              {section.content}
            </div>
            
            {/* Key Points */}
            <div style={{
              background: '#f8fafc',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #1976d2'
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#1976d2' }}>🎯 Pontos-chave:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: '5px', color: '#555' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Quiz Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#1976d2',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🧠 Teste seus conhecimentos
          </h2>
          
          {moduleContent.quiz.map((question, index) => (
            <div key={index} style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>
                {index + 1}. {question.question}
              </h4>
              
              {question.options.map((option, optIndex) => (
                <div key={optIndex} style={{
                  padding: '8px 12px',
                  margin: '5px 0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: optIndex === question.correct ? '#e8f5e8' : '#fff',
                  border: optIndex === question.correct ? '2px solid #4caf50' : '1px solid #ddd'
                }}>
                  {String.fromCharCode(65 + optIndex)}. {option}
                  {optIndex === question.correct && (
                    <span style={{ color: '#4caf50', marginLeft: '10px', fontWeight: 'bold' }}>
                      ✓ Correto
                    </span>
                  )}
                </div>
              ))}
              
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#fff3cd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#856404'
              }}>
                <strong>💡 Explicação:</strong> {question.explanation}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Link
            href="/modules"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            ← Voltar aos Módulos
          </Link>
          
          <Link
            href="/modules/diagnostico"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Próximo: Diagnóstico →
          </Link>
        </div>
        </div>
      </EducationalLayout>
    </>
  );
}