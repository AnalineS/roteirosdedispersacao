import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import PersonaCard from '@components/PersonaCard'
import type { Persona } from '@/types'
import { 
  QuestionMarkCircleIcon, 
  AcademicCapIcon, 
  HeartIcon,
  ChevronRightIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface EnhancedPersonaSelectorProps {
  personas: Record<string, Persona> | undefined
  isLoading: boolean
  selectedPersona: string | null
}

const EnhancedPersonaSelector: React.FC<EnhancedPersonaSelectorProps> = ({
  personas,
  isLoading,
  selectedPersona
}) => {
  const { setSelectedPersona } = useChat()
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizStep, setQuizStep] = useState(0)
  const [userProfile, setUserProfile] = useState({
    knowledge: 'unsure',
    purpose: 'unsure',
    preference: 'unsure'
  })
  const [showTooltip, setShowTooltip] = useState('')
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  // Check if user has seen onboarding before
  useEffect(() => {
    const seen = localStorage.getItem('persona-onboarding-seen')
    setHasSeenOnboarding(!!seen)
  }, [])

  // Quiz questions for undecided users
  const quizQuestions = [
    {
      id: 'knowledge',
      question: 'Você trabalha ou estuda na área da saúde?',
      options: [
        { value: 'yes', label: 'Sim, sou profissional ou estudante', icon: AcademicCapIcon },
        { value: 'no', label: 'Não, busco informações gerais', icon: HeartIcon },
        { value: 'partial', label: 'Tenho algum conhecimento', icon: SparklesIcon }
      ]
    },
    {
      id: 'purpose',
      question: 'Está buscando informações para si ou para ajudar alguém?',
      options: [
        { value: 'self', label: 'Para mim mesmo', icon: HeartIcon },
        { value: 'other', label: 'Para ajudar alguém', icon: HeartIcon },
        { value: 'study', label: 'Para estudo/pesquisa', icon: AcademicCapIcon }
      ]
    },
    {
      id: 'preference',
      question: 'Como prefere receber as informações?',
      options: [
        { value: 'detailed', label: 'Explicações detalhadas e técnicas', icon: AcademicCapIcon },
        { value: 'simple', label: 'Linguagem simples e direta', icon: HeartIcon },
        { value: 'balanced', label: 'Um pouco de cada', icon: SparklesIcon }
      ]
    }
  ]

  const handleQuizAnswer = (value: string) => {
    const question = quizQuestions[quizStep]
    setUserProfile(prev => ({
      ...prev,
      [question.id]: value
    }))

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(prev => prev + 1)
    } else {
      // Analyze responses and recommend persona
      recommendPersona()
    }
  }

  const recommendPersona = () => {
    const { knowledge, purpose, preference } = userProfile
    
    // Logic to recommend persona based on answers
    let recommendedPersona = 'ga' // Default to Gá
    
    if (
      (knowledge === 'yes' || purpose === 'study') && 
      preference === 'detailed'
    ) {
      recommendedPersona = 'dr_gasnelio'
    }

    // Show recommendation with explanation
    setShowQuiz(false)
    setSelectedPersona(recommendedPersona)
    
    // Show tooltip explaining the recommendation
    setTimeout(() => {
      setShowTooltip(`Recomendamos ${recommendedPersona === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'} baseado em suas respostas!`)
      setTimeout(() => setShowTooltip(''), 5000)
    }, 500)
  }

  // First-time user onboarding
  const OnboardingOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => {
        setHasSeenOnboarding(true)
        localStorage.setItem('persona-onboarding-seen', 'true')
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Bem-vindo ao Roteiro de Dispensação!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vou ajudar você a entender tudo sobre medicamentos e tratamentos de forma clara e simples.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Escolha seu assistente</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dr. Gasnelio para informações técnicas ou Gá para explicações simples
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Faça suas perguntas</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pergunte sobre sintomas, tratamentos ou tire suas dúvidas
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aprenda no seu ritmo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Informações adaptadas ao seu nível de conhecimento
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setHasSeenOnboarding(true)
            localStorage.setItem('persona-onboarding-seen', 'true')
          }}
          className="w-full btn-primary py-3 font-medium"
        >
          Vamos começar!
        </button>
      </motion.div>
    </motion.div>
  )

  // Quiz component
  const PersonaQuiz = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg max-w-md mx-auto"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Vamos encontrar o melhor assistente para você
          </h3>
          <button
            onClick={() => setShowQuiz(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar questionário"
          >
            ✕
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pergunta {quizStep + 1} de {quizQuestions.length}
        </p>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
          {quizQuestions[quizStep].question}
        </h4>

        <div className="space-y-3">
          {quizQuestions[quizStep].options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleQuizAnswer(option.value)}
                className="w-full flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 text-left group"
              >
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 mr-3" />
                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  {option.label}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 ml-auto" />
              </button>
            )
          })}
        </div>
      </div>

      {quizStep > 0 && (
        <button
          onClick={() => setQuizStep(prev => prev - 1)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Voltar
        </button>
      )}
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full mb-4 mx-auto" />
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!personas || Object.keys(personas).length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <QuestionMarkCircleIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Nenhuma persona disponível
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não foi possível carregar os assistentes. Tente novamente.
        </p>
      </motion.div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {!hasSeenOnboarding && <OnboardingOverlay />}
        {showQuiz && <PersonaQuiz />}
      </AnimatePresence>

      {/* Tooltip notification */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg z-40"
          >
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="w-5 h-5" />
              <span>{showTooltip}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header with help button */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Escolha seu assistente virtual
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Cada assistente tem um jeito especial de explicar as informações
          </p>
          
          {!showQuiz && (
            <button
              onClick={() => setShowQuiz(true)}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
              Não sei qual escolher
            </button>
          )}
        </div>

        {/* Persona cards */}
        {!showQuiz && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(personas).map(([id, persona], index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <PersonaCard
                  persona={persona}
                  onSelect={() => {
                    setSelectedPersona(id)
                    // Track selection for analytics
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'select_persona', {
                        persona_id: id,
                        persona_name: persona.name
                      })
                    }
                  }}
                  isSelected={selectedPersona === id}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Educational tip */}
        {!showQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center"
          >
            <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
              <SparklesIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Dica:</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Você pode trocar de assistente a qualquer momento durante a conversa!
            </p>
          </motion.div>
        )}
      </div>
    </>
  )
}

export default EnhancedPersonaSelector