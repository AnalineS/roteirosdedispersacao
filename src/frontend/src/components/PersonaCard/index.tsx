import React from 'react'
import { motion } from 'framer-motion'
import type { Persona } from '@types'
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
  return (
    <motion.div
      className={`card-hover p-6 cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : ''
      }`}
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold text-xl mb-4 mx-auto">
        {persona.avatar || persona.name.charAt(0)}
      </div>

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
      <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6 leading-relaxed">
        {persona.description}
      </p>

      {/* Capabilities */}
      {persona.capabilities && persona.capabilities.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            <SparklesIcon className="w-3 h-3 mr-1" />
            Especialidades
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.capabilities.slice(0, 3).map((capability, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
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
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          isSelected
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isSelected ? 'Selecionado' : 'Conversar'}
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