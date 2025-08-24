'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BeginnerIcon, IntermediateIcon, AdvancedIcon, ExpertIcon, TargetIcon, DoctorIcon, PillIcon, HeartIcon } from '@/components/icons/FlatOutlineIcons';
import { usePersonalization } from '@/hooks/usePersonalization';
import { MedicalRole, ExperienceLevel, SpecializationArea } from '@/types/personalization';

interface ExperienceBannerProps {
  onComplete?: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function ExperienceBanner({ onComplete }: ExperienceBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    medicalRole: 'unknown' as MedicalRole,
    experienceLevel: 'beginner' as ExperienceLevel,
    specializationArea: 'general' as SpecializationArea
  });
  const router = useRouter();
  const { updatePersonalization } = usePersonalization();

  // Show banner immediately, check localStorage after
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('personalization_onboarding_completed');
    
    // Show if user hasn't completed full onboarding
    if (!hasCompletedOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'role',
      title: 'Qual é o seu papel profissional?',
      description: 'Isso nos ajuda a personalizar o conteúdo para você',
      icon: '👨‍⚕️'
    },
    {
      id: 'experience',
      title: 'Qual é o seu nível de experiência?',
      description: 'Adaptaremos a complexidade do conteúdo',
      icon: '📈'
    },
    {
      id: 'area',
      title: 'Qual é a sua área de atuação?',
      description: 'Para mostrar conteúdo mais relevante',
      icon: '🏥'
    }
  ];

  const roleOptions = [
    { id: 'pharmacy', title: 'Farmácia', description: 'Farmacêutico(a)', icon: PillIcon },
    { id: 'medicine', title: 'Medicina', description: 'Médico(a)', icon: DoctorIcon },
    { id: 'nursing', title: 'Enfermagem', description: 'Enfermeiro(a)', icon: HeartIcon },
    { id: 'student', title: 'Estudante', description: 'Graduação/Pós', icon: BeginnerIcon }
  ];

  const experienceOptions = [
    { id: 'beginner', title: 'Iniciante', description: 'Pouca experiência', icon: BeginnerIcon },
    { id: 'intermediate', title: 'Intermediário', description: 'Conhecimento básico', icon: IntermediateIcon },
    { id: 'advanced', title: 'Avançado', description: 'Experiência significativa', icon: AdvancedIcon },
    { id: 'expert', title: 'Especialista', description: 'Ampla experiência', icon: ExpertIcon }
  ];

  const areaOptions = [
    { id: 'clinical', title: 'Clínica', description: 'Atendimento clínico' },
    { id: 'hospital', title: 'Hospital', description: 'Ambiente hospitalar' },
    { id: 'community', title: 'Comunidade', description: 'Saúde pública' },
    { id: 'academic', title: 'Acadêmica', description: 'Ensino e pesquisa' }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save personalization data
    updatePersonalization({
      medicalRole: formData.medicalRole,
      experienceLevel: formData.experienceLevel,
      specializationArea: formData.specializationArea,
      preferredComplexity: formData.experienceLevel === 'expert' ? 'advanced' : 
                         formData.experienceLevel === 'advanced' ? 'intermediate' : 'basic',
      showTechnicalTerms: formData.experienceLevel === 'expert' || formData.experienceLevel === 'advanced',
      enableDetailedExplanations: true
    });
    
    // Mark as completed
    localStorage.setItem('personalization_onboarding_completed', 'true');
    localStorage.setItem('experience_banner_seen', 'true');
    
    // Hide banner with animation
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 1000);
  };

  const handleSkip = () => {
    localStorage.setItem('experience_banner_seen', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.medicalRole !== 'unknown';
      case 1: return true; // experience always has default
      case 2: return true; // area always has default
      default: return true;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        padding: '10px 20px',
        animation: 'slideDown 0.5s ease-out',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          border: '4px solid #f59e0b',
          position: 'relative',
          transform: 'translateY(0)'
        }}>
          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e5e7eb',
            borderRadius: '2px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
              height: '100%',
              backgroundColor: '#f59e0b',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Passo {currentStep + 1} de {onboardingSteps.length}
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#003366',
              margin: '0 0 8px 0'
            }}>
              {onboardingSteps[currentStep].title}
            </h2>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '1rem'
            }}>
              {onboardingSteps[currentStep].description}
            </p>
          </div>

          {/* Step Content */}
          <div style={{ marginBottom: '24px' }}>
            {currentStep === 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                {roleOptions.map((role) => {
                  const IconComponent = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setFormData(prev => ({ ...prev, medicalRole: role.id as MedicalRole }))}
                      style={{
                        padding: '20px 16px',
                        border: formData.medicalRole === role.id ? '3px solid #f59e0b' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        backgroundColor: formData.medicalRole === role.id ? '#fef3c7' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <IconComponent size={32} color={formData.medicalRole === role.id ? '#f59e0b' : '#6b7280'} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                          {role.title}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {role.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep === 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                {experienceOptions.map((exp) => {
                  const IconComponent = exp.icon;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => setFormData(prev => ({ ...prev, experienceLevel: exp.id as ExperienceLevel }))}
                      style={{
                        padding: '16px',
                        border: formData.experienceLevel === exp.id ? '3px solid #f59e0b' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        backgroundColor: formData.experienceLevel === exp.id ? '#fef3c7' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <IconComponent size={28} color={formData.experienceLevel === exp.id ? '#f59e0b' : '#6b7280'} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#374151', fontSize: '0.9rem', marginBottom: '2px' }}>
                          {exp.title}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                          {exp.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep === 2 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                {areaOptions.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setFormData(prev => ({ ...prev, specializationArea: area.id as SpecializationArea }))}
                    style={{
                      padding: '20px',
                      border: formData.specializationArea === area.id ? '3px solid #f59e0b' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: formData.specializationArea === area.id ? '#fef3c7' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
                      {area.title}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {area.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={handleSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '8px 16px'
              }}
            >
              Pular personalização
            </button>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Anterior
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: isStepValid() ? '#f59e0b' : '#e5e7eb',
                  color: isStepValid() ? 'white' : '#9ca3af',
                  cursor: isStepValid() ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {currentStep === onboardingSteps.length - 1 ? 'Concluir' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}