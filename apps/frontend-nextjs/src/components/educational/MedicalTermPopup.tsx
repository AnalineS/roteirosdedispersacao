'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookIcon, DoctorIcon, PillIcon, HeartIcon } from '@/components/icons/FlatOutlineIcons';
import { modernChatTheme } from '@/config/modernTheme';

interface MedicalTerm {
  id: string;
  term: string;
  definition: string;
  category: 'medication' | 'procedure' | 'condition' | 'general';
  examples?: string[];
  relatedTerms?: string[];
  clinicalNote?: string;
  source?: string;
}

interface MedicalTermPopupProps {
  term: string;
  isVisible: boolean;
  onClose: () => void;
  customDefinition?: MedicalTerm;
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  delay?: number;
}

// Database simulado de termos médicos relacionados à hanseníase e PQT-U
const medicalTermsDatabase: Record<string, MedicalTerm> = {
  'pqt-u': {
    id: 'pqt-u',
    term: 'PQT-U',
    definition: 'Poliquimioterapia Única para hanseníase, esquema terapêutico que combina rifampicina, dapsona e clofazimina em doses únicas.',
    category: 'medication',
    examples: [
      'Administração supervisionada mensal',
      'Esquema para casos paucibacilares e multibacilares',
      'Duração de 6-12 meses conforme classificação'
    ],
    relatedTerms: ['rifampicina', 'dapsona', 'clofazimina', 'hanseníase'],
    clinicalNote: 'Deve ser administrado sob supervisão direta do profissional de saúde',
    source: 'Protocolo MS 2022'
  },
  'rifampicina': {
    id: 'rifampicina',
    term: 'Rifampicina',
    definition: 'Antibiótico bactericida do grupo das rifamicinas, componente principal da PQT-U.',
    category: 'medication',
    examples: [
      'Dose: 600mg para adultos ≥50kg',
      'Administração: via oral, jejum',
      'Coloração alaranjada da urina é normal'
    ],
    relatedTerms: ['pqt-u', 'bactericida', 'mycobacterium'],
    clinicalNote: 'Pode causar hepatotoxicidade - monitorar função hepática',
    source: 'Farmacologia Clínica'
  },
  'hanseníase': {
    id: 'hanseniase',
    term: 'Hanseníase',
    definition: 'Doença infecciosa crônica causada pelo Mycobacterium leprae, que afeta principalmente pele e nervos periféricos.',
    category: 'condition',
    examples: [
      'Lesões cutâneas com alteração de sensibilidade',
      'Espessamento de nervos periféricos',
      'Classificação: paucibacilar ou multibacilar'
    ],
    relatedTerms: ['mycobacterium', 'pqt-u', 'neuropatia', 'baciloscopia'],
    clinicalNote: 'Doença de notificação compulsória - diagnóstico precoce é fundamental',
    source: 'Guia de Vigilância MS'
  },
  'dapsona': {
    id: 'dapsona',
    term: 'Dapsona',
    definition: 'Antibiótico bacteriostático do grupo das sulfonas, componente da PQT-U com ação contra o M. leprae.',
    category: 'medication',
    examples: [
      'Dose: 100mg diários para adultos',
      'Mecanismo: inibe síntese do ácido fólico',
      'Uso contínuo durante todo o tratamento'
    ],
    relatedTerms: ['pqt-u', 'bacteriostático', 'deficiência-g6pd'],
    clinicalNote: 'Contraindicado em deficiência de G6PD - risco de hemólise',
    source: 'Manual Técnico MS'
  }
};

export default function MedicalTermPopup({
  term,
  isVisible,
  onClose,
  customDefinition,
  position = 'auto',
  trigger = 'hover',
  delay = 500
}: MedicalTermPopupProps): React.JSX.Element | null {

  const [termData, setTermData] = useState<MedicalTerm | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  // Buscar definição do termo
  useEffect(() => {
    if (customDefinition) {
      setTermData(customDefinition);
      return;
    }

    const searchTerm = term.toLowerCase().trim();
    const found = medicalTermsDatabase[searchTerm];
    
    if (found) {
      setTermData(found);
    } else {
      // Fallback para termo não encontrado
      setTermData({
        id: searchTerm,
        term: term,
        definition: 'Termo médico relacionado ao contexto de hanseníase e PQT-U. Consulte literatura especializada para definição completa.',
        category: 'general',
        clinicalNote: 'Definição não disponível na base de dados local',
        source: 'Sistema Local'
      });
    }
  }, [term, customDefinition]);

  // Calcular posição do popup
  useEffect(() => {
    if (isVisible && position === 'auto') {
      // Em uma implementação real, calcularíamos baseado na posição do elemento trigger
      setPopupPosition({
        top: 100,
        left: 100
      });
    }
  }, [isVisible, position]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication':
        return <PillIcon size={20} color={modernChatTheme.colors.personas.gasnelio.primary} />;
      case 'procedure':
        return <DoctorIcon size={20} color={modernChatTheme.colors.personas.ga.primary} />;
      case 'condition':
        return <HeartIcon size={20} color="#dc2626" />;
      default:
        return <BookIcon size={20} color={modernChatTheme.colors.neutral.textMuted} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medication':
        return modernChatTheme.colors.personas.gasnelio.primary;
      case 'procedure':
        return modernChatTheme.colors.personas.ga.primary;
      case 'condition':
        return '#dc2626';
      default:
        return modernChatTheme.colors.neutral.textMuted;
    }
  };

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible || !termData) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'fadeIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {getCategoryIcon(termData.category)}
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                {termData.term}
              </h3>
              <span style={{
                fontSize: '0.875rem',
                color: getCategoryColor(termData.category),
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {termData.category}
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: modernChatTheme.colors.neutral.textMuted,
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: modernChatTheme.borderRadius.sm
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem'
        }}>
          {/* Definition */}
          <div style={{
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: '0.5rem'
            }}>
              Definição
            </h4>
            <p style={{
              fontSize: '1rem',
              color: modernChatTheme.colors.neutral.textMuted,
              lineHeight: '1.6',
              margin: 0
            }}>
              {termData.definition}
            </p>
          </div>

          {/* Examples */}
          {termData.examples && termData.examples.length > 0 && (
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: '0.5rem'
              }}>
                Exemplos
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '1.25rem',
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                {termData.examples.map((example, index) => (
                  <li key={index} style={{
                    marginBottom: '0.25rem',
                    lineHeight: '1.5'
                  }}>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinical Note */}
          {termData.clinicalNote && (
            <div style={{
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: modernChatTheme.borderRadius.md,
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#92400e',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Nota Clínica
              </h4>
              <p style={{
                fontSize: '0.875rem',
                color: '#92400e',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {termData.clinicalNote}
              </p>
            </div>
          )}

          {/* Related Terms */}
          {termData.relatedTerms && termData.relatedTerms.length > 0 && (
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: '0.75rem'
              }}>
                Termos Relacionados
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {termData.relatedTerms.map((relatedTerm, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: `${modernChatTheme.colors.personas.gasnelio.primary}15`,
                      color: modernChatTheme.colors.personas.gasnelio.primary,
                      borderRadius: modernChatTheme.borderRadius.full,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${modernChatTheme.colors.personas.gasnelio.primary}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${modernChatTheme.colors.personas.gasnelio.primary}15`;
                    }}
                  >
                    {relatedTerm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          {termData.source && (
            <div style={{
              fontSize: '0.875rem',
              color: modernChatTheme.colors.neutral.textMuted,
              fontStyle: 'italic',
              textAlign: 'right'
            }}>
              Fonte: {termData.source}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}