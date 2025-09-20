/**
 * useFirebaseSync Hook - Simplified Version
 * Firebase sync disabled - returns compatibility interface only
 */

'use client';

import { useState, useCallback } from 'react';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';

// Firebase sync disabled - using local storage only
const FEATURES = {
  FIRESTORE_ENABLED: false,
  SYNC_ENABLED: false,
};

// Types for compatibility
type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
type DataMigration = {
  version: string;
  timestamp: number;
};

interface SyncOptions {
  autoSync: boolean;
  syncInterval: number;
  retryAttempts: number;
  batchSize: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  errors: string[];
  progress: number;
}

interface MigrationState {
  isRequired: boolean;
  isInProgress: boolean;
  progress: number;
  itemsTotal: number;
  itemsProcessed: number;
  errors: string[];
  completed: boolean;
}

// Simplified hook for compatibility - Firebase sync disabled
export function useFirebaseSync(options: Partial<SyncOptions> = {}) {
  const auth = useAuth();
  const [syncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    lastSync: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    conflicts: 0,
    errors: [],
    progress: 0
  });

  const [migrationState] = useState<MigrationState>({
    isRequired: false,
    isInProgress: false,
    progress: 0,
    itemsTotal: 0,
    itemsProcessed: 0,
    errors: [],
    completed: false
  });

  // Disabled sync functions
  const syncUserData = useCallback(async () => {
    console.log('Firebase sync disabled');
    return { success: true };
  }, []);

  const forceSyncAll = useCallback(async () => {
    console.log('Firebase sync disabled');
    return { success: true };
  }, []);

  const clearSyncData = useCallback(async () => {
    console.log('Firebase sync disabled');
    return { success: true };
  }, []);

  const startMigration = useCallback(async () => {
    console.log('Firebase migration disabled');
    return { success: true };
  }, []);

  return {
    syncState,
    migrationState,
    syncUserData,
    forceSyncAll,
    clearSyncData,
    startMigration,
    isEnabled: false,
    isSupported: false
  };
}

export default useFirebaseSync;