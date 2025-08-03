import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Persona } from '@/types'
import {
  ArrowRightIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface PersonaTransitionSuggestionProps {
  suggestedPersona: string
  currentPersona: string
  personas: Record<string, Persona>
  currentMessage: string // Used for analytics and reasoning context
  onAccept: () => void
  onDecline: () => void
  onDismiss: () => void
}

const PersonaTransitionSuggestion: React.FC<PersonaTransitionSuggestionProps> = ({
  suggestedPersona,
  currentPersona,
  personas,
  currentMessage, // Used for analytics and reasoning context
  onAccept,
  onDecline,
  onDismiss
}) => {
  
  const [showDetails, setShowDetails] = useState(false)

  if (!currentPersona || !personas) return null

  const currentPersonaData = personas[currentPersona]
  const targetPersona = personas[suggestedPersona]
  
  if (!currentPersonaData || !targetPersona) return null

  // Função de sugestão inline (standalone)
  const getTransitionSuggestion = (current: string, suggested: string): string => {
    const suggestions = {
      'dr_gasnelio_to_ga': 'Percebi que minha explicação ficou muito técnica. Que tal conversar com Gá? Ela explica de forma mais simples e acolhedora.',
      'ga_to_dr_gasnelio': 'Que bom que quer saber mais! Para informações técnicas detalhadas, Dr. Gasnelio é o especialista ideal. Posso apresentá-lo?'
    }
    
    const key = `${current}_to_${suggested}`
    return suggestions[key as keyof typeof suggestions] || 'Talvez outro assistente possa ajudar melhor com sua pergunta.'
  }
  
  const suggestionText = getTransitionSuggestion(currentPersona, suggestedPersona)

  const getPersonaEmoji = (personaId: string) => {
    return personaId === 'dr_gasnelio' ? '👨‍⚕️' : '🤝'
  }

  const getTransitionReason = () => {
    if (currentPersona === 'dr_gasnelio' && suggestedPersona === 'ga') {
      return 'Sua mensagem indica que você pode preferir explicações mais simples e acolhedoras.'
    }
    if (currentPersona === 'ga' && suggestedPersona === 'dr_gasnelio') {
      return 'Percebi que você está buscando informações mais técnicas e detalhadas.'
    }
    return 'Outro assistente pode ser mais adequado para sua necessidade atual.'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md mx-4 z-40"
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Sugestão de Assistente
                </span>
              </div>
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Fechar sugestão"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Transition visualization */}
            <div className="flex items-center justify-center space-x-3">
              <div className="text-center">
                <div className="text-2xl mb-1">{getPersonaEmoji(currentPersona)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentPersonaData.name}
                </div>
              </div>
              
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </motion.div>
              
              <div className="text-center">
                <div className="text-2xl mb-1">{getPersonaEmoji(suggestedPersona)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {targetPersona.name}
                </div>
              </div>
            </div>

            {/* Suggestion message */}
            <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
              {suggestionText}
            </div>

            {/* Show details toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-auto transition-colors"
            >
              <QuestionMarkCircleIcon className="w-3 h-3" />
              <span>{showDetails ? 'Ocultar detalhes' : 'Por que esta sugestão?'}</span>
            </button>

            {/* Details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Razão da sugestão:</strong>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {getTransitionReason()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    Baseado na mensagem: "{currentMessage.length > 50 ? currentMessage.substring(0, 50) + '...' : currentMessage}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={onDecline}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Continuar com {currentPersonaData.name}
              </button>
              <button
                onClick={onAccept}
                className="flex-1 px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <span>Mudar para {targetPersona.name}</span>
                <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Esta sugestão é baseada no conteúdo da sua mensagem
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PersonaTransitionSuggestion