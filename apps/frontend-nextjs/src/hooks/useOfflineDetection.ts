'use client';

import { useState, useEffect } from 'react';

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
}

export function useOfflineDetection() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    lastOnline: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setState(prev => ({
        isOnline,
        isOffline: !isOnline,
        lastOnline: isOnline ? new Date() : prev.lastOnline || new Date()
      }));
    };

    // Initial state
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Periodic connectivity check (every 30 seconds when offline)
    let intervalId: NodeJS.Timeout;
    
    if (!navigator.onLine) {
      intervalId = setInterval(async () => {
        try {
          // Try to fetch a small resource to check connectivity
          const response = await fetch('/favicon.ico', { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          if (response.ok && !navigator.onLine) {
            // Browser thinks we're offline but we can actually reach the server
            updateOnlineStatus();
          }
        } catch (error) {
          // Still offline
          console.log('Still offline:', error);
        }
      }, 30000);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return state;
}