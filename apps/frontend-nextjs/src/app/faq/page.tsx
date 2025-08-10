'use client';

import { useState } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';
import { ChevronDownIcon } from '@/components/icons/NavigationIcons';

export default function FAQPage() {
  const unbColors = getUnbColors();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const faqs = [
    {
      pergunta: 'O que é PQT-U e como funciona?',
      resposta: 'A Poliquimioterapia Única (PQT-U) é o esquema de tratamento padronizado para hanseníase, recomendado pelo Ministério da Saúde. Consiste na combinação de três medicamentos: Rifampicina, Clofazimina e Dapsona para casos MB, ou Rifampicina e Dapsona para casos PB.'
    },
    {
      pergunta: 'Como utilizar os assistentes Dr. Gasnelio e Gá?',
      resposta: 'Dr. Gasnelio oferece respostas técnicas e científicas, ideal para profissionais. Gá fornece explicações mais acessíveis e empáticas, adequada para pacientes e familiares. Ambos são baseados nas mesmas diretrizes oficiais.'
    },
    {
      pergunta: 'A plataforma substitui o julgamento clínico?',
      resposta: 'Não. Esta plataforma é uma ferramenta educacional de apoio. Sempre consulte as diretrizes oficiais e mantenha o julgamento clínico profissional para decisões de tratamento.'
    },
    {
      pergunta: 'Como posso acessar as ferramentas práticas?',
      resposta: 'Acesse a seção "Recursos Práticos" no menu principal. Lá você encontrará calculadoras de doses, checklists de dispensação e guias de reações adversas.'
    },
    {
      pergunta: 'Os dados são seguros na plataforma?',
      resposta: 'Sim. Seguimos rigorosamente a LGPD e não coletamos dados pessoais sem consentimento. As conversas com os assistentes são processadas de forma segura e confidencial.'
    }
  ];

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>
            ❓ Perguntas Frequentes
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Dúvidas mais comuns sobre a plataforma e PQT-U
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => toggleItem(index)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: expandedItems.has(index) ? unbColors.alpha.primary : '#f8fafc',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: unbColors.primary
                  }}
                >
                  {faq.pergunta}
                  <div style={{
                    transform: expandedItems.has(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    <ChevronDownIcon
                      size={20}
                      color={unbColors.primary}
                    />
                  </div>
                </button>
                
                {expandedItems.has(index) && (
                  <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      lineHeight: '1.6',
                      fontSize: '1rem'
                    }}>
                      {faq.resposta}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}