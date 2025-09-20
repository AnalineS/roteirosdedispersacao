/**
 * Testes para Sistema de Cache Híbrido
 * Cobertura: Memory, localStorage, API integration, sync, fallback
 */

import { hybridCache, HybridCacheUtils } from '../../services/hybridCache';
// Mock do cache API para testes
const mockApiCache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  isReady: jest.fn(),
  getStats: jest.fn(),
};

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('HybridCache', () => {
  const mockFirestoreCache = firestoreCache as jest.Mocked<typeof firestoreCache>;

  beforeEach(() => {
    // Limpar todos os caches
    hybridCache.clear();
    localStorageMock.clear();
    
    // Reset dos mocks
    jest.clearAllMocks();
    
    // Configurar mocks padrão
    mockFirestoreCache.isReady.mockResolvedValue(true);
    mockFirestoreCache.get.mockResolvedValue(null);
    mockFirestoreCache.set.mockResolvedValue(true);
    mockFirestoreCache.delete.mockResolvedValue(true);
    mockFirestoreCache.clear.mockResolvedValue(true);
    mockFirestoreCache.getStats.mockResolvedValue({
      totalEntries: 0,
      expiredEntries: 0,
      totalSize: 0,
      isAvailable: true
    });

    // Simular online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data from memory cache', async () => {
      const key = 'test-key';
      const data = { message: 'Hello World' };

      await hybridCache.set(key, data);
      const result = await hybridCache.get(key);

      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', async () => {
      const result = await hybridCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      const testCases = [
        ['string', 'test string'],
        ['number', 42],
        ['boolean', true],
        ['array', [1, 2, 3]],
        ['object', { key: 'value', nested: { data: 'test' } }],
        ['null', null],
        ['undefined', undefined]
      ];

      for (const [type, data] of testCases) {
        const key = `test-${type}`;
        await hybridCache.set(key, data);
        const result = await hybridCache.get(key);
        expect(result).toEqual(data);
      }
    });
  });

  describe('Memory-First Strategy', () => {
    it('should prioritize memory cache over other layers', async () => {
      const key = 'priority-test';
      const memoryData = { source: 'memory' };
      const localStorageData = { source: 'localStorage' };
      const firestoreData = { source: 'firestore' };

      // Mock diferentes respostas das camadas
      mockFirestoreCache.get.mockResolvedValue(firestoreData);
      
      // Simular dados no localStorage
      const storageKey = 'hybrid_cache_' + key;
      localStorageMock.setItem(storageKey, JSON.stringify({
        data: localStorageData,
        timestamp: Date.now(),
        ttl: 60000,
        source: 'localStorage',
        key,
        syncStatus: 'synced'
      }));

      // Armazenar na memória (deve ter prioridade)
      await hybridCache.set(key, memoryData, { ttl: 60000 });

      const result = await hybridCache.get(key);
      expect(result).toEqual(memoryData);
      
      // Verificar que não acessou Firestore
      expect(mockFirestoreCache.get).not.toHaveBeenCalled();
    });

    it('should fallback to localStorage when memory cache misses', async () => {
      const key = 'fallback-localStorage-test';
      const localStorageData = { source: 'localStorage' };
      
      // Simular dados apenas no localStorage
      const storageKey = 'hybrid_cache_' + key.replace(/[\/\s#\[\]]/g, '_');
      localStorageMock.setItem(storageKey, JSON.stringify({
        data: localStorageData,
        timestamp: Date.now(),
        ttl: 60000,
        source: 'localStorage',
        key: storageKey,
        syncStatus: 'synced'
      }));

      const result = await hybridCache.get(key);
      expect(result).toEqual(localStorageData);
    });

    it('should fallback to Firestore when memory and localStorage miss', async () => {
      const key = 'fallback-firestore-test';
      const firestoreData = { source: 'firestore' };
      
      // Mock Firestore retornando dados
      mockFirestoreCache.get.mockResolvedValue(firestoreData);

      const result = await hybridCache.get(key);
      expect(result).toEqual(firestoreData);
      expect(mockFirestoreCache.get).toHaveBeenCalledWith(
        key.replace(/[\/\s#\[\]]/g, '_')
      );
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries based on TTL', async () => {
      const key = 'ttl-test';
      const data = { message: 'Should expire' };
      
      // Armazenar com TTL muito curto
      await hybridCache.set(key, data, { ttl: 10, skipFirestore: true }); // 10ms, skip Firestore
      
      // Imediatamente deve estar disponível
      expect(await hybridCache.get(key)).toEqual(data);
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Deve retornar null após expiração
      expect(await hybridCache.get(key)).toBeNull();
    });

    it('should respect custom TTL values', async () => {
      const key = 'custom-ttl-test';
      const data = { message: 'Custom TTL' };
      
      await hybridCache.set(key, data, { ttl: 1000 }); // 1 segundo
      
      const result = await hybridCache.get(key);
      expect(result).toEqual(data);
    });
  });

  describe('Offline Behavior', () => {
    it('should work offline using memory and localStorage', async () => {
      // Simular offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const key = 'offline-test';
      const data = { message: 'Offline data' };
      
      await hybridCache.set(key, data);
      const result = await hybridCache.get(key);
      
      expect(result).toEqual(data);
      // Não deve tentar acessar Firestore offline
      expect(mockFirestoreCache.set).not.toHaveBeenCalled();
      expect(mockFirestoreCache.get).not.toHaveBeenCalled();
    });

    it('should skip Firestore operations when skipFirestore is true', async () => {
      const key = 'skip-firestore-test';
      const data = { message: 'Skip Firestore' };
      
      await hybridCache.set(key, data, { skipFirestore: true });
      
      expect(mockFirestoreCache.set).not.toHaveBeenCalled();
    });
  });

  describe('Background Synchronization', () => {
    it('should sync data to Firestore with high priority', async () => {
      const key = 'high-priority-test';
      const data = { message: 'High priority' };
      
      await hybridCache.set(key, data, { priority: 'high' });
      
      // Com prioridade alta, deve sincronizar imediatamente
      expect(mockFirestoreCache.set).toHaveBeenCalledWith(
        key.replace(/[\/\s#\[\]]/g, '_'),
        data,
        expect.any(Number),
        expect.objectContaining({
          source: 'system',
          tags: ['hybrid-cache']
        })
      );
    });

    it('should handle sync failures gracefully', async () => {
      const key = 'sync-failure-test';
      const data = { message: 'Sync failure' };
      
      // Mock falha no Firestore
      mockFirestoreCache.set.mockRejectedValue(new Error('Sync failed'));
      
      // Deve ainda funcionar localmente
      const success = await hybridCache.set(key, data, { priority: 'high' });
      expect(success).toBe(true);
      
      const result = await hybridCache.get(key);
      expect(result).toEqual(data);
    });

    it('should handle manual sync', async () => {
      const key1 = 'manual-sync-1';
      const key2 = 'manual-sync-2';
      const data1 = { message: 'Data 1' };
      const data2 = { message: 'Data 2' };
      
      // Armazenar dados normalmente (vão para queue de sync mas não sincronizam imediatamente)
      await hybridCache.set(key1, data1, { priority: 'normal' });
      await hybridCache.set(key2, data2, { priority: 'normal' });
      
      // Mock success para um, falha para outro
      mockFirestoreCache.set
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Sync failed'));
      
      const result = await hybridCache.forceSync();
      
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('Cache Management', () => {
    it('should delete entries from all layers', async () => {
      const key = 'delete-test';
      const data = { message: 'To be deleted' };
      
      await hybridCache.set(key, data);
      expect(await hybridCache.get(key)).toEqual(data);
      
      await hybridCache.delete(key);
      expect(await hybridCache.get(key)).toBeNull();
      expect(mockFirestoreCache.delete).toHaveBeenCalled();
    });

    it('should clear all cache layers', async () => {
      const data = { message: 'To be cleared' };
      
      await hybridCache.set('key1', data);
      await hybridCache.set('key2', data);
      
      await hybridCache.clear();
      
      expect(await hybridCache.get('key1')).toBeNull();
      expect(await hybridCache.get('key2')).toBeNull();
      expect(mockFirestoreCache.clear).toHaveBeenCalled();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide detailed cache statistics', async () => {
      const data = { message: 'Stats test' };
      
      // Armazenar alguns dados
      await hybridCache.set('stats1', data);
      await hybridCache.set('stats2', data);
      
      // Fazer algumas buscas
      await hybridCache.get('stats1'); // hit
      await hybridCache.get('nonexistent'); // miss
      
      const stats = await hybridCache.getDetailedStats();
      
      expect(stats).toHaveProperty('memory');
      expect(stats).toHaveProperty('localStorage');
      expect(stats).toHaveProperty('firestore');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('totalMisses');
      expect(stats).toHaveProperty('hitRatio');
      
      expect(stats.memory.hits).toBeGreaterThan(0);
      expect(stats.memory.misses).toBeGreaterThan(0);
    });

    it('should handle Firestore stats errors gracefully', async () => {
      // Mock erro nas stats do Firestore
      mockFirestoreCache.getStats.mockRejectedValue(new Error('Stats failed'));
      
      const stats = await hybridCache.getDetailedStats();
      
      // Deve ainda retornar stats válidas
      expect(stats).toBeDefined();
      expect(stats.firestore.isAvailable).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage quota exceeded', async () => {
      const key = 'quota-test';
      const data = { message: 'Large data' };
      
      // Mock localStorage.setItem para simular quota exceeded
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn().mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      // Deve ainda funcionar (fallback para memory)
      const success = await hybridCache.set(key, data);
      expect(success).toBe(true);
      
      const result = await hybridCache.get(key);
      expect(result).toEqual(data);
      
      // Restaurar localStorage
      localStorageMock.setItem = originalSetItem;
    });

    it('should sanitize invalid keys', async () => {
      const invalidKey = 'key/with/slashes and spaces#and[brackets]';
      const data = { message: 'Invalid key test' };
      
      await hybridCache.set(invalidKey, data);
      const result = await hybridCache.get(invalidKey);
      
      expect(result).toEqual(data);
    });

    it('should handle corrupted localStorage data', async () => {
      const key = 'corrupted-test';
      const storageKey = 'hybrid_cache_' + key;
      
      // Inserir dados corrompidos no localStorage
      localStorageMock.setItem(storageKey, 'invalid json{');
      
      // Deve retornar null e não quebrar
      const result = await hybridCache.get(key);
      expect(result).toBeNull();
    });
  });

  describe('HybridCacheUtils', () => {
    it('should provide correct TTL constants', () => {
      expect(HybridCacheUtils.TTL.VERY_SHORT).toBe(30 * 1000);
      expect(HybridCacheUtils.TTL.SHORT).toBe(2 * 60 * 1000);
      expect(HybridCacheUtils.TTL.MEDIUM).toBe(10 * 60 * 1000);
      expect(HybridCacheUtils.TTL.LONG).toBe(60 * 60 * 1000);
      expect(HybridCacheUtils.TTL.VERY_LONG).toBe(24 * 60 * 60 * 1000);
    });

    it('should generate correct cache keys', () => {
      expect(HybridCacheUtils.Keys.chat('hello', 'dr_gasnelio'))
        .toBe('chat:dr_gasnelio:hello');
      
      expect(HybridCacheUtils.Keys.personas())
        .toBe('personas:all');
      
      expect(HybridCacheUtils.Keys.api('/api/test', 'params'))
        .toBe('api:/api/test:params');
      
      expect(HybridCacheUtils.Keys.user('user123', 'profile'))
        .toBe('user:user123:profile');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore unavailable gracefully', async () => {
      // Mock Firestore como indisponível
      mockFirestoreCache.isReady.mockResolvedValue(false);
      
      const key = 'firestore-unavailable-test';
      const data = { message: 'Firestore unavailable' };
      
      const success = await hybridCache.set(key, data);
      expect(success).toBe(true);
      
      const result = await hybridCache.get(key);
      expect(result).toEqual(data);
    });

    it('should handle network errors during sync', async () => {
      const key = 'network-error-test';
      const data = { message: 'Network error' };
      
      // Mock erro de rede
      mockFirestoreCache.set.mockRejectedValue(new Error('Network error'));
      
      const success = await hybridCache.set(key, data, { priority: 'high' });
      expect(success).toBe(true); // Deve suceder localmente
      
      const result = await hybridCache.get(key);
      expect(result).toEqual(data);
    });
  });

  afterEach(() => {
    // Cleanup após cada teste
    jest.clearAllMocks();
    localStorageMock.clear();
  });
});