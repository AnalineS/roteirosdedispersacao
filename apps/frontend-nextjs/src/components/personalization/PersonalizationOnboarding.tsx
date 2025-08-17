/**
 * Componente de Onboarding para Personalização
 * Wizard para configuração inicial do perfil médico do usuário
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  MedicalRole, 
  ExperienceLevel, 
  SpecializationArea,
  MEDICAL_ROLE_PRESETS 
} from '@/types/personalization';
import { usePersonalization } from '@/hooks/usePersonalization';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
import { getUnbColors } from '@/config/modernTheme';

interface PersonalizationOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Sistema PQT-U',
    description: 'Vamos personalizar sua experiência baseada no seu perfil profissional',
    icon: '👋'
  },
  {
    id: 'role',
    title: 'Qual é o seu papel profissional?',
    description: 'Isso nos ajuda a personalizar o conteúdo e as ferramentas mais relevantes',
    icon: '👨‍⚕️'
  },
  {
    id: 'experience',
    title: 'Qual é o seu nível de experiência?',
    description: 'Adaptaremos a complexidade do conteúdo ao seu conhecimento',
    icon: '📈'
  },
  {
    id: 'specialization',
    title: 'Qual é a sua área de atuação?',
    description: 'Priorizaremos conteúdo específico para seu contexto de trabalho',
    icon: '🏥'
  },
  {
    id: 'preferences',
    title: 'Configure suas preferências',
    description: 'Personalize a interface e as funcionalidades conforme seu uso',
    icon: '⚙️'
  },
  {
    id: 'complete',
    title: 'Configuração completa!',
    description: 'Sua experiência está personalizada. Você pode ajustar isso a qualquer momento.',
    icon: '✅'
  }
];

const ROLE_OPTIONS = [
  { value: 'pharmacy', label: 'Farmacêutico', icon: '💊', description: 'Dispensação e orientação farmacêutica' },
  { value: 'medicine', label: 'Médico', icon: '🩺', description: 'Diagnóstico e prescrição médica' },
  { value: 'nursing', label: 'Enfermeiro', icon: '👩‍⚕️', description: 'Cuidados e administração de medicamentos' },
  { value: 'student', label: 'Estudante', icon: '🎓', description: 'Aprendizagem em ciências da saúde' },
  { value: 'researcher', label: 'Pesquisador', icon: '🔬', description: 'Pesquisa científica e acadêmica' }
];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Iniciante', icon: '🌱', description: 'Pouca experiência com hanseníase' },
  { value: 'intermediate', label: 'Intermediário', icon: '🌿', description: 'Conhecimento básico sobre hanseníase' },
  { value: 'advanced', label: 'Avançado', icon: '🌳', description: 'Experiência significativa na área' },
  { value: 'expert', label: 'Especialista', icon: '🏆', description: 'Ampla experiência e especialização' }
];

const SPECIALIZATION_OPTIONS = [
  { value: 'clinical', label: 'Clínica', icon: '🏥', description: 'Atendimento ambulatorial' },
  { value: 'hospital', label: 'Hospitalar', icon: '🏨', description: 'Ambiente hospitalar' },
  { value: 'community', label: 'Comunitária', icon: '🏘️', description: 'Atenção básica e PSF' },
  { value: 'academic', label: 'Acadêmica', icon: '🎓', description: 'Ensino e pesquisa' },
  { value: 'research', label: 'Pesquisa', icon: '🔬', description: 'Desenvolvimento científico' },
  { value: 'general', label: 'Geral', icon: '⚕️', description: 'Atuação diversificada' }
];

export default function PersonalizationOnboarding({ 
  isOpen, 
  onComplete, 
  onSkip 
}: PersonalizationOnboardingProps) {
  const { updatePersonalization, applyRolePreset, trackUserBehavior } = usePersonalization();
  const { flags } = useRemoteConfig();
  const unbColors = getUnbColors();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    medicalRole: 'unknown' as MedicalRole,
    experienceLevel: 'beginner' as ExperienceLevel,
    specializationArea: 'general' as SpecializationArea,
    preferredComplexity: 'basic' as 'basic' | 'intermediate' | 'advanced',
    showTechnicalTerms: false,
    enableDetailedExplanations: true,
    fastAccessPriority: 'educational' as 'emergency' | 'routine' | 'educational',
    enableQuickActions: true
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      trackUserBehavior('onboarding_started');
    }
  }, [isOpen, trackUserBehavior]);

  // Auto-ajustar configurações baseado no papel selecionado
  useEffect(() => {
    if (formData.medicalRole !== 'unknown') {
      const preset = MEDICAL_ROLE_PRESETS[formData.medicalRole];
      if (preset) {
        setFormData(prev => ({
          ...prev,
          preferredComplexity: preset.preferredComplexity || prev.preferredComplexity,
          showTechnicalTerms: preset.showTechnicalTerms ?? prev.showTechnicalTerms,
          fastAccessPriority: preset.fastAccessPriority || prev.fastAccessPriority,
          enableQuickActions: preset.enableQuickActions ?? prev.enableQuickActions
        }));
      }
    }
  }, [formData.medicalRole]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
      
      trackUserBehavior('onboarding_step_completed', { 
        step: ONBOARDING_STEPS[currentStep].id 
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    // Aplicar todas as configurações
    updatePersonalization({
      ...formData,
      sessionCount: 1,
      lastAccess: new Date()
    });

    trackUserBehavior('onboarding_completed', formData);
    onComplete();
  };

  const handleSkip = () => {
    trackUserBehavior('onboarding_skipped');
    if (onSkip) onSkip();
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👋</div>
            <h2 style={{ color: unbColors.primary, marginBottom: '1rem' }}>
              Bem-vindo ao Sistema Educacional PQT-U
            </h2>
            <p style={{ fontSize: '1.1rem', color: unbColors.neutral, lineHeight: '1.6' }}>
              Este sistema foi desenvolvido para auxiliar profissionais de saúde no aprendizado 
              sobre hanseníase e dispensação de medicamentos PQT-U.
            </p>
            <p style={{ color: unbColors.neutral, marginTop: '1rem' }}>
              Vamos personalizar sua experiência em apenas alguns passos.
            </p>
          </div>
        );

      case 'role':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ color: unbColors.primary, marginBottom: '1.5rem', textAlign: 'center' }}>
              Qual é o seu papel profissional?
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, medicalRole: option.value as MedicalRole }))}
                  style={{
                    padding: '1.5rem',
                    border: `2px solid ${formData.medicalRole === option.value ? unbColors.primary : '#e2e8f0'}`,
                    borderRadius: '12px',
                    background: formData.medicalRole === option.value 
                      ? `linear-gradient(135deg, ${unbColors.alpha.primary} 0%, ${unbColors.alpha.secondary} 100%)`
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{option.icon}</span>
                    <strong style={{ color: unbColors.primary }}>{option.label}</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: unbColors.neutral }}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'experience':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ color: unbColors.primary, marginBottom: '1.5rem', textAlign: 'center' }}>
              Qual é o seu nível de experiência com hanseníase?
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {EXPERIENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, experienceLevel: option.value as ExperienceLevel }))}
                  style={{
                    padding: '1.5rem',
                    border: `2px solid ${formData.experienceLevel === option.value ? unbColors.primary : '#e2e8f0'}`,
                    borderRadius: '12px',
                    background: formData.experienceLevel === option.value 
                      ? `linear-gradient(135deg, ${unbColors.alpha.primary} 0%, ${unbColors.alpha.secondary} 100%)`
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{option.icon}</div>
                  <strong style={{ color: unbColors.primary, display: 'block', marginBottom: '0.5rem' }}>
                    {option.label}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: unbColors.neutral }}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'specialization':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ color: unbColors.primary, marginBottom: '1.5rem', textAlign: 'center' }}>
              Qual é a sua principal área de atuação?
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}>
              {SPECIALIZATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, specializationArea: option.value as SpecializationArea }))}
                  style={{
                    padding: '1.25rem',
                    border: `2px solid ${formData.specializationArea === option.value ? unbColors.primary : '#e2e8f0'}`,
                    borderRadius: '12px',
                    background: formData.specializationArea === option.value 
                      ? `linear-gradient(135deg, ${unbColors.alpha.primary} 0%, ${unbColors.alpha.secondary} 100%)`
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{option.icon}</div>
                  <strong style={{ color: unbColors.primary, display: 'block', marginBottom: '0.25rem' }}>
                    {option.label}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: unbColors.neutral }}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div style={{ padding: '1rem' }}>
            <h3 style={{ color: unbColors.primary, marginBottom: '1.5rem', textAlign: 'center' }}>
              Configure suas preferências
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Complexidade do conteúdo */}
              <div>
                <h4 style={{ color: unbColors.primary, marginBottom: '0.75rem' }}>
                  📚 Complexidade do conteúdo
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { value: 'basic', label: 'Básico', description: 'Linguagem simples e didática' },
                    { value: 'intermediate', label: 'Intermediário', description: 'Equilíbrio entre clareza e técnica' },
                    { value: 'advanced', label: 'Avançado', description: 'Terminologia técnica completa' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, preferredComplexity: option.value as any }))}
                      style={{
                        padding: '0.75rem 1rem',
                        border: `1px solid ${formData.preferredComplexity === option.value ? unbColors.primary : '#e2e8f0'}`,
                        borderRadius: '8px',
                        background: formData.preferredComplexity === option.value ? unbColors.alpha.primary : 'white',
                        color: formData.preferredComplexity === option.value ? unbColors.primary : unbColors.neutral,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prioridade de acesso rápido */}
              <div>
                <h4 style={{ color: unbColors.primary, marginBottom: '0.75rem' }}>
                  ⚡ Prioridade de acesso rápido
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { value: 'emergency', label: '🚨 Emergência', description: 'Acesso rápido a protocolos críticos' },
                    { value: 'routine', label: '🔄 Rotina', description: 'Ferramentas para uso diário' },
                    { value: 'educational', label: '📖 Educacional', description: 'Conteúdo de aprendizagem' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, fastAccessPriority: option.value as any }))}
                      style={{
                        padding: '0.75rem 1rem',
                        border: `1px solid ${formData.fastAccessPriority === option.value ? unbColors.primary : '#e2e8f0'}`,
                        borderRadius: '8px',
                        background: formData.fastAccessPriority === option.value ? unbColors.alpha.primary : 'white',
                        color: formData.fastAccessPriority === option.value ? unbColors.primary : unbColors.neutral,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.showTechnicalTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, showTechnicalTerms: e.target.checked }))}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span>🔬 Mostrar terminologia técnica avançada</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enableDetailedExplanations}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableDetailedExplanations: e.target.checked }))}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span>💡 Habilitar explicações detalhadas</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enableQuickActions}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableQuickActions: e.target.checked }))}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span>⚡ Habilitar ações rápidas na interface</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: unbColors.primary, marginBottom: '1rem' }}>
              Configuração completa!
            </h2>
            <p style={{ fontSize: '1.1rem', color: unbColors.neutral, lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Sua experiência está personalizada para o perfil de <strong>{ROLE_OPTIONS.find(r => r.value === formData.medicalRole)?.label}</strong> 
              com nível <strong>{EXPERIENCE_OPTIONS.find(e => e.value === formData.experienceLevel)?.label}</strong>.
            </p>
            <div style={{
              background: unbColors.alpha.primary,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, color: unbColors.primary, fontSize: '0.9rem' }}>
                💡 Você pode ajustar essas configurações a qualquer momento nas suas preferências.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !flags?.personalization_system) return null;

  return (
    <div style={{
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
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.15s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ margin: 0, color: unbColors.primary, fontSize: '1.5rem' }}>
              {ONBOARDING_STEPS[currentStep].icon} {ONBOARDING_STEPS[currentStep].title}
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: unbColors.neutral, fontSize: '0.9rem' }}>
              {ONBOARDING_STEPS[currentStep].description}
            </p>
          </div>
          
          {onSkip && currentStep < ONBOARDING_STEPS.length - 1 && (
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: unbColors.neutral,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Pular
            </button>
          )}
        </div>

        {/* Progress */}
        <div style={{
          padding: '0 2rem',
          paddingTop: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: '4px',
                  background: index <= currentStep ? unbColors.primary : '#e2e8f0',
                  borderRadius: '2px',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            color: unbColors.neutral,
            textAlign: 'center'
          }}>
            Passo {currentStep + 1} de {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div style={{ minHeight: '400px' }}>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: `1px solid ${currentStep === 0 ? '#e2e8f0' : unbColors.primary}`,
              borderRadius: '8px',
              color: currentStep === 0 ? '#94a3b8' : unbColors.primary,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            Anterior
          </button>

          {currentStep === ONBOARDING_STEPS.length - 1 ? (
            <button
              onClick={handleComplete}
              style={{
                padding: '0.75rem 2rem',
                background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Finalizar configuração
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && formData.medicalRole === 'unknown') ||
                (currentStep === 2 && formData.experienceLevel === 'beginner' && formData.medicalRole === 'unknown')
              }
              style={{
                padding: '0.75rem 1.5rem',
                background: unbColors.primary,
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                opacity: (currentStep === 1 && formData.medicalRole === 'unknown') ? 0.5 : 1
              }}
            >
              Próximo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}