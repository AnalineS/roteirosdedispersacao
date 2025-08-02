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
    <div className="chat-page-container">
      {/* Sidebar */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Chat Area */}
      <div className="chat-main-content">
        {/* Header */}
        <header className="chat-header">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedPersona.avatar || selectedPersona.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedPersona.name}
                    </h1>
                    <div className="flex items-center text-sm text-success-500">
                      <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                      Online
                    </div>
                  </div>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Assistente Virtual PQT-U
                </h1>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowScopePreview(!showScopePreview)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Visualizar escopo"
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
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-4xl w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Escolha seu Assistente Virtual
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
                className="flex-1 overflow-y-auto p-4 space-y-4"
                role="log"
                aria-live="polite"
                aria-label="Histórico de mensagens"
              >
                {/* Welcome Message */}
                {state.messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">
                        {selectedPersona.avatar || selectedPersona.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {selectedPersona.greeting || `Olá! Sou ${selectedPersona.name}`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {selectedPersona.description}
                    </p>
                    
                    {/* Example Questions */}
                    {selectedPersona.example_questions && selectedPersona.example_questions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Exemplos de perguntas:
                        </p>
                        {selectedPersona.example_questions.slice(0, 3).map((question: any, index: number) => (
                          <button
                            key={index}
                            className="block w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                            onClick={() => {
                              // TODO: Implement send example question
                            }}
                          >
                            "{question}"
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Messages */}
                <div className="max-w-4xl mx-auto space-y-4">
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
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm p-4 max-w-xs">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
                      className="flex justify-center"
                    >
                      <div className="bg-error-100 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 max-w-md flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-error-800 dark:text-error-200 font-medium text-sm">
                            Erro na comunicação
                          </p>
                          <p className="text-error-600 dark:text-error-300 text-sm mt-1">
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
              <div className="border-t bg-white dark:bg-gray-900 p-4">
                <div className="max-w-4xl mx-auto">
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