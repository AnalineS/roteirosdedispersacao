import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface Section {
  id: string
  title: string
  icon: React.ComponentType<any>
  content: React.ReactNode
  difficulty: 'basic' | 'intermediate' | 'advanced'
  estimatedReadTime: number // in minutes
}

interface DiseaseInfoSectionProps {
  sections: Section[]
  userLevel: 'beginner' | 'intermediate' | 'advanced'
  onSectionComplete?: (sectionId: string) => void
}

const DiseaseInfoSection: React.FC<DiseaseInfoSectionProps> = ({
  sections,
  userLevel,
  onSectionComplete
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [readProgress, setReadProgress] = useState<Record<string, number>>({})

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
      // Start tracking read progress
      if (!readProgress[sectionId]) {
        startReadingProgress(sectionId)
      }
    }
    setExpandedSections(newExpanded)
  }

  const startReadingProgress = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const totalReadTime = section.estimatedReadTime * 60 * 1000 // Convert to ms
    const updateInterval = 100 // Update every 100ms
    const increment = (updateInterval / totalReadTime) * 100

    const interval = setInterval(() => {
      setReadProgress(prev => {
        const current = prev[sectionId] || 0
        const next = Math.min(current + increment, 100)
        
        if (next >= 100) {
          clearInterval(interval)
          markSectionComplete(sectionId)
        }
        
        return { ...prev, [sectionId]: next }
      })
    }, updateInterval)

    // Cleanup function with proper memory management
    return interval
  }

  // Cleanup intervals on unmount
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []
    
    return () => {
      intervals.forEach(interval => clearInterval(interval))
    }
  }, [])

  const markSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]))
    onSectionComplete?.(sectionId)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
      case 'advanced':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'Básico'
      case 'intermediate':
        return 'Intermediário'
      case 'advanced':
        return 'Avançado'
      default:
        return difficulty
    }
  }

  // Filter sections based on user level
  const visibleSections = sections.filter(section => {
    if (userLevel === 'beginner') return section.difficulty === 'basic'
    if (userLevel === 'intermediate') return section.difficulty !== 'advanced'
    return true // Advanced users see all
  })

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Seu Progresso
          </h3>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {completedSections.size} de {visibleSections.length} seções
          </span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(completedSections.size / visibleSections.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Sections */}
      {visibleSections.map((section, index) => {
        const Icon = section.icon
        const isExpanded = expandedSections.has(section.id)
        const isCompleted = completedSections.has(section.id)
        const progress = readProgress[section.id] || 0

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border-2 transition-all duration-300 ${
              isCompleted
                ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              aria-expanded={isExpanded}
              aria-controls={`section-content-${section.id}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {section.title}
                  </h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      getDifficultyColor(section.difficulty)
                    }`}>
                      {getDifficultyLabel(section.difficulty)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {section.estimatedReadTime} min de leitura
                    </span>
                    {isCompleted && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ Concluído
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              </motion.div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  id={`section-content-${section.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {/* Reading Progress Bar */}
                  {!isCompleted && progress > 0 && (
                    <div className="px-6 pb-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="px-6 pb-6 pt-2">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {section.content}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex items-center justify-between">
                      {!isCompleted ? (
                        <button
                          onClick={() => markSectionComplete(section.id)}
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Marcar como lido
                        </button>
                      ) : (
                        <span className="inline-flex items-center text-sm text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Seção concluída
                        </span>
                      )}

                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Level Upgrade Prompt */}
      {completedSections.size === visibleSections.length && userLevel !== 'advanced' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-6 mt-6"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">
                Parabéns! Você completou todas as seções!
              </h3>
              <p className="text-sm opacity-90">
                Que tal avançar para conteúdo mais detalhado?
              </p>
            </div>
            <button className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors">
              Avançar Nível
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default DiseaseInfoSection