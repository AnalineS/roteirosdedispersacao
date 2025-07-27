import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { scopeApi } from '@services/api'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface ScopePreviewProps {
  onClose: () => void
}

const ScopePreview: React.FC<ScopePreviewProps> = ({ onClose }) => {
  const { data: scopeData, isLoading } = useQuery(
    'scope-info',
    scopeApi.getInfo,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                Escopo do Sistema
              </h3>
              
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-primary-200 dark:bg-primary-800 rounded animate-pulse"></div>
                  <div className="h-4 bg-primary-200 dark:bg-primary-800 rounded animate-pulse w-3/4"></div>
                </div>
              ) : scopeData ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-primary-800 dark:text-primary-200 mb-2">
                      <strong>Foco principal:</strong> {scopeData.knowledge_scope.primary_focus}
                    </p>
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      <strong>Fonte:</strong> {scopeData.knowledge_scope.source}
                    </p>
                  </div>

                  {/* Covered Topics */}
                  <div>
                    <p className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">
                      Tópicos cobertos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(scopeData.knowledge_scope.covered_topics).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200 rounded-full text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Not Covered */}
                  {scopeData.knowledge_scope.explicitly_not_covered.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">
                        Não coberto:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {scopeData.knowledge_scope.explicitly_not_covered.map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Levels */}
                  <div>
                    <p className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">
                      Níveis de confiança:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(scopeData.confidence_levels).map(([level, description]) => (
                        <div
                          key={level}
                          className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded px-2 py-1"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            level === 'high' ? 'bg-success-500' :
                            level === 'medium' ? 'bg-warning-500' : 'bg-error-500'
                          }`}></div>
                          <span className="capitalize font-medium">{level}:</span>
                          <span className="text-gray-600 dark:text-gray-400">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Erro ao carregar informações do escopo.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default ScopePreview