import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Error Icon */}
          <motion.div
            className="w-24 h-24 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mx-auto mb-8"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ExclamationTriangleIcon className="w-12 h-12 text-error-500" />
          </motion.div>

          {/* Error Code */}
          <motion.h1
            className="text-6xl md:text-8xl font-bold text-gradient mb-4"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            404
          </motion.h1>

          {/* Error Message */}
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Página não encontrada
          </motion.h2>

          <motion.p
            className="text-gray-600 dark:text-gray-400 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            A página que você está procurando não existe ou foi movida. 
            Que tal voltar ao início ou iniciar uma conversa com nossos assistentes virtuais?
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Ir para o Início
            </Link>

            <Link
              to="/chat"
              className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Iniciar Chat
            </Link>
          </motion.div>

          {/* Additional Help */}
          <motion.div
            className="mt-12 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Precisa de ajuda?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Se você chegou aqui através de um link, ele pode estar quebrado. 
              Experimente as opções abaixo:
            </p>
            
            <div className="space-y-2 text-sm">
              <Link 
                to="/about" 
                className="block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
              >
                • Saiba mais sobre o projeto
              </Link>
              <Link 
                to="/resources" 
                className="block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
              >
                • Acesse recursos educacionais
              </Link>
              <Link 
                to="/chat" 
                className="block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
              >
                • Converse com nossos assistentes
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFoundPage