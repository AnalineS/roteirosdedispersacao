'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import config from '@/config/environment';

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
}

const DEBOUNCE_MS = 2000;

async function checkBackendHealth(): Promise<boolean> {
  try {
    const apiBase = config.api.baseUrl;
    if (!apiBase) return true; // No backend configured = assume online

    const resp = await fetch(`${apiBase}/api/v1/health/live`, {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export function useOfflineDetection() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isOffline: false,
    lastOnline: null
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateState = useCallback((online: boolean) => {
    setState(prev => ({
      isOnline: online,
      isOffline: !online,
      lastOnline: online ? new Date() : prev.lastOnline
    }));
  }, []);

  const performHealthCheck = useCallback(async () => {
    if (!navigator.onLine) {
      updateState(false);
      return;
    }

    const backendOk = await checkBackendHealth();
    updateState(backendOk);
  }, [updateState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial health check (deferred to avoid setState in effect body)
    const initialCheck = setTimeout(performHealthCheck, 0);

    const handleOnline = () => {
      // Browser says online - verify with backend after debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(performHealthCheck, DEBOUNCE_MS);
    };

    const handleOffline = () => {
      // Browser says offline - verify with backend after debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(performHealthCheck, DEBOUNCE_MS);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat - check every 30s regardless of state
    intervalRef.current = setInterval(performHealthCheck, 30000);

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [performHealthCheck]);

  return state;
}
