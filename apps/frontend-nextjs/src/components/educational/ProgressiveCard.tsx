'use client';

import React, { useState, useCallback } from 'react';
import { BookIcon, CheckIcon, HeartIcon } from '@/components/icons/FlatOutlineIcons';
import { modernChatTheme } from '@/config/modernTheme';

interface ProgressStep {
  id: string;
  title: string;
  content: string;
  isCompleted?: boolean;
}

interface ProgressiveCardProps {
  title: string;
  description?: string;
  steps: ProgressStep[];
  autoProgress?: boolean;
  progressDelay?: number;
  onComplete?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
}

export default function ProgressiveCard({
  title,
  description,
  steps,
  autoProgress = false,
  progressDelay = 3000,
  onComplete,
  variant = 'default',
  showProgress = true
}: ProgressiveCardProps): React.JSX.Element {
  
  const [currentStep, setCurrentStep] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState<number[]>([0]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Auto progress functionality
  React.useEffect(() => {
    if (!autoProgress || isCompleted) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= steps.length) {
          setIsCompleted(true);
          onComplete?.();
          return prev;
        }
        setRevealedSteps(current => [...current, nextStep]);
        return nextStep;
      });
    }, progressDelay);

    return () => clearInterval(interval);
  }, [autoProgress, progressDelay, steps.length, isCompleted, onComplete]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex <= revealedSteps.length - 1 || isCompleted) {
      setCurrentStep(stepIndex);
    } else if (!autoProgress) {
      // Manual revelation
      const newRevealed = [];
      for (let i = 0; i <= stepIndex; i++) {
        newRevealed.push(i);
      }
      setRevealedSteps(newRevealed);
      setCurrentStep(stepIndex);
      
      if (stepIndex === steps.length - 1) {
        setIsCompleted(true);
        onComplete?.();
      }
    }
  }, [revealedSteps, autoProgress, steps.length, onComplete, isCompleted]);

  const getProgressPercentage = () => {
    return ((revealedSteps.length / steps.length) * 100);
  };

  const renderProgressBar = () => {
    if (!showProgress) return null;
    
    return (
      <div style={{
        width: '100%',
        height: '6px',
        background: modernChatTheme.colors.neutral.border,
        borderRadius: '3px',
        marginBottom: '1.5rem',
        overflow: 'hidden'
      }}>
        <div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${modernChatTheme.colors.personas.gasnelio.primary}, ${modernChatTheme.colors.personas.ga.primary})`,
            width: `${getProgressPercentage()}%`,
            transition: 'width 0.5s ease-in-out',
            borderRadius: '3px'
          }}
        />
      </div>
    );
  };

  const renderStep = (step: ProgressStep, index: number) => {
    const isRevealed = revealedSteps.includes(index);
    const isCurrent = currentStep === index;
    const stepCompleted = step.isCompleted || index < currentStep || isCompleted;
    
    return (
      <div
        key={step.id}
        style={{
          marginBottom: variant === 'compact' ? '1rem' : '1.5rem',
          opacity: isRevealed ? 1 : 0.3,
          transform: isRevealed ? 'translateX(0)' : 'translateX(-10px)',
          transition: 'all 0.5s ease',
          cursor: isRevealed || !autoProgress ? 'pointer' : 'default'
        }}
        onClick={() => handleStepClick(index)}
      >
        {/* Step Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          {/* Step Number/Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: stepCompleted 
              ? '#22c55e' 
              : isCurrent 
                ? modernChatTheme.colors.personas.gasnelio.primary 
                : modernChatTheme.colors.neutral.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stepCompleted || isCurrent ? 'white' : modernChatTheme.colors.neutral.textMuted,
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}>
            {stepCompleted ? <CheckIcon size={16} color="white" /> : index + 1}
          </div>

          {/* Step Title */}
          <h4 style={{
            fontSize: variant === 'compact' ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: isCurrent 
              ? modernChatTheme.colors.personas.gasnelio.primary
              : modernChatTheme.colors.neutral.text,
            margin: 0,
            transition: 'color 0.3s ease'
          }}>
            {step.title}
          </h4>
        </div>

        {/* Step Content */}
        {isRevealed && (
          <div style={{
            paddingLeft: variant === 'compact' ? '2.5rem' : '3rem',
            fontSize: '0.95rem',
            color: modernChatTheme.colors.neutral.textMuted,
            lineHeight: '1.6',
            background: isCurrent ? `${modernChatTheme.colors.personas.gasnelio.primary}08` : 'transparent',
            padding: isCurrent ? '1rem' : '0',
            borderRadius: isCurrent ? modernChatTheme.borderRadius.md : '0',
            marginLeft: variant === 'compact' ? '2.5rem' : '3rem',
            transition: 'all 0.3s ease'
          }}>
            {step.content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: modernChatTheme.borderRadius.lg,
      padding: variant === 'compact' ? '1.5rem' : '2rem',
      boxShadow: modernChatTheme.shadows.subtle,
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      maxWidth: variant === 'detailed' ? '800px' : '600px'
    }}>
      {/* Card Header */}
      <div style={{
        marginBottom: variant === 'compact' ? '1.5rem' : '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: description ? '0.75rem' : 0
        }}>
          <BookIcon size={24} color={modernChatTheme.colors.personas.gasnelio.primary} />
          <h3 style={{
            fontSize: variant === 'compact' ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            margin: 0
          }}>
            {title}
          </h3>
          {isCompleted && (
            <HeartIcon size={20} color="#22c55e" />
          )}
        </div>
        
        {description && (
          <p style={{
            fontSize: '1rem',
            color: modernChatTheme.colors.neutral.textMuted,
            margin: 0,
            lineHeight: '1.5'
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Steps */}
      <div>
        {steps.map(renderStep)}
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#22c55e15',
          borderRadius: modernChatTheme.borderRadius.md,
          border: '1px solid #22c55e40',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckIcon size={24} color="#22c55e" />
          <span style={{
            fontSize: '1rem',
            color: '#16a34a',
            fontWeight: '600'
          }}>
            Processo educacional concluído com sucesso!
          </span>
        </div>
      )}
    </div>
  );
}