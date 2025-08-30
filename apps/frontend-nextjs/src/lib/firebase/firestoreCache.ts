/**
 * Firestore Cache Manager
 * Gerencia operações específicas de cache no Firestore
 * Implementa TTL automático e fallback para offline
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, FEATURES } from './config';

// Interface para entradas do cache
export interface FirestoreCacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Timestamp;
  expiresAt: Timestamp;
  version: string;
  metadata?: {
    source: 'api' | 'user' | 'system';
    tags?: string[];
    size?: number;
  };
}

// Configurações do cache
export const CACHE_CONFIG = {
  COLLECTION_NAME: 'cache',
  DEFAULT_TTL_MS: 5 * 60 * 1000, // 5 minutos
  MAX_BATCH_SIZE: 500,
  CLEANUP_BATCH_SIZE: 50,
  VERSION: '1.0.0',
  OFFLINE_GRACE_PERIOD_MS: 24 * 60 * 60 * 1000, // 24 horas
} as const;

class FirestoreCache {
  private isAvailable = false;
  private initPromise: Promise<boolean> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  /**
   * Inicializa o cache e verifica disponibilidade do Firestore
   */
  private async initialize(): Promise<boolean> {
    try {
      if (!db || !FEATURES.FIRESTORE_ENABLED) {
        console.log('[FirestoreCache] Firestore não disponível - modo fallback');
        return false;
      }

      // Teste de conectividade simples
      const testRef = doc(db, CACHE_CONFIG.COLLECTION_NAME, '__test__');
      await setDoc(testRef, { test: true }, { merge: true });
      await deleteDoc(testRef);

      this.isAvailable = true;
      console.log('[FirestoreCache] Inicializado com sucesso');

      // Limpeza automática em background
      if (typeof window !== 'undefined') {
        setTimeout(() => this.backgroundCleanup(), 30000); // 30s após inicialização
      }

      return true;
    } catch (error) {
      console.warn('[FirestoreCache] Falha na inicialização:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Aguarda inicialização e verifica se está disponível
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initPromise) {
      await this.initPromise;
    }
    return this.isAvailable;
  }

  /**
   * Gera timestamp de expiração
   */
  private getExpirationTimestamp(ttlMs: number): Timestamp {
    const expirationDate = new Date(Date.now() + ttlMs);
    return Timestamp.fromDate(expirationDate);
  }

  /**
   * Verifica se uma entrada está expirada
   */
  private isExpired(entry: FirestoreCacheEntry): boolean {
    return Timestamp.now().toMillis() > entry.expiresAt.toMillis();
  }

  /**
   * Obtém dados do cache no Firestore
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        return null;
      }

      const docRef = doc(db!, CACHE_CONFIG.COLLECTION_NAME, this.sanitizeKey(key));
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const entry = docSnap.data() as FirestoreCacheEntry<T>;

      // Verificar expiração
      if (this.isExpired(entry)) {
        // Remover entrada expirada em background
        this.delete(key).catch(() => {
          // Ignore errors in background deletion
        });
        return null;
      }

      console.log(`[FirestoreCache] Cache hit para: ${key}`);
      return entry.data;

    } catch (error) {
      console.warn(`[FirestoreCache] Erro ao buscar ${key}:`, error);
      return null;
    }
  }

  /**
   * Armazena dados no cache do Firestore
   */
  async set<T>(
    key: string, 
    data: T, 
    ttlMs: number = CACHE_CONFIG.DEFAULT_TTL_MS,
    metadata?: FirestoreCacheEntry<T>['metadata']
  ): Promise<boolean> {
    try {
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        return false;
      }

      const sanitizedKey = this.sanitizeKey(key);
      const docRef = doc(db!, CACHE_CONFIG.COLLECTION_NAME, sanitizedKey);

      const entry: FirestoreCacheEntry<T> = {
        key: sanitizedKey,
        data,
        timestamp: serverTimestamp() as Timestamp,
        expiresAt: this.getExpirationTimestamp(ttlMs),
        version: CACHE_CONFIG.VERSION,
        metadata: {
          source: 'system',
          size: this.estimateDataSize(data),
          ...metadata
        }
      };

      await setDoc(docRef, entry);
      console.log(`[FirestoreCache] Cache set para: ${key} (TTL: ${ttlMs}ms)`);
      return true;

    } catch (error) {
      console.error(`[FirestoreCache] Erro ao armazenar ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove entrada específica do cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        return false;
      }

      const docRef = doc(db!, CACHE_CONFIG.COLLECTION_NAME, this.sanitizeKey(key));
      await deleteDoc(docRef);
      
      console.log(`[FirestoreCache] Cache deleted: ${key}`);
      return true;

    } catch (error) {
      console.warn(`[FirestoreCache] Erro ao deletar ${key}:`, error);
      return false;
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<boolean> {
    try {
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        return false;
      }

      const collectionRef = collection(db!, CACHE_CONFIG.COLLECTION_NAME);
      const snapshot = await getDocs(collectionRef);

      if (snapshot.empty) {
        return true;
      }

      // Usar batch para deletar em lotes
      const batches: any[] = [];
      let currentBatch = writeBatch(db!);
      let operationCount = 0;

      snapshot.docs.forEach(doc => {
        currentBatch.delete(doc.ref);
        operationCount++;

        // Firestore permite máximo 500 operações por batch
        if (operationCount === CACHE_CONFIG.MAX_BATCH_SIZE) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db!);
          operationCount = 0;
        }
      });

      // Adicionar último batch se tiver operações pendentes
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Executar todos os batches
      await Promise.all(batches.map(batch => batch.commit()));

      console.log(`[FirestoreCache] Cache limpo (${snapshot.size} entradas)`);
      return true;

    } catch (error) {
      console.error('[FirestoreCache] Erro ao limpar cache:', error);
      return false;
    }
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  async backgroundCleanup(): Promise<void> {
    try {
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        return;
      }

      const now = Timestamp.now();
      const collectionRef = collection(db!, CACHE_CONFIG.COLLECTION_NAME);
      
      // Buscar entradas expiradas (limitando a quantidade para não sobrecarregar)
      const expiredQuery = query(
        collectionRef,
        where('expiresAt', '<', now)
      );

      const snapshot = await getDocs(expiredQuery);
      
      if (snapshot.empty) {
        return;
      }

      // Deletar em batches
      const batch = writeBatch(db!);
      let count = 0;

      snapshot.docs.forEach(doc => {
        if (count < CACHE_CONFIG.CLEANUP_BATCH_SIZE) {
          batch.delete(doc.ref);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`[FirestoreCache] Limpeza automática: ${count} entradas expiradas removidas`);
      }

      // Agendar próxima limpeza
      if (typeof window !== 'undefined') {
        setTimeout(() => this.backgroundCleanup(), 10 * 60 * 1000); // 10 minutos
      }

    } catch (error) {
      console.warn('[FirestoreCache] Erro na limpeza automática:', error);
      
      // Reagendar mesmo com erro (backoff)
      if (typeof window !== 'undefined') {
        setTimeout(() => this.backgroundCleanup(), 30 * 60 * 1000); // 30 minutos
      }
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    totalSize: number;
    isAvailable: boolean;
  }> {
    try {
      const isReady = await this.ensureInitialized();
      if (!isReady) {
        return {
          totalEntries: 0,
          expiredEntries: 0,
          totalSize: 0,
          isAvailable: false
        };
      }

      const collectionRef = collection(db!, CACHE_CONFIG.COLLECTION_NAME);
      const snapshot = await getDocs(collectionRef);

      let totalSize = 0;
      let expiredCount = 0;

      snapshot.docs.forEach(doc => {
        const entry = doc.data() as FirestoreCacheEntry;
        
        if (this.isExpired(entry)) {
          expiredCount++;
        }

        if (entry.metadata?.size) {
          totalSize += entry.metadata.size;
        }
      });

      return {
        totalEntries: snapshot.size,
        expiredEntries: expiredCount,
        totalSize,
        isAvailable: true
      };

    } catch (error) {
      console.error('[FirestoreCache] Erro ao obter estatísticas:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        totalSize: 0,
        isAvailable: false
      };
    }
  }

  /**
   * Sanitiza chaves para uso como document ID no Firestore
   */
  private sanitizeKey(key: string): string {
    // Firestore document IDs não podem conter certos caracteres
    return key
      .replace(/[\/\s#\[\]]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 1500); // Limite do Firestore
  }

  /**
   * Estima tamanho dos dados em bytes (aproximado)
   */
  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Verifica se o Firestore está disponível
   */
  public async isReady(): Promise<boolean> {
    return await this.ensureInitialized();
  }
}

// Instância singleton
export const firestoreCache = new FirestoreCache();

// Utilitários de conveniência
export const FirestoreCacheUtils = {
  // TTLs pré-definidos
  TTL: {
    SHORT: 2 * 60 * 1000,      // 2 minutos
    MEDIUM: 10 * 60 * 1000,    // 10 minutos  
    LONG: 60 * 60 * 1000,      // 1 hora
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 horas
  },

  // Prefixos de chave para organização
  Keys: {
    CHAT: 'chat_',
    PERSONAS: 'personas_',
    API: 'api_',
    USER: 'user_',
    SYSTEM: 'system_'
  }
};

export default firestoreCache;