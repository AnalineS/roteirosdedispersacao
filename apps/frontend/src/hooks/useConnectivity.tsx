import { useState, useEffect } from 'react'

// Hook for using connectivity status
export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionHistory, setConnectionHistory] = useState<{
    timestamp: Date
    status: 'online' | 'offline'
  }[]>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionHistory(prev => [...prev.slice(-9), {
        timestamp: new Date(),
        status: 'online'
      }])
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionHistory(prev => [...prev.slice(-9), {
        timestamp: new Date(),
        status: 'offline'
      }])
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    connectionHistory,
    lastChanged: connectionHistory[connectionHistory.length - 1]?.timestamp
  }
}