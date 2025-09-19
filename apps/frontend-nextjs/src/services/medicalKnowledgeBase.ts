/**
 * Medical Knowledge Base Service
 * Gerencia base de conhecimento médico para sistema RAG
 * Integra com embeddings e busca semântica
 * Especializado em hanseníase e PQT (Poliquimioterapia)
 */

import { embeddingService } from './embeddingService';
import { knowledgeCache } from './simpleCache';
import { supabaseRAGClient } from './supabaseRAGClient';
import { secureLogger } from '@/utils/secureLogger';

export interface MedicalDocument {
  id: string;
  title: string;
  content: string;
  category: 'dosage' | 'protocol' | 'contraindication' | 'side_effect' | 'interaction' | 'general';
  priority: number; // 0.0 - 1.0
  source: string;
  lastUpdated: string;
  tags: string[];
  chunks?: MedicalChunk[];
  embedding?: number[];
}

export interface MedicalChunk {
  id: string;
  content: string;
  category: string;
  priority: number;
  sourceSection: string;
  wordCount: number;
  containsDosage: boolean;
  containsContraindication: boolean;
  embedding?: number[];
}

export interface SearchResult {
  document: MedicalDocument;
  chunk?: MedicalChunk;
  similarity: number;
  relevantSections: string[];
  confidence: number;
}

export interface KnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  categoriesCount: Record<string, number>;
  avgDocumentLength: number;
  lastIndexUpdate: string;
  embeddingModel: string;
  searchAccuracy: number;
}

export class MedicalKnowledgeBase {
  private static instance: MedicalKnowledgeBase;
  private cache = knowledgeCache;
  private documents: Map<string, MedicalDocument> = new Map();
  private chunks: Map<string, MedicalChunk> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private priorityIndex: Map<string, Set<string>> = new Map();
  
  private stats: KnowledgeStats = {
    totalDocuments: 0,
    totalChunks: 0,
    categoriesCount: {},
    avgDocumentLength: 0,
    lastIndexUpdate: '',
    embeddingModel: 'text-embedding-3-small',
    searchAccuracy: 0.85
  };

  private constructor() {
    this.initializeKnowledgeBase();
  }

  static getInstance(): MedicalKnowledgeBase {
    if (!MedicalKnowledgeBase.instance) {
      MedicalKnowledgeBase.instance = new MedicalKnowledgeBase();
    }
    return MedicalKnowledgeBase.instance;
  }

  /**
   * Adiciona documento médico à base de conhecimento
   */
  async addDocument(document: MedicalDocument): Promise<boolean> {
    try {
      // Gerar chunks do documento
      const chunks = await this.chunkDocument(document);
      document.chunks = chunks;

      // Gerar embedding do documento completo
      const documentEmbedding = await embeddingService.embedSingleText(
        `${document.title} ${document.content}`
      );
      document.embedding = documentEmbedding || undefined;

      // Gerar embeddings dos chunks
      for (const chunk of chunks) {
        const chunkEmbedding = await embeddingService.embedSingleText(chunk.content);
        chunk.embedding = chunkEmbedding || undefined;
        this.chunks.set(chunk.id, chunk);
      }

      // Adicionar aos índices
      this.documents.set(document.id, document);
      this.updateIndexes(document);

      // Cachear documento
      await this.cache.set(`medical_doc:${document.id}`, document, 24 * 60 * 60 * 1000);

      // Atualizar estatísticas
      this.updateStats();

      secureLogger.medical('document_added', {
        documentId: document.id,
        category: document.category,
        chunksCount: chunks.length,
        wordCount: document.content.length
      });
      return true;

    } catch (error) {
      secureLogger.error('Failed to add medical document', error as Error, {
        component: 'MedicalKnowledgeBase',
        operation: 'addDocument'
      });
      return false;
    }
  }

