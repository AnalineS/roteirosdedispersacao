import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import { ValidationMessage } from '@components/FormValidation'
import { 
  PaperAirplaneIcon,
  MicrophoneIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'

const ChatInput: React.FC = () => {
  const { state, sendMessage } = useChat()
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Simple validation state
  const [messageValidation, setMessageValidation] = useState({
    errors: [] as string[],
    warnings: [] as string[],
    infos: [] as string[]
  })

  // Simple validation function
  const validateMessage = (value: string) => {
    const errors: string[] = []
    const warnings: string[] = []
    const infos: string[] = []

    if (!value.trim()) {
      errors.push('Digite uma mensagem')
    } else if (value.length < 3) {
      errors.push('Mensagem muito curta (mínimo 3 caracteres)')
    } else if (value.length > 1000) {
      errors.push('Mensagem muito longa (máximo 1000 caracteres)')
    }

    const medicalKeywords = ['dosagem', 'medicamento', 'tratamento', 'sintoma', 'diagnóstico', 'paciente', 'farmácia', 'dispensação']
    const hasKeywords = medicalKeywords.some(keyword => value.toLowerCase().includes(keyword))
    if (!hasKeywords && value.length >= 10) {
      warnings.push('Texto deve estar relacionado ao contexto médico')
    }

    const hanseniasiKeywords = ['hansen', 'pqt', 'rifampicina', 'clofazimina', 'dapsona', 'dispensação']
    const hasHanseniasiKeywords = hanseniasiKeywords.some(keyword => value.toLowerCase().includes(keyword))
    if (!hasHanseniasiKeywords) {
      infos.push('Para consultas sobre hanseníase, use termos específicos como "PQT", "rifampicina", "dispensação"')
    }

    return { errors, warnings, infos }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Focus on textarea when persona is selected
  useEffect(() => {
    if (state.selectedPersona && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [state.selectedPersona])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Form submit triggered:', { 
      message: message.trim(), 
      persona: state.selectedPersona,
      isLoading: state.isLoading 
    })
    
    // Validate message before sending
    const validation = validateMessage(message)
    setMessageValidation(validation)
    if (validation.errors.length > 0 || !message.trim() || state.isLoading || !state.selectedPersona) {
      console.log('❌ Validation failed:', { validation, hasMessage: !!message.trim(), isLoading: state.isLoading, hasPersona: !!state.selectedPersona })
      return
    }

    console.log('✅ Sending message:', message.trim())
    sendMessage(message.trim())
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleVoiceInput = () => {
    // TODO: Implement voice recognition
    setIsRecording(!isRecording)
  }

  const handleFileUpload = (type: 'image' | 'document') => {
    // TODO: Implement file upload
    console.log(`Upload ${type}`)
  }

  const isDisabled = state.isLoading || !state.selectedPersona

  return (
    <div className="space-y-3">
      {/* Suggestions */}
      {state.messages.length === 0 && state.selectedPersona && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-3"
          role="region"
          aria-label="Sugestões de perguntas"
        >
          {[
            "Qual a dosagem de rifampicina?",
            "Como dispensar PQT-U?",
            "Efeitos colaterais da clofazimina"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setMessage(suggestion)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={`Usar sugestão: ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input Form */}
      <form 
        onSubmit={handleSubmit} 
        className="relative"
        role="search"
        aria-label="Enviar mensagem para o assistente"
      >
        <div className="glass rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-primary-500 dark:focus-within:border-primary-400 transition-colors">
          <div className="flex items-end space-x-3 p-4">
            {/* Attachment Buttons */}
            <div 
              className="flex items-center space-x-1"
              role="group"
              aria-label="Anexos"
            >
              <button
                type="button"
                onClick={() => handleFileUpload('image')}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Anexar imagem"
                aria-label="Anexar imagem (funcionalidade em desenvolvimento)"
                disabled={isDisabled}
              >
                <PhotoIcon className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => handleFileUpload('document')}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Anexar documento"
                aria-label="Anexar documento (funcionalidade em desenvolvimento)"
                disabled={isDisabled}
              >
                <DocumentIcon className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                  isRecording 
                    ? 'text-error-500 bg-error-50 dark:bg-error-900/20' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
                title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                aria-label={isRecording ? 'Parar gravação de áudio' : 'Gravar áudio (funcionalidade em desenvolvimento)'}
                aria-pressed={isRecording}
                disabled={isDisabled}
              >
                <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} aria-hidden="true" />
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  setMessageValidation(validateMessage(e.target.value))
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  !state.selectedPersona 
                    ? "Selecione um assistente primeiro..." 
                    : "Digite sua pergunta sobre dispensação de medicamentos..."
                }
                className="w-full bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
                maxLength={1000}
                disabled={isDisabled}
                aria-label="Campo de mensagem"
                aria-describedby="message-help message-validation"
                aria-required="true"
                aria-invalid={messageValidation.errors.length > 0}
              />
              <div className="sr-only" id="message-help">
                Digite sua pergunta sobre hanseníase e dispensação de medicamentos. Pressione Enter para enviar ou Shift+Enter para nova linha.
              </div>
            </div>

            {/* Send Button */}
            <motion.button
              type="submit"
              disabled={isDisabled || !message.trim() || (messageValidation.errors.length > 0)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                message.trim() && !isDisabled && messageValidation.errors.length === 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              whileHover={message.trim() && !isDisabled && messageValidation.errors.length === 0 ? { scale: 1.05 } : {}}
              whileTap={message.trim() && !isDisabled && messageValidation.errors.length === 0 ? { scale: 0.95 } : {}}
              aria-label={
                message.trim() && !isDisabled && messageValidation.errors.length === 0 
                  ? 'Enviar mensagem' 
                  : 'Corrija os erros na mensagem para enviar'
              }
            >
              <PaperAirplaneIcon className="w-5 h-5" aria-hidden="true" />
            </motion.button>
          </div>

          {/* Character Count */}
          {message.length > 800 && (
            <div className="px-4 pb-2">
              <div 
                className={`text-xs text-right ${
                  message.length > 950 ? 'text-error-500' : 'text-warning-500'
                }`}
                role="status"
                aria-live="polite"
                aria-label={`${message.length} de 1000 caracteres`}
              >
                {message.length}/1000
              </div>
            </div>
          )}

          {/* Validation Messages */}
          <AnimatePresence>
            {(messageValidation.errors.length > 0 || messageValidation.warnings.length > 0 || messageValidation.infos.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-3 space-y-1"
                id="message-validation"
              >
                {messageValidation.errors.map((error: string, index: number) => (
                  <ValidationMessage
                    key={`error-${index}`}
                    type="error"
                    message={error}
                    className="text-xs"
                  />
                ))}
                {messageValidation.warnings.map((warning: string, index: number) => (
                  <ValidationMessage
                    key={`warning-${index}`}
                    type="warning"
                    message={warning}
                    className="text-xs"
                  />
                ))}
                {messageValidation.infos.map((info: string, index: number) => (
                  <ValidationMessage
                    key={`info-${index}`}
                    type="info"
                    message={info}
                    className="text-xs"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Messages */}
        {state.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center mt-2 text-sm text-gray-500 dark:text-gray-400"
            role="status"
            aria-live="polite"
            aria-label="Enviando mensagem"
          >
            <div className="flex space-x-1 mr-2" aria-hidden="true">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
            </div>
            Enviando mensagem...
          </motion.div>
        )}

        {!state.selectedPersona && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400"
            role="status"
            aria-live="polite"
          >
            Selecione um assistente virtual para começar a conversar
          </motion.div>
        )}
      </form>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-gray-500 dark:text-gray-400 text-center"
      >
        Este sistema fornece informações baseadas em pesquisa científica. 
        Sempre consulte um profissional de saúde qualificado para orientações médicas.
      </motion.div>
    </div>
  )
}

export default ChatInput