/**
 * Componente de Sugestões Preditivas
 * Exibe sugestões contextuais baseadas na análise preditiva
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  usePredictiveSuggestions, 
  type PredictiveSuggestion,
  type SuggestionContext 
} from '@/hooks/usePredictiveSuggestions';

interface PredictiveSuggestionsProps {
  currentQuery: string;
  persona: string;
  onSuggestionClick: (suggestion: PredictiveSuggestion) => void;
  onSuggestionDismiss?: () => void;
  className?: string;
}

export default function PredictiveSuggestions({
  currentQuery,
  persona,
  onSuggestionClick,
  onSuggestionDismiss,
  className = ''
}: PredictiveSuggestionsProps) {
  const {
    suggestions,
    context,
    loading,
    error,
    getSuggestions,
    trackInteraction,
    clearSuggestions
  } = usePredictiveSuggestions();

  const [showSuggestions, setShowSuggestions] = useState(true);
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null);

  // Obter sugestões quando query muda
  useEffect(() => {
    if (currentQuery && currentQuery.length >= 3) {
      getSuggestions(currentQuery, persona);
    } else {
      clearSuggestions();
    }
  }, [currentQuery, persona, getSuggestions, clearSuggestions]);

  // Handler para clique em sugestão
  const handleSuggestionClick = async (suggestion: PredictiveSuggestion) => {
    await trackInteraction(suggestion.id);
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
  };

  // Handler para feedback de satisfação
  const handleFeedback = async (suggestionId: string, score: number) => {
    await trackInteraction(suggestionId, score);
    setFeedbackMode(null);
  };

  // Handler para dismissar sugestões
  const handleDismiss = () => {
    setShowSuggestions(false);
    clearSuggestions();
    onSuggestionDismiss?.();
  };

  // Não renderizar se não há sugestões ou estão ocultas
  if (!showSuggestions || (!loading && suggestions.length === 0 && !error)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-4 ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-gray-700">
              Sugestões Inteligentes
            </h3>
            {context?.urgencyLevel === 'high' && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                Urgente
              </span>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar sugestões"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Context Info */}
        {context && context.analyzedCategories.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Detectado:</p>
            <div className="flex flex-wrap gap-1">
              {context.analyzedCategories.map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Analisando contexto...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">
              Não foi possível carregar sugestões. Tente novamente.
            </p>
          </div>
        )}

        {/* Suggestions List */}
        {!loading && suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-md transition-colors duration-200 border border-transparent hover:border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">
                        {suggestion.text}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {suggestion.category}
                        </span>
                        {suggestion.persona !== 'mixed' && (
                          <span className="text-xs text-blue-600">
                            {suggestion.persona === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'}
                          </span>
                        )}
                        <div className="flex items-center space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: 
                                suggestion.confidence > 0.8 ? '#22c55e' :
                                suggestion.confidence > 0.6 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                          <span className="text-xs text-gray-400">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Feedback Mode */}
                {feedbackMode === suggestion.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-2 bg-gray-100 rounded-md"
                  >
                    <p className="text-xs text-gray-600 mb-2">
                      Esta sugestão foi útil?
                    </p>
                    <div className="flex space-x-2">
                      {[
                        { score: 1, label: '👍', color: 'green' },
                        { score: 0.5, label: '👌', color: 'yellow' },
                        { score: 0, label: '👎', color: 'red' }
                      ].map(({ score, label, color }) => (
                        <button
                          key={score}
                          onClick={() => handleFeedback(suggestion.id, score)}
                          className={`px-2 py-1 text-xs rounded-md transition-colors bg-${color}-100 hover:bg-${color}-200 text-${color}-700`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Feedback Button */}
        {!loading && suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setFeedbackMode(feedbackMode ? null : suggestions[0]?.id)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {feedbackMode ? 'Cancelar feedback' : 'Dar feedback sobre sugestões'}
            </button>
          </div>
        )}

        {/* Context Indicators */}
        {context && (context.queryPatterns.length > 0 || context.complexityIndicators.length > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                Análise contextual
                <span className="ml-1 transform group-open:rotate-180 transition-transform inline-block">
                  ▼
                </span>
              </summary>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {context.queryPatterns.length > 0 && (
                  <div>
                    <span className="font-medium">Padrões:</span> {context.queryPatterns.join(', ')}
                  </div>
                )}
                {context.complexityIndicators.length > 0 && (
                  <div>
                    <span className="font-medium">Complexidade:</span> {context.complexityIndicators.join(', ')}
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Componente de contexto do usuário (para configurações)
export function UserContextDisplay({ sessionId }: { sessionId: string }) {
  const { userContext, refreshUserContext } = usePredictiveSuggestions();

  useEffect(() => {
    refreshUserContext();
  }, [sessionId, refreshUserContext]);

  if (!userContext) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Seu Perfil de Interação
      </h3>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Persona preferida:</span>
          <span className="font-medium">
            {userContext.personaPreference === 'dr_gasnelio' ? 'Dr. Gasnelio' :
             userContext.personaPreference === 'ga_empathetic' ? 'Gá' : 'Misto'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Complexidade:</span>
          <span className="font-medium">
            {userContext.complexityPreference === 'technical' ? 'Técnico' : 'Simples'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Interações:</span>
          <span className="font-medium">
            {userContext.interactionStats.totalInteractions}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Satisfação:</span>
          <span className="font-medium">
            {Math.round(userContext.interactionStats.satisfactionAverage * 100)}%
          </span>
        </div>
        
        {userContext.medicalInterests.length > 0 && (
          <div>
            <span className="block mb-1">Interesses:</span>
            <div className="flex flex-wrap gap-1">
              {userContext.medicalInterests.slice(0, 3).map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}