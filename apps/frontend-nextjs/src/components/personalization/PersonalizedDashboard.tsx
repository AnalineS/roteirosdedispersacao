/**
 * Dashboard Personalizado
 * Interface adaptada baseada no perfil e preferências do usuário
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
import { getUnbColors } from '@/config/modernTheme';
import { ContentRecommendation } from '@/types/personalization';

// Helper functions at module scope
const getRoleIcon = (role: string) => {
  const icons = {
    pharmacy: '💊',
    medicine: '🩺',
    nursing: '👩‍⚕️',
    student: '🎓',
    researcher: '🔬',
    unknown: '👤'
  };
  return icons[role as keyof typeof icons] || '👤';
};

const getUrgencyColor = (urgency: string) => {
  const colors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };
  return colors[urgency as keyof typeof colors] || '#6b7280';
};

// Types for extracted widget props
type UnbColors = ReturnType<typeof getUnbColors>;
type PersonalizationData = ReturnType<typeof usePersonalization>['personalization'];

interface ProfileWidgetProps {
  personalization: PersonalizationData;
  unbColors: UnbColors;
}

interface QuickActionsWidgetProps {
  personalizedNavigation: Array<{ href: string; label: string }>;
  trackUserBehavior: (event: string, data: Record<string, unknown>) => void;
  unbColors: UnbColors;
}

interface RecommendationsWidgetProps {
  recommendations: ContentRecommendation[];
  unbColors: UnbColors;
  onRecommendationClick: (recommendation: ContentRecommendation) => void;
}

interface ProgressWidgetProps {
  personalization: PersonalizationData;
  unbColors: UnbColors;
}

// Extracted widget components at module scope
const ProfileWidget = ({ personalization, unbColors }: ProfileWidgetProps) => (
    <div style={{
      background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
      borderRadius: '16px',
      padding: '1.5rem',
      color: 'white',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2.5rem' }}>
          {getRoleIcon(personalization.medicalRole)}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
            Olá, {personalization.medicalRole === 'pharmacy' ? 'Farmacêutico' : 
                  personalization.medicalRole === 'medicine' ? 'Doutor' :
                  personalization.medicalRole === 'nursing' ? 'Enfermeiro' :
                  personalization.medicalRole === 'student' ? 'Estudante' :
                  'Profissional'}!
          </h2>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Especialização: {personalization.specializationArea} • 
            Nível: {personalization.experienceLevel}
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {personalization.sessionCount}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Sessões</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {Math.round(personalization.totalTimeSpent / 60000)}m
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tempo total</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {personalization.completedModules.length}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Módulos</div>
        </div>
      </div>
    </div>
  );

const QuickActionsWidget = ({ personalizedNavigation, trackUserBehavior, unbColors }: QuickActionsWidgetProps) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    marginBottom: '1.5rem'
  }}>
    <h3 style={{
      margin: '0 0 1rem',
      color: unbColors.primary,
      fontSize: '1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      ⚡ Acesso Rápido Personalizado
    </h3>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '1rem'
    }}>
      {personalizedNavigation.slice(0, 6).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => trackUserBehavior('quick_action_used', { action: item.label })}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            color: unbColors.primary,
            transition: 'all 0.2s',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {item.label === 'Início' ? '🏠' :
             item.label === 'Chat IA' ? '🤖' :
             item.label === 'Módulos' ? '📚' :
             item.label === 'Ferramentas' ? '🛠️' :
             item.label === 'Calculadora' ? '🧮' :
             item.label === 'Interações' ? '⚠️' :
             item.label === '🚨 Emergência' ? '🚨' : '📋'}
          </div>
          {item.label}
        </Link>
      ))}
    </div>
  </div>
);

const RecommendationsWidget = ({ recommendations, unbColors, onRecommendationClick }: RecommendationsWidgetProps) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    marginBottom: '1.5rem'
  }}>
    <h3 style={{
      margin: '0 0 1rem',
      color: unbColors.primary,
      fontSize: '1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      🎯 Recomendado para você
    </h3>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {recommendations.slice(0, 4).map((rec) => (
        <Link
          key={rec.id}
          href={`/resources/${rec.id}`}
          onClick={() => onRecommendationClick(rec)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.background = unbColors.alpha.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
          }}
        >
          <div style={{
            width: '8px',
            height: '40px',
            background: getUrgencyColor(rec.urgency),
            borderRadius: '4px',
            flexShrink: 0
          }} />

          <div style={{ flex: 1 }}>
            <h4 style={{
              margin: '0 0 0.25rem',
              fontSize: '0.95rem',
              color: unbColors.primary,
              fontWeight: 'bold'
            }}>
              {rec.title}
            </h4>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: unbColors.neutral,
              lineHeight: '1.4'
            }}>
              {rec.description}
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: unbColors.neutral
            }}>
              <span>⏱️ {rec.estimatedTime}min</span>
              <span style={{ color: getUrgencyColor(rec.urgency) }}>
                ● {rec.urgency.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{
            fontSize: '1.2rem',
            color: unbColors.primary,
            opacity: 0.6
          }}>
            →
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const ProgressWidget = ({ personalization, unbColors }: ProgressWidgetProps) => {
  const totalModules = personalization.learningPath.length || 10;
  const completedCount = personalization.completedModules.length;
  const progressPercentage = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{
        margin: '0 0 1rem',
        color: unbColors.primary,
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📈 Seu Progresso
      </h3>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.9rem', color: unbColors.neutral }}>
            Módulos concluídos
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: unbColors.primary }}>
            {completedCount}/{totalModules}
          </span>
        </div>

        <div style={{
          width: '100%',
          height: '8px',
          background: '#f1f5f9',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {personalization.recentlyAccessed.length > 0 && (
        <div>
          <h4 style={{
            margin: '0 0 0.75rem',
            fontSize: '0.95rem',
            color: unbColors.primary
          }}>
            📚 Acessados recentemente
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {personalization.recentlyAccessed.slice(0, 3).map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: unbColors.neutral,
                  borderLeft: `3px solid ${unbColors.primary}`
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
interface PersonalizedDashboardProps {
  className?: string;
}

export default function PersonalizedDashboard({ className }: PersonalizedDashboardProps) {
  const {
    personalization,
    recommendations,
    getPersonalizedNavigation,
    trackUserBehavior,
    shouldShowAdvancedContent,
    complexitySettings
  } = usePersonalization();

  const { flags } = useRemoteConfig();
  const unbColors = getUnbColors();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const personalizedNavigation = useMemo(() => getPersonalizedNavigation(), [getPersonalizedNavigation]);

  // Renderizar apenas se a personalização estiver habilitada
  const isPersonalized = personalization.medicalRole !== 'unknown';
  if (!flags?.personalization_system || !isPersonalized) {
    return null;
  }

  const handleRecommendationClick = (recommendation: ContentRecommendation) => {
    trackUserBehavior('recommendation_clicked', {
      recommendationId: recommendation.id,
      urgency: recommendation.urgency,
      type: recommendation.type
    });
  };

  return (
    <div className={className} style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      {/* Grid responsivo do dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Coluna principal */}
        <div style={{ gridColumn: 'span 2', minWidth: '0' }}>
          <ProfileWidget personalization={personalization} unbColors={unbColors} />
          <QuickActionsWidget
            personalizedNavigation={personalizedNavigation}
            trackUserBehavior={trackUserBehavior}
            unbColors={unbColors}
          />
          <RecommendationsWidget
            recommendations={recommendations}
            unbColors={unbColors}
            onRecommendationClick={handleRecommendationClick}
          />
        </div>

        {/* Sidebar */}
        <div>
          <ProgressWidget personalization={personalization} unbColors={unbColors} />
        </div>
      </div>

      {/* Informações de personalização */}
      {shouldShowAdvancedContent && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: unbColors.alpha.primary,
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            margin: '0 0 0.5rem',
            color: unbColors.primary,
            fontSize: '0.95rem'
          }}>
            🎯 Configuração ativa
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            fontSize: '0.85rem',
            color: unbColors.neutral
          }}>
            <div>
              <strong>Complexidade:</strong> {personalization.preferredComplexity}
            </div>
            <div>
              <strong>Prioridade:</strong> {personalization.fastAccessPriority}
            </div>
            <div>
              <strong>Termos técnicos:</strong> {complexitySettings.showTechnicalTerms ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Explicações:</strong> {complexitySettings.enableDetailedExplanations ? 'Sim' : 'Não'}
            </div>
          </div>
        </div>
      )}

      {/* CSS responsivo */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="gridColumn: span 2"] {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
}