import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const LoadingScreen: React.FC = () => {
  const [loadingTime, setLoadingTime] = useState(0)
  const navigate = useNavigate()
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1)
    }, 1000)
    
    // Timeout de segurança - 5 segundos
    const timeout = setTimeout(() => {
      console.warn('⚠️ Loading timeout - navegando para chat')
      navigate('/chat')
    }, 5000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [navigate])
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        {/* Logo animado */}
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl mx-auto mb-6 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="text-white font-bold text-xl">PQT</span>
        </motion.div>

        {/* Título */}
        <motion.h2
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Carregando...
        </motion.h2>

        {/* Barra de progresso */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Texto de status */}
        <motion.p
          className="text-gray-600 dark:text-gray-400 mt-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {loadingTime < 2 && 'Preparando o sistema de apoio à dispensação...'}
          {loadingTime >= 2 && loadingTime < 4 && 'Conectando com os assistentes...'}
          {loadingTime >= 4 && 'Finalizando configurações...'}
        </motion.p>
        
        {/* Aviso de timeout */}
        {loadingTime >= 3 && (
          <motion.div
            className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-sm mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Conexão lenta detectada. Redirecionando...
            </p>
          </motion.div>
        )}
        
        {/* Botão de emergência */}
        {loadingTime >= 2 && (
          <motion.button
            onClick={() => navigate('/chat')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Continuar sem esperar
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default LoadingScreen