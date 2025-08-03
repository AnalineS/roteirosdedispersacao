import React, { useState, useEffect } from 'react'
import { chatApi } from '@services/api'

interface DiagnosticData {
  apiConnection: boolean
  personasLoaded: boolean
  apiStatus: any
  errorDetails: string | null
}

const DiagnosticPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData>({
    apiConnection: false,
    personasLoaded: false,
    apiStatus: null,
    errorDetails: null
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    try {
      // Test API connection
      console.log('🔍 Testando conexão com API...')
      const connectionTest = await chatApi.testConnection()
      
      // Test personas
      console.log('🔍 Testando carregamento de personas...')
      const personasData = await chatApi.getPersonas()
      
      // Get API status
      const apiStatus = chatApi.getStatus()
      
      setDiagnostics({
        apiConnection: connectionTest.success,
        personasLoaded: !!personasData,
        apiStatus,
        errorDetails: connectionTest.error || null
      })
      
      console.log('✅ Diagnósticos concluídos:', {
        apiConnection: connectionTest.success,
        personasLoaded: !!personasData,
        apiStatus
      })
      
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error)
      setDiagnostics({
        apiConnection: false,
        personasLoaded: false,
        apiStatus: null,
        errorDetails: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  // Show diagnostic button in development or when there are issues
  if (!import.meta.env.DEV && diagnostics.apiConnection && diagnostics.personasLoaded) {
    return null
  }

  return (
    <>
      {/* Diagnostic Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-40 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Diagnósticos do Sistema"
      >
        🔧
      </button>

      {/* Diagnostic Panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Diagnósticos do Sistema
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Conexão API:</span>
              <span className={diagnostics.apiConnection ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.apiConnection ? '✅ OK' : '❌ Falhou'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Personas:</span>
              <span className={diagnostics.personasLoaded ? 'text-green-600' : 'text-red-600'}>
                {diagnostics.personasLoaded ? '✅ Carregadas' : '❌ Erro'}
              </span>
            </div>
            
            {diagnostics.apiStatus && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                <strong>URL da API:</strong> {diagnostics.apiStatus.baseUrl}
                <br />
                <strong>Ambiente:</strong> {diagnostics.apiStatus.environment}
                <br />
                <strong>Total de Logs:</strong> {diagnostics.apiStatus.totalLogs}
              </div>
            )}
            
            {diagnostics.errorDetails && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                <strong>Erro:</strong> {diagnostics.errorDetails}
              </div>
            )}
            
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={runDiagnostics}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
              >
                Executar Novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DiagnosticPanel