import React from 'react'
import { motion } from 'framer-motion'

const LoadingScreen: React.FC = () => {
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
          Preparando o sistema de apoio à dispensação...
        </motion.p>
      </div>
    </div>
  )
}

export default LoadingScreen