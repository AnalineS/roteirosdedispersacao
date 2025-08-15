/**
 * Conflict Resolution - Resolução de Conflitos de Sincronização
 * Sistema inteligente para resolver conflitos entre dados locais e remotos
 * Implementa estratégias baseadas em timestamps, conteúdo e contexto
 */

import { Timestamp } from 'firebase/firestore';
import { 
  FirestoreConversation, 
  FirestoreUserProfile, 
  FirestoreMessage 
} from '@/lib/firebase/types';

// ============================================
// TYPES
// ============================================

export type ConflictStrategy = 'client_wins' | 'server_wins' | 'merge' | 'ask_user';

export interface ConflictResolutionResult<T> {
  resolved: T;
  strategy: ConflictStrategy;
  confidence: number;
  explanation: string;
  requiresUserInput?: boolean;
  metadata?: {
    conflictType: string;
    affectedFields: string[];
    autoResolved: boolean;
  };
}

export interface ConflictContext {
  lastSync?: Date;
  userActivity?: Date;
  dataAge?: number;
  importance?: 'low' | 'medium' | 'high';
}

// ============================================
// CONVERSATION CONFLICT RESOLUTION
// ============================================

export class ConversationConflictResolver {
  /**
   * Resolve conflitos entre conversas local e remota
   */
  static resolve(
    localConv: any, // Conversation local
    remoteConv: FirestoreConversation,
    context: ConflictContext = {}
  ): ConflictResolutionResult<FirestoreConversation> {
    
    // Analisar tipo de conflito
    const conflictAnalysis = this.analyzeConflict(localConv, remoteConv);
    
    switch (conflictAnalysis.type) {
      case 'messages_diverged':
        return this.resolveDivergedMessages(localConv, remoteConv, context);
      
      case 'metadata_conflict':
        return this.resolveMetadataConflict(localConv, remoteConv, context);
      
      case 'title_conflict':
        return this.resolveTitleConflict(localConv, remoteConv, context);
      
      case 'no_conflict':
        return {
          resolved: remoteConv,
          strategy: 'server_wins',
          confidence: 1.0,
          explanation: 'Nenhum conflito detectado'
        };
      
      default:
        return this.fallbackResolution(localConv, remoteConv, context);
    }
  }

  private static analyzeConflict(localConv: any, remoteConv: FirestoreConversation) {
    const localMessageIds = localConv.messages?.map((m: any) => m.id) || [];
    const remoteMessageIds = remoteConv.messages?.map(m => m.id) || [];
    
    // Verificar divergência de mensagens
    if (localMessageIds.length !== remoteMessageIds.length) {
      return { type: 'messages_diverged', severity: 'high' };
    }
    
    // Verificar se IDs das mensagens diferem
    const messagesDiffer = localMessageIds.some((id: string, index: number) => 
      id !== remoteMessageIds[index]
    );
    
    if (messagesDiffer) {
      return { type: 'messages_diverged', severity: 'medium' };
    }
    
    // Verificar metadados
    if (localConv.title !== remoteConv.title) {
      return { type: 'title_conflict', severity: 'low' };
    }
    
    if (Math.abs(localConv.lastActivity - remoteConv.lastActivity.toDate().getTime()) > 60000) {
      return { type: 'metadata_conflict', severity: 'low' };
    }
    
    return { type: 'no_conflict', severity: 'none' };
  }

