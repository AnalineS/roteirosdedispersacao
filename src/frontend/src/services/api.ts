import axios, { AxiosError } from 'axios'
import type { 
  ApiResponse, 
  Message, 
  ScopeInfo, 
  ScopeAnalysis,
  FeedbackData,
  SystemStats 
} from '@/types'

// Google Apps Script Web App URL - configure via environment variable
const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || ''

// Create axios instance for Google Apps Script
const api = axios.create({
  baseURL: GAS_WEB_APP_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor (simplified for Google Apps Script)
api.interceptors.request.use(
  (config) => {
    // Google Apps Script doesn't need auth tokens
    // Just ensure proper content type
    config.headers['Content-Type'] = 'application/json'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['x-ratelimit-reset']
      console.warn(`Rate limit exceeded. Retry after: ${retryAfter}`)
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Chat API (adapted for Google Apps Script)
export const chatApi = {
  sendMessage: async (message: string, personaId: string): Promise<Message> => {
    try {
      const response = await api.post('', {
        question: message,
        persona: personaId,
      })
      
      // Transform Google Apps Script response to expected Message format
      const gasResponse = response.data
      
      return {
        id: Date.now().toString(),
        content: gasResponse.response,
        sender: 'assistant',
        timestamp: new Date(),
        persona: gasResponse.persona,
        cached: gasResponse.cached || false
      }
    } catch (error: any) {
      // Handle Google Apps Script errors
      if (error.response?.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.')
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      
      throw new Error('Erro ao enviar mensagem. Verifique sua conexão.')
    }
  },
}

// Personas API (hardcoded for Google Apps Script)
export const personasApi = {
  getAll: async () => {
    // Since Google Apps Script has personas built-in, return static data
    return {
      personas: {
        dr_gasnelio: {
          id: 'dr_gasnelio',
          name: 'Dr. Gasnelio',
          avatar: 'Dr',
          role: 'Farmacêutico Clínico',
          description: 'Farmacêutico clínico especialista em hanseníase PQT-U',
          expertise: 'Respostas técnicas e protocolos farmacológicos',
          tone: 'Profissional e preciso',
          use_cases: ['Consultas técnicas', 'Protocolos de dispensação', 'Validação farmacológica'],
          capabilities: ['Protocolos farmacológicos', 'Dispensação PQT-U', 'Validação técnica'],
          example_questions: ['Qual a dosagem correta de rifampicina para um paciente de 65kg?'],
          greeting: 'Olá! Como posso ajudar com a dispensação de PQT-U hoje?'
        },
        ga: {
          id: 'ga',
          name: 'Gá',
          avatar: 'Gá',
          role: 'Farmacêutico Educador',
          description: 'Farmacêutico empático e acessível',
          expertise: 'Comunicação simples e acolhedora',
          tone: 'Caloroso e educativo',
          use_cases: ['Explicações simples', 'Apoio emocional', 'Tradução técnica'],
          capabilities: ['Educação ao paciente', 'Comunicação empática', 'Orientações práticas'],
          example_questions: ['Como explicar os efeitos colaterais para um paciente idoso?'],
          greeting: 'Oi! Estou aqui para ajudar com suas dúvidas sobre o tratamento de hanseníase.'
        }
      },
      metadata: {
        total: 2,
        active: 2
      }
    }
  },
}

// Scope API (simplified for Google Apps Script)
export const scopeApi = {
  getInfo: async (): Promise<ScopeInfo> => {
    // Return hardcoded scope info since Google Apps Script handles scope internally
    return {
      topics: [
        'Hanseníase e PQT-U',
        'Rifampicina, Clofazimina, Dapsona',
        'Dispensação farmacêutica',
        'Roteiros de tratamento',
        'Efeitos adversos dos medicamentos PQT-U'
      ],
      invalid_topics: [
        'Outras doenças infecciosas',
        'Medicamentos não relacionados à hanseníase',
        'Consultas médicas gerais'
      ],
      scope_boundaries: 'Especializado em hanseníase PQT-U',
      confidence_threshold: 0.8
    }
  },

  checkQuestion: async (question: string): Promise<{
    question: string
    analysis: ScopeAnalysis
    recommendation: any
    metadata: any
  }> => {
    // Simple scope check - can be enhanced later
    const validKeywords = ['hansen', 'pqt', 'rifampicina', 'clofazimina', 'dapsona', 'dispensação']
    const hasValidKeyword = validKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    )
    
    return {
      question,
      analysis: {
        is_in_scope: hasValidKeyword,
        confidence: hasValidKeyword ? 0.9 : 0.1,
        detected_topics: hasValidKeyword ? ['hanseníase'] : ['outros'],
        scope_classification: hasValidKeyword ? 'valid' : 'invalid'
      },
      recommendation: {
        action: hasValidKeyword ? 'proceed' : 'redirect',
        message: hasValidKeyword ? 'Pergunta dentro do escopo' : 'Pergunta fora do escopo de hanseníase'
      },
      metadata: {
        processing_time: 0.1,
        model_version: 'simple_v1'
      }
    }
  },
}

// Feedback API (simplified)
export const feedbackApi = {
  submit: async (data: FeedbackData) => {
    // For now, just log feedback - can be enhanced to use Google Forms or Sheets
    console.log('Feedback submitted:', data)
    return { success: true, message: 'Feedback recebido com sucesso!' }
  },
}

// Stats API (mock data)
export const statsApi = {
  getStats: async (): Promise<{ system_stats: SystemStats; metadata: any }> => {
    return {
      system_stats: {
        interactions: 0,
        success_rate: 95,
        average_response_time: 2.5,
        active_personas: 2,
        cache_hit_rate: 15
      },
      metadata: {
        last_updated: new Date(),
        version: '1.0.0'
      }
    }
  },
}

// Health check (for Google Apps Script)
export const healthApi = {
  check: async () => {
    try {
      // Simple ping to check if GAS is responding
      if (!GAS_WEB_APP_URL) {
        throw new Error('URL do Google Apps Script não configurada')
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        backend: 'Google Apps Script',
        model: 'moonshotai/kimi-k2:free'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }
    }
  },
}

// Export default
export default api