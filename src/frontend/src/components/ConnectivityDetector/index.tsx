import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'
// Hook moved to: src/hooks/useConnectivity.tsx

interface ConnectivityDetectorProps {
  onConnectionChange?: (isOnline: boolean) => void
}

const ConnectivityDetector: React.FC<ConnectivityDetectorProps> = ({ 
  onConnectionChange 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      
      // Show reconnection message if was previously offline
      if (wasOffline) {
        setWasOffline(false)
        // Could show a success toast here
      }
      
      onConnectionChange?.(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      setWasOffline(true)
      onConnectionChange?.(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onConnectionChange, wasOffline])

  // Auto-hide the offline message after some time
  useEffect(() => {
    if (!isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 10000) // Hide after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [isOnline, showOfflineMessage])

  return (
    <AnimatePresence>
      {!isOnline && showOfflineMessage && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg shadow-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon 
                  className="w-5 h-5 text-warning-600 dark:text-warning-400" 
                  aria-hidden="true"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-warning-800 dark:text-warning-200">
                  Sem conexão com a internet
                </h3>
                <p className="text-xs text-warning-600 dark:text-warning-300 mt-1">
                  Algumas funcionalidades podem não estar disponíveis. 
                  Verifique sua conexão e tente novamente.
                </p>
              </div>
              
              <button
                onClick={() => setShowOfflineMessage(false)}
                className="flex-shrink-0 p-1 rounded hover:bg-warning-100 dark:hover:bg-warning-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-500"
                aria-label="Fechar aviso"
              >
                <XMarkIcon className="w-4 h-4 text-warning-600 dark:text-warning-400" />
              </button>
            </div>
            
            {/* Connection status indicator */}
            <div className="mt-3 flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <WifiIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Status: {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Retry button */}
              <button
                onClick={() => {
                  // Force a network check
                  window.location.reload()
                }}
                className="text-xs text-warning-700 dark:text-warning-300 hover:text-warning-800 dark:hover:text-warning-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-500 rounded px-1"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConnectivityDetector