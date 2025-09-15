/**
 * API Integration Layer - Next.js
 * Conecta com o backend Python que usa prompts de IA e personas
 * Integrado com sistema robusto de tratamento de erros
 */

import { useErrorHandler } from '@/hooks/useErrorHandler';

// Configuração simplificada de API URL
const getApiUrl = (): string => {
  // PRIORIDADE 1: Variável de ambiente explícita
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    console.log(`[API] Usando URL do ambiente: ${envUrl}`);
    return envUrl.trim();
  }
  
  // PRIORIDADE 2: URLs específicas por ambiente via GitHub Variables
  const hmlApiUrl = process.env.NEXT_PUBLIC_API_URL_STAGING;
  const prodApiUrl = process.env.NEXT_PUBLIC_API_URL_PRODUCTION;
  const devApiUrl = process.env.NEXT_PUBLIC_DEV_API_URL || 'http://localhost:8080';
  
  // PRIORIDADE 3: Detectar ambiente baseado no hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[API] Ambiente local detectado');
      return devApiUrl;
    }
    
    // Homologação
    if (hostname.includes('hml-roteiros-de-dispensacao.web.app')) {
      console.log('[API] Ambiente de homologação detectado');
      if (!hmlApiUrl) {
        console.error('[API] NEXT_PUBLIC_API_URL_STAGING não configurada');
        return devApiUrl;
      }
      return hmlApiUrl;
    }

    // Produção
    if (hostname.includes('roteirosdispensacao.com') || hostname.includes('roteiros-de-dispensacao.web.app')) {
      console.log('[API] Produção detectada, usando Cloud Run');
      if (!prodApiUrl) {
        console.error('[API] NEXT_PUBLIC_API_URL_PRODUCTION não configurada');
        return devApiUrl;
      }
      return prodApiUrl;
    }

    console.log('[API] Hostname não reconhecido, usando desenvolvimento');
    return devApiUrl;
  }
  
  // PRIORIDADE 4: Fallback para desenvolvimento (SSR)
  console.log('[API] Fallback para desenvolvimento (SSR)');
  return devApiUrl;
};

const API_BASE_URL = getApiUrl();

// Import dados estáticos para fallback
import { STATIC_PERSONAS } from '@/data/personas';

/**
 * Busca personas do backend ou retorna dados estáticos em modo offline
 */
export async function getPersonas(): Promise<PersonasResponse> {
  // Se backend está em modo offline, usar dados estáticos
  if (!API_BASE_URL) {
    console.log('[Personas] Modo offline ativo, usando dados estáticos');
    return STATIC_PERSONAS;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/personas`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Personas] Carregadas do backend:', Object.keys(data).length);
    return data;
  } catch (error) {
    console.error('[Personas] Erro no backend, usando dados estáticos:', error);
    
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

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  persona?: string;
  metadata?: {
    isFallback?: boolean;
    fallbackSource?: 'cache' | 'local_knowledge' | 'emergency' | 'generic';
    confidence?: number;
    suggestion?: string;
    emergency_contact?: string;
  };
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
  const apiUrl = getApiUrl();
  
  // Se backend indisponível, usar resposta offline
  if (!apiUrl) {
    console.warn('[Chat] Backend indisponível, gerando resposta offline');
    return generateOfflineResponse(request);
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${apiUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Chat] Erro no backend, usando resposta offline:', error);
    return generateOfflineResponse(request);
  }
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
  const apiUrl = getApiUrl();
  
  // Se URL é null, backend está indisponível
  if (!apiUrl) {
    console.warn('[API Health] Backend temporariamente indisponível');
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
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`[API Health] Conectado via ${endpoint}`);
        return {
          available: true,
          url: apiUrl,
          fallbackActive: false
        };
      }
    } catch (error) {
      console.log(`[API Health] Falhou em ${endpoint}:`, error instanceof Error ? error.message : 'Erro desconhecido');
      continue;
    }
  }
  
  // Se chegou aqui, nenhum endpoint funcionou
  console.error('[API Health] Todos os endpoints falharam, usando modo offline');
  return {
    available: false,
    url: apiUrl,
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
    console.log('[Scope] Modo offline ativo, retornando escopo padrão');
    return {
      scope: 'medical_general',
      confidence: 0.8,
      details: 'Modo offline - escopo médico geral detectado',
      category: 'hanseniase',
      is_medical: true,
      offline_mode: true
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/scope`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao detectar escopo:', error);
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
}

/**
 * API Client para requisições HTTP
 */
export const apiClient = {
  async post<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    // Verificar se backend está em modo offline
    if (!API_BASE_URL) {
      console.log(`[ApiClient] POST ${endpoint} - Modo offline ativo`);
      throw new Error('Backend em modo offline');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição POST para ${endpoint}:`, error);
      throw error;
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    // Verificar se backend está em modo offline
    if (!API_BASE_URL) {
      console.log(`[ApiClient] GET ${endpoint} - Modo offline ativo`);
      throw new Error('Backend em modo offline');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição GET para ${endpoint}:`, error);
      throw error;
    }
  },
};
