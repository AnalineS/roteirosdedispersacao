'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';

interface SummarySection {
  id: string;
  title: string;
  description: string;
  icon: string;
  relevance: 'high' | 'medium' | 'low';
  audience: ('professional' | 'patient' | 'student' | 'general')[];
  estimatedTime: string;
  href: string;
  keyTopics: string[];
}

interface ExecutiveSummaryProps {
  userProfile?: 'professional' | 'patient' | 'student' | 'general';
  className?: string;
}

const summaryData: SummarySection[] = [
  {
    id: 'quick-help',
    title: 'Ajuda Imediata',
    description: 'Assistentes virtuais Dr. Gasnelio e Gá prontos para esclarecer dúvidas sobre hanseníase, medicamentos e direitos.',
    icon: '🤖',
    relevance: 'high',
    audience: ['professional', 'patient', 'student', 'general'],
    estimatedTime: 'Imediato',
    href: '/chat',
    keyTopics: ['Dúvidas rápidas', 'Orientações personalizadas', 'Suporte 24/7']
  },
  {
    id: 'treatment-module',
    title: 'Tratamento PQT-U',
    description: 'Protocolo completo da Poliquimioterapia Única: dosagem, administração, reações adversas e acompanhamento.',
    icon: '💊',
    relevance: 'high',
    audience: ['professional', 'student'],
    estimatedTime: '30 min',
    href: '/modules/tratamento',
    keyTopics: ['Rifampicina', 'Clofazimina', 'Dapsona', 'Dose supervisionada']
  },
  {
    id: 'patient-life',
    title: 'Vida com Hanseníase',
    description: 'Qualidade de vida, direitos legais, cuidados familiares e recursos de apoio para pacientes e familiares.',
    icon: '💜',
    relevance: 'high',
    audience: ['patient', 'general'],
    estimatedTime: '15 min',
    href: '/vida-com-hanseniase',
    keyTopics: ['Direitos', 'Qualidade de vida', 'Apoio familiar', 'Recursos']
  },
  {
    id: 'diagnosis',
    title: 'Diagnóstico Clínico',
    description: 'Critérios diagnósticos, sinais cardinais, exames complementares e diagnóstico diferencial.',
    icon: '🩺',
    relevance: 'high',
    audience: ['professional', 'student'],
    estimatedTime: '25 min',
    href: '/modules/diagnostico',
    keyTopics: ['Sinais cardinais', 'Baciloscopia', 'Classificação operacional']
  },
  {
    id: 'practical-tools',
    title: 'Ferramentas Práticas',
    description: 'Calculadora de doses, verificador de interações, checklists e materiais para download.',
    icon: '🛠️',
    relevance: 'medium',
    audience: ['professional', 'student'],
    estimatedTime: '10 min',
    href: '/resources',
    keyTopics: ['Calculadora', 'Interações', 'Checklists', 'Downloads']
  },
  {
    id: 'glossary',
    title: 'Glossário Médico',
    description: 'Definições de termos técnicos, pronuncia e explicações simplificadas para melhor compreensão.',
    icon: '📚',
    relevance: 'medium',
    audience: ['professional', 'patient', 'student', 'general'],
    estimatedTime: '5 min',
    href: '/glossario',
    keyTopics: ['Terminologia', 'Definições', 'Pronuncia', 'Conceitos']
  }
];

export default function ExecutiveSummary({ userProfile = 'general', className = '' }: ExecutiveSummaryProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const unbColors = getUnbColors();

  // Filtrar e ordenar seções por relevância para o usuário
  const relevantSections = summaryData
    .filter(section => section.audience.includes(userProfile))
    .sort((a, b) => {
      const relevanceOrder = { high: 3, medium: 2, low: 1 };
      return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
    });

  const getRelevanceColor = (relevance: string) => {
    const colors = {
      high: '#dc2626',
      medium: '#ea580c', 
      low: '#6b7280'
    };
    return colors[relevance as keyof typeof colors];
  };

  const getAudienceLabel = (audience: string) => {
    const labels = {
      professional: 'Profissional',
      patient: 'Paciente',
      student: 'Estudante', 
      general: 'Geral'
    };
    return labels[audience as keyof typeof labels];
  };

  return (
    <div className={`executive-summary ${className}`} style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: `2px solid ${unbColors.alpha.primary}`
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: unbColors.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Sumário Executivo
          </h2>
          <p style={{
            margin: '0.5rem 0 0',
            color: '#6b7280',
            fontSize: '0.95rem'
          }}>
            Visão rápida do conteúdo mais relevante para <strong>{getAudienceLabel(userProfile)}</strong>
          </p>
        </div>
        
        <div style={{
          background: unbColors.alpha.primary,
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: unbColors.primary
        }}>
          {relevantSections.length} seções relevantes
        </div>
      </div>

      {/* Summary Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {relevantSections.map((section) => (
          <div
            key={section.id}
            style={{
              border: `2px solid ${section.relevance === 'high' ? getRelevanceColor(section.relevance) : '#e5e7eb'}`,
              borderRadius: '12px',
              padding: '1rem',
              background: section.relevance === 'high' ? `${getRelevanceColor(section.relevance)}05` : 'white',
              transition: 'all 0.3s ease',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Priority Badge */}
            {section.relevance === 'high' && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '12px',
                background: getRelevanceColor(section.relevance),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                PRIORITÁRIO
              </div>
            )}

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {section.title}
                </h3>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '2px'
                }}>
                  <span>⏱️ {section.estimatedTime}</span>
                  <span>•</span>
                  <span style={{
                    background: '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}>
                    {getAudienceLabel(userProfile)}
                  </span>
                </div>
              </div>
              
              <div style={{
                fontSize: '0.8rem',
                color: '#6b7280',
                transform: expandedSection === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}>
                ▼
              </div>
            </div>

            {/* Description */}
            <p style={{
              margin: '0 0 0.75rem 0',
              fontSize: '0.9rem',
              color: '#4b5563',
              lineHeight: '1.4'
            }}>
              {section.description}
            </p>

            {/* Expanded Content */}
            {expandedSection === section.id && (
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e5e7eb',
                animation: 'expandIn 200ms ease'
              }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  🎯 Tópicos principais:
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25rem',
                  marginBottom: '0.75rem'
                }}>
                  {section.keyTopics.map((topic, index) => (
                    <span
                      key={index}
                      style={{
                        background: unbColors.alpha.secondary,
                        color: unbColors.primary,
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                
                <Link
                  href={section.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: section.relevance === 'high' ? getRelevanceColor(section.relevance) : unbColors.primary,
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Acessar agora →
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with overall stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#6b7280'
      }}>
        <div>
          <strong>Tempo total estimado:</strong> {
            relevantSections.reduce((total, section) => {
              const time = parseInt(section.estimatedTime) || 0;
              return total + time;
            }, 0)
          } minutos de leitura
        </div>
        <div>
          <strong>{relevantSections.filter(s => s.relevance === 'high').length}</strong> seções prioritárias
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes expandIn {
          from { 
            opacity: 0; 
            transform: translateY(-8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}