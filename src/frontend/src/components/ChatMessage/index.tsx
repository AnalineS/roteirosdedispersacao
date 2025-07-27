import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Message, Persona } from '@types'
import { 
  ClipboardDocumentIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import {
  HandThumbUpIcon as HandThumbUpSolid,
  HandThumbDownIcon as HandThumbDownSolid,
} from '@heroicons/react/24/solid'

interface ChatMessageProps {
  message: Message
  persona?: Persona | null
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, persona }) => {
  const [isCopied, setIsCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(feedback === type ? null : type)
    // TODO: Send feedback to API
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400'
    if (confidence >= 0.8) return 'text-success-500'
    if (confidence >= 0.6) return 'text-warning-500'
    return 'text-error-500'
  }

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return ClockIcon
    if (confidence >= 0.8) return CheckCircleIcon
    if (confidence >= 0.6) return ExclamationTriangleIcon
    return ExclamationTriangleIcon
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar and Name */}
        {isAssistant && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {persona?.avatar || persona?.name.charAt(0) || 'AI'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {persona?.name || 'Assistente'}
            </span>
            {message.confidence && (
              <div className="flex items-center space-x-1">
                {React.createElement(getConfidenceIcon(message.confidence), {
                  className: `w-3 h-3 ${getConfidenceColor(message.confidence)}`
                })}
                <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                  {Math.round(message.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`p-4 rounded-2xl ${
            isUser
              ? 'message-user ml-4'
              : 'message-assistant mr-4'
          }`}
        >
          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {message.content}
          </div>

          {/* Timestamp */}
          <div className={`text-xs mt-2 ${
            isUser 
              ? 'text-white/70' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {format(message.timestamp, 'HH:mm', { locale: ptBR })}
            {message.metadata?.processing_time_ms && (
              <span className="ml-2">
                • {message.metadata.processing_time_ms}ms
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isAssistant && (
          <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Copiar mensagem"
            >
              {isCopied ? (
                <CheckCircleIcon className="w-4 h-4 text-success-500" />
              ) : (
                <ClipboardDocumentIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {/* Feedback Buttons */}
            <button
              onClick={() => handleFeedback('up')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Resposta útil"
            >
              {feedback === 'up' ? (
                <HandThumbUpSolid className="w-4 h-4 text-success-500" />
              ) : (
                <HandThumbUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={() => handleFeedback('down')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Resposta não útil"
            >
              {feedback === 'down' ? (
                <HandThumbDownSolid className="w-4 h-4 text-error-500" />
              ) : (
                <HandThumbDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        )}

        {/* Scope Analysis */}
        {message.metadata?.scope_analysis && !message.metadata.scope_analysis.is_in_scope && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning-800 dark:text-warning-200">
                  Pergunta fora do escopo
                </p>
                <p className="text-warning-700 dark:text-warning-300 mt-1">
                  {message.metadata.scope_analysis.reasoning}
                </p>
                {message.metadata.scope_analysis.redirect_suggestion && (
                  <p className="text-warning-600 dark:text-warning-400 mt-2 text-xs">
                    Sugestão: {message.metadata.scope_analysis.redirect_suggestion}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ChatMessage