  /**
   * Busca semântica na base de conhecimento
   */
  async search(
    query: string,
    options?: {
      categories?: string[];
      minPriority?: number;
      maxResults?: number;
      similarity?: number;
      useChunks?: boolean;
    }
  ): Promise<SearchResult[]> {
    const {
      categories = [],
      minPriority = 0.0,
      maxResults = 10,
      similarity = 0.7,
      useChunks = true
    } = options || {};

    try {
      // Gerar embedding da query
      const queryEmbedding = await embeddingService.embedSingleText(query);
      if (!queryEmbedding) {
        return [];
      }

      const results: SearchResult[] = [];

      // Buscar em chunks ou documentos
      if (useChunks && this.chunks.size > 0) {
        await this.searchInChunks(queryEmbedding, query, results, {
          categories, minPriority, maxResults, similarity
        });
      } else {
        await this.searchInDocuments(queryEmbedding, query, results, {
          categories, minPriority, maxResults, similarity
        });
      }

      // Ordenar por relevância
      results.sort((a, b) => b.similarity - a.similarity);

      // Limitar resultados
      return results.slice(0, maxResults);

    } catch (error) {
      secureLogger.error('Medical knowledge search failed', error as Error, {
        component: 'MedicalKnowledgeBase',
        operation: 'search',
        queryLength: query.length
      });
      return [];
    }
  }

  /**
   * Busca por categoria específica
   */
  async searchByCategory(
    category: string,
    query?: string,
    maxResults: number = 5
  ): Promise<SearchResult[]> {
    return this.search(query || '', {
      categories: [category],
      maxResults,
      minPriority: 0.3
    });
  }

  /**
   * Busca informações críticas (alta prioridade)
   */
  async searchCritical(
    query: string,
    maxResults: number = 3
  ): Promise<SearchResult[]> {
    return this.search(query, {
      minPriority: 0.8,
      maxResults,
      similarity: 0.6,
      useChunks: true
    });
  }

  /**
   * Obtém documento por ID
   */
  async getDocument(id: string): Promise<MedicalDocument | undefined> {
    // Tentar cache primeiro
    let document = this.documents.get(id);
    
    if (!document) {
      const cachedDocument = await this.cache.get(`medical_doc:${id}`) as MedicalDocument | null;
      if (cachedDocument) {
        this.documents.set(id, cachedDocument);
        document = cachedDocument;
      }
    }

    return document;
  }

  /**
   * Lista documentos por categoria
   */
  getDocumentsByCategory(category: string): MedicalDocument[] {
    const docIds = this.categoryIndex.get(category) || new Set();
    return Array.from(docIds).map(id => this.documents.get(id)).filter(Boolean) as MedicalDocument[];
  }

  /**
   * Obtém estatísticas da base de conhecimento
   */
  getStats(): KnowledgeStats {
    return { ...this.stats };
  }

  /**
   * Reindex base de conhecimento
   */
  async reindexKnowledge(): Promise<boolean> {
    try {
      secureLogger.medical('reindex_started', {
        totalDocuments: this.documents.size,
        totalChunks: this.chunks.size
      });

      // Limpar índices
      this.categoryIndex.clear();
      this.priorityIndex.clear();

      // Reprocessar todos os documentos
      for (const document of this.documents.values()) {
        this.updateIndexes(document);
        
        // Regerar embeddings se necessário
        if (!document.embedding) {
          const documentEmbedding = await embeddingService.embedSingleText(
            `${document.title} ${document.content}`
          );
          document.embedding = documentEmbedding || undefined;
        }
      }

      this.updateStats();
      
      secureLogger.medical('reindex_completed', {
        totalDocuments: this.documents.size,
        totalChunks: this.chunks.size
      });
      return true;

    } catch (error) {
      secureLogger.error('Knowledge base reindex failed', error as Error, {
        component: 'MedicalKnowledgeBase',
        operation: 'reindexKnowledge'
      });
      return false;
    }
  }

