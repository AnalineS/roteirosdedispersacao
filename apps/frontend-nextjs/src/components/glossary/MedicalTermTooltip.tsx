'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getUnbColors } from '@/config/modernTheme';

interface MedicalTermDefinition {
  term: string;
  definition: string;
  category: 'farmacologia' | 'anatomia' | 'patologia' | 'procedimento' | 'sigla';
  complexity: 'basic' | 'intermediate' | 'advanced' | 'technical';
  relatedTerms?: string[];
  pronunciation?: string;
}

interface MedicalTermTooltipProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}

// Base de dados de termos médicos
const medicalTermsDatabase: Record<string, MedicalTermDefinition> = {
  'PQT-U': {
    term: 'PQT-U',
    definition: 'Poliquimioterapia Única - Esquema de tratamento padronizado para hanseníase com 3 medicamentos: rifampicina, clofazimina e dapsona, administrado por 6 meses.',
    category: 'sigla',
    complexity: 'intermediate',
    pronunciation: 'P-Q-T-U',
    relatedTerms: ['rifampicina', 'clofazimina', 'dapsona', 'hanseníase']
  },
  'dermatoneurológico': {
    term: 'dermatoneurológico',
    definition: 'Relacionado à pele (dermato) e sistema nervoso (neurológico). A hanseníase é uma doença dermatoneurológica porque afeta tanto a pele quanto os nervos.',
    category: 'anatomia',
    complexity: 'advanced',
    pronunciation: 'der-ma-to-neu-ro-ló-gi-co',
    relatedTerms: ['hanseníase', 'neuropatia', 'lesões cutâneas']
  },
  'baciloscopia': {
    term: 'baciloscopia',
    definition: 'Exame microscópico para detectar bacilos (bactérias) em material coletado da pele ou mucosa nasal. Usado no diagnóstico da hanseníase.',
    category: 'procedimento',
    complexity: 'intermediate',
    pronunciation: 'ba-ci-los-co-pi-a',
    relatedTerms: ['Mycobacterium leprae', 'diagnóstico', 'índice baciloscópico']
  },
  'Mycobacterium leprae': {
    term: 'Mycobacterium leprae',
    definition: 'Bactéria que causa a hanseníase. É um bacilo álcool-ácido resistente que se multiplica muito lentamente e tem preferência por temperaturas mais baixas.',
    category: 'patologia',
    complexity: 'technical',
    pronunciation: 'Mai-co-bac-té-ri-um lé-prae',
    relatedTerms: ['hanseníase', 'baciloscopia', 'BAAR']
  },
  'clofazimina': {
    term: 'clofazimina',
    definition: 'Medicamento antibiótico usado no tratamento da hanseníase. Pode causar coloração escura na pele, que é reversível após o término do tratamento.',
    category: 'farmacologia',
    complexity: 'intermediate',
    pronunciation: 'clo-fa-zi-mi-na',
    relatedTerms: ['PQT-U', 'hiperpigmentação', 'bactericida']
  },
  'rifampicina': {
    term: 'rifampicina',
    definition: 'Antibiótico muito potente contra a hanseníase. É o medicamento mais importante da PQT-U, capaz de eliminar 99,9% dos bacilos em dose única.',
    category: 'farmacologia',
    complexity: 'intermediate',
    pronunciation: 'ri-fam-pi-ci-na',
    relatedTerms: ['PQT-U', 'bactericida', 'dose supervisionada']
  },
  'dapsona': {
    term: 'dapsona',
    definition: 'Antibiótico usado no tratamento da hanseníase. Impede que a bactéria se multiplique (bacteriostático) e é tomado diariamente pelo paciente.',
    category: 'farmacologia',
    complexity: 'intermediate',
    pronunciation: 'dap-so-na',
    relatedTerms: ['PQT-U', 'bacteriostático', 'dose diária']
  },
  'neurite': {
    term: 'neurite',
    definition: 'Inflamação de um nervo. Na hanseníase, pode causar dor, perda de sensibilidade e fraqueza muscular. Requer tratamento imediato para evitar sequelas.',
    category: 'patologia',
    complexity: 'intermediate',
    pronunciation: 'neu-ri-te',
    relatedTerms: ['neuropatia', 'incapacidades', 'corticoides']
  },
  'estado reacional': {
    term: 'estado reacional',
    definition: 'Reação inflamatória aguda que pode ocorrer durante ou após o tratamento da hanseníase. Não significa que o tratamento falhou, mas precisa de acompanhamento médico.',
    category: 'patologia',
    complexity: 'advanced',
    pronunciation: 'es-ta-do re-a-ci-o-nal',
    relatedTerms: ['neurite', 'eritema nodoso', 'reação reversa']
  },
  'SINAN': {
    term: 'SINAN',
    definition: 'Sistema de Informação de Agravos de Notificação - Sistema do governo para registrar doenças importantes como a hanseníase. Todo caso deve ser notificado.',
    category: 'sigla',
    complexity: 'basic',
    pronunciation: 'SI-NAN',
    relatedTerms: ['notificação compulsória', 'vigilância epidemiológica']
  },
  'PCDT': {
    term: 'PCDT',
    definition: 'Protocolo Clínico e Diretrizes Terapêuticas - Documento oficial do Ministério da Saúde que estabelece como diagnosticar e tratar a hanseníase no Brasil.',
    category: 'sigla',
    complexity: 'intermediate',
    pronunciation: 'P-C-D-T',
    relatedTerms: ['Ministério da Saúde', 'protocolo', 'diretrizes']
  }
};

export default function MedicalTermTooltip({ term, children, className = '' }: MedicalTermTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const unbColors = getUnbColors();

  // Buscar definição do termo (case-insensitive)
  const termDefinition = medicalTermsDatabase[term.toLowerCase()] || 
                        medicalTermsDatabase[term.toUpperCase()] ||
                        medicalTermsDatabase[term];

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;

      // Ajustar se sair da tela pela direita
      if (left + tooltipRect.width > viewport.width - 16) {
        left = viewport.width - tooltipRect.width - 16;
      }

      // Ajustar se sair da tela pela esquerda
      if (left < 16) {
        left = 16;
      }

      // Ajustar se sair da tela por baixo
      if (top + tooltipRect.height > viewport.height - 16) {
        top = triggerRect.top - tooltipRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  // Se não há definição, renderizar apenas o children sem tooltip
  if (!termDefinition) {
    return <>{children}</>;
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      farmacologia: '#059669',
      anatomia: '#dc2626',
      patologia: '#ea580c',
      procedimento: '#7c3aed',
      sigla: '#0369a1'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  const getComplexityLabel = (complexity: string) => {
    const labels = {
      basic: 'Básico',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      technical: 'Técnico'
    };
    return labels[complexity as keyof typeof labels] || 'Básico';
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`medical-term-trigger ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0}
        role="button"
        aria-describedby={`tooltip-${term}`}
        style={{
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: getCategoryColor(termDefinition.category),
          cursor: 'help',
          color: getCategoryColor(termDefinition.category),
          fontWeight: '500',
          outline: 'none',
          borderRadius: '2px',
          padding: '1px 2px',
          transition: 'all 0.2s ease'
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsVisible(!isVisible);
          }
          if (e.key === 'Escape') {
            setIsVisible(false);
          }
        }}
      >
        {children}
      </span>

      {isVisible && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'transparent'
            }}
            onClick={() => setIsVisible(false)}
          />
          
          {/* Tooltip */}
          <div
            ref={tooltipRef}
            id={`tooltip-${term}`}
            role="tooltip"
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 1000,
              background: 'white',
              border: `2px solid ${getCategoryColor(termDefinition.category)}`,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              maxWidth: '320px',
              minWidth: '280px',
              fontSize: '0.9rem',
              lineHeight: '1.5',
              animation: 'fadeIn 200ms ease'
            }}
          >
            {/* Header com termo e categoria */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: `1px solid ${getCategoryColor(termDefinition.category)}20`
            }}>
              <div>
                <h4 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: getCategoryColor(termDefinition.category)
                }}>
                  {termDefinition.term}
                </h4>
                {termDefinition.pronunciation && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    marginTop: '2px'
                  }}>
                    📢 {termDefinition.pronunciation}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  background: getCategoryColor(termDefinition.category),
                  color: 'white',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {termDefinition.category}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {getComplexityLabel(termDefinition.complexity)}
                </span>
              </div>
            </div>

            {/* Definição */}
            <p style={{
              margin: '0 0 12px 0',
              color: '#374151',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              {termDefinition.definition}
            </p>

            {/* Termos relacionados */}
            {termDefinition.relatedTerms && termDefinition.relatedTerms.length > 0 && (
              <div style={{
                background: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  🔗 Termos relacionados:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {termDefinition.relatedTerms.map((relatedTerm, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        background: '#e2e8f0',
                        color: '#475569',
                        borderRadius: '8px',
                        fontWeight: '500'
                      }}
                    >
                      {relatedTerm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Indicador de mais informações */}
            <div style={{
              marginTop: '12px',
              fontSize: '0.75rem',
              color: '#6b7280',
              textAlign: 'center',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb'
            }}>
              💡 Para mais detalhes, visite o <strong>Glossário</strong> completo
            </div>
          </div>
        </>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .medical-term-trigger:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        .medical-term-trigger:focus {
          background-color: rgba(59, 130, 246, 0.1);
          outline: 2px solid #3b82f6;
          outline-offset: 1px;
        }
      `}</style>
    </>
  );
}