/**
 * useSmartSync Hook
 * Hook React para integrar o SmartSyncManager com componentes
 * Fornece interface reativa para sincronização avançada
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SmartSyncManager } from '@/lib/firebase/sync/smartSyncManager';
import { ConflictResolutionManager } from '@/lib/firebase/sync/conflictResolution';
import { FEATURES } from '@/lib/firebase/config';

// ============================================
// TYPES
// ============================================

interface SmartSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  isInitialized: boolean;
  lastSync: Date | null;
  error: string | null;
  metrics: {
    totalSynced: number;
    conflictsResolved: number;
    conflictsPending: number;
    errorRate: number;
    averageLatency: number;
  };
  queue: {
    upload: number;
    download: number;
    conflicts: number;
  };
}

interface ConflictItem {
  id: string;
  type: 'conversation' | 'profile';
  title: string;
  description: string;
  local: any;
  remote: any;
  resolution?: any;
  timestamp: Date;
}

interface SmartSyncControls {
  // Sync operations
  sync: () => Promise<void>;
  forceSync: () => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => void;
  
  // Queue management
  queueItem: (type: 'conversation' | 'profile', id: string, data: any, priority?: 'low' | 'medium' | 'high') => void;
  clearQueue: () => void;
  
  // Conflict resolution
  getConflicts: () => ConflictItem[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'custom', customData?: any) => Promise<void>;
  autoResolveConflicts: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  resetMetrics: () => void;
  exportSyncData: () => string;
  
  // Status checks
  isFeatureAvailable: boolean;
  canSync: boolean;
  needsAttention: boolean;
}

// ============================================
// MAIN HOOK
// ============================================

export function useSmartSync(): SmartSyncState & SmartSyncControls {
  const auth = useAuth();
  const [syncState, setSyncState] = useState<SmartSyncState>({
    isOnline: true,
    isSyncing: false,
    isInitialized: false,
    lastSync: null,
    error: null,
    metrics: {
      totalSynced: 0,
      conflictsResolved: 0,
      conflictsPending: 0,
      errorRate: 0,
      averageLatency: 0
    },
    queue: {
      upload: 0,
      download: 0,
      conflicts: 0
    }
  });

  const syncManagerRef = useRef<SmartSyncManager | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Feature availability
  const isFeatureAvailable = FEATURES.FIRESTORE_ENABLED && auth.isAuthenticated;
  const canSync = isFeatureAvailable && syncState.isOnline && !syncState.isSyncing;
  const needsAttention = syncState.queue.conflicts > 0 || !!syncState.error;

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    if (!isFeatureAvailable || !auth.user) {
      // Cleanup if feature not available
      if (syncManagerRef.current) {
        syncManagerRef.current.destroy();
        syncManagerRef.current = null;
      }
      setSyncState(prev => ({ ...prev, isInitialized: false }));
      return;
    }

    // Initialize sync manager
    if (!syncManagerRef.current) {
      try {
        syncManagerRef.current = new SmartSyncManager(auth.user.uid, {
          conflictResolution: 'auto',
          maxRetries: 3,
          batchSize: 3
        });

        // Subscribe to sync updates
        const subscriptionId = syncManagerRef.current.subscribe(() => {
          updateSyncState();
        });

        setSyncState(prev => ({ 
          ...prev, 
          isInitialized: true,
          error: null 
        }));

        // Start periodic state updates
        updateIntervalRef.current = setInterval(updateSyncState, 5000);

        // Cleanup function
        return () => {
          if (syncManagerRef.current) {
            syncManagerRef.current.unsubscribe(subscriptionId);
            syncManagerRef.current.destroy();
            syncManagerRef.current = null;
          }
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
        };
      } catch (error) {
        console.error('Erro ao inicializar SmartSyncManager:', error);
        setSyncState(prev => ({ 
          ...prev, 
          error: 'Erro na inicialização do sync',
          isInitialized: false 
        }));
      }
    }
  }, [isFeatureAvailable, auth.user]);

  // ============================================
  // STATE UPDATES
  // ============================================

  const updateSyncState = useCallback(() => {
    if (!syncManagerRef.current) return;

    try {
      const metrics = syncManagerRef.current.getMetrics();
      const queue = syncManagerRef.current.getQueueStatus();

      setSyncState(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        lastSync: metrics.lastSuccessfulSync,
        metrics: {
          totalSynced: metrics.totalSynced,
          conflictsResolved: metrics.conflictsResolved,
          conflictsPending: metrics.conflictsPending,
          errorRate: metrics.errorRate,
          averageLatency: metrics.averageLatency
        },
        queue,
        error: null
      }));
    } catch (error) {
      console.error('Erro ao atualizar estado do sync:', error);
      setSyncState(prev => ({ 
        ...prev, 
        error: 'Erro ao obter status do sync' 
      }));
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setSyncState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  const sync = useCallback(async (): Promise<void> => {
    if (!syncManagerRef.current || !canSync) {
      throw new Error('Sync não disponível');
    }

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
      await syncManagerRef.current.sync();
      updateSyncState();
    } catch (error: any) {
      const errorMessage = error.message || 'Erro na sincronização';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [canSync, updateSyncState]);

  const forceSync = useCallback(async (): Promise<void> => {
    if (!syncManagerRef.current) {
      throw new Error('Sync manager não inicializado');
    }

    try {
      setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));
      await syncManagerRef.current.performFullSync();
      updateSyncState();
    } catch (error: any) {
      const errorMessage = error.message || 'Erro na sincronização forçada';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [updateSyncState]);

  const pauseSync = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.pauseSync();
      updateSyncState();
    }
  }, [updateSyncState]);

  const resumeSync = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.resumeSync();
      updateSyncState();
    }
  }, [updateSyncState]);

  // ============================================
  // QUEUE MANAGEMENT
  // ============================================

  const queueItem = useCallback((
    type: 'conversation' | 'profile', 
    id: string, 
    data: any, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!syncManagerRef.current) return;

    syncManagerRef.current.queueForUpload(id, type, data, priority);
    updateSyncState();
  }, [updateSyncState]);

  const clearQueue = useCallback(() => {
    // Esta funcionalidade seria implementada no SmartSyncManager
    console.log('Limpeza de fila não implementada');
  }, []);

  // ============================================
  // CONFLICT RESOLUTION
  // ============================================

  const getConflicts = useCallback((): ConflictItem[] => {
    if (!syncManagerRef.current) return [];

    const rawConflicts = syncManagerRef.current.getPendingConflicts();
    
    return rawConflicts.map(conflict => ({
      id: conflict.id,
      type: conflict.type as 'conversation' | 'profile',
      title: generateConflictTitle(conflict),
      description: generateConflictDescription(conflict),
      local: conflict.data.local,
      remote: conflict.data.remote,
      resolution: conflict.data.resolution,
      timestamp: conflict.lastModified
    }));
  }, []);

  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'remote' | 'custom', 
    customData?: any
  ): Promise<void> => {
    if (!syncManagerRef.current) {
      throw new Error('Sync manager não inicializado');
    }

    try {
      await syncManagerRef.current.resolveConflictManually(conflictId, resolution, customData);
      updateSyncState();
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao resolver conflito';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateSyncState]);

  const autoResolveConflicts = useCallback(async (): Promise<void> => {
    const conflicts = getConflicts();
    
    for (const conflict of conflicts) {
      try {
        // Aplicar resolução automática baseada em heurísticas
        const autoResolution = determineAutoResolution(conflict);
        await resolveConflict(conflict.id, autoResolution.strategy, autoResolution.data);
      } catch (error) {
        console.error(`Erro ao resolver conflito ${conflict.id}:`, error);
      }
    }
  }, [getConflicts, resolveConflict]);

  // ============================================
  // UTILITIES
  // ============================================

  const clearError = useCallback(() => {
    setSyncState(prev => ({ ...prev, error: null }));
  }, []);

  const resetMetrics = useCallback(() => {
    // Esta funcionalidade seria implementada no SmartSyncManager
    setSyncState(prev => ({
      ...prev,
      metrics: {
        totalSynced: 0,
        conflictsResolved: 0,
        conflictsPending: 0,
        errorRate: 0,
        averageLatency: 0
      }
    }));
  }, []);

  const exportSyncData = useCallback((): string => {
    const exportData = {
      state: syncState,
      conflicts: getConflicts(),
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }, [syncState, getConflicts]);

  // ============================================
  // RETURN OBJECT
  // ============================================

  return {
    // State
    ...syncState,
    
    // Controls
    sync,
    forceSync,
    pauseSync,
    resumeSync,
    queueItem,
    clearQueue,
    getConflicts,
    resolveConflict,
    autoResolveConflicts,
    clearError,
    resetMetrics,
    exportSyncData,
    
    // Status
    isFeatureAvailable,
    canSync,
    needsAttention
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateConflictTitle(conflict: any): string {
  switch (conflict.type) {
    case 'conversation':
      return `Conversa: ${conflict.data.local?.title || conflict.data.remote?.title || 'Sem título'}`;
    case 'profile':
      return 'Perfil do Usuário';
    default:
      return `${conflict.type}: ${conflict.id}`;
  }
}

function generateConflictDescription(conflict: any): string {
  const resolution = conflict.data.resolution;
  if (resolution?.explanation) {
    return resolution.explanation;
  }

  switch (conflict.type) {
    case 'conversation':
      return 'Diferenças detectadas entre a conversa local e remota';
    case 'profile':
      return 'Configurações do perfil diferem entre dispositivos';
    default:
      return 'Conflito de dados detectado';
  }
}

function determineAutoResolution(conflict: ConflictItem): { strategy: 'local' | 'remote'; data?: any } {
  // Heurísticas simples para resolução automática
  
  if (conflict.type === 'conversation') {
    // Para conversas, preferir a versão com mais mensagens
    const localMessages = conflict.local?.messages?.length || 0;
    const remoteMessages = conflict.remote?.messages?.length || 0;
    
    return {
      strategy: localMessages >= remoteMessages ? 'local' : 'remote'
    };
  }
  
  if (conflict.type === 'profile') {
    // Para perfis, preferir versão remota por segurança
    return {
      strategy: 'remote'
    };
  }
  
  // Default: preferir remoto
  return {
    strategy: 'remote'
  };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook simplificado para componentes que só precisam de status básico
 */
export function useSyncStatus() {
  const smartSync = useSmartSync();
  
  return {
    isOnline: smartSync.isOnline,
    isSyncing: smartSync.isSyncing,
    hasConflicts: smartSync.queue.conflicts > 0,
    hasErrors: !!smartSync.error,
    canSync: smartSync.canSync,
    lastSync: smartSync.lastSync,
    sync: smartSync.sync
  };
}

/**
 * Hook para monitorar conflitos
 */
export function useConflictMonitor() {
  const smartSync = useSmartSync();
  
  return {
    conflicts: smartSync.getConflicts(),
    conflictCount: smartSync.queue.conflicts,
    resolveConflict: smartSync.resolveConflict,
    autoResolve: smartSync.autoResolveConflicts,
    hasConflicts: smartSync.queue.conflicts > 0
  };
}

export default useSmartSync;