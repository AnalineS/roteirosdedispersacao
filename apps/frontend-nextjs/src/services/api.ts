/**
 * API Integration Layer - Next.js
 * Conecta com o backend Python que usa prompts de IA e personas
 */

// Configuração simplificada de API URL
const getApiUrl = () => {
  // PRIORIDADE 1: Variável de ambiente
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    console.log(`[API] Usando URL do ambiente: ${envUrl}`);
    return envUrl.trim();
  }
  
  // PRIORIDADE 2: Detectar ambiente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[API] Ambiente local detectado');
      return 'http://localhost:8080';
    }
    
    // Produção - REATIVADO: usar backend otimizado
    console.log('[API] Produção detectada, conectando ao backend otimizado');
    return 'https://roteiro-dispensacao-api-992807978726.us-central1.run.app';
  }
  
  // PRIORIDADE 3: Fallback para desenvolvimento  
  console.log('[API] Fallback para desenvolvimento');
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiUrl();

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
  response_format: any;
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
 * Busca todas las personas disponíveis com fallback
 */
export async function getPersonas(): Promise<PersonasResponse> {
  const apiUrl = getApiUrl();
  
  // Se backend indisponível, usar personas offline
  if (!apiUrl) {
    console.warn('[Personas] Usando personas offline');
    return getOfflinePersonas();
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${apiUrl}/api/v1/personas`, {
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

    const data = await response.json();
    return data.personas || data;
  } catch (error) {
    console.error('[Personas] Erro ao buscar do backend, usando offline:', error);
    return getOfflinePersonas();
  }
}

/**
 * Personas offline para fallback
 */
function getOfflinePersonas(): PersonasResponse {
  return {
    "ga": {
      name: "Gá",
      description: "Assistente empática e acolhedora para informações sobre hanseníase",
      avatar: "🤗",
      personality: "empática, acolhedora, paciente e encorajadora",
      expertise: ["educação em saúde", "comunicação empática", "apoio emocional"],
      response_style: "linguagem simples, tom caloroso, analogias do dia a dia",
      target_audience: "pacientes e familiares",
      system_prompt: "Você é a Gá, uma assistente empática especializada em hanseníase...",
      capabilities: ["explicações simplificadas", "apoio emocional", "orientações básicas"],
      example_questions: ["Como tomar os medicamentos?", "É normal a pele ficar manchada?"],
      limitations: ["não substitui consulta médica", "informações básicas apenas"],
      response_format: {}
    },
    "dr-gasnelio": {
      name: "Dr. Gasnelio",
      description: "Farmacêutico especialista em hanseníase e PQT-U",
      avatar: "👨‍⚕️",
      personality: "técnico, preciso, científico e educativo",
      expertise: ["farmacologia", "protocolos PQT-U", "interações medicamentosas"],
      response_style: "linguagem técnica, embasamento científico, referências",
      target_audience: "profissionais de saúde e estudantes",
      system_prompt: "Você é o Dr. Gasnelio, farmacêutico especialista em hanseníase...",
      capabilities: ["análise técnica", "protocolos detalhados", "farmacovigilância"],
      example_questions: ["Dosagem para crianças?", "Interações com outros medicamentos?"],
      limitations: ["área específica de hanseníase", "não diagnóstica"],
      response_format: {}
    }
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
    ? `${emoji} Oi! Sou a Gá e estou aqui para te ajudar com informações sobre hanseníase. 

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
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/api/v1/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return {
      available: response.ok,
      url: apiUrl,
      error: !response.ok ? `HTTP ${response.status}` : undefined,
      fallbackActive: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[API Health] Erro:', errorMessage);
    
    return {
      available: false,
      url: apiUrl,
      error: errorMessage,
      fallbackActive: true
    };
  }
}

/**
 * Detecta escopo da pergunta
 */
export async function detectQuestionScope(question: string) {
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
    throw error;
  }
}

/**
 * API Client para requisições HTTP
 */
export const apiClient = {
  async post<T>(endpoint: string, data: any): Promise<T> {
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