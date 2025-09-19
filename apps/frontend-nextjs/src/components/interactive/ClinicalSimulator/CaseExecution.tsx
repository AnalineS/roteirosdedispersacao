/**
 * CaseExecution - Interface principal de execução de casos clínicos
 * Integração completa com Dr. Gasnelio e Gá para feedback personalizado
 * Sistema interativo de steps com validação em tempo real
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ClinicalCase, CaseStep, StepValidation } from '@/types/clinicalCases';
import { CompletedCase, CaseStepResult } from '@/types/gamification';
import { SelectOption } from '@/types/components';
import { getUnbColors } from '@/config/modernTheme';

interface UserAnswer {
  value: string | number | boolean | string[];
  confidence?: number;
  reasoning?: string;
  timeSpent?: number;
  // Support for checklist (array of selected IDs)
  selectedItems?: string[];
  // Support for calculation (key-value pairs)
  calculations?: { [key: string]: number };
  [key: string]: unknown;
}

interface FormField {
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'radio' | 'checkbox';
  label: string;
  required?: boolean;
  options?: SelectOption[];
  unit?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// SelectOption agora importado de @/types/components
interface ExtendedSelectOption extends SelectOption {
  text?: string;
  category?: string;
  points?: number;
  required?: boolean;
  id?: string | number;
}

interface StepParameters {
  inputFields: FormField[];
  validationType?: 'exact' | 'range' | 'multiple' | 'calculation';
  expectedAnswer?: unknown;
  acceptableAnswers?: unknown[];
  tolerance?: number;
  expectedResult?: { [key: string]: number };
}
import {
  CheckCircleIcon,
  ClockIcon,
  LightbulbIcon,
  AlertTriangleIcon,
  UserIcon,
  RocketIcon,
  ZapIcon
} from '@/components/icons/EducationalIcons';

interface CaseExecutionProps {
  case: ClinicalCase;
  onComplete: (result: CompletedCase) => void;
  onBack: () => void;
  userLevel: 'paciente' | 'estudante' | 'profissional' | 'especialista';
}

interface StepState {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  score: number;
  maxScore: number;
  timeSpent: number;
  attempts: number;
  userAnswer: UserAnswer | null;
  feedback?: string;
}

interface PersonaFeedback {
  persona: 'dr-gasnelio' | 'ga';
  message: string;
  tone: 'encouraging' | 'technical' | 'supportive' | 'corrective';
  xpBonus?: number;
}

export default function CaseExecution({
  case: clinicalCase,
  onComplete,
  onBack,
  userLevel
}: CaseExecutionProps) {
  const unbColors = getUnbColors();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStates, setStepStates] = useState<StepState[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());
  const [personaFeedback, setPersonaFeedback] = useState<PersonaFeedback[]>([]);
  const [showPersonaChat, setShowPersonaChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentStep = clinicalCase.steps[currentStepIndex];
  const totalSteps = clinicalCase.steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Initialize step states
  useEffect(() => {
    const initialStates: StepState[] = clinicalCase.steps.map(step => ({
      id: step.id,
      status: 'pending',
      score: 0,
      maxScore: step.validation.points,
      timeSpent: 0,
      attempts: 0,
      userAnswer: null
    }));
    initialStates[0].status = 'active';
    setStepStates(initialStates);
  }, [clinicalCase]);

  // Calculate persona preference based on user level and step type
  const getPreferredPersona = (step: CaseStep): 'dr-gasnelio' | 'ga' => {
    // Dr. Gasnelio for technical/clinical content for advanced users
    if (userLevel === 'profissional' || userLevel === 'especialista') {
      if (step.type === 'assessment' || step.type === 'calculation') {
        return 'dr-gasnelio';
      }
    }

    // Gá for counseling and patient-oriented content
    if (step.type === 'counseling' || userLevel === 'paciente' || userLevel === 'estudante') {
      return 'ga';
    }

    return 'dr-gasnelio'; // Default to technical
  };

  // Generate persona-specific feedback
  const generatePersonaFeedback = (
    step: CaseStep,
    isCorrect: boolean,
    score: number,
    maxScore: number
  ): PersonaFeedback => {
    const persona = getPreferredPersona(step);
    const percentage = (score / maxScore) * 100;

    if (persona === 'dr-gasnelio') {
      // Technical, precise feedback
      if (isCorrect) {
        return {
          persona: 'dr-gasnelio',
          tone: 'technical',
          message: `Procedimento executado corretamente! Pontuação: ${score}/${maxScore} (${percentage.toFixed(1)}%). Sua abordagem seguiu os protocolos estabelecidos no PCDT Hanseníase 2022. ${percentage >= 90 ? 'Performance excepcional - demonstra domínio técnico da dispensação PQT-U.' : 'Bom desempenho técnico. Continue aplicando os fundamentos farmacológicos.'}`,
          xpBonus: percentage >= 90 ? 25 : percentage >= 80 ? 15 : 10
        };
      } else {
        return {
          persona: 'dr-gasnelio',
          tone: 'corrective',
          message: `Análise técnica: ${score}/${maxScore} pontos. Revise os aspectos farmacológicos: ${step.validation.feedback.incorrect.explanation} É fundamental seguir rigorosamente os protocolos para garantir eficácia terapêutica e segurança do paciente.`,
          xpBonus: 5
        };
      }
    } else {
      // Empathetic, supportive feedback from Gá
      if (isCorrect) {
        return {
          persona: 'ga',
          tone: 'encouraging',
          message: `Muito bem! 🌟 Você mostrou cuidado e atenção com o paciente. ${score}/${maxScore} pontos! ${percentage >= 90 ? 'Sua dedicação em aprender sobre hanseníase faz toda a diferença na vida das pessoas. Continue assim!' : 'Você está no caminho certo. Cada passo que dá é importante para ajudar quem precisa.'}`,
          xpBonus: percentage >= 90 ? 20 : percentage >= 80 ? 12 : 8
        };
      } else {
        return {
          persona: 'ga',
          tone: 'supportive',
          message: `Não desanime! 💪 Aprender leva tempo e você está se esforçando. ${score}/${maxScore} pontos desta vez. Lembre-se: ${step.validation.feedback.incorrect.explanation} Vamos continuar juntos - cada erro é uma oportunidade de crescer!`,
          xpBonus: 3
        };
      }
    }
  };

  // Handle step completion
  const handleStepSubmit = async (userAnswer: UserAnswer) => {
    if (isProcessing) return;

    setIsProcessing(true);
    const stepEndTime = new Date();
    const timeSpent = (stepEndTime.getTime() - stepStartTime.getTime()) / 1000;

    // Validate answer and calculate score
    const { isCorrect, score, feedback } = validateStepAnswer(currentStep, userAnswer);

    // Update step state
    const newStepStates = [...stepStates];
    newStepStates[currentStepIndex] = {
      ...newStepStates[currentStepIndex],
      status: isCorrect ? 'completed' : 'failed',
      score,
      maxScore: currentStep.validation.points,
      timeSpent,
      attempts: newStepStates[currentStepIndex].attempts + 1,
      userAnswer,
      feedback
    };
    setStepStates(newStepStates);

    // Generate persona feedback
    const personaResponse = generatePersonaFeedback(
      currentStep,
      isCorrect,
      score,
      currentStep.validation.points
    );
    setPersonaFeedback(prev => [...prev, personaResponse]);
    setShowPersonaChat(true);

    // Wait for user to read feedback
    setTimeout(() => {
      setIsProcessing(false);

      // Move to next step or complete case
      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex(prev => prev + 1);
        setStepStartTime(new Date());

        // Update next step status
        const nextStepStates = [...newStepStates];
        nextStepStates[currentStepIndex + 1].status = 'active';
        setStepStates(nextStepStates);
      } else {
        // Case completed
        handleCaseCompletion(newStepStates);
      }

      setShowPersonaChat(false);
    }, 3000);
  };

  // Validate step answer based on interaction type
  const validateStepAnswer = (step: CaseStep, userAnswer: UserAnswer) => {
    const validation = step.validation;
    let isCorrect = false;
    let score = 0;

    switch (step.interaction.type) {
      case 'checklist':
        const requiredItems = step.interaction.checklistItems?.filter(item => item.required) || [];
        const userArrayAnswer = Array.isArray(userAnswer.value) ? userAnswer.value : userAnswer.selectedItems || [];
        const selectedRequired = userArrayAnswer.filter((id: string) =>
          requiredItems.some(item => item.id === id)
        );

        isCorrect = selectedRequired.length === requiredItems.length;
        score = isCorrect ? validation.points : Math.floor((selectedRequired.length / requiredItems.length) * validation.points);
        break;

      case 'multiple_choice':
        const correctOption = step.interaction.options?.find(opt => opt.isCorrect);
        isCorrect = userAnswer.value === correctOption?.id;
        score = isCorrect ? validation.points : 0;
        break;

      case 'calculation':
        const expectedResults = step.interaction.calculationParameters?.expectedResult;
        if (expectedResults) {
          let correctCount = 0;
          let totalFields = Object.keys(expectedResults).length;

          Object.entries(expectedResults).forEach(([key, expectedValue]) => {
            const userCalculations = userAnswer.calculations || {};
            const userValue = userCalculations[key];
            const tolerance = step.interaction.calculationParameters?.tolerance || 10;

            if (typeof userValue === 'number' && typeof expectedValue === 'number' &&
                Math.abs(userValue - expectedValue) <= tolerance) {
              correctCount++;
            }
          });

          const accuracy = correctCount / totalFields;
          isCorrect = accuracy >= 0.8; // 80% accuracy required
          score = Math.floor(accuracy * validation.points);
        }
        break;

      default:
        isCorrect = true;
        score = validation.points;
    }

    const feedback = isCorrect ? validation.feedback.correct : validation.feedback.incorrect;
    return { isCorrect, score, feedback: feedback.message };
  };

  // Handle case completion
  const handleCaseCompletion = (finalStepStates: StepState[]) => {
    const endTime = new Date();
    const totalTimeSpent = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

    const totalScore = finalStepStates.reduce((sum, state) => sum + state.score, 0);
    const maxPossibleScore = finalStepStates.reduce((sum, state) => sum + state.maxScore, 0);
    const diagnosticAccuracy = (totalScore / maxPossibleScore) * 100;

    const stepResults: CaseStepResult[] = finalStepStates.map((state, index) => ({
      stepId: state.id,
      stepNumber: index + 1,
      title: clinicalCase.steps[index].title,
      score: (state.score / state.maxScore) * 100,
      timeSpent: state.timeSpent,
      attempts: state.attempts,
      completed: state.status === 'completed'
    }));

    // Calculate XP from persona feedback
    const totalPersonaXP = personaFeedback.reduce((sum, feedback) =>
      sum + (feedback.xpBonus || 0), 0);

    const result: CompletedCase = {
      caseId: clinicalCase.id,
      title: clinicalCase.title,
      difficulty: clinicalCase.difficulty,
      category: clinicalCase.category,
      completedAt: endTime.toISOString(),
      timeSpent: totalTimeSpent,
      diagnosticAccuracy,
      score: diagnosticAccuracy, // Add missing score property
      xpEarned: totalScore + totalPersonaXP,
      attempts: 1,
      perfectScore: diagnosticAccuracy >= 95,
      stepResults,
      competencyScores: {
        'Avaliação Clínica': diagnosticAccuracy,
        'Comunicação': personaFeedback.filter(f => f.persona === 'ga').length > 0 ? 85 : 70,
        'Conhecimento Técnico': personaFeedback.filter(f => f.persona === 'dr-gasnelio').length > 0 ? 90 : 75
      }
    };

    onComplete(result);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
        padding: '1.5rem',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {clinicalCase.title}
            </h1>
            <div style={{ opacity: 0.9, marginTop: '0.5rem' }}>
              Paciente: {clinicalCase.patient.name} • {clinicalCase.patient.age} anos • {clinicalCase.patient.weight}kg
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Etapa {currentStepIndex + 1} de {totalSteps}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {progress.toFixed(0)}% Completo
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          height: '8px',
          marginTop: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'white',
            height: '100%',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
            borderRadius: '10px'
          }} />
        </div>
      </div>

      {/* Step Execution Area */}
      {currentStep && (
        <StepExecutionInterface
          step={currentStep}
          stepState={stepStates[currentStepIndex]}
          onSubmit={handleStepSubmit}
          isProcessing={isProcessing}
          userLevel={userLevel}
        />
      )}

      {/* Persona Chat Overlay */}
      {showPersonaChat && personaFeedback.length > 0 && (
        <PersonaChatOverlay
          feedback={personaFeedback[personaFeedback.length - 1]}
          onClose={() => setShowPersonaChat(false)}
        />
      )}

      {/* Back Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: unbColors.primary,
            border: `1px solid ${unbColors.primary}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Voltar à Seleção
        </button>
      </div>
    </div>
  );
}

// Step Execution Interface Component
interface StepExecutionInterfaceProps {
  step: CaseStep;
  stepState: StepState;
  onSubmit: (answer: UserAnswer) => void;
  isProcessing: boolean;
  userLevel: string;
}

function StepExecutionInterface({
  step,
  stepState,
  onSubmit,
  isProcessing,
  userLevel
}: StepExecutionInterfaceProps) {
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSubmit = () => {
    if (step.interaction.type === 'checklist') {
      onSubmit({ value: selectedItems, selectedItems });
    } else if (step.interaction.type === 'calculation') {
      onSubmit({ value: userAnswer, calculations: userAnswer });
    } else {
      onSubmit({ value: userAnswer });
    }
  };

  const hasValidAnswer = () => {
    if (step.interaction.type === 'checklist') {
      return selectedItems.length > 0;
    } else if (step.interaction.type === 'calculation') {
      return userAnswer && Object.keys(userAnswer).length > 0;
    } else {
      return userAnswer !== null && userAnswer !== undefined;
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
          {step.title}
        </h2>
        <p style={{ color: '#64748b', margin: '0 0 1rem' }}>
          {step.description}
        </p>
        <div style={{
          background: '#f1f5f9',
          padding: '1rem',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <strong>Instrução:</strong> {step.instruction}
        </div>
      </div>

      {/* Render interaction based on type */}
      {step.interaction.type === 'checklist' && (
        <ChecklistInterface
          items={(step.interaction.checklistItems || []).map((item, index) =>
            typeof item === 'string'
              ? { value: item, label: item }
              : {
                  value: item.id || item.text || String(index),
                  label: item.text || item.label || String(item),
                  text: item.text,
                  category: item.category,
                  points: item.points,
                  required: item.required,
                  id: item.id
                }
          )}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      )}

      {step.interaction.type === 'multiple_choice' && (
        <MultipleChoiceInterface
          options={(step.interaction.options || []).map((option, index) =>
            typeof option === 'string'
              ? { value: option, label: option }
              : { value: option.id || option.text || String(index), label: option.text || option.label || String(option) }
          )}
          selectedOption={userAnswer}
          onSelectionChange={setUserAnswer}
        />
      )}

      {step.interaction.type === 'calculation' && (
        <CalculationInterface
          parameters={step.interaction.calculationParameters!}
          values={userAnswer || {}}
          onValuesChange={setUserAnswer}
        />
      )}

      {/* Submit Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !hasValidAnswer()}
          style={{
            padding: '12px 32px',
            background: isProcessing ? '#94a3b8' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto'
          }}
        >
          {isProcessing ? (
            <>
              <ClockIcon size={20} color="white" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircleIcon size={20} color="white" />
              Confirmar Resposta
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Checklist Interface Component
interface ChecklistInterfaceProps {
  items: ExtendedSelectOption[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

function ChecklistInterface({ items, selectedItems, onSelectionChange }: ChecklistInterfaceProps) {
  const handleItemToggle = (itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Itens a verificar:
      </h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {items.map((item) => (
          <label
            key={item.value}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              border: selectedItems.includes(String(item.value)) ? '2px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedItems.includes(String(item.value)) ? '#f0fdfa' : 'white'
            }}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(String(item.value))}
              onChange={() => handleItemToggle(String(item.value))}
              style={{ marginTop: '2px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                {item.text || item.label}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#64748b',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Categoria: {item.category || 'Geral'}</span>
                <span>{item.points || 0} pontos</span>
              </div>
              {item.required && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  marginTop: '0.25rem',
                  fontWeight: '500'
                }}>
                  * Obrigatório
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Multiple Choice Interface Component
interface MultipleChoiceInterfaceProps {
  options: SelectOption[];
  selectedOption: string | null;
  onSelectionChange: (option: string) => void;
}

function MultipleChoiceInterface({
  options,
  selectedOption,
  onSelectionChange
}: MultipleChoiceInterfaceProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Selecione a opção correta:
      </h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {options.map((option) => (
          <label
            key={option.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              border: selectedOption === String(option.id) ? '2px solid #10b981' : '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedOption === String(option.id) ? '#f0fdfa' : 'white'
            }}
          >
            <input
              type="radio"
              name="multiple-choice"
              checked={selectedOption === String(option.id)}
              onChange={() => onSelectionChange(String(option.id))}
            />
            <div style={{ flex: 1, fontWeight: '500' }}>
              {option.text || option.label}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Persona Chat Overlay Component
interface PersonaChatOverlayProps {
  feedback: PersonaFeedback;
  onClose: () => void;
}

function PersonaChatOverlay({ feedback, onClose }: PersonaChatOverlayProps) {
  const isGa = feedback.persona === 'ga';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        maxWidth: '500px',
        margin: '1rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Persona Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: isGa ? '#fff7ed' : '#f0f9ff',
          borderRadius: '8px',
          border: `2px solid ${isGa ? '#f97316' : '#0284c7'}`
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isGa ? '#f97316' : '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserIcon size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {isGa ? 'Gá' : 'Dr. Gasnelio'}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              {isGa ? 'Assistente Empática' : 'Especialista Técnico'}
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        <div style={{
          background: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          borderLeft: `4px solid ${isGa ? '#f97316' : '#0284c7'}`
        }}>
          <div style={{ lineHeight: 1.6 }}>
            {feedback.message}
          </div>

          {feedback.xpBonus && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: '#10b981',
              color: 'white',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              🎉 +{feedback.xpBonus} XP Bônus!
            </div>
          )}
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: isGa ? '#f97316' : '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

// Calculation Interface Component
interface CalculationInterfaceProps {
  parameters: StepParameters;
  values: { [key: string]: number };
  onValuesChange: (values: { [key: string]: number }) => void;
}

function CalculationInterface({
  parameters,
  values,
  onValuesChange
}: CalculationInterfaceProps) {
  const handleInputChange = (fieldName: string, value: number) => {
    onValuesChange({ ...values, [fieldName]: value });
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
        Cálculo de Doses Pediátricas:
      </h3>

      <div style={{
        background: '#f8fafc',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: '1rem' }}>
          📋 Fórmulas para Cálculo (Peso: 25kg)
        </h4>
        <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
          • <strong>Rifampicina:</strong> 10mg/kg = 25 × 10 = <strong>250mg</strong> (mensal supervisionada)<br />
          • <strong>Clofazimina mensal:</strong> 6mg/kg = 25 × 6 = <strong>150mg</strong> (mensal supervisionada)<br />
          • <strong>Clofazimina diária:</strong> 1mg/kg = 25 × 1 = <strong>25mg</strong> (autoadministrada)<br />
          • <strong>Dapsona:</strong> 2mg/kg = 25 × 2 = <strong>50mg</strong> (mensal e diária)
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {parameters.inputFields.map((field: FormField) => (
          <div key={field.name} style={{
            padding: '1rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: 'white'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#1e293b'
            }}>
              {field.label}
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                value={values[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, Number(e.target.value))}
                min={field.validation?.min}
                max={field.validation?.max}
                required={field.validation?.required}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  width: '120px'
                }}
              />
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                {field.unit || 'mg'}
              </span>
            </div>

            {field.validation?.min && field.validation?.max && (
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b',
                marginTop: '0.25rem'
              }}>
                Faixa esperada: {field.validation.min}-{field.validation.max} {field.unit || 'mg'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Results Preview */}
      {Object.keys(values).length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f0f9ff',
          border: '1px solid #0284c7',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 0.75rem', color: '#0c4a6e', fontSize: '0.875rem' }}>
            📊 Resumo das Doses Calculadas:
          </h4>
          <div style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
            {Object.entries(values).map(([key, value]) => {
              const field = parameters.inputFields.find((f: FormField) => f.name === key);
              return field ? (
                <div key={key} style={{ marginBottom: '0.25rem' }}>
                  <strong>{field.label}:</strong> {value} {field.unit || 'mg'}
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}