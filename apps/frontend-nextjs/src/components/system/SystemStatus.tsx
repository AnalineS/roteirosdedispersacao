/**
 * SystemStatus - Componente para monitorar status do sistema
 * Exibe informações sobre backend, conectividade e modo offline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { checkAPIHealth } from '@/services/api';

interface SystemStatusData {
  backendStatus: 'online' | 'offline' | 'checking';
  lastCheck: Date | null;
  fallbackActive: boolean;
  errorMessage?: string;
}

interface SystemStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function SystemStatus({ showDetails = false, className = '' }: SystemStatusProps) {
  const [status, setStatus] = useState<SystemStatusData>({
    backendStatus: 'checking',
    lastCheck: null,
    fallbackActive: false
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, backendStatus: 'checking' }));
    
    try {
      const result = await checkAPIHealth();
      
      setStatus({
        backendStatus: result.available ? 'online' : 'offline',
        lastCheck: new Date(),
        fallbackActive: result.fallbackActive,
        errorMessage: result.error
      });
    } catch (error) {
      setStatus({
        backendStatus: 'offline',
        lastCheck: new Date(),
        fallbackActive: true,
        errorMessage: 'Erro ao verificar status'
      });
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Verificar status a cada 5 minutos
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status.backendStatus) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-orange-600';
      case 'checking': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    const size = 12;
    switch (status.backendStatus) {
      case 'online': 
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#22c55e">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'offline': 
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'checking': 
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#3b82f6">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      default: 
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#6b7280">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getStatusMessage = () => {
    if (status.backendStatus === 'online') {
      return 'Sistema completo';
    } else if (status.fallbackActive) {
      return 'Modo offline';
    } else if (status.backendStatus === 'checking') {
      return 'Conectando...';
    } else {
      return 'Verificando backend...';
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-xs ${getStatusColor()}`}>
          {getStatusMessage()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Status do Sistema</h3>
        <button
          onClick={checkStatus}
          disabled={status.backendStatus === 'checking'}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {status.backendStatus === 'checking' ? 'Verificando...' : 'Atualizar'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Backend API</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {status.backendStatus === 'checking' ? 'Verificando...' : 
               status.backendStatus === 'online' ? 'Online' : 
               'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Modo de operação</span>
          <span className="text-sm text-gray-900">
            {status.fallbackActive ? 'Offline/Local' : 'Online/Sincronizado'}
          </span>
        </div>

        {status.lastCheck && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Última verificação</span>
            <span className="text-xs text-gray-500">
              {status.lastCheck.toLocaleTimeString()}
            </span>
          </div>
        )}

        {status.errorMessage && (
          <div className="mt-2 p-2 bg-orange-50 rounded border-l-4 border-orange-400">
            <p className="text-xs text-orange-700">{status.errorMessage}</p>
          </div>
        )}

        {status.fallbackActive && (
          <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm0-8h2V7h-2v2z"/>
              </svg>
              <p className="text-xs text-blue-700">
                Sistema funcionando em modo offline. Suas interações são salvas localmente 
                e serão sincronizadas quando o backend estiver disponível.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook para usar status do sistema em outros componentes
 */
export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatusData>({
    backendStatus: 'checking',
    lastCheck: null,
    fallbackActive: false
  });

  const checkStatus = async () => {
    try {
      const result = await checkAPIHealth();
      
      setStatus({
        backendStatus: result.available ? 'online' : 'offline',
        lastCheck: new Date(),
        fallbackActive: result.fallbackActive,
        errorMessage: result.error
      });

      return result;
    } catch (error) {
      const errorStatus = {
        backendStatus: 'offline' as const,
        lastCheck: new Date(),
        fallbackActive: true,
        errorMessage: 'Erro ao verificar status'
      };
      
      setStatus(errorStatus);
      return { available: false, fallbackActive: true };
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { status, checkStatus };
}