'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';

export default function DiagnosticoModulePage() {
  const moduleContent = {
    title: 'Diagnóstico da Hanseníase',
    subtitle: 'Sinais, sintomas e exames complementares',
    duration: '15 minutos',
    level: 'Intermediário',
    category: 'Diagnóstico',
    description: 'Aprenda a reconhecer os sinais cardinais, realizar classificação operacional e solicitar exames complementares.',
    
    sections: [
      {
        id: 'sinais-cardinais',
        title: '🎯 Sinais Cardinais da Hanseníase',
        content: `
          O diagnóstico da hanseníase baseia-se na presença de pelo menos um dos sinais cardinais:
          
          **1. Mancha(s) com alteração de sensibilidade:**
          • Hipoestesia ou anestesia térmica, dolorosa e/ou tátil
          • Pode apresentar alteração de cor (hipo/hiperpigmentação)
          • Bordas bem definidas ou difusas
          • Distribuição assimétrica
          
          **2. Espessamento de nervo(s) periférico(s):**
          • Palpação cuidadosa dos nervos superficiais
          • Nervos mais comumente acometidos: ulnar, mediano, fibular comum, tibial posterior
          • Pode estar associado à dor neural
          
          **3. Baciloscopia positiva:**
          • Pesquisa de bacilos álcool-ácido resistentes (BAAR)
          • Coleta em lóbulo da orelha e/ou lesão
          • Resultado expresso pelo Índice Baciloscópico (IB)
        `,
        keyPoints: [
          'Pelo menos UM sinal cardinal é suficiente para diagnóstico',
          'Mancha com alteração de sensibilidade é o sinal mais comum',
          'Baciloscopia positiva confirma o diagnóstico'
        ]
      },
      {
        id: 'classificacao',
        title: '📊 Classificação Operacional',
        content: `
          A classificação operacional determina o esquema terapêutico a ser utilizado:
          
          **PAUCIBACILAR (PB) - Até 5 lesões:**
          • Até 5 lesões de pele
          • Baciloscopia negativa (quando realizada)
          • Comprometimento de apenas um tronco nervoso
          • Formas: tuberculoide e indeterminada
          
          **MULTIBACILAR (MB) - 6 ou mais lesões:**
          • 6 ou mais lesões de pele
          • Baciloscopia positiva (independente do número de lesões)
          • Comprometimento de mais de um tronco nervoso
          • Formas: lepromatosa, borderline e casos com baciloscopia positiva
          
          **Observações importantes:**
          • Na dúvida, classificar como MB
          • Baciloscopia positiva = sempre MB
          • Hanseníase neural pura pode ser PB ou MB
        `,
        keyPoints: [
          'Classificação define o tratamento (PQT-PB vs PQT-MB)',
          'Critério principal: número de lesões (≤5 vs ≥6)',
          'Baciloscopia positiva sempre indica MB'
        ]
      },
      {
        id: 'exames',
        title: '🔬 Exames Complementares',
        content: `
          **1. Baciloscopia (BAAR):**
          • Método: Ziehl-Neelsen
          • Material: raspado dérmico (lóbulo da orelha e lesão)
          • Resultado: Índice Baciloscópico (IB) de 0 a 6+
          • Finalidade: confirmação diagnóstica e classificação
          
          **2. Biópsia de pele:**
          • Indicada quando há dúvida diagnóstica
          • Permite classificação histopatológica
          • Avalia infiltrado inflamatório e presença de bacilos
          • Técnica: punch de 4mm em borda ativa da lesão
          
          **3. Testes de função neural:**
          • Avaliação da sensibilidade térmica, dolorosa e tátil
          • Teste de força muscular
          • Pesquisa de espessamento neural
          • Importante para seguimento e detecção de neurite
          
          **4. Outros exames:**
          • Teste de histamina (pouco usado)
          • Sorologia anti-PGL1 (pesquisa)
          • PCR para M. leprae (não disponível rotineiramente)
        `,
        keyPoints: [
          'Baciloscopia é o exame mais importante',
          'Biópsia reservada para casos duvidosos',
          'Avaliação neurológica é fundamental'
        ]
      },
      {
        id: 'diferencial',
        title: '🔍 Diagnóstico Diferencial',
        content: `
          **Dermatoses a considerar:**
          
          **1. Vitiligo:**
          • Despigmentação completa
          • Sensibilidade preservada
          • Distribuição simétrica
          • Ausência de descamação
          
          **2. Tinha corporis:**
          • Lesões anelares com bordas elevadas
          • Descamação evidente
          • Sensibilidade preservada
          • KOH positivo para fungos
          
          **3. Eczema:**
          • Prurido intenso
          • Sensibilidade preservada
          • História de atopia
          • Resposta a corticoides tópicos
          
          **4. Pitiríase versicolor:**
          • Lesões hipocrômicas com descamação fina
          • Sensibilidade preservada
          • KOH positivo para Malassezia
          
          **5. Neuropatias periféricas:**
          • Diabetes mellitus
          • Deficiência de vitamina B12
          • Alcoolismo
          • Neuropatias hereditárias
        `,
        keyPoints: [
          'Sempre testar sensibilidade das lesões',
          'Considerar história clínica e epidemiológica',
          'Na dúvida, tratar como hanseníase'
        ]
      }
    ],
    
    quiz: [
      {
        question: 'Quantos sinais cardinais são necessários para o diagnóstico de hanseníase?',
        options: [
          'Todos os três sinais cardinais',
          'Pelo menos dois sinais cardinais',
          'Apenas um sinal cardinal',
          'Depende da forma clínica'
        ],
        correct: 2,
        explanation: 'O diagnóstico de hanseníase pode ser estabelecido com a presença de apenas UM dos sinais cardinais.'
      },
      {
        question: 'Um paciente apresenta 4 lesões de pele e baciloscopia positiva. Qual a classificação?',
        options: [
          'Paucibacilar (PB)',
          'Multibacilar (MB)',
          'Depende do tipo de lesão',
          'Necessita biópsia para definir'
        ],
        correct: 1,
        explanation: 'Baciloscopia positiva sempre classifica o caso como Multibacilar (MB), independente do número de lesões.'
      }
    ]
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Module Header */}
        <div style={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <span style={{ fontSize: '3rem' }}>🩺</span>
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
              color: '#9c27b0',
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
              background: '#f3e5f5',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #9c27b0'
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#9c27b0' }}>🎯 Pontos-chave:</h4>
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
            color: '#9c27b0',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🧠 Teste seus conhecimentos
          </h2>
          
          {moduleContent.quiz.map((question, index) => (
            <div key={index} style={{
              background: '#f3e5f5',
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
            href="/modules/hanseniase"
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
            ← Anterior: Sobre a Hanseníase
          </Link>
          
          <Link
            href="/modules/tratamento"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#9c27b0',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Próximo: Tratamento PQT-U →
          </Link>
        </div>
      </div>
    </EducationalLayout>
  );
}