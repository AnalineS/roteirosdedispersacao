/**
 * Painel de Estatísticas do Cache Unificado
 * Mostra métricas em tempo real do sistema de cache
 * Útil para desenvolvimento e monitoramento
 * 
 * Data: 09 de Janeiro de 2025
 * Fase: Integração Frontend
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedCache } from '@/hooks/useUnifiedCache';

interface CacheStatsProps {
  visible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  updateInterval?: number;
}

const CacheStatsPanel: React.FC<CacheStatsProps> = ({
  visible = false,
  position = 'bottom-right',
  updateInterval = 2000
}) => {
  const { getStats, clear } = useUnifiedCache();
  const [stats, setStats] = useState(getStats());
  const [isExpanded, setIsExpanded] = useState(false);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setStats(getStats());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [visible, updateInterval, getStats]);

  // Não renderizar se não visível
  if (!visible) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const getHitRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Cache Stats
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${getHitRateColor(stats.hitRate)}`}>
              {stats.hitRate.toFixed(1)}%
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
            {/* Hit Rate Summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="text-gray-600 dark:text-gray-400">Requests</div>
                <div className="font-mono font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalRequests.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                <div className="text-gray-600 dark:text-gray-400">Hit Rate</div>
                <div className={`font-mono font-bold ${getHitRateColor(stats.hitRate)}`}>
                  {stats.hitRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Cache Layers */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Cache Layers
              </div>
              
              {/* Memory Cache */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">Memory</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-green-600">{stats.memoryHits}</span>
                  <span className="text-gray-500">({stats.memorySize} items)</span>
                </div>
              </div>

              {/* localStorage Cache */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">localStorage</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-blue-600">{stats.localStorageHits}</span>
                  <span className="text-gray-500">({stats.localStorageSize} items)</span>
                </div>
              </div>

              {/* API Cache */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">API</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-purple-600">{stats.apiHits}</span>
                </div>
              </div>

              {/* Misses */}
              <div className="flex justify-between items-center text-sm border-t pt-2">
                <span className="text-gray-700 dark:text-gray-300">Misses</span>
                <span className="font-mono text-red-600">{stats.misses}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex space-x-2">
              <button
                onClick={clear}
                className="flex-1 px-3 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
              >
                Clear Cache
              </button>
              
              <button
                onClick={() => setStats(getStats())}
                className="flex-1 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
              >
                Refresh
              </button>
            </div>

            {/* Performance Indicators */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Memory Efficiency:</span>
                <span className={stats.memorySize > 80 ? 'text-orange-600' : 'text-green-600'}>
                  {((stats.memoryHits / Math.max(1, stats.totalRequests)) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Offline Ready:</span>
                <span className={stats.localStorageHits > 0 ? 'text-green-600' : 'text-gray-400'}>
                  {stats.localStorageHits > 0 ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheStatsPanel;