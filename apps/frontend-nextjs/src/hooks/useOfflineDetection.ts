'use client';

import { useState, useEffect } from 'react';

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
}

export function useOfflineDetection() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true, // Temporariamente forçar online
    isOffline: false, // Temporariamente forçar online
    lastOnline: null
  });

  useEffect(() => {
    // Temporariamente desabilitar detecção offline - forçar sempre online
    setState({
      isOnline: true,
      isOffline: false,
      lastOnline: new Date()
    });
    
    console.log('[OfflineDetection] Modo online forçado');
  }, []);

  return state;
}