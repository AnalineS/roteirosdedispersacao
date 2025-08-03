import React from 'react'
import { motion } from 'framer-motion'
import type { Persona } from '@/types'
import { ChatBubbleLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface PersonaCardProps {
  persona: Persona
  onSelect: () => void
  isSelected?: boolean
}

const PersonaCard: React.FC<PersonaCardProps> = ({ 
  persona, 
  onSelect, 
  isSelected = false 
}) => {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <motion.div
      className={`card-medical hover-lift p-6 cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-glow' 
          : 'hover:shadow-primary-500/15'
      }`}
      onClick={onSelect}
      onKeyDown={handleKeyPress}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Selecionar ${persona.name} - ${persona.role || 'Assistente'}`}
      aria-describedby={`persona-desc-${persona.id || persona.name?.toLowerCase() || 'persona'}`}
    >
      {/* Avatar */}
      <motion.div 
        className="flex items-center justify-center w-16 h-16 rounded-full bg-medical-primary text-white font-bold text-xl mb-4 mx-auto shadow-lg"
        aria-hidden="true"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {persona.avatar || persona.name?.charAt(0) || '?'}
      </motion.div>

      {/* Name and Role */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {persona.name}
        </h3>
        {persona.role && (
          <span className="badge-primary">
            {persona.role}
          </span>
        )}
      </div>

      {/* Description */}
      <p 
        className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6 leading-relaxed"
        id={`persona-desc-${persona.id || persona.name?.toLowerCase() || 'persona'}`}
      >
        {persona.description}
      </p>

      {/* Capabilities */}
      {persona.capabilities && persona.capabilities.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            <SparklesIcon className="w-3 h-3 mr-1" aria-hidden="true" />
            Especialidades
          </div>
          <div 
            className="flex flex-wrap gap-1"
            role="list"
            aria-label="Especialidades do assistente"
          >
            {persona.capabilities.slice(0, 3).map((capability: string, index: number) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                role="listitem"
              >
                {capability}
              </span>
            ))}
            {persona.capabilities.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{persona.capabilities.length - 3} mais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Example Questions */}
      {persona.example_questions && persona.example_questions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            <ChatBubbleLeftIcon className="w-3 h-3 mr-1" />
            Perguntas exemplo
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 italic">
            "{persona.example_questions[0]}"
          </div>
        </div>
      )}

      {/* Action Button */}
      <motion.button
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 focus-ring-offset ${
          isSelected
            ? 'btn-primary text-white shadow-lg'
            : 'btn-secondary hover:btn-glass'
        }`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`${isSelected ? 'Já selecionado' : 'Iniciar conversa com'} ${persona.name}`}
        aria-pressed={isSelected}
      >
        {isSelected ? '✓ Selecionado' : 'Conversar'}
      </motion.button>

      {/* Greeting Preview */}
      {persona.greeting && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Saudação:
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300 italic truncate-2">
            {persona.greeting}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default PersonaCard