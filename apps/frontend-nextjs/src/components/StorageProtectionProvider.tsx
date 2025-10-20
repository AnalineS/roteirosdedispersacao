'use client';

/**
 * Storage Protection Provider
 * Automatically prevents localStorage overflow
 */

import { useEffect } from 'react';
import { initStorageProtection } from '@/utils/storageProtection';

export function StorageProtectionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize storage protection on mount
    initStorageProtection();
  }, []);

  return <>{children}</>;
}
