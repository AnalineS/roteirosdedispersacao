/**
 * Smart Sync Manager - Gerenciador Inteligente de Sincronização
 * Sistema avançado de sincronização bidirecional com resolução automática de conflitos
 * Implementa padrões de sincronização otimizados para performance e confiabilidade
 */

import { 
  ConflictResolutionManager, 
  ConflictResolutionResult,
  ConflictContext 
} from './conflictResolution';
import { 
  UserProfileRepository, 
  ConversationRepository,
  RealtimeSubscriptions 
} from '@/lib/firebase/firestore';
import { 
  FirestoreConversation, 
  FirestoreUserProfile,
  SyncStatus 
} from '@/lib/firebase/types';
import { FEATURES, FIRESTORE_CONFIG } from '@/lib/firebase/config';

// ============================================
// TYPES
// ============================================

interface SyncItem {
  id: string;
  type: 'conversation' | 'profile' | 'feedback';
  data: any;
  priority: 'low' | 'medium' | 'high';
  lastModified: Date;
  retryCount: number;
  localVersion?: string;
  remoteVersion?: string;
}

interface SyncQueue {
  upload: SyncItem[];
  download: SyncItem[];
  conflicts: SyncItem[];
}

interface SyncMetrics {
  totalSynced: number;
  uploadSuccess: number;
  downloadSuccess: number;
  conflictsResolved: number;
  conflictsPending: number;
  averageLatency: number;
  errorRate: number;
  lastSuccessfulSync: Date | null;
}

interface SyncStrategy {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  conflictResolution: 'auto' | 'manual';
  networkThreshold: number; // ms
  priorityWeights: Record<string, number>;
}

// ============================================
// SMART SYNC MANAGER
// ============================================

export class SmartSyncManager {
  private userId: string;
  private syncQueue: SyncQueue = {
    upload: [],
    download: [],
    conflicts: []
  };
  private metrics: SyncMetrics = {
    totalSynced: 0,
    uploadSuccess: 0,
    downloadSuccess: 0,
    conflictsResolved: 0,
    conflictsPending: 0,
    averageLatency: 0,
    errorRate: 0,
    lastSuccessfulSync: null
  };
  private strategy: SyncStrategy = {
    maxRetries: 3,
    retryDelay: 2000,
    batchSize: 5,
    conflictResolution: 'auto',
    networkThreshold: 5000,
    priorityWeights: {
      high: 3,
      medium: 2,
      low: 1
    }
  };
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, () => void> = new Map();

  constructor(userId: string, customStrategy?: Partial<SyncStrategy>) {
    this.userId = userId;
    if (customStrategy) {
      this.strategy = { ...this.strategy, ...customStrategy };
    }
    this.initializeNetworkMonitoring();
    this.startPeriodicSync();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeNetworkMonitoring() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.pauseSync();
    });

    // Initial network check
    this.isOnline = navigator.onLine;
  }

  private startPeriodicSync() {
    if (!FEATURES.FIRESTORE_ENABLED) return;

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performIncrementalSync();
      }
    }, FIRESTORE_CONFIG.CACHE.SYNC_DEBOUNCE_MS);
  }

  // ============================================
  // QUEUE MANAGEMENT
  // ============================================

  /**
   * Adicionar item à fila de upload
   */
  queueForUpload(
    id: string, 
    type: 'conversation' | 'profile' | 'feedback', 
    data: any, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) {
    const item: SyncItem = {
      id,
      type,
      data,
      priority,
      lastModified: new Date(),
      retryCount: 0
    };

    // Remover item duplicado se existir
    this.syncQueue.upload = this.syncQueue.upload.filter(existing => 
      !(existing.id === id && existing.type === type)
    );

    // Adicionar à fila com prioridade
    this.syncQueue.upload.push(item);
    this.syncQueue.upload.sort((a, b) => 
      this.strategy.priorityWeights[b.priority] - this.strategy.priorityWeights[a.priority]
    );

    // Trigger sync imediato se alta prioridade
    if (priority === 'high' && this.isOnline) {
      this.performImmediateSync();
    }
  }

  /**
   * Processar fila de upload
   */
  private async processUploadQueue(): Promise<void> {
    if (this.syncQueue.upload.length === 0) return;

    const batch = this.syncQueue.upload.splice(0, this.strategy.batchSize);
    const startTime = Date.now();

    for (const item of batch) {
      try {
        await this.uploadItem(item);
        this.metrics.uploadSuccess++;
        this.metrics.totalSynced++;
      } catch (error) {
        console.error(`Erro no upload de ${item.type}:${item.id}`, error);
        
        // Retry logic
        if (item.retryCount < this.strategy.maxRetries) {
          item.retryCount++;
          setTimeout(() => {
            this.syncQueue.upload.unshift(item);
          }, this.strategy.retryDelay * item.retryCount);
        } else {
          console.error(`Max retries exceeded for ${item.type}:${item.id}`);
          this.handleSyncFailure(item, error as Error);
        }
      }
    }

    // Update metrics
    const latency = Date.now() - startTime;
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
  }

  /**
   * Upload individual item
   */
  private async uploadItem(item: SyncItem): Promise<void> {
    switch (item.type) {
      case 'conversation':
        const convResult = await ConversationRepository.saveConversation(item.data);
        if (!convResult.success) {
          throw new Error(convResult.error);
        }
        break;

      case 'profile':
        const profileResult = await UserProfileRepository.saveProfile(item.data);
        if (!profileResult.success) {
          throw new Error(profileResult.error);
        }
        break;

      case 'feedback':
        // Implementar quando necessário
        break;

      default:
        throw new Error(`Tipo não suportado: ${item.type}`);
    }
  }

  // ============================================
  // DOWNLOAD AND CONFLICT RESOLUTION
  // ============================================

  /**
   * Sincronizar dados do servidor
   */
  private async downloadUpdates(): Promise<void> {
    if (!this.isOnline || !FEATURES.FIRESTORE_ENABLED) return;

    try {
      // Download conversations
      await this.downloadConversations();
      
      // Download profile
      await this.downloadProfile();
      
      this.metrics.lastSuccessfulSync = new Date();
    } catch (error) {
      console.error('Erro no download de atualizações:', error);
      throw error;
    }
  }

  private async downloadConversations(): Promise<void> {
    const result = await ConversationRepository.getUserConversations(this.userId, {
      limit: FIRESTORE_CONFIG.LIMITS.MAX_CONVERSATIONS_PER_USER
    });

    if (result.success && result.data) {
      for (const remoteConv of result.data) {
        await this.handleConversationSync(remoteConv);
      }
    }
  }

  private async downloadProfile(): Promise<void> {
    const result = await UserProfileRepository.getProfile(this.userId);

    if (result.success && result.data) {
      await this.handleProfileSync(result.data);
    }
  }

  /**
   * Lidar com sincronização de conversa individual
   */
  private async handleConversationSync(remoteConv: FirestoreConversation): Promise<void> {
    // Buscar versão local
    const localConv = this.getLocalConversation(remoteConv.id);
    
    if (!localConv) {
      // Nova conversa do servidor
      this.saveConversationLocally(remoteConv);
      return;
    }

    // Verificar se há conflito
    if (this.hasConversationConflict(localConv, remoteConv)) {
      await this.resolveConversationConflict(localConv, remoteConv);
    } else {
      // Sem conflito - atualizar local
      this.saveConversationLocally(remoteConv);
    }
  }

  /**
   * Lidar com sincronização de perfil
   */
  private async handleProfileSync(remoteProfile: FirestoreUserProfile): Promise<void> {
    const localProfile = this.getLocalProfile();
    
    if (!localProfile) {
      this.saveProfileLocally(remoteProfile);
      return;
    }

    if (this.hasProfileConflict(localProfile, remoteProfile)) {
      await this.resolveProfileConflict(localProfile, remoteProfile);
    } else {
      this.saveProfileLocally(remoteProfile);
    }
  }

  /**
   * Resolver conflito de conversa
   */
  private async resolveConversationConflict(
    localConv: any, 
    remoteConv: FirestoreConversation
  ): Promise<void> {
    const context: ConflictContext = {
      lastSync: this.metrics.lastSuccessfulSync || undefined,
      userActivity: new Date(localConv.lastActivity),
      importance: 'medium'
    };

    const resolution = await ConflictResolutionManager.resolveConflict(
      'conversation',
      localConv,
      remoteConv,
      context
    );

    if (resolution.requiresUserInput && this.strategy.conflictResolution === 'manual') {
      // Adicionar à fila de conflitos para resolução manual
      this.syncQueue.conflicts.push({
        id: localConv.id,
        type: 'conversation',
        data: { local: localConv, remote: remoteConv, resolution },
        priority: 'high',
        lastModified: new Date(),
        retryCount: 0
      });
      this.metrics.conflictsPending++;
    } else {
      // Aplicar resolução automática
      this.saveConversationLocally(resolution.resolved);
      
      // Se foi alterado, fazer upload da versão resolvida
      if (resolution.strategy === 'merge' || resolution.strategy === 'client_wins') {
        this.queueForUpload(resolution.resolved.id, 'conversation', resolution.resolved, 'medium');
      }
      
      this.metrics.conflictsResolved++;
    }
  }

  /**
   * Resolver conflito de perfil
   */
  private async resolveProfileConflict(
    localProfile: any, 
    remoteProfile: FirestoreUserProfile
  ): Promise<void> {
    const context: ConflictContext = {
      lastSync: this.metrics.lastSuccessfulSync || undefined,
      importance: 'high'
    };

    const resolution = await ConflictResolutionManager.resolveConflict(
      'profile',
      localProfile,
      remoteProfile,
      context
    );

    if (resolution.requiresUserInput && this.strategy.conflictResolution === 'manual') {
      this.syncQueue.conflicts.push({
        id: 'user_profile',
        type: 'profile',
        data: { local: localProfile, remote: remoteProfile, resolution },
        priority: 'high',
        lastModified: new Date(),
        retryCount: 0
      });
      this.metrics.conflictsPending++;
    } else {
      this.saveProfileLocally(resolution.resolved);
      
      if (resolution.strategy === 'merge' || resolution.strategy === 'client_wins') {
        this.queueForUpload('user_profile', 'profile', resolution.resolved, 'high');
      }
      
      this.metrics.conflictsResolved++;
    }
  }

  // ============================================
  // SYNC OPERATIONS
  // ============================================

  /**
   * Sincronização incremental (automática)
   */
  private async performIncrementalSync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      // Upload pending changes
      await this.processUploadQueue();
      
      // Download updates (less frequent)
      if (this.shouldPerformDownload()) {
        await this.downloadUpdates();
      }
    } catch (error) {
      console.error('Erro na sincronização incremental:', error);
      this.handleSyncError(error as Error);
    } finally {
      this.isSyncing = false;
      this.notifySubscribers();
    }
  }

  /**
   * Sincronização imediata (manual ou alta prioridade)
   */
  private async performImmediateSync(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      await this.processUploadQueue();
      await this.downloadUpdates();
    } catch (error) {
      console.error('Erro na sincronização imediata:', error);
      throw error;
    } finally {
      this.isSyncing = false;
      this.notifySubscribers();
    }
  }

  /**
   * Sincronização completa (força download de tudo)
   */
  async performFullSync(): Promise<void> {
    this.isSyncing = true;
    try {
      // Upload everything
      await this.processUploadQueue();
      
      // Force download all
      await this.downloadUpdates();
      
      console.log('Sincronização completa realizada');
    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      throw error;
    } finally {
      this.isSyncing = false;
      this.notifySubscribers();
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private shouldPerformDownload(): boolean {
    if (!this.metrics.lastSuccessfulSync) return true;
    
    const timeSinceLastSync = Date.now() - this.metrics.lastSuccessfulSync.getTime();
    return timeSinceLastSync > FIRESTORE_CONFIG.CACHE.SYNC_DEBOUNCE_MS * 2;
  }

  private hasConversationConflict(localConv: any, remoteConv: FirestoreConversation): boolean {
    return Math.abs(localConv.lastActivity - remoteConv.lastActivity.toDate().getTime()) > 60000 ||
           localConv.messages?.length !== remoteConv.messages?.length;
  }

  private hasProfileConflict(localProfile: any, remoteProfile: FirestoreUserProfile): boolean {
    return localProfile.type !== remoteProfile.type ||
           JSON.stringify(localProfile.preferences) !== JSON.stringify(remoteProfile.preferences);
  }

  private getLocalConversation(id: string): any {
    // Implementar busca no localStorage ou estado local
    try {
      const stored = localStorage.getItem('conversation-history');
      if (stored) {
        const conversations = JSON.parse(stored);
        return conversations.find((conv: any) => conv.id === id);
      }
    } catch (error) {
      console.error('Erro ao buscar conversa local:', error);
    }
    return null;
  }

  private getLocalProfile(): any {
    // Implementar busca no localStorage
    try {
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        const data = JSON.parse(stored);
        return data.profile;
      }
    } catch (error) {
      console.error('Erro ao buscar perfil local:', error);
    }
    return null;
  }

  private saveConversationLocally(conversation: FirestoreConversation): void {
    // Implementar salvamento no localStorage
    // Este método seria integrado com os hooks existentes
    console.log('Salvando conversa localmente:', conversation.id);
  }

  private saveProfileLocally(profile: FirestoreUserProfile): void {
    // Implementar salvamento no localStorage
    console.log('Salvando perfil localmente:', profile.uid);
  }

  private handleSyncFailure(item: SyncItem, error: Error): void {
    console.error(`Falha definitiva na sincronização de ${item.type}:${item.id}`, error);
    this.metrics.errorRate = (this.metrics.errorRate + 1) / (this.metrics.totalSynced + 1);
  }

  private handleSyncError(error: Error): void {
    console.error('Erro geral de sincronização:', error);
    this.metrics.errorRate = (this.metrics.errorRate + 1) / Math.max(this.metrics.totalSynced, 1);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Iniciar sincronização manual
   */
  async sync(): Promise<void> {
    await this.performFullSync();
  }

  /**
   * Pausar sincronização automática
   */
  pauseSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Retomar sincronização automática
   */
  resumeSync(): void {
    if (!this.syncInterval) {
      this.startPeriodicSync();
    }
  }

  /**
   * Obter métricas de sincronização
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Obter status da fila
   */
  getQueueStatus(): { upload: number; download: number; conflicts: number } {
    return {
      upload: this.syncQueue.upload.length,
      download: this.syncQueue.download.length,
      conflicts: this.syncQueue.conflicts.length
    };
  }

  /**
   * Obter conflitos pendentes
   */
  getPendingConflicts(): SyncItem[] {
    return [...this.syncQueue.conflicts];
  }

  /**
   * Resolver conflito manualmente
   */
  async resolveConflictManually(conflictId: string, resolution: 'local' | 'remote' | 'custom', customData?: any): Promise<void> {
    const conflictIndex = this.syncQueue.conflicts.findIndex(item => item.id === conflictId);
    if (conflictIndex === -1) return;

    const conflict = this.syncQueue.conflicts[conflictIndex];
    let resolvedData;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.data.local;
        break;
      case 'remote':
        resolvedData = conflict.data.remote;
        break;
      case 'custom':
        resolvedData = customData;
        break;
    }

    // Salvar resolução
    if (conflict.type === 'conversation') {
      this.saveConversationLocally(resolvedData);
    } else if (conflict.type === 'profile') {
      this.saveProfileLocally(resolvedData);
    }

    // Upload da resolução
    this.queueForUpload(conflict.id, conflict.type, resolvedData, 'high');

    // Remover da fila de conflitos
    this.syncQueue.conflicts.splice(conflictIndex, 1);
    this.metrics.conflictsPending--;
    this.metrics.conflictsResolved++;
  }

  /**
   * Subscrever mudanças de sincronização
   */
  subscribe(callback: () => void): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, callback);
    return id;
  }

  /**
   * Remover subscrição
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Erro em callback de sincronização:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.pauseSync();
    this.subscribers.clear();
    window.removeEventListener('online', this.resumeSync);
    window.removeEventListener('offline', this.pauseSync);
  }
}