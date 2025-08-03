import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const SmartLoadingScreen: React.FC = () => {
  const [loadingTime, setLoadingTime] = useState(0)
  const navigate = useNavigate()
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTime(prev => prev + 1)
    }, 1000)
    
    // Timeout de segurança - 5 segundos
    const timeout = setTimeout(() => {
      console.warn('⚠️ Loading timeout - forçando navegação')
      navigate('/chat')
    }, 5000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [navigate])
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-lg w-full mx-4 p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          {/* Animação de Loading */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 border-8 border-green-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-t-8 border-green-600 rounded-full animate-spin"></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <span className="text-4xl">🏥</span>
            </div>
          </div>
          
          {/* Mensagem de Loading */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Carregando Assistentes Educacionais...
          </h2>
          
          {/* Mensagens dinâmicas baseadas no tempo */}
          <p className="text-gray-600 mb-4">
            {loadingTime < 2 && 'Preparando o ambiente...'}
            {loadingTime >= 2 && loadingTime < 4 && 'Conectando com os especialistas...'}
            {loadingTime >= 4 && 'Finalizando configurações...'}
          </p>
          
          {/* Aviso de timeout */}
          {loadingTime >= 3 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Conexão lenta detectada. Entrando em modo offline...
              </p>
            </div>
          )}
          
          {/* Botão de emergência */}
          {loadingTime >= 2 && (
            <button
              onClick={() => navigate('/chat')}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continuar sem esperar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}