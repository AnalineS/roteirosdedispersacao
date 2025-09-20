'use client';

import React from 'react';
import { BookIcon, HeartIcon, PillIcon, DoctorIcon, ClipboardIcon, CheckIcon } from '@/components/icons/FlatOutlineIcons';
import { modernChatTheme } from '@/config/modernTheme';

interface Feature {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  title: string;
  description: string;
  benefits: string[];
}

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  variant?: 'default' | 'compact' | 'detailed';
}

const defaultFeatures: Feature[] = [
  {
    icon: PillIcon,
    title: 'Calculadora PQT-U',
    description: 'Sistema inteligente para cálculo de doses personalizadas',
    benefits: ['Doses precisas por peso', 'Validação automática', 'Histórico de cálculos']
  },
  {
    icon: ClipboardIcon,
    title: 'Checklist Interativo',
    description: 'Workflow completo para dispensação segura',
    benefits: ['Processo guiado', 'Controle de qualidade', 'Rastreabilidade']
  },
  {
    icon: DoctorIcon,
    title: 'Orientação Especializada',
    description: 'Personas técnicas com expertise em hanseníase',
    benefits: ['Dr. Gasnelio técnico', 'Gá empático', 'Suporte contextual']
  },
  {
    icon: BookIcon,
    title: 'Educação Continuada',
    description: 'Recursos didáticos para capacitação profissional',
    benefits: ['Metodologia validada', 'Conteúdo atualizado', 'Prática orientada']
  }
];

export default function FeaturesSection({
  title = 'Recursos Educacionais',
  subtitle = 'Ferramentas desenvolvidas para otimizar a dispensação de medicamentos PQT-U',
  features = defaultFeatures,
  variant = 'default'
}: FeaturesSectionProps): React.JSX.Element {
  
  const renderFeatureCard = (feature: Feature, index: number) => {
    const IconComponent = feature.icon;
    
    return (
      <div
        key={index}
        style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          padding: variant === 'compact' ? '1.5rem' : '2rem',
          boxShadow: modernChatTheme.shadows.subtle,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = modernChatTheme.shadows.moderate;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = modernChatTheme.shadows.subtle;
        }}
      >
        {/* Icon Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          gap: '0.75rem'
        }}>
          <div style={{
            padding: '0.75rem',
            background: `${modernChatTheme.colors.personas.gasnelio.primary}15`,
            borderRadius: modernChatTheme.borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconComponent 
              size={24} 
              color={modernChatTheme.colors.personas.gasnelio.primary} 
            />
          </div>
          <h3 style={{
            fontSize: variant === 'compact' ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            margin: 0
          }}>
            {feature.title}
          </h3>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '1rem',
          color: modernChatTheme.colors.neutral.textMuted,
          lineHeight: '1.6',
          marginBottom: variant === 'compact' ? '1rem' : '1.5rem'
        }}>
          {feature.description}
        </p>

        {/* Benefits (only for detailed variant) */}
        {variant === 'detailed' && (
          <ul style={{
            margin: 0,
            padding: 0,
            listStyle: 'none'
          }}>
            {feature.benefits.map((benefit, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  color: modernChatTheme.colors.neutral.textMuted
                }}
              >
                <CheckIcon size={16} color="#22c55e" />
                {benefit}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <section style={{
      padding: variant === 'compact' ? '2rem 0' : '3rem 0',
      background: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: variant === 'compact' ? '2rem' : '3rem'
        }}>
          <h2 style={{
            fontSize: variant === 'compact' ? '1.8rem' : '2.5rem',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            <HeartIcon size={variant === 'compact' ? 28 : 32} color={modernChatTheme.colors.personas.gasnelio.primary} />
            {title}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: modernChatTheme.colors.neutral.textMuted,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            {subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: variant === 'compact' 
            ? 'repeat(auto-fit, minmax(280px, 1fr))'
            : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: variant === 'compact' ? '1.5rem' : '2rem'
        }}>
          {features.map(renderFeatureCard)}
        </div>
      </div>
    </section>
  );
}