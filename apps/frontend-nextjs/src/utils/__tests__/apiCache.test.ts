/**
 * Testes para API Cache
 * Cobertura: Cache LRU, TTL, invalidação
 */

import { apiCache, PersonasCache, ChatCache } from '../apiCache';

describe('APICache', () => {
  beforeEach(() => {
    apiCache.clear();
  });

  describe('basic cache operations', () => {
    it('should store and retrieve values', () => {
      apiCache.set('/test', 'value1');
      expect(apiCache.get('/test')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(apiCache.get('/nonexistent')).toBeNull();
    });

    it('should overwrite existing keys', () => {
      apiCache.set('/test', 'value1');
      apiCache.set('/test', 'value2');
      expect(apiCache.get('/test')).toBe('value2');
    });

    it('should handle parameters in cache keys', () => {
      apiCache.set('/test', 'value1', { param: 'a' });
      apiCache.set('/test', 'value2', { param: 'b' });
      
      expect(apiCache.get('/test', { param: 'a' })).toBe('value1');
      expect(apiCache.get('/test', { param: 'b' })).toBe('value2');
    });
  });

  describe('cache management', () => {
    it('should delete specific keys', () => {
      apiCache.set('/test1', 'value1');
      apiCache.set('/test2', 'value2');
      
      apiCache.delete('/test1');
      
      expect(apiCache.get('/test1')).toBeNull();
      expect(apiCache.get('/test2')).toBe('value2');
    });

    it('should clear all cache', () => {
      apiCache.set('/test1', 'value1');
      apiCache.set('/test2', 'value2');
      
      apiCache.clear();
      
      expect(apiCache.get('/test1')).toBeNull();
      expect(apiCache.get('/test2')).toBeNull();
    });

    it('should return cache statistics', () => {
      apiCache.set('/test1', 'value1');
      apiCache.set('/test2', 'value2');
      
      const stats = apiCache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBeDefined();
      expect(stats.keys).toHaveLength(2);
      expect(stats.hitRate).toBeDefined();
    });
  });

  describe('TTL expiration', () => {
    it('should expire items after TTL', async () => {
      // Set with very short TTL
      apiCache.set('/test', 'value', undefined, 10); // 10ms TTL
      
      expect(apiCache.get('/test')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(apiCache.get('/test')).toBeNull();
    });

    it('should respect custom TTL', () => {
      apiCache.set('/test1', 'value1', undefined, 1000); // 1 second
      apiCache.set('/test2', 'value2', undefined, 100);  // 100ms
      
      expect(apiCache.get('/test1')).toBe('value1');
      expect(apiCache.get('/test2')).toBe('value2');
    });
  });

  describe('preload functionality', () => {
    it('should preload data into cache', () => {
      apiCache.preload('/preloaded', 'preloaded-value');
      
      expect(apiCache.get('/preloaded')).toBe('preloaded-value');
    });

    it('should preload with custom TTL', () => {
      apiCache.preload('/preloaded', 'value', undefined, 500);
      
      expect(apiCache.get('/preloaded')).toBe('value');
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      apiCache.set('/null', null);
      apiCache.set('/undefined', undefined);
      
      expect(apiCache.get('/null')).toBe(null);
      expect(apiCache.get('/undefined')).toBe(undefined);
    });

    it('should handle complex objects', () => {
      const complexObject = {
        nested: { data: 'test' },
        array: [1, 2, 3],
        boolean: true
      };
      
      apiCache.set('/complex', complexObject);
      expect(apiCache.get('/complex')).toEqual(complexObject);
    });
  });
});

describe('PersonasCache', () => {
  beforeEach(() => {
    apiCache.clear();
  });

  it('should store and retrieve personas', () => {
    const personas = {
      dr_gasnelio: { name: 'Dr. Gasnelio' },
      ga: { name: 'Gá' }
    };
    
    PersonasCache.set(personas);
    expect(PersonasCache.get()).toEqual(personas);
  });

  it('should clear personas cache', () => {
    PersonasCache.set({ test: 'data' });
    PersonasCache.clear();
    
    expect(PersonasCache.get()).toBeNull();
  });
});

describe('ChatCache', () => {
  beforeEach(() => {
    apiCache.clear();
  });

  it('should store and retrieve chat responses', () => {
    const message = 'Hello';
    const persona = 'dr_gasnelio';
    const response = { answer: 'Hi there!' };
    
    ChatCache.set(message, persona, response);
    expect(ChatCache.get(message, persona)).toEqual(response);
  });

  it('should handle different message/persona combinations', () => {
    ChatCache.set('message1', 'dr_gasnelio', { answer: 'response1' });
    ChatCache.set('message1', 'ga', { answer: 'response2' });
    ChatCache.set('message2', 'dr_gasnelio', { answer: 'response3' });
    
    expect(ChatCache.get('message1', 'dr_gasnelio')).toEqual({ answer: 'response1' });
    expect(ChatCache.get('message1', 'ga')).toEqual({ answer: 'response2' });
    expect(ChatCache.get('message2', 'dr_gasnelio')).toEqual({ answer: 'response3' });
  });

  it('should clear all chat cache', () => {
    ChatCache.set('message', 'persona', { answer: 'response' });
    ChatCache.clear();
    
    expect(ChatCache.get('message', 'persona')).toBeNull();
  });
});