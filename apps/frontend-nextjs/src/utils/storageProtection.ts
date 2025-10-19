/**
 * Storage Protection - Prevent localStorage overflow
 * Automatically cleans up old entries to prevent ERR_INSUFFICIENT_RESOURCES
 */

const MAX_STORAGE_KEYS = 100; // Safe limit for localStorage keys
const CLEANUP_PREFIX_PATTERNS = [
  'user-profile-anon-', // Anonymous user profiles
  'temp-',
  'cache-',
  '_next-', // Next.js temporary data
];

export interface StorageCleanupResult {
  before: number;
  after: number;
  deleted: number;
  freed: boolean;
}

/**
 * Clean up old localStorage entries to prevent overflow
 */
export function cleanupLocalStorage(): StorageCleanupResult {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { before: 0, after: 0, deleted: 0, freed: false };
  }

  const before = window.localStorage.length;

  // If under limit, no cleanup needed
  if (before < MAX_STORAGE_KEYS) {
    return { before, after: before, deleted: 0, freed: false };
  }

  console.warn(`[StorageProtection] localStorage overflow detected: ${before} keys (limit: ${MAX_STORAGE_KEYS})`);

  let deleted = 0;
  const keysToDelete: string[] = [];

  // Collect keys matching cleanup patterns
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key) continue;

    for (const pattern of CLEANUP_PREFIX_PATTERNS) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
        break;
      }
    }
  }

  // Sort by age (extract timestamp from anon keys)
  keysToDelete.sort((a, b) => {
    const timestampA = extractTimestamp(a);
    const timestampB = extractTimestamp(b);
    return timestampA - timestampB; // Oldest first
  });

  // Delete oldest entries until under limit
  const targetDelete = before - Math.floor(MAX_STORAGE_KEYS * 0.8); // Clean to 80% capacity
  for (let i = 0; i < Math.min(keysToDelete.length, targetDelete); i++) {
    try {
      window.localStorage.removeItem(keysToDelete[i]);
      deleted++;
    } catch (e) {
      console.error(`[StorageProtection] Failed to delete key: ${keysToDelete[i]}`, e);
    }
  }

  const after = window.localStorage.length;

  console.log(`[StorageProtection] Cleanup complete: ${before} → ${after} keys (deleted ${deleted})`);

  return { before, after, deleted, freed: after < MAX_STORAGE_KEYS };
}

/**
 * Extract timestamp from key like "user-profile-anon-1234567890-abc"
 */
function extractTimestamp(key: string): number {
  const match = key.match(/anon-(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Monitor localStorage usage and auto-cleanup if needed
 */
export function monitorLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const count = window.localStorage.length;

  if (count > MAX_STORAGE_KEYS * 0.9) {
    console.warn(`[StorageProtection] localStorage near limit: ${count}/${MAX_STORAGE_KEYS}`);
    cleanupLocalStorage();
  }
}

/**
 * Initialize storage protection (call on app mount)
 */
export function initStorageProtection(): void {
  if (typeof window === 'undefined') return;

  // Initial cleanup if needed
  const result = cleanupLocalStorage();

  if (result.deleted > 0) {
    console.log(`[StorageProtection] Initial cleanup: freed ${result.deleted} entries`);
  }

  // Monitor every 30 seconds
  setInterval(monitorLocalStorage, 30000);

  // Monitor on storage events
  window.addEventListener('storage', () => {
    monitorLocalStorage();
  });
}