  private static resolveDivergedMessages(
    localConv: any,
    remoteConv: FirestoreConversation,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreConversation> {
    
    const localMessages = localConv.messages || [];
    const remoteMessages = remoteConv.messages || [];
    
    // Estratégia: Merge inteligente baseado em timestamps
    const mergedMessages = this.mergeMessages(localMessages, remoteMessages);
    
    const resolved: FirestoreConversation = {
      ...remoteConv,
      messages: mergedMessages,
      lastActivity: new Date(Math.max(
        localConv.lastActivity || 0,
        remoteConv.lastActivity.toDate().getTime()
      )) as any, // Will be converted to Timestamp
      messageCount: mergedMessages.length
    };

    return {
      resolved,
      strategy: 'merge',
      confidence: 0.85,
      explanation: `Mescladas ${mergedMessages.length} mensagens de ambas as fontes`,
      metadata: {
        conflictType: 'messages_diverged',
        affectedFields: ['messages', 'messageCount', 'lastActivity'],
        autoResolved: true
      }
    };
  }

  private static mergeMessages(localMessages: any[], remoteMessages: FirestoreMessage[]): FirestoreMessage[] {
    const messageMap = new Map<string, FirestoreMessage>();
    
    // Adicionar mensagens remotas primeiro
    remoteMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Adicionar/sobrescrever com mensagens locais mais recentes
    localMessages.forEach((localMsg: any) => {
      const existingMsg = messageMap.get(localMsg.id);
      
      if (!existingMsg) {
        // Mensagem só existe localmente - adicionar
        messageMap.set(localMsg.id, {
          id: localMsg.id,
          content: localMsg.content,
          role: localMsg.role,
          timestamp: new Date(localMsg.timestamp) as any,
          persona: localMsg.persona
        });
      } else {
        // Verificar qual é mais recente
        const localTimestamp = new Date(localMsg.timestamp);
        const remoteTimestamp = existingMsg.timestamp.toDate();
        
        if (localTimestamp > remoteTimestamp) {
          messageMap.set(localMsg.id, {
            id: localMsg.id,
            content: localMsg.content,
            role: localMsg.role,
            timestamp: localTimestamp as any,
            persona: localMsg.persona
          });
        }
      }
    });
    
    // Retornar mensagens ordenadas por timestamp
    return Array.from(messageMap.values())
      .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());
  }

  private static resolveTitleConflict(
    localConv: any,
    remoteConv: FirestoreConversation,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreConversation> {
    
    // Preferir título mais descritivo ou mais recente
    let resolvedTitle = remoteConv.title;
    let strategy: ConflictStrategy = 'server_wins';
    let explanation = 'Mantido título do servidor';
    
    // Se título local é mais longo e mais descritivo
    if (localConv.title && localConv.title.length > remoteConv.title.length + 10) {
      resolvedTitle = localConv.title;
      strategy = 'client_wins';
      explanation = 'Título local é mais descritivo';
    }
    
    // Se atividade local é mais recente
    else if (context.userActivity && context.lastSync) {
      const timeSinceActivity = Date.now() - context.userActivity.getTime();
      const timeSinceSync = Date.now() - context.lastSync.getTime();
      
      if (timeSinceActivity < timeSinceSync && localConv.title) {
        resolvedTitle = localConv.title;
        strategy = 'client_wins';
        explanation = 'Título modificado recentemente pelo usuário';
      }
    }

    return {
      resolved: {
        ...remoteConv,
        title: resolvedTitle,
        lastActivity: new Date(Math.max(
          localConv.lastActivity || 0,
          remoteConv.lastActivity.toDate().getTime()
        )) as any
      },
      strategy,
      confidence: 0.75,
      explanation,
      metadata: {
        conflictType: 'title_conflict',
        affectedFields: ['title'],
        autoResolved: true
      }
    };
  }

  private static resolveMetadataConflict(
    localConv: any,
    remoteConv: FirestoreConversation,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreConversation> {
    
    // Para metadados, geralmente preferir dados mais recentes
    const resolved: FirestoreConversation = {
      ...remoteConv,
      lastActivity: new Date(Math.max(
        localConv.lastActivity || 0,
        remoteConv.lastActivity.toDate().getTime()
      )) as any
    };

    return {
      resolved,
      strategy: 'merge',
      confidence: 0.9,
      explanation: 'Metadados mesclados com timestamps mais recentes',
      metadata: {
        conflictType: 'metadata_conflict',
        affectedFields: ['lastActivity'],
        autoResolved: true
      }
    };
  }

  private static fallbackResolution(
    localConv: any,
    remoteConv: FirestoreConversation,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreConversation> {
    
    // Em caso de conflito não identificado, preferir servidor por segurança
    return {
      resolved: remoteConv,
      strategy: 'server_wins',
      confidence: 0.5,
      explanation: 'Conflito complexo - mantidos dados do servidor por segurança',
      requiresUserInput: true,
      metadata: {
        conflictType: 'unknown',
        affectedFields: ['unknown'],
        autoResolved: false
      }
    };
  }
}

// ============================================
// USER PROFILE CONFLICT RESOLUTION
// ============================================

export class UserProfileConflictResolver {
  /**
   * Resolve conflitos entre perfis local e remoto
   */
  static resolve(
    localProfile: any,
    remoteProfile: FirestoreUserProfile,
    context: ConflictContext = {}
  ): ConflictResolutionResult<FirestoreUserProfile> {
    
    const conflictAnalysis = this.analyzeProfileConflict(localProfile, remoteProfile);
    
    switch (conflictAnalysis.type) {
      case 'preferences_conflict':
        return this.resolvePreferencesConflict(localProfile, remoteProfile, context);
      
      case 'history_conflict':
        return this.resolveHistoryConflict(localProfile, remoteProfile, context);
      
      case 'profile_type_conflict':
        return this.resolveProfileTypeConflict(localProfile, remoteProfile, context);
      
      case 'no_conflict':
        return {
          resolved: remoteProfile,
          strategy: 'server_wins',
          confidence: 1.0,
          explanation: 'Perfis são compatíveis'
        };
      
      default:
        return this.fallbackProfileResolution(localProfile, remoteProfile, context);
    }
  }

  private static analyzeProfileConflict(localProfile: any, remoteProfile: FirestoreUserProfile) {
    // Verificar tipo de perfil
    if (localProfile.type !== remoteProfile.type) {
      return { type: 'profile_type_conflict', severity: 'high' };
    }
    
    // Verificar preferências
    const localPrefs = localProfile.preferences || {};
    const remotePrefs = remoteProfile.preferences || {};
    
    if (JSON.stringify(localPrefs) !== JSON.stringify(remotePrefs)) {
      return { type: 'preferences_conflict', severity: 'medium' };
    }
    
    // Verificar histórico
    const localHistory = localProfile.history || {};
    const remoteHistory = remoteProfile.history || {};
    
    if (localHistory.conversationCount !== remoteHistory.conversationCount) {
      return { type: 'history_conflict', severity: 'low' };
    }
    
    return { type: 'no_conflict', severity: 'none' };
  }

  private static resolvePreferencesConflict(
    localProfile: any,
    remoteProfile: FirestoreUserProfile,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreUserProfile> {
    
    // Mesclar preferências favorecendo mudanças recentes do usuário
    const mergedPreferences = {
      ...remoteProfile.preferences,
      ...localProfile.preferences
    };

    // Se há atividade recente, preferir configurações locais
    if (context.userActivity) {
      const timeSinceActivity = Date.now() - context.userActivity.getTime();
      if (timeSinceActivity < 3600000) { // 1 hora
        // Usuário mudou configurações recentemente
        Object.assign(mergedPreferences, localProfile.preferences);
      }
    }

    return {
      resolved: {
        ...remoteProfile,
        preferences: mergedPreferences
      },
      strategy: 'merge',
      confidence: 0.8,
      explanation: 'Preferências mescladas favorecendo mudanças recentes',
      metadata: {
        conflictType: 'preferences_conflict',
        affectedFields: ['preferences'],
        autoResolved: true
      }
    };
  }

  private static resolveHistoryConflict(
    localProfile: any,
    remoteProfile: FirestoreUserProfile,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreUserProfile> {
    
    const localHistory = localProfile.history || {};
    const remoteHistory = remoteProfile.history || {};
    
    // Mesclar histórico somando valores quando apropriado
    const mergedHistory = {
      ...remoteHistory,
      ...localHistory,
      conversationCount: Math.max(
        localHistory.conversationCount || 0,
        remoteHistory.conversationCount || 0
      ),
      totalSessions: Math.max(
        localHistory.totalSessions || 0,
        remoteHistory.totalSessions || 0
      ),
      totalTimeSpent: Math.max(
        localHistory.totalTimeSpent || 0,
        remoteHistory.totalTimeSpent || 0
      ),
      preferredTopics: [
        ...(remoteHistory.preferredTopics || []),
        ...(localHistory.preferredTopics || [])
      ].filter((topic, index, arr) => arr.indexOf(topic) === index), // Remove duplicatas
      completedModules: [
        ...(remoteHistory.completedModules || []),
        ...(localHistory.completedModules || [])
      ].filter((module, index, arr) => arr.indexOf(module) === index),
      achievements: [
        ...(remoteHistory.achievements || []),
        ...(localHistory.achievements || [])
      ].filter((achievement, index, arr) => arr.indexOf(achievement) === index)
    };

    return {
      resolved: {
        ...remoteProfile,
        history: mergedHistory
      },
      strategy: 'merge',
      confidence: 0.9,
      explanation: 'Histórico mesclado preservando progresso de ambas as fontes',
      metadata: {
        conflictType: 'history_conflict',
        affectedFields: ['history'],
        autoResolved: true
      }
    };
  }

  private static resolveProfileTypeConflict(
    localProfile: any,
    remoteProfile: FirestoreUserProfile,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreUserProfile> {
    
    // Conflito de tipo de perfil é sério - requer decisão do usuário
    return {
      resolved: remoteProfile,
      strategy: 'server_wins',
      confidence: 0.3,
      explanation: 'Conflito de tipo de perfil detectado - mantido perfil do servidor',
      requiresUserInput: true,
      metadata: {
        conflictType: 'profile_type_conflict',
        affectedFields: ['type', 'focus'],
        autoResolved: false
      }
    };
  }

  private static fallbackProfileResolution(
    localProfile: any,
    remoteProfile: FirestoreUserProfile,
    context: ConflictContext
  ): ConflictResolutionResult<FirestoreUserProfile> {
    
    return {
      resolved: remoteProfile,
      strategy: 'server_wins',
      confidence: 0.5,
      explanation: 'Conflito de perfil não identificado - mantidos dados do servidor',
      requiresUserInput: true,
      metadata: {
        conflictType: 'unknown_profile_conflict',
        affectedFields: ['unknown'],
        autoResolved: false
      }
    };
  }
}

// ============================================
// CONFLICT RESOLUTION MANAGER
// ============================================

export class ConflictResolutionManager {
  private static conflictHistory: Map<string, ConflictResolutionResult<any>[]> = new Map();

  /**
   * Resolve conflito e salva no histórico
   */
  static async resolveConflict<T>(
    type: 'conversation' | 'profile',
    localData: any,
    remoteData: T,
    context: ConflictContext = {}
  ): Promise<ConflictResolutionResult<T>> {
    
    let result: ConflictResolutionResult<T>;
    
    if (type === 'conversation') {
      result = ConversationConflictResolver.resolve(
        localData, 
        remoteData as FirestoreConversation, 
        context
      ) as ConflictResolutionResult<T>;
    } else if (type === 'profile') {
      result = UserProfileConflictResolver.resolve(
        localData, 
        remoteData as FirestoreUserProfile, 
        context
      ) as ConflictResolutionResult<T>;
    } else {
      throw new Error(`Tipo de conflito não suportado: ${type}`);
    }
    
    // Salvar no histórico
    const key = type + '_conflicts';
    const history = this.conflictHistory.get(key) || [];
    history.push(result);
    this.conflictHistory.set(key, history.slice(-10)); // Manter apenas últimos 10
    
    return result;
  }

  /**
   * Obter estatísticas de resolução de conflitos
   */
  static getConflictStats() {
    const stats = {
      totalConflicts: 0,
      autoResolved: 0,
      userInputRequired: 0,
      strategyCounts: {
        client_wins: 0,
        server_wins: 0,
        merge: 0,
        ask_user: 0
      }
    };

    this.conflictHistory.forEach(conflicts => {
      conflicts.forEach(conflict => {
        stats.totalConflicts++;
        if (conflict.metadata?.autoResolved) stats.autoResolved++;
        if (conflict.requiresUserInput) stats.userInputRequired++;
        stats.strategyCounts[conflict.strategy]++;
      });
    });

    return stats;
  }

  /**
   * Limpar histórico de conflitos
   */
  static clearHistory() {
    this.conflictHistory.clear();
  }
}