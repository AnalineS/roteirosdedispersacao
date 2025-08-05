'use client';

import { useState } from 'react';
import { Persona } from '@/services/api';
import { getPersonaAvatar } from '@/constants/avatars';

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
  emoji: string;
  options: {
    id: string;
    text: string;
    value: UserProfile['type'] | UserProfile['focus'];
    emoji: string;
  }[];
}

const questions: Question[] = [
  {
    id: 'profile',
    text: 'Para oferecer a melhor experiência, qual dessas opções melhor descreve você?',
    emoji: '🎯',
    options: [
      {
        id: 'professional',
        text: 'Profissional de saúde',
        value: 'professional',
        emoji: '👨‍⚕️'
      },
      {
        id: 'student',
        text: 'Estudante da área da saúde',
        value: 'student',
        emoji: '📚'
      },
      {
        id: 'patient',
        text: 'Paciente ou familiar',
        value: 'patient',
        emoji: '🤗'
      },
      {
        id: 'caregiver',
        text: 'Cuidador ou pessoa interessada',
        value: 'caregiver',
        emoji: '💙'
      }
    ]
  },
  {
    id: 'focus',
    text: 'Sobre o que gostaria de conversar?',
    emoji: '🔍',
    options: [
      {
        id: 'technical',
        text: 'Informações técnicas sobre medicamentos',
        value: 'technical',
        emoji: '🧬'
      },
      {
        id: 'practical',
        text: 'Como tomar corretamente os remédios',
        value: 'practical',
        emoji: '💊'
      },
      {
        id: 'effects',
        text: 'Efeitos que posso sentir',
        value: 'effects',
        emoji: '🌡️'
      },
      {
        id: 'general',
        text: 'Dúvidas sobre o tratamento',
        value: 'general',
        emoji: '❓'
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
    
    // Lógica de recomendação baseada na estratégia UX
    let personaId = 'ga'; // padrão empático
    let confidence = 0.5;
    let explanation = '';

    if (profile === 'professional' || profile === 'student') {
      if (focus === 'technical') {
        personaId = 'dr_gasnelio';
        confidence = 0.9;
        explanation = 'Recomendo Dr. Gasnelio por sua expertise técnica e científica, ideal para profissionais da saúde.';
      } else {
        personaId = 'dr_gasnelio';
        confidence = 0.7;
        explanation = 'Dr. Gasnelio pode fornecer informações precisas, mas pode alternar para Gá se preferir explicações mais simples.';
      }
    } else {
      if (focus === 'technical') {
        personaId = 'dr_gasnelio';
        confidence = 0.6;
        explanation = 'Dr. Gasnelio tem as informações técnicas que procura, mas Gá pode explicar de forma mais acessível.';
      } else {
        personaId = 'ga';
        confidence = 0.9;
        explanation = 'Gá é perfeita para explicações claras e acolhedoras, focando no seu bem-estar.';
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
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🤖✨</div>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'white' }}>
        Assistentes Virtuais Especializados
      </h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9, lineHeight: '1.6' }}>
        Tenho dois especialistas prontos para ajudar você com hanseníase PQT-U.
        Para recomendar o melhor assistente, preciso conhecer um pouco sobre você.
      </p>
      <button
        onClick={() => setCurrentStep('question1')}
        style={{
          background: 'white',
          color: '#1976d2',
          border: 'none',
          padding: '15px 40px',
          borderRadius: '30px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        }}
      >
        Começar Questionário
      </button>
      
      <div style={{ marginTop: '40px', opacity: 0.7 }}>
        <p style={{ fontSize: '0.9rem' }}>
          Ou escolha diretamente um assistente:
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px' }}>
          <button
            onClick={() => handlePersonaSelect('dr_gasnelio')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            👨‍⚕️ Dr. Gasnelio
          </button>
          <button
            onClick={() => handlePersonaSelect('ga')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            😊 Gá
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestion = (questionIndex: number) => {
    const question = questions[questionIndex];
    
    return (
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{question.emoji}</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '30px', color: 'white', lineHeight: '1.4' }}>
          {question.text}
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(question.id, option.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                transform: 'translate3d(0, 0, 0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) translate3d(0, 0, 0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) translate3d(0, 0, 0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{option.emoji}</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{option.text}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(currentStep === 'question1' ? 'intro' : 'question1')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
        >
          ← Voltar
        </button>
      </div>
    );
  };

  const renderRecommendation = () => {
    const recommendation = calculateRecommendation();
    const recommendedPersona = personas[recommendation.personaId];
    const alternativePersonaId = recommendation.personaId === 'dr_gasnelio' ? 'ga' : 'dr_gasnelio';
    const alternativePersona = personas[alternativePersonaId];

    return (
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>✨🎯</div>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: 'white' }}>
          Recomendação Personalizada
        </h3>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
            {recommendedPersona.avatar}
          </div>
          <h4 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'white' }}>
            {recommendedPersona.name}
          </h4>
          <p style={{ fontSize: '1rem', marginBottom: '15px', opacity: 0.9 }}>
            {recommendedPersona.personality}
          </p>
          <p style={{ fontSize: '0.95rem', marginBottom: '20px', opacity: 0.8, lineHeight: '1.4' }}>
            {recommendation.explanation}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            <div style={{
              background: 'rgba(76, 175, 80, 0.2)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              border: '1px solid rgba(76, 175, 80, 0.5)'
            }}>
              {Math.round(recommendation.confidence * 100)}% de compatibilidade
            </div>
          </div>

          <button
            onClick={() => handlePersonaSelect(recommendation.personaId)}
            style={{
              background: 'white',
              color: '#1976d2',
              border: 'none',
              padding: '15px 40px',
              borderRadius: '30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            }}
          >
            Conversar com {recommendedPersona.name}
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '1rem', marginBottom: '15px', opacity: 0.8 }}>
            Ou escolha o outro especialista:
          </p>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
              {alternativePersona.avatar}
            </div>
            <h5 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'white' }}>
              {alternativePersona.name}
            </h5>
            <p style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: 0.8 }}>
              {alternativePersona.personality}
            </p>
            
            <button
              onClick={() => handlePersonaSelect(alternativePersonaId)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                padding: '10px 25px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
            >
              Conversar com {alternativePersona.name}
            </button>
          </div>
        </div>

        <button
          onClick={() => setCurrentStep('question2')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
        >
          ← Refazer questionário
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 20px', minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
      {currentStep === 'intro' && renderIntro()}
      {currentStep === 'question1' && renderQuestion(0)}
      {currentStep === 'question2' && renderQuestion(1)}
      {currentStep === 'recommendation' && renderRecommendation()}
    </div>
  );
}