/**
 * API Integration Layer - Next.js
 * Conecta com o backend Python que usa prompts de IA e personas
 * Integrado com sistema robusto de tratamento de erros
 * Uses centralized environment configuration system
 */

import { logger } from '@/utils/logger';
import type { ChatMessage, ChatSession } from '@/types/api';
import config from '@/config/environment';

// Re-export types for external use
export type { ChatMessage, ChatSession } from '@/types/api';

// Validate API URL to ensure it's a safe HTTP(S) URL (CWE-20 fix)
const validateApiUrl = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.log(`[API Config] Invalid protocol in URL: ${parsed.protocol}`);
      return '';
    }
    return parsed.origin;
  } catch {
    logger.log(`[API Config] Invalid URL format: ${url}`);
    return '';
  }
};

// Environment-aware API configuration
const getApiConfig = (): { apiUrl: string; timeout: number; retries: number } => {
  const rawApiUrl = config.api.baseUrl;
  const apiUrl = validateApiUrl(rawApiUrl) || ''; // Empty string = relative URLs, never bypass validation
  const timeout = config.api.timeout;
  const retries = config.api.retries;

  logger.log(`[API Config] Environment: ${config.environment}`);
  logger.log(`[API Config] Base URL: ${apiUrl}`);
  logger.log(`[API Config] Timeout: ${timeout}ms, Retries: ${retries}`);

  return { apiUrl, timeout, retries };
};

const { apiUrl: API_BASE_URL, timeout: API_TIMEOUT, retries: API_RETRIES } = getApiConfig();

// Import dados estáticos para fallback
import { STATIC_PERSONAS } from '@/data/personas';

/**
 * Busca configurações de personas para uso nos hooks
 * Alias para getPersonas() para compatibilidade com hooks
 */
export async function getPersonaConfigs(): Promise<PersonasResponse> {
  try {
    const personas = await getPersonas();
    logger.log('[getPersonaConfigs] Received personas:', Object.keys(personas || {}).length);
    // Garantir que nunca retorna null/undefined
    return personas || STATIC_PERSONAS;
  } catch (error) {
    logger.error('[getPersonaConfigs] Exception caught, returning static personas:', error);
    return STATIC_PERSONAS;
  }
}

/**
 * Busca personas do backend ou retorna dados estáticos em modo offline
 */
export async function getPersonas(): Promise<PersonasResponse> {
  // Se backend está em modo offline, usar dados estáticos
  if (!API_BASE_URL) {
    logger.log('[Personas] Modo offline ativo, usando dados estáticos');
    return STATIC_PERSONAS;
  }

  const maxRetries = config.features.offline ? 1 : API_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/api/v1/personas`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log(`[Personas] Carregadas do backend com sucesso (tentativa ${attempt})`);
      return data;
    } catch (error) {
      lastError = error as Error;
      logger.log(`[Personas] Tentativa ${attempt}/${maxRetries} falhou:`, error);

      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  logger.error('[Personas] Todas as tentativas falharam, usando dados estáticos:', lastError);

  // Capturar erro no sistema centralizado
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('show-error-toast', {
      detail: {
        errorId: `api_personas_${Date.now()}`,
        severity: 'medium',
        message: 'Conectando com servidor offline. Usando dados locais.'
      }
    });
    window.dispatchEvent(event);
  }

  return STATIC_PERSONAS;
}

export interface Persona {
  name: string;
  description: string;
  avatar: string;
  personality: string;
  expertise: string[];
  response_style: string;
  target_audience: string;
  system_prompt: string;
  capabilities: string[];
  example_questions: string[];
  limitations: string[];
  response_format: {
    technical: boolean;
    citations?: boolean;
    structured?: boolean;
    empathetic?: boolean;
  };
}

export interface PersonasResponse {
  [key: string]: Persona;
}

// ChatMessage interface moved to @/types/api

export interface ChatAttachmentPayload {
  fileName: string;
  mimeType: string;
  base64Data: string;
  sizeBytes: number;
}

export interface ChatRequest {
  question: string;
  personality_id: string;
  conversation_history?: ChatMessage[];
  sentiment?: {
    category: string;
    score: number;
    magnitude: number;
  };
  knowledge_context?: {
    context: string;
    confidence: number;
    sources: string[];
  };
  attachment?: ChatAttachmentPayload;
}

export interface ChatResponse {
  answer: string;
  persona: string;
  timestamp?: string;
  request_id: string;
  processing_time_ms?: number;
  confidence?: number;
  name?: string;
  api_version?: string;
  metadata?: {
    tokens_used?: number;
    model_used?: string;
    context_retrieved?: boolean;
    scope_detected?: string;
  };
}


/**
 * Envia mensagem para o chat com fallback offline
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  // Se backend indisponível, usar resposta offline
  if (!API_BASE_URL) {
    logger.warn('[Chat] Backend indisponível, gerando resposta offline');
    return generateOfflineResponse(request);
  }

  const maxRetries = config.features.offline ? 1 : API_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log(`[Chat] Resposta recebida com sucesso (tentativa ${attempt})`);
      return data;
    } catch (error) {
      lastError = error as Error;
      logger.log(`[Chat] Tentativa ${attempt}/${maxRetries} falhou:`, error);

      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  logger.error('[Chat] Todas as tentativas falharam, usando resposta offline:', lastError);
  return generateOfflineResponse(request);
}

/**
 * Gera resposta offline quando backend indisponível
 */
function generateOfflineResponse(request: ChatRequest): ChatResponse {
  const isGa = request.personality_id === 'ga';
  const persona = isGa ? 'Gá' : 'Dr. Gasnelio';
  const emoji = isGa ? '🤗' : '👨‍⚕️';
  
  // Resposta básica informando sobre indisponibilidade
  const offlineMessage = isGa 
    ? `${emoji} Oi! Sou o Gá e estou aqui para te ajudar com informações sobre hanseníase. 

No momento, estou funcionando em modo offline, então minhas respostas podem ser mais limitadas. 

Para sua pergunta sobre: "${request.question}"

📚 Recomendo que consulte:
• O material educativo disponível nesta plataforma
• Seu médico ou farmacêutico para orientações específicas
• A cartilha oficial do Ministério da Saúde sobre hanseníase

Lembre-se: é muito importante seguir corretamente o tratamento PQT-U e não interromper os medicamentos. O tratamento da hanseníase tem cura quando feito adequadamente! 💚`
    
    : `${emoji} Dr. Gasnelio aqui. Atualmente funcionando em modo offline.

Sua consulta: "${request.question}"

📋 **Informações gerais sobre PQT-U:**
• Duração: 6 meses para hanseníase paucibacilar
• Medicamentos: Rifampicina, Dapsona, Clofazimina
• Administração: Dose supervisionada mensal + autoadministração diária

⚠️ **Importante:** Para orientações específicas sobre dosagem, interações medicamentosas ou efeitos adversos, consulte sempre um profissional de saúde qualificado.

📖 Consulte o material técnico disponível nesta plataforma para informações detalhadas baseadas no PCDT Hanseníase 2022.`;

  return {
    answer: offlineMessage,
    persona: persona,
    request_id: `offline_${Date.now()}`,
    timestamp: new Date().toISOString(),
    processing_time_ms: 100,
    confidence: 0.8,
    name: persona,
    api_version: "offline_v1.0",
    metadata: {
      tokens_used: 0,
      model_used: "offline_fallback",
      context_retrieved: false,
      scope_detected: "offline_mode"
    }
  };
}

/**
 * Verifica saúde da API com fallback inteligente
 */
export async function checkAPIHealth(): Promise<{
  available: boolean;
  url: string | null;
  error?: string;
  fallbackActive: boolean;
}> {
  // Se URL é null, backend está indisponível
  if (!API_BASE_URL) {
    logger.warn('[API Health] Backend temporariamente indisponível');
    return {
      available: false,
      url: null,
      error: 'Backend em manutenção - usando modo offline',
      fallbackActive: true
    };
  }

  // Lista de endpoints para testar (ordem de prioridade)
  const healthEndpoints = [
    '/api/v1/health',
    '/api/health',
    '/health',
    '/'
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(API_TIMEOUT, 5000));

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        logger.log(`[API Health] Conectado com sucesso no ambiente ${config.environment}`);
        return {
          available: true,
          url: API_BASE_URL,
          fallbackActive: false
        };
      }
    } catch (error) {
      logger.log(`[API Health] Falha na conexão com ${endpoint}:`, error);
      continue;
    }
  }

  // Se chegou aqui, nenhum endpoint funcionou
  logger.error('[API Health] Todos os endpoints falharam, usando modo offline');
  return {
    available: false,
    url: API_BASE_URL,
    error: 'Backend indisponível - usando funcionalidades básicas',
    fallbackActive: true
  };
}

/**
 * Detecta escopo da pergunta
 */
export async function detectQuestionScope(question: string): Promise<{ scope: string; confidence: number; details: string; category?: string; is_medical?: boolean; offline_mode?: boolean; offline_fallback?: boolean }> {
  // Se backend está em modo offline, retornar escopo padrão
  if (!API_BASE_URL) {
    logger.log('[Scope] Modo offline ativo, retornando escopo padrão');
    return {
      scope: 'medical_general',
      confidence: 0.8,
      details: 'Modo offline - escopo médico geral detectado',
      category: 'hanseniase',
      is_medical: true,
      offline_mode: true
    };
  }

  const maxRetries = config.features.offline ? 1 : Math.min(API_RETRIES, 2);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/api/v1/scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logger.log(`[Scope] Detectado com sucesso: ${result.scope} (tentativa ${attempt})`);
      return result;
    } catch (error) {
      lastError = error as Error;
      logger.log(`[Scope] Tentativa ${attempt}/${maxRetries} falhou:`, error);

      if (attempt < maxRetries) {
        const backoffDelay = Math.min(500 * attempt, 2000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  logger.error('Erro ao detectar escopo após todas as tentativas:', lastError);
  // Fallback para escopo offline
  return {
    scope: 'medical_general',
    confidence: 0.6,
    details: 'Fallback para escopo médico geral após erro de rede',
    category: 'hanseniase',
    is_medical: true,
    offline_fallback: true
  };
}

/**
 * API Client para requisições HTTP com retry e timeout configuráveis
 */
export const apiClient = {
  async post<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    // Verificar se backend está em modo offline
    if (!API_BASE_URL) {
      logger.log('[ApiClient] POST - Modo offline ativo');
      throw new Error('Backend em modo offline');
    }

    const maxRetries = config.features.offline ? 1 : API_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        logger.log(`[ApiClient] POST ${endpoint} sucesso (tentativa ${attempt})`);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.log(`[ApiClient] POST ${endpoint} tentativa ${attempt}/${maxRetries} falhou:`, error);

        if (attempt < maxRetries) {
          const backoffDelay = Math.min(1000 * attempt, 3000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    logger.error(`Erro na requisição POST para ${endpoint} após todas as tentativas:`, lastError);
    throw lastError;
  },

  async get<T>(endpoint: string): Promise<T> {
    // Verificar se backend está em modo offline
    if (!API_BASE_URL) {
      logger.log('[ApiClient] GET - Modo offline ativo');
      throw new Error('Backend em modo offline');
    }

    const maxRetries = config.features.offline ? 1 : API_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        logger.log(`[ApiClient] GET ${endpoint} sucesso (tentativa ${attempt})`);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.log(`[ApiClient] GET ${endpoint} tentativa ${attempt}/${maxRetries} falhou:`, error);

        if (attempt < maxRetries) {
          const backoffDelay = Math.min(1000 * attempt, 3000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    logger.error(`Erro na requisição GET para ${endpoint} após todas as tentativas:`, lastError);
    throw lastError;
  },
};