  /**
   * Exporta base de conhecimento para backup
   */
  exportKnowledge(): {
    documents: MedicalDocument[];
    stats: KnowledgeStats;
    exportedAt: string;
  } {
    return {
      documents: Array.from(this.documents.values()),
      stats: this.stats,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Importa base de conhecimento de backup
   */
  async importKnowledge(backup: {
    documents: MedicalDocument[];
    stats?: KnowledgeStats;
  }): Promise<boolean> {
    try {
      secureLogger.medical('import_started', {
        documentsCount: backup.documents.length
      });

      // Limpar dados existentes
      this.documents.clear();
      this.chunks.clear();
      this.categoryIndex.clear();
      this.priorityIndex.clear();

      // Importar documentos
      for (const document of backup.documents) {
        await this.addDocument(document);
      }

      if (backup.stats) {
        this.stats = { ...backup.stats };
      }

      secureLogger.medical('import_completed', {
        documentsCount: backup.documents.length,
        totalDocuments: this.documents.size
      });
      return true;

    } catch (error) {
      secureLogger.error('Knowledge base import failed', error as Error, {
        component: 'MedicalKnowledgeBase',
        operation: 'importKnowledge'
      });
      return false;
    }
  }

  // MÉTODOS PRIVADOS

  private async initializeKnowledgeBase(): Promise<void> {
    try {
      // Carregar conhecimento base do sistema
      await this.loadBaseKnowledge();
      this.updateStats();
      secureLogger.medical('knowledge_base_initialized', {
        totalDocuments: this.stats.totalDocuments,
        totalChunks: this.stats.totalChunks
      });

    } catch (error) {
      secureLogger.error('Knowledge base initialization failed', error as Error, {
        component: 'MedicalKnowledgeBase',
        operation: 'initializeKnowledgeBase'
      });
    }
  }

  private async loadBaseKnowledge(): Promise<void> {
    // Conhecimento base essencial sobre hanseníase
    const baseDocuments: Omit<MedicalDocument, 'id' | 'lastUpdated' | 'embedding'>[] = [
      {
        title: 'PQT-U - Poliquimioterapia Única para Hanseníase',
        content: 'A Poliquimioterapia Única (PQT-U) é o tratamento padrão para hanseníase, consistindo em rifampicina 600mg mensal supervisionada, dapsona 100mg diária auto-administrada e clofazimina 300mg mensal supervisionada + 50mg diária. O tratamento dura 12 doses mensais, com duração máxima de 18 meses.',
        category: 'protocol',
        priority: 1.0,
        source: 'Ministério da Saúde - Guia Prático sobre Hanseníase',
        tags: ['pqt-u', 'poliquimioterapia', 'rifampicina', 'dapsona', 'clofazimina', 'tratamento']
      },
      {
        title: 'Rifampicina - Dosagem e Administração',
        content: 'Rifampicina 600mg é administrada uma vez por mês sob supervisão direta do profissional de saúde. Deve ser tomada com estômago vazio, preferencialmente 1 hora antes ou 2 horas após as refeições. Pode causar coloração alaranjada na urina, suor e lágrimas, o que é normal e reversível.',
        category: 'dosage',
        priority: 0.9,
        source: 'Protocolo Clínico - Hanseníase',
        tags: ['rifampicina', 'dosagem', '600mg', 'mensal', 'supervisionada', 'coloração']
      },
      {
        title: 'Dapsona - Administração Diária',
        content: 'Dapsona 100mg deve ser administrada diariamente por via oral, auto-administrada pelo paciente. Pode ser tomada com ou sem alimentos. Principais efeitos adversos incluem anemia hemolítica e metemoglobinemia. Contraindicada em casos de deficiência de G6PD.',
        category: 'dosage',
        priority: 0.9,
        source: 'Manual de Medicamentos - Hanseníase',
        tags: ['dapsona', '100mg', 'diária', 'anemia', 'g6pd', 'metemoglobinemia']
      },
      {
        title: 'Clofazimina - Efeitos e Administração',
        content: 'Clofazimina é administrada em dose de 300mg mensal supervisionada e 50mg diária auto-administrada. Pode causar hiperpigmentação da pele (coloração escura), que é dose-dependente e pode levar anos para reverter completamente após o término do tratamento.',
        category: 'side_effect',
        priority: 0.8,
        source: 'Farmacologia Clínica - Hanseníase',
        tags: ['clofazimina', 'hiperpigmentação', 'coloração', 'pele', '300mg', '50mg']
      },
      {
        title: 'Contraindicações e Precauções',
        content: 'Principais contraindicações: Rifampicina - hipersensibilidade, icterícia; Dapsona - deficiência de G6PD, anemia grave; Clofazimina - hipersensibilidade. Durante a gravidez, o tratamento deve ser mantido com adaptações. Amamentação é segura durante o tratamento PQT.',
        category: 'contraindication',
        priority: 0.9,
        source: 'Guia de Contraindicações - MS',
        tags: ['contraindicações', 'gravidez', 'amamentação', 'hipersensibilidade', 'g6pd']
      },
      {
        title: 'Interações Medicamentosas',
        content: 'Rifampicina é potente indutor enzimático, podendo reduzir eficácia de anticoncepcionais orais, anticoagulantes, antifúngicos e outros medicamentos. Dapsona pode ter absorção reduzida por antiácidos. Monitorar interações e ajustar doses conforme necessário.',
        category: 'interaction',
        priority: 0.7,
        source: 'Manual de Interações - Farmácia Clínica',
        tags: ['interações', 'rifampicina', 'anticoncepcionais', 'anticoagulantes', 'antiácidos']
      },
      {
        title: 'Adesão ao Tratamento e Orientações',
        content: 'A adesão adequada ao tratamento é fundamental para cura da hanseníase. Orientar sobre: importância de não interromper o tratamento, horários regulares de medicação, efeitos esperados (coloração da urina), quando procurar o serviço de saúde. Consultas mensais são obrigatórias.',
        category: 'general',
        priority: 0.8,
        source: 'Manual de Orientação ao Paciente',
        tags: ['adesão', 'orientações', 'consultas', 'cura', 'coloração', 'horários']
      }
    ];

    // Adicionar documentos base
    for (let i = 0; i < baseDocuments.length; i++) {
      const doc = baseDocuments[i];
      const fullDocument: MedicalDocument = {
        ...doc,
        id: `base_${i + 1}`,
        lastUpdated: new Date().toISOString()
      };

      await this.addDocument(fullDocument);
    }
  }

  private async chunkDocument(document: MedicalDocument): Promise<MedicalChunk[]> {
    const chunks: MedicalChunk[] = [];
    const content = document.content;
    
    // Chunking simples por sentenças
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let chunkId = 1;
    for (let i = 0; i < sentences.length; i += 2) { // 2 sentenças por chunk
      const chunkContent = sentences.slice(i, i + 2).join('. ').trim() + '.';
      
      const chunk: MedicalChunk = {
        id: `${document.id}_chunk_${chunkId++}`,
        content: chunkContent,
        category: document.category,
        priority: document.priority,
        sourceSection: `${document.title} - Seção ${chunkId}`,
        wordCount: chunkContent.split(' ').length,
        containsDosage: /\d+\s*(mg|g|ml|comprimido|dose)/i.test(chunkContent),
        containsContraindication: /(contraindicad|não.*administrar|evitar|precauç)/i.test(chunkContent)
      };

      chunks.push(chunk);
    }

    return chunks;
  }

  private async searchInChunks(
    queryEmbedding: number[],
    query: string,
    results: SearchResult[],
    options: {
      categories: string[];
      minPriority: number;
      maxResults: number;
      similarity: number;
    }
  ): Promise<void> {
    for (const chunk of this.chunks.values()) {
      if (!chunk.embedding) continue;

      // Filtros
      if (options.categories.length > 0 && !options.categories.includes(chunk.category)) {
        continue;
      }
      
      if (chunk.priority < options.minPriority) {
        continue;
      }

      // Calcular similaridade
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      
      if (similarity >= options.similarity) {
        // Encontrar documento pai
        const documentId = chunk.id.split('_chunk_')[0];
        const document = this.documents.get(documentId);
        
        if (document) {
          results.push({
            document,
            chunk,
            similarity,
            relevantSections: [chunk.sourceSection],
            confidence: this.calculateConfidence(similarity, chunk)
          });
        }
      }
    }
  }

  private async searchInDocuments(
    queryEmbedding: number[],
    query: string,
    results: SearchResult[],
    options: {
      categories: string[];
      minPriority: number;
      maxResults: number;
      similarity: number;
    }
  ): Promise<void> {
    for (const document of this.documents.values()) {
      if (!document.embedding) continue;

      // Filtros
      if (options.categories.length > 0 && !options.categories.includes(document.category)) {
        continue;
      }
      
      if (document.priority < options.minPriority) {
        continue;
      }

      // Calcular similaridade
      const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
      
      if (similarity >= options.similarity) {
        results.push({
          document,
          similarity,
          relevantSections: [document.title],
          confidence: this.calculateConfidence(similarity, document)
        });
      }
    }
  }

  private updateIndexes(document: MedicalDocument): void {
    // Índice por categoria
    if (!this.categoryIndex.has(document.category)) {
      this.categoryIndex.set(document.category, new Set());
    }
    this.categoryIndex.get(document.category)!.add(document.id);

    // Índice por prioridade
    const priorityLevel = document.priority >= 0.8 ? 'high' : 
                         document.priority >= 0.5 ? 'medium' : 'low';
    if (!this.priorityIndex.has(priorityLevel)) {
      this.priorityIndex.set(priorityLevel, new Set());
    }
    this.priorityIndex.get(priorityLevel)!.add(document.id);
  }

  private updateStats(): void {
    this.stats.totalDocuments = this.documents.size;
    this.stats.totalChunks = this.chunks.size;
    
    // Contar por categoria
    this.stats.categoriesCount = {};
    for (const [category, docIds] of this.categoryIndex.entries()) {
      this.stats.categoriesCount[category] = docIds.size;
    }

    // Calcular comprimento médio
    const lengths = Array.from(this.documents.values()).map(doc => doc.content.length);
    this.stats.avgDocumentLength = lengths.length > 0 ? 
      lengths.reduce((sum, len) => sum + len, 0) / lengths.length : 0;

    this.stats.lastIndexUpdate = new Date().toISOString();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private calculateConfidence(similarity: number, item: MedicalDocument | MedicalChunk): number {
    const baseSimilarity = similarity;
    const priorityBonus = 'priority' in item ? item.priority * 0.1 : 0;
    const categoryBonus = ['dosage', 'contraindication'].includes(item.category) ? 0.1 : 0;
    
    return Math.min(1.0, baseSimilarity + priorityBonus + categoryBonus);
  }
}

// Instância singleton
export const medicalKnowledgeBase = MedicalKnowledgeBase.getInstance();

// Funções de conveniência
export async function searchMedicalKnowledge(
  query: string,
  options?: Parameters<MedicalKnowledgeBase['search']>[1]
): Promise<SearchResult[]> {
  return medicalKnowledgeBase.search(query, options);
}

export async function searchDosageInfo(query: string): Promise<SearchResult[]> {
  return medicalKnowledgeBase.searchByCategory('dosage', query);
}

export async function searchContraindications(query: string): Promise<SearchResult[]> {
  return medicalKnowledgeBase.searchByCategory('contraindication', query);
}

export async function searchCriticalInfo(query: string): Promise<SearchResult[]> {
  return medicalKnowledgeBase.searchCritical(query);
}

export default medicalKnowledgeBase;