import React, { useState, useEffect } from 'react'
import { chatApi } from '@/services/api'

interface DebugInfo {
  timestamp: string
  environment: string
  apiUrl: string
  frontendUrl: string
  networkStatus: 'online' | 'offline'
  lastApiCall?: {
    url: string
    status: number
    error?: string
    timestamp: string
  }
}

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    timestamp: new Date().toISOString(),
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    apiUrl: import.meta.env.VITE_API_URL || 'https://roteiros-de-dispensacao.web.app',
    frontendUrl: window.location.origin,
    networkStatus: navigator.onLine ? 'online' : 'offline'
  })

  const testApiConnection = async () => {
    try {
      console.log('🔍 Testando conexão com API...')
      const response = await fetch(`${debugInfo.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      setDebugInfo(prev => ({
        ...prev,
        lastApiCall: {
          url: `${debugInfo.apiUrl}/api/health`,
          status: response.status,
          timestamp: new Date().toISOString()
        }
      }))
      
      console.log('✅ Resposta da API:', response.status)
    } catch (error) {
      console.error('❌ Erro na conexão:', error)
      setDebugInfo(prev => ({
        ...prev,
        lastApiCall: {
          url: `${debugInfo.apiUrl}/api/health`,
          status: 0,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  const testChatEndpoint = async () => {
    try {
      console.log('🔍 Testando endpoint de chat...')
      const response = await chatApi.sendMessage('Teste de conexão', 'dr_gasnelio')
      console.log('✅ Chat funcionando:', response)
    } catch (error) {
      console.error('❌ Erro no chat:', error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
        >
          Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🔍 Debug Panel</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Informações do Sistema */}
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">📊 Informações do Sistema</h3>
            <div className="text-sm space-y-1">
              <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
              <div><strong>Environment:</strong> {debugInfo.environment}</div>
              <div><strong>API URL:</strong> {debugInfo.apiUrl}</div>
              <div><strong>Frontend URL:</strong> {debugInfo.frontendUrl}</div>
              <div><strong>Network:</strong> 
                <span className={`ml-1 ${debugInfo.networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {debugInfo.networkStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Variáveis de Ambiente */}
          <div className="bg-blue-100 p-4 rounded">
            <h3 className="font-semibold mb-2">🔧 Variáveis de Ambiente</h3>
            <div className="text-sm space-y-1">
              <div><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'Não definida'}</div>
              <div><strong>VITE_ENVIRONMENT:</strong> {import.meta.env.VITE_ENVIRONMENT || 'Não definida'}</div>
              <div><strong>MODE:</strong> {import.meta.env.MODE}</div>
              <div><strong>DEV:</strong> {import.meta.env.DEV ? 'true' : 'false'}</div>
              <div><strong>PROD:</strong> {import.meta.env.PROD ? 'true' : 'false'}</div>
            </div>
          </div>

          {/* Última Chamada da API */}
          {debugInfo.lastApiCall && (
            <div className="bg-yellow-100 p-4 rounded">
              <h3 className="font-semibold mb-2">📡 Última Chamada da API</h3>
              <div className="text-sm space-y-1">
                <div><strong>URL:</strong> {debugInfo.lastApiCall.url}</div>
                <div><strong>Status:</strong> 
                  <span className={`ml-1 ${debugInfo.lastApiCall.status === 200 ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.lastApiCall.status}
                  </span>
                </div>
                <div><strong>Timestamp:</strong> {debugInfo.lastApiCall.timestamp}</div>
                {debugInfo.lastApiCall.error && (
                  <div><strong>Erro:</strong> <span className="text-red-600">{debugInfo.lastApiCall.error}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Testes */}
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-semibold mb-2">🧪 Testes de Conectividade</h3>
            <div className="space-y-2">
              <button
                onClick={testApiConnection}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
              >
                Testar API Health
              </button>
              <button
                onClick={testChatEndpoint}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Testar Chat
              </button>
            </div>
          </div>

          {/* Console Log */}
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">📝 Console</h3>
            <div className="text-xs text-gray-600">
              Pressione Ctrl+Shift+D para abrir/fechar este painel<br/>
              Verifique o Console do navegador para logs detalhados
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}