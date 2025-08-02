import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import { 
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onToggle }) => {
  const { state, personas, clearChat, setSelectedPersona } = useChat()

  const selectedPersona = state.selectedPersona && personas 
    ? personas[state.selectedPersona] 
    : null

  const handleExportChat = () => {
    // TODO: Implement chat export
    console.log('Export chat')
  }

  const handleClearChat = () => {
    if (confirm('Tem certeza que deseja limpar o histórico da conversa?')) {
      clearChat()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`chat-sidebar ${isOpen ? 'open' : ''}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Chat
            </h2>
            <button
              onClick={onToggle}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 lg:hidden"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Persona */}
        {selectedPersona && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {selectedPersona.avatar || selectedPersona.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedPersona.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {selectedPersona.role || 'Assistente Virtual'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              setSelectedPersona('')
              onToggle()
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span>Nova Conversa</span>
          </button>

          {state.messages.length > 0 && (
            <>
              <button
                onClick={handleExportChat}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Exportar Conversa</span>
              </button>

              <button
                onClick={handleClearChat}
                className="w-full flex items-center space-x-3 px-3 py-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Limpar Histórico</span>
              </button>
            </>
          )}
        </div>

        {/* Chat Statistics */}
        {state.messages.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Estatísticas da Conversa
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mensagens:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {state.messages.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Suas perguntas:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {state.messages.filter(m => m.role === 'user').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Respostas:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {state.messages.filter(m => m.role === 'assistant').length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Persona Capabilities */}
        {selectedPersona?.capabilities && selectedPersona.capabilities.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Especialidades
            </h3>
            <div className="space-y-1">
              {selectedPersona.capabilities.map((capability: string, index: number) => (
                <div
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {capability}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
            <span>Configurações</span>
          </button>
        </div>
      </motion.div>
    </>
  )
}

export default ChatSidebar