import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import confetti from 'canvas-confetti'

interface StepContent {
  title: string
  description: string
  icon: React.ComponentType<any>
  image?: string
  tips?: string[]
  warnings?: string[]
  checkpoints?: {
    label: string
    checked: boolean
  }[]
  duration?: string
}

interface InteractiveStep {
  id: string
  content: StepContent
  validation?: () => boolean
  action?: () => void
}

interface InteractiveStepGuideProps {
  title: string
  steps: InteractiveStep[]
  onComplete?: () => void
  allowSkip?: boolean
  autoPlay?: boolean
  autoPlayDelay?: number // milliseconds
}

const InteractiveStepGuide: React.FC<InteractiveStepGuideProps> = ({
  title,
  steps,
  onComplete,
  allowSkip = false,
  autoPlay = false,
  autoPlayDelay = 5000
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [stepCheckpoints, setStepCheckpoints] = useState<Record<number, Record<number, boolean>>>({})
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        handleNext()
      }, autoPlayDelay)
      return () => clearTimeout(timer)
    } else if (isPlaying && currentStep === steps.length - 1) {
      setIsPlaying(false)
    }
  }, [isPlaying, currentStep, steps.length, autoPlayDelay])

  const handleNext = () => {
    const step = steps[currentStep]
    
    // Validate current step if validation function exists
    if (step.validation && !step.validation()) {
      alert('Por favor, complete todos os requisitos antes de continuar.')
      return
    }

    // Execute action if exists
    if (step.action) {
      step.action()
    }

    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]))

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Guide completed
      handleCompletion()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (index: number) => {
    if (allowSkip || index <= Math.max(...completedSteps, 0)) {
      setCurrentStep(index)
    }
  }

  const handleCheckpointToggle = (stepIndex: number, checkpointIndex: number) => {
    setStepCheckpoints(prev => ({
      ...prev,
      [stepIndex]: {
        ...prev[stepIndex],
        [checkpointIndex]: !prev[stepIndex]?.[checkpointIndex]
      }
    }))
  }

  const handleCompletion = () => {
    setShowCompletionAnimation(true)
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    setTimeout(() => {
      onComplete?.()
    }, 2000)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setStepCheckpoints({})
    setShowCompletionAnimation(false)
  }

  const currentStepData = steps[currentStep]
  const progress = ((completedSteps.size) / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-t-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <div className="flex items-center space-x-2">
            {autoPlay && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <PauseIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <PlayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
            )}
            <button
              onClick={handleRestart}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
              aria-label="Reiniciar"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progresso</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-primary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center space-x-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            const isCurrent = index === currentStep
            const isClickable = allowSkip || index <= Math.max(...completedSteps, 0)

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary-500 text-white scale-110 shadow-lg'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : isClickable
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                aria-label={`Passo ${index + 1}: ${step.content.title}`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="font-medium">{index + 1}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {!showCompletionAnimation ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6"
          >
            {/* Step Header */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <currentStepData.content.icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Passo {currentStep + 1}: {currentStepData.content.title}
                </h3>
                {currentStepData.content.duration && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tempo estimado: {currentStepData.content.duration}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
              <p>{currentStepData.content.description}</p>
            </div>

            {/* Visual Content */}
            {currentStepData.content.image && (
              <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={currentStepData.content.image}
                  alt={`Ilustração do ${currentStepData.content.title}`}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Checkpoints */}
            {currentStepData.content.checkpoints && (
              <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                  Checklist
                </h4>
                <div className="space-y-2">
                  {currentStepData.content.checkpoints.map((checkpoint, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={stepCheckpoints[currentStep]?.[index] || false}
                        onChange={() => handleCheckpointToggle(currentStep, index)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className={`text-sm ${
                        stepCheckpoints[currentStep]?.[index]
                          ? 'text-gray-700 dark:text-gray-300 line-through'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {checkpoint.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {currentStepData.content.tips && currentStepData.content.tips.length > 0 && (
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                  <InformationCircleIcon className="w-4 h-4 mr-2" />
                  Dicas úteis
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  {currentStepData.content.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {currentStepData.content.warnings && currentStepData.content.warnings.length > 0 && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center">
                  <InformationCircleIcon className="w-4 h-4 mr-2" />
                  Atenção
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {currentStepData.content.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">⚠️</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  currentStep === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span>Anterior</span>
              </button>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep + 1} de {steps.length}
              </span>

              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                <span>{currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}</span>
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Parabéns! 🎉
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Você completou o guia com sucesso!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Fazer novamente
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  Continuar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InteractiveStepGuide