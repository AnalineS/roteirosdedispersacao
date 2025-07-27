import React from 'react'
import { motion } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import PersonaCard from '@components/PersonaCard'
import type { Persona } from '@/types'

interface PersonaSelectorProps {
  personas: Record<string, Persona> | undefined
  isLoading: boolean
  selectedPersona: string | null
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  personas,
  isLoading,
  selectedPersona
}) => {
  const { setSelectedPersona } = useChat()

  if (isLoading) {
    return (
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="region"
        aria-label="Carregando personas"
        aria-live="polite"
      >
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="card p-6"
            role="status"
            aria-label={`Carregando persona ${i + 1}`}
          >
            <div className="animate-pulse">
              <div 
                className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full mb-4 mx-auto"
                aria-hidden="true"
              ></div>
              <div 
                className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2"
                aria-hidden="true"
              ></div>
              <div 
                className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4"
                aria-hidden="true"
              ></div>
              <div 
                className="h-10 bg-gray-300 dark:bg-gray-700 rounded"
                aria-hidden="true"
              ></div>
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
        role="alert"
        aria-live="assertive"
      >
        <div 
          className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"
          aria-hidden="true"
        >
          <span className="text-gray-400 text-xl">?</span>
        </div>
        <h3 
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
          id="error-title"
        >
          Nenhuma persona disponível
        </h3>
        <p 
          className="text-gray-600 dark:text-gray-400"
          aria-describedby="error-title"
        >
          Não foi possível carregar os assistentes virtuais. Tente novamente mais tarde.
        </p>
      </motion.div>
    )
  }

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="region"
      aria-label="Seleção de assistente virtual"
      aria-describedby="persona-description"
    >
      <div className="sr-only" id="persona-description">
        Escolha um dos assistentes virtuais especializados em hanseníase para iniciar a conversa
      </div>
      {Object.entries(personas).map(([id, persona], index) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
        >
          <PersonaCard
            persona={persona}
            onSelect={() => setSelectedPersona(id)}
            isSelected={selectedPersona === id}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default PersonaSelector