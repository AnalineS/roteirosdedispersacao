/**
 * RAG and Knowledge Base Type Definitions
 * ========================================
 *
 * Unified type definitions for RAG systems and Knowledge Base statistics.
 * This file consolidates scattered type definitions across the application.
 *
 * IMPORTANT: Use these types instead of local interface definitions.
 */

// ============================================
// BASE RAG STATS INTERFACE
// ============================================

/**
 * Core RAG system statistics interface
 * Includes all possible fields from various RAG implementations
 */
export interface RAGStats {
  // Query metrics
  totalQueries?: number;
  queriesProcessed?: number;
  avgResponseTime?: number;
  averageResponseTime?: number;

  // Cache metrics
  cacheHitRate?: number;
  cacheHits?: number;

  // Search metrics
  supabaseSearches?: number;
  avgContextScore?: number;
  avgRelevance?: number;

  // Document metrics
  documentsIndexed?: number;

  // Quality metrics
  successRate?: number;
  scopeViolations?: number;

  // System availability
  availableComponents?: {
    vectorStore: boolean;
    cache: boolean;
    searchEngine: boolean;
    openrouter: boolean;
  };

  // Extensible for additional metrics
  [key: string]: unknown;
}

// ============================================
// BASE KNOWLEDGE STATS INTERFACE
// ============================================

/**
 * Knowledge Base statistics interface
 * Covers both medical knowledge base and general knowledge metrics
 */
export interface KnowledgeStats {
  // Document structure metrics
  totalDocuments?: number;
  totalChunks?: number;
  avgDocumentLength?: number;

  // Category metrics
  categoriesCount?: Record<string, number>;

  // Search metrics
  documentsFound?: number;
  searchTime?: number;
  relevanceScore?: number;
  searchAccuracy?: number;

  // Source information
  sources?: string[];

  // Confidence and quality
  confidence?: number;

  // System information
  lastIndexUpdate?: string;
  embeddingModel?: string;

  // Extensible for additional metrics
  [key: string]: unknown;
}

// ============================================
// UNION TYPES FOR COMPATIBILITY
// ============================================

/**
 * Union type for components that can accept either RAG or Knowledge stats
 * Resolves TypeScript compatibility errors
 */
export type RAGOrKnowledgeStats = RAGStats | KnowledgeStats;

/**
 * Optional versions for components that might not have stats available
 */
export type OptionalRAGStats = RAGStats | null | undefined;
export type OptionalKnowledgeStats = KnowledgeStats | null | undefined;
export type OptionalRAGOrKnowledgeStats = RAGOrKnowledgeStats | null | undefined;

// ============================================
// SPECIALIZED INTERFACES
// ============================================

/**
 * Simple RAG stats for basic use cases (like useKnowledgeBase)
 */
export interface SimpleRAGStats {
  totalQueries: number;
  avgResponseTime: number;
  cacheHitRate: number;
}

/**
 * Complete RAG stats for advanced implementations (like SupabaseRAGClient)
 */
export interface CompleteRAGStats {
  queriesProcessed: number;
  cacheHits: number;
  supabaseSearches: number;
  avgContextScore: number;
  avgRelevance?: number;
  scopeViolations: number;
  availableComponents: {
    vectorStore: boolean;
    cache: boolean;
    searchEngine: boolean;
    openrouter: boolean;
  };
  [key: string]: unknown;
}

/**
 * Medical Knowledge Base stats (for MedicalKnowledgeBase)
 */
export interface MedicalKnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  categoriesCount: Record<string, number>;
  avgDocumentLength: number;
  lastIndexUpdate: string;
  embeddingModel: string;
  searchAccuracy: number;
}

/**
 * UI Knowledge stats for components (with all optional fields)
 */
export interface UIKnowledgeStats {
  documentsFound?: number;
  searchTime?: number;
  relevanceScore?: number;
  sources?: string[];
  confidence?: number;
  [key: string]: unknown;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard to check if stats are RAG stats
 */
export function isRAGStats(stats: unknown): stats is RAGStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    (
      'totalQueries' in stats ||
      'queriesProcessed' in stats ||
      'avgResponseTime' in stats ||
      'cacheHitRate' in stats
    )
  );
}

/**
 * Type guard to check if stats are Knowledge stats
 */
export function isKnowledgeStats(stats: unknown): stats is KnowledgeStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    (
      'totalDocuments' in stats ||
      'totalChunks' in stats ||
      'documentsFound' in stats ||
      'searchAccuracy' in stats
    )
  );
}

/**
 * Type guard for simple RAG stats
 */
export function isSimpleRAGStats(stats: unknown): stats is SimpleRAGStats {
  return (
    typeof stats === 'object' &&
    stats !== null &&
    'totalQueries' in stats &&
    'avgResponseTime' in stats &&
    'cacheHitRate' in stats
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert any RAGStats variant to the base RAGStats interface
 */
export function normalizeRAGStats(stats: any): RAGStats {
  if (!stats) return {};

  return {
    totalQueries: stats.totalQueries || stats.queriesProcessed || 0,
    avgResponseTime: stats.avgResponseTime || stats.averageResponseTime || 0,
    cacheHitRate: stats.cacheHitRate || 0,
    cacheHits: stats.cacheHits || 0,
    supabaseSearches: stats.supabaseSearches || 0,
    avgContextScore: stats.avgContextScore || 0,
    avgRelevance: stats.avgRelevance,
    documentsIndexed: stats.documentsIndexed,
    successRate: stats.successRate,
    scopeViolations: stats.scopeViolations || 0,
    availableComponents: stats.availableComponents,
    ...stats
  };
}

/**
 * Convert any KnowledgeStats variant to the base KnowledgeStats interface
 */
export function normalizeKnowledgeStats(stats: any): KnowledgeStats {
  if (!stats) return {};

  return {
    totalDocuments: stats.totalDocuments || 0,
    totalChunks: stats.totalChunks || 0,
    avgDocumentLength: stats.avgDocumentLength || 0,
    categoriesCount: stats.categoriesCount || {},
    documentsFound: stats.documentsFound,
    searchTime: stats.searchTime,
    relevanceScore: stats.relevanceScore,
    searchAccuracy: stats.searchAccuracy,
    sources: stats.sources,
    confidence: stats.confidence,
    lastIndexUpdate: stats.lastIndexUpdate,
    embeddingModel: stats.embeddingModel,
    ...stats
  };
}

// ============================================
// DEPRECATED NOTICE
// ============================================

/**
 * MIGRATION GUIDE
 * ===============
 *
 * If you have local RAGStats or KnowledgeStats interfaces, replace them with:
 *
 * ```typescript
 * // Instead of local interface definitions:
 * interface RAGStats { ... }
 *
 * // Use:
 * import { RAGStats, KnowledgeStats } from '@/types/rag-knowledge';
 * ```
 *
 * Available types:
 * - RAGStats: General purpose RAG statistics
 * - KnowledgeStats: Knowledge base statistics
 * - RAGOrKnowledgeStats: Union type for flexibility
 * - SimpleRAGStats: For basic implementations
 * - CompleteRAGStats: For advanced implementations
 * - MedicalKnowledgeStats: For medical knowledge base
 * - UIKnowledgeStats: For UI components
 */