import React, { useState, useRef, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import { AnimationOptimizer } from '@utils/performanceOptimizer'
import { SkeletonMessage } from '@components/SkeletonLoader'
import ChatMessage from '@components/ChatMessage'
import ChatInput from '@components/ChatInput'
import ChatSidebar from '@components/ChatSidebar'
import { ErrorState } from '@components/FeedbackStates'
import { ChatPageSEO } from '@components/SEOHead'
import { 
  Bars3Icon, 
  XMarkIcon, 
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Lazy load components
const PersonaSelector = React.lazy(() => import('@components/PersonaSelector'))
const ScopePreview = React.lazy(() => import('@components/ScopePreview'))

const ChatPage: React.FC = () => {
  const { state, personas, isPersonasLoading } = useChat()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showScopePreview, setShowScopePreview] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get optimized animations
  const animationVariants = AnimationOptimizer.createOptimizedVariants()

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  const selectedPersona = state.selectedPersona && personas 
    ? personas[state.selectedPersona] 
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ChatPageSEO />
      {/* Sidebar */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Responsivo */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target flex-shrink-0"
                aria-label={isSidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
                aria-expanded={isSidebarOpen}
              >
                {isSidebarOpen ? (
                  <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              {/* Selected Persona Info */}
              {selectedPersona ? (
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs sm:text-sm">
                      {selectedPersona.avatar || selectedPersona.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                      {selectedPersona.name}
                    </h1>
                    <div className="flex items-center text-xs sm:text-sm text-success-500">
                      <div className="w-2 h-2 bg-success-500 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="truncate">Online</span>
                    </div>
                  </div>
                </div>
              ) : (
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  Assistente Virtual PQT-U
                </h1>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                onClick={() => setShowScopePreview(!showScopePreview)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
                title="Visualizar escopo"
                aria-label="Visualizar escopo do sistema"
              >
                <InformationCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Scope Preview */}
        <AnimatePresence>
          {showScopePreview && (
            <Suspense fallback={
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            }>
              <ScopePreview onClose={() => setShowScopePreview(false)} />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          id="chat-section"
          role="region"
          aria-label="Área de conversa"
        >
          {!selectedPersona ? (
            /* Persona Selection */
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
              <div className="max-w-4xl w-full">
                <motion.div
                  variants={animationVariants.slideUp}
                  initial="initial"
                  animate="animate"
                  className="text-center mb-6 sm:mb-8"
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                    Escolha seu Assistente Virtual
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Selecione o especialista virtual mais adequado para suas questões 
                    sobre dispensação de medicamentos para hanseníase.
                  </p>
                </motion.div>

                <Suspense fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="card-medical p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto animate-pulse" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse" />
                        </div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                }>
                  <PersonaSelector
                    personas={personas}
                    isLoading={isPersonasLoading}
                    selectedPersona={state.selectedPersona}
                  />
                </Suspense>
              </div>
            </div>
          ) : (
            /* Messages Area */
            <>
              <div 
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
                role="log"
                aria-live="polite"
                aria-label="Histórico de mensagens"
              >
                {/* Welcome Message */}
                {state.messages.length === 0 && (
                  <motion.div
                    variants={animationVariants.fade}
                    initial="initial"
                    animate="animate"
                    className="max-w-2xl mx-auto text-center py-6 sm:py-8"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {selectedPersona.avatar || selectedPersona.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {selectedPersona.greeting || `Olá! Sou ${selectedPersona.name}`}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 leading-relaxed">
                      {selectedPersona.description}
                    </p>
                    
                    {/* Example Questions */}
                    {selectedPersona.example_questions && selectedPersona.example_questions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Exemplos de perguntas:
                        </p>
                        <div className="space-y-2 max-w-md mx-auto">
                          {selectedPersona.example_questions.slice(0, 3).map((question: any, index: number) => (
                            <button
                              key={index}
                              className="block w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm touch-target"
                              onClick={() => {
                                // TODO: Implement send example question
                              }}
                            >
                              "{question}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Messages */}
                <div className="max-w-3xl sm:max-w-4xl mx-auto space-y-3 sm:space-y-4">
                  {state.messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      persona={selectedPersona}
                    />
                  ))}

                  {/* Loading Message */}
                  {state.isLoading && (
                    <motion.div
                      variants={animationVariants.slideUp}
                      initial="initial"
                      animate="animate"
                      className="flex justify-start"
                    >
                      <SkeletonMessage />
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {state.error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center px-4"
                    >
                      <ErrorState
                        title="Erro na comunicação"
                        message={state.error}
                        variant={state.error.includes('conexão') || state.error.includes('internet') ? 'network' : 'error'}
                        action={{
                          label: 'Tentar novamente',
                          onClick: () => {
                            // Could trigger a retry mechanism
                            window.location.reload()
                          }
                        }}
                        className="max-w-md w-full"
                      />
                    </motion.div>
                  )}
                </div>

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="max-w-3xl sm:max-w-4xl mx-auto">
                  <ChatInput />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPage