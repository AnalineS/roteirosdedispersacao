/**
 * API Integration Layer - Next.js
 * Conecta com o backend Python que usa prompts de IA e personas
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

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
 * Busca todas as personas disponíveis do backend
 */
export async function getPersonas(): Promise<PersonasResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/personas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // O backend retorna { personas: {...}, metadata: {...} }
    // Precisamos apenas do objeto personas
    return data.personas || data;
  } catch (error) {
    console.error('Erro ao buscar personas:', error);
    throw error;
  }
}

/**
 * Envia mensagem para o chat com uma persona específica
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
}

/**
 * Verifica saúde da API
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`);
    return response.ok;
  } catch (error) {
    console.error('Erro ao verificar saúde da API:', error);
    return false;
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