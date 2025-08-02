import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InformationCircleIcon, BookOpenIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'
import { useChat } from '@hooks/useChat'

interface TooltipContent {
  term: string
  technical: {
    definition: string
    details?: string
    references?: string[]
  }
  simple: {
    definition: string
    analogy?: string
    example?: string
  }
  pronunciation?: string
  relatedTerms?: string[]
}

interface MedicalTooltipProps {
  term: string
  content: TooltipContent
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const MedicalTooltip: React.FC<MedicalTooltipProps> = ({
  term,
  content,
  children,
  position = 'top',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const { selectedPersona } = useChat()

  // Check if term has been viewed before
  useEffect(() => {
    const viewedTerms = localStorage.getItem('viewed-medical-terms')
    if (viewedTerms) {
      const terms = JSON.parse(viewedTerms)
      setHasBeenViewed(terms.includes(term))
    }
  }, [term])

  // Mark term as viewed
  const markAsViewed = () => {
    if (!hasBeenViewed) {
      const viewedTerms = localStorage.getItem('viewed-medical-terms')
      const terms = viewedTerms ? JSON.parse(viewedTerms) : []
      terms.push(term)
      localStorage.setItem('viewed-medical-terms', JSON.stringify(terms))
      setHasBeenViewed(true)
    }
  }

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      markAsViewed()
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (!showFullContent) {
      setIsVisible(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowFullContent(!showFullContent)
    setIsVisible(true)
    markAsViewed()
  }

  const playPronunciation = () => {
    if (content.pronunciation && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content.pronunciation)
      utterance.lang = 'pt-BR'
      window.speechSynthesis.speak(utterance)
    }
  }

  // Determine which content to show based on persona
  const isTechnicalPersona = selectedPersona === 'dr_gasnelio'
  const displayContent = isTechnicalPersona ? content.technical : content.simple

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  return (
    <span className="relative inline-block" ref={triggerRef}>
      {/* Trigger */}
      <span
        className={`cursor-help border-b-2 border-dotted transition-colors duration-200 ${
          hasBeenViewed
            ? 'border-gray-400 hover:border-primary-500'
            : 'border-primary-500 hover:border-primary-600'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Definição de ${term}`}
        aria-expanded={isVisible}
      >
        {children}
        {!hasBeenViewed && (
          <InformationCircleIcon className="inline-block w-3 h-3 ml-1 text-primary-500" />
        )}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${getPositionClasses()}`}
            style={{ minWidth: showFullContent ? '320px' : '280px' }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
              {/* Quick View */}
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      {term}
                      {content.pronunciation && (
                        <button
                          onClick={playPronunciation}
                          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Ouvir pronúncia"
                        >
                          <SpeakerWaveIcon className="w-4 h-4" />
                        </button>
                      )}
                    </h4>
                    {content.pronunciation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        [{content.pronunciation}]
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                    aria-label="Fechar tooltip"
                  >
                    ✕
                  </button>
                </div>

                {/* Definition */}
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {displayContent.definition}
                </p>

                {/* Simple content extras */}
                {!isTechnicalPersona && content.simple.analogy && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 mb-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <span className="font-medium">É como:</span> {content.simple.analogy}
                    </p>
                  </div>
                )}

                {/* Toggle for more info */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFullContent(!showFullContent)
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center"
                >
                  <BookOpenIcon className="w-3 h-3 mr-1" />
                  {showFullContent ? 'Ver menos' : 'Ver mais'}
                </button>
              </div>

              {/* Extended Content */}
              <AnimatePresence>
                {showFullContent && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                      {/* Technical details or example */}
                      {isTechnicalPersona && content.technical.details && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Detalhes técnicos:
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {content.technical.details}
                          </p>
                        </div>
                      )}

                      {!isTechnicalPersona && content.simple.example && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Exemplo:
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {content.simple.example}
                          </p>
                        </div>
                      )}

                      {/* Related terms */}
                      {content.relatedTerms && content.relatedTerms.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Termos relacionados:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {content.relatedTerms.map((relatedTerm, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                              >
                                {relatedTerm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* References (technical only) */}
                      {isTechnicalPersona && content.technical.references && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Referências:
                          </h5>
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                            {content.technical.references.map((ref, index) => (
                              <li key={index} className="truncate">• {ref}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Persona switch suggestion */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {isTechnicalPersona 
                            ? '💡 Mude para Gá para uma explicação mais simples'
                            : '💡 Mude para Dr. Gasnelio para detalhes técnicos'
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// Wrapper component to automatically add tooltips to medical terms
export const MedicalText: React.FC<{ 
  text: string, 
  tooltips: Record<string, TooltipContent> 
}> = ({ text, tooltips }) => {
  // Create regex pattern from all tooltip terms
  const termsPattern = Object.keys(tooltips).join('|')
  const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi')

  // Split text and wrap matching terms with tooltips
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => {
        const lowerPart = part.toLowerCase()
        if (tooltips[lowerPart]) {
          return (
            <MedicalTooltip
              key={index}
              term={part}
              content={tooltips[lowerPart]}
            >
              {part}
            </MedicalTooltip>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

export default MedicalTooltip