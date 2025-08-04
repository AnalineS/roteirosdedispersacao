/**
 * API Integration Layer - Next.js
 * Conecta com o backend Python que usa prompts de IA e personas
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://roteiro-dispensacao-api-1016586236354.us-central1.run.app';

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
}

export interface ChatRequest {
  message: string;
  persona: string;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  persona: string;
  timestamp: number;
  request_id: string;
  processing_time: number;
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
    const response = await fetch(`${API_BASE_URL}/api/personas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
    const response = await fetch(`${API_BASE_URL}/health`);
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
    const response = await fetch(`${API_BASE_URL}/api/scope`, {
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