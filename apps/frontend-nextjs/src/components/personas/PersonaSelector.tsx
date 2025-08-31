'use client';

import { useState, type JSX } from 'react';
import Image from 'next/image';
import { Persona } from '@/services/api';
import { getPersonaAvatar } from '@/constants/avatars';
import { theme } from '@/config/theme';

interface PersonaSelectorProps {
  personas: Record<string, Persona>;
  onPersonaSelect: (personaId: string, userProfile: UserProfile) => void;
}

interface UserProfile {
  type: 'professional' | 'student' | 'patient' | 'caregiver';
  focus: 'technical' | 'practical' | 'effects' | 'general';
  confidence: number;
  explanation: string;
}

interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    value: UserProfile['type'] | UserProfile['focus'];
    icon: React.JSX.Element;
  }[];
}

const questions: Question[] = [
  {
    id: 'profile',
    text: 'Qual é o seu perfil?',
    options: [
      {
        id: 'professional',
        text: 'Profissional de saúde',
        value: 'professional',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        )
      },
      {
        id: 'student',
        text: 'Estudante',
        value: 'student',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 14l9-5-9-5-9 5 9 5z"/>
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
          </svg>
        )
      },
      {
        id: 'patient',
        text: 'Paciente ou familiar',
        value: 'patient',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        )
      },
      {
        id: 'caregiver',
        text: 'Cuidador',
        value: 'caregiver',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        )
      }
    ]
  },
  {
    id: 'focus',
    text: 'Qual é o seu interesse principal?',
    options: [
      {
        id: 'technical',
        text: 'Informações técnicas',
        value: 'technical',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-11h-6m-6 0H1"/>
          </svg>
        )
      },
      {
        id: 'practical',
        text: 'Orientações práticas',
        value: 'practical',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        )
      },
      {
        id: 'effects',
        text: 'Efeitos e cuidados',
        value: 'effects',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
          </svg>
        )
      },
      {
        id: 'general',
        text: 'Informações gerais',
        value: 'general',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        )
      }
    ]
  }
];

export default function PersonaSelector({ personas, onPersonaSelect }: PersonaSelectorProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'question1' | 'question2' | 'recommendation'>('intro');
  const [answers, setAnswers] = useState<{
    profile?: UserProfile['type'];
    focus?: UserProfile['focus'];
  }>({});

  const calculateRecommendation = (): { personaId: string; confidence: number; explanation: string } => {
    const { profile, focus } = answers;
    
    let personaId = 'ga';
    let confidence = 0.5;
    let explanation = '';

    if (profile === 'professional' || profile === 'student') {
      if (focus === 'technical') {
        personaId = 'dr_gasnelio';
        confidence = 0.9;
        explanation = 'Com base no seu perfil profissional e interesse técnico, Dr. Gasnelio é o assistente mais adequado.';
      } else {
        personaId = 'dr_gasnelio';
        confidence = 0.7;
        explanation = 'Dr. Gasnelio pode fornecer as informações detalhadas que você busca.';
      }
    } else {
      if (focus === 'technical') {
        personaId = 'dr_gasnelio';
        confidence = 0.6;
        explanation = 'Dr. Gasnelio tem conhecimento técnico, mas Gá pode ser uma alternativa mais acessível.';
      } else {
        personaId = 'ga';
        confidence = 0.9;
        explanation = 'Gá oferece explicações claras e acolhedoras, ideal para o seu perfil.';
      }
    }

    return { personaId, confidence, explanation };
  };

  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId === 'profile' ? 'profile' : 'focus']: value };
    setAnswers(newAnswers);

    if (currentStep === 'question1') {
      setCurrentStep('question2');
    } else if (currentStep === 'question2') {
      setCurrentStep('recommendation');
    }
  };

  const handlePersonaSelect = (recommendedPersonaId?: string) => {
    const finalPersonaId = recommendedPersonaId || 'ga';
    const recommendation = calculateRecommendation();
    
    const userProfile: UserProfile = {
      type: answers.profile || 'patient',
      focus: answers.focus || 'general',
      confidence: recommendation.confidence,
      explanation: recommendation.explanation
    };

    onPersonaSelect(finalPersonaId, userProfile);
  };

  const renderIntro = () => (
    <div className="text-center">
      <p style={{ 
        fontSize: '1rem',
        color: '#64748b',
        marginBottom: '2rem'
      }}>
        Para oferecer a melhor experiência, vamos personalizar o atendimento.
      </p>
      
      <button
        onClick={() => setCurrentStep('question1')}
        className="btn btn-primary btn-lg"
        style={{ marginBottom: '1rem' }}
      >
        Personalizar Atendimento
      </button>
      
      <div style={{ marginTop: '2rem' }}>
        <p style={{ 
          fontSize: '0.875rem',
          color: '#94a3b8',
          marginBottom: '1rem'
        }}>
          Ou escolha diretamente:
        </p>
        
        <div className="grid grid-cols-2 gap-md" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button 
            className="card card-flat"
            style={{ cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', background: 'inherit', textAlign: 'center', width: '100%' }}
            onClick={() => handlePersonaSelect('dr_gasnelio')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePersonaSelect('dr_gasnelio');
              }
            }}
            aria-label="Escolher Dr. Gasnelio como assistente - Técnico e detalhado"
            role="button"
            tabIndex={0}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              overflow: 'hidden',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}>
              <Image 
                src={getPersonaAvatar('dr_gasnelio')} 
                alt="Dr. Gasnelio"
                width={120}
                height={120}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Dr. Gasnelio
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Técnico e detalhado
            </p>
          </button>
          
          <button 
            className="card card-flat"
            style={{ cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', background: 'inherit', textAlign: 'center', width: '100%' }}
            onClick={() => handlePersonaSelect('ga')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePersonaSelect('ga');
              }
            }}
            aria-label="Escolher Gá como assistente - Clara e acolhedora"
            role="button"
            tabIndex={0}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              overflow: 'hidden',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}>
              <Image 
                src={getPersonaAvatar('ga')} 
                alt="Gá"
                width={120}
                height={120}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Gá
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Clara e acolhedora
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = (questionIndex: number) => {
    const question = questions[questionIndex];
    
    return (
      <div>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {question.text}
        </h3>
        
        <div className="grid grid-cols-2 gap-md" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(question.id, option.value)}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '2px solid transparent',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ color: '#0284c7', marginBottom: '0.75rem' }}>
                {option.icon}
              </div>
              <div style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b'
              }}>
                {option.text}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <button
            onClick={() => setCurrentStep(currentStep === 'question1' ? 'intro' : 'question1')}
            className="btn btn-ghost btn-sm"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  };

  const renderRecommendation = () => {
    const recommendation = calculateRecommendation();
    const recommendedPersona = personas[recommendation.personaId];
    const alternativePersonaId = recommendation.personaId === 'dr_gasnelio' ? 'ga' : 'dr_gasnelio';
    const alternativePersona = personas[alternativePersonaId];

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ 
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Assistente Recomendado
        </h3>
        
        <div className="card" style={{
          border: '2px solid #0284c7',
          marginBottom: '1.5rem'
        }}>
          <div className="flex items-center gap-lg">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <Image 
                src={getPersonaAvatar(recommendation.personaId)} 
                alt={recommendedPersona.name}
                width={80}
                height={80}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {recommendedPersona.name}
              </h4>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#64748b',
                marginBottom: '0.75rem'
              }}>
                {recommendedPersona.personality}
              </p>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                {recommendation.explanation}
              </p>
              
              <div className="badge badge-success" style={{ marginTop: '0.75rem' }}>
                {Math.round(recommendation.confidence * 100)}% compatível
              </div>
            </div>
          </div>
          
          <button
            onClick={() => handlePersonaSelect(recommendation.personaId)}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            Iniciar conversa com {recommendedPersona.name}
          </button>
        </div>

        <div className="card card-flat">
          <p style={{ 
            fontSize: '0.875rem',
            color: '#64748b',
            marginBottom: '1rem'
          }}>
            Alternativa disponível:
          </p>
          
          <div className="flex items-center gap-md">
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)'
            }}>
              <Image 
                src={getPersonaAvatar(alternativePersonaId)} 
                alt={alternativePersona.name}
                width={60}
                height={60}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <h5 style={{ 
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                {alternativePersona.name}
              </h5>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                {alternativePersona.personality}
              </p>
            </div>
            
            <button
              onClick={() => handlePersonaSelect(alternativePersonaId)}
              className="btn btn-secondary btn-sm"
            >
              Escolher
            </button>
          </div>
        </div>

        <div className="text-center" style={{ marginTop: '2rem' }}>
          <button
            onClick={() => setCurrentStep('intro')}
            className="btn btn-ghost btn-sm"
          >
            ← Refazer seleção
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'question1' && renderQuestion(0)}
      {currentStep === 'question2' && renderQuestion(1)}
      {currentStep === 'recommendation' && renderRecommendation()}
    </div>
  );
}