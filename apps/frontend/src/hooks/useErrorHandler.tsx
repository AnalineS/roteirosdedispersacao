// Hook for functional components to access error boundary context
export const useErrorHandler = () => {
  return {
    reportError: (error: Error, context?: string) => {
      console.error(`Manual Error Report [${context || 'Unknown Context'}]:`, error)
      
      // Could trigger error boundary by throwing
      // throw error
    },
    
    logError: (message: string, details?: unknown) => {
      console.error('Application Error:', message, details)
    }
  }
}