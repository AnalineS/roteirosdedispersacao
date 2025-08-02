import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import PersonaSelector from '@components/PersonaSelector'
import ChatMessage from '@components/ChatMessage'
import ChatInput from '@components/ChatInput'
import ScopePreview from '@components/ScopePreview'
import ChatSidebar from '@components/ChatSidebar'
import { 
  Bars3Icon, 
  XMarkIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const ChatPage: React.FC = () => {
  const { state, personas, isPersonasLoading } = useChat()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showScopePreview, setShowScopePreview] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  const selectedPersona = state.selectedPersona && personas 
    ? personas[state.selectedPersona] 
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
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
            <ScopePreview onClose={() => setShowScopePreview(false)} />
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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

                <PersonaSelector
                  personas={personas}
                  isLoading={isPersonasLoading}
                  selectedPersona={state.selectedPersona}
                />
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm p-3 sm:p-4 max-w-xs sm:max-w-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {selectedPersona.name} está digitando...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {state.error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center px-4"
                    >
                      <div className="bg-error-100 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 sm:p-4 max-w-md w-full flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-error-800 dark:text-error-200 font-medium text-sm">
                            Erro na comunicação
                          </p>
                          <p className="text-error-600 dark:text-error-300 text-xs sm:text-sm mt-1 break-words">
                            {state.error}
                          </p>
                        </div>
                      </div>
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