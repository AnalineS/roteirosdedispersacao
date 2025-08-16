'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Verificar conectividade
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
    };

    // Listeners para mudanças de conectividade
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);
    
    // Verificação inicial
    checkOnline();

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  useEffect(() => {
    // Redirecionar automaticamente quando voltar online
    if (isOnline && retryCount === 0) {
      router.push('/');
    }
  }, [isOnline, router, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
    if (navigator.onLine) {
      router.push('/');
    } else {
      // Mostrar feedback de tentativa
      setTimeout(() => setRetryCount(0), 2000);
    }
  };

  const openCachedContent = () => {
    router.push('/modules');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Status de conectividade */}
        <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
          isOnline ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isOnline ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636L5.636 18.364m0-12.728L18.364 18.364M12 8v4m0 4h.01" />
            </svg>
          )}
        </div>

        {/* Título e status */}
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          {isOnline ? 'Conectado!' : 'Sem Conexão'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isOnline 
            ? 'Sua conexão foi restaurada. Redirecionando...'
            : 'Você está offline, mas ainda pode acessar conteúdo em cache.'
          }
        </p>

        {/* Funcionalidades offline */}
        {!isOnline && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Disponível Offline:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Módulos educacionais em cache</li>
              <li>✓ FAQ e glossário</li>
              <li>✓ Calculadora de dose</li>
              <li>✓ Documentos PDF</li>
            </ul>
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-3">
          {isOnline ? (
            <button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ir para o Início
            </button>
          ) : (
            <>
              <button
                onClick={handleRetry}
                disabled={retryCount > 0}
                className={`w-full py-3 px-4 rounded-lg transition-colors ${
                  retryCount > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {retryCount > 0 ? 'Verificando...' : 'Tentar Novamente'}
              </button>
              
              <button
                onClick={openCachedContent}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ver Conteúdo Offline
              </button>
            </>
          )}
        </div>

        {/* Dicas para uso offline */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 text-sm mb-2">💡 Dica:</h4>
            <p className="text-xs text-amber-700">
              O sistema funciona parcialmente offline. Suas interações serão sincronizadas 
              automaticamente quando a conexão for restaurada.
            </p>
          </div>
        )}

        {/* Status da conexão */}
        <div className="mt-6 text-xs text-gray-500">
          Status: {isOnline ? 'Online' : 'Offline'} • 
          PWA: {typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Ativo' : 'Inativo'}
        </div>
      </div>
    </div>
  );
}