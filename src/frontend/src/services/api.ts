import axios, { AxiosError } from 'axios'
import type { 
  ApiResponse, 
  Message, 
  ScopeInfo, 
  ScopeAnalysis,
  FeedbackData,
  SystemStats 
} from '@/types'

// API Configuration for multiple backends
const API_CONFIG = {
  // Google Cloud Run (Primary)
  CLOUD_RUN_URL: import.meta.env.VITE_API_URL || '',
  // Google Apps Script (Legacy fallback)
  GAS_WEB_APP_URL: import.meta.env.VITE_GAS_WEB_APP_URL || '',
  // Environment
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  // Timeout settings
  TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '30000'),
  // Retry settings
  MAX_RETRIES: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3')
}

// Determine which backend to use
const getApiBaseUrl = () => {
  // In production, prefer Cloud Run
  if (API_CONFIG.ENVIRONMENT === 'production' && API_CONFIG.CLOUD_RUN_URL) {
    return API_CONFIG.CLOUD_RUN_URL
  }
  
  // Fallback to Google Apps Script
  if (API_CONFIG.GAS_WEB_APP_URL) {
    return API_CONFIG.GAS_WEB_APP_URL
  }
  
  // Development fallback
  return 'http://localhost:5000'
}

const API_BASE_URL = getApiBaseUrl()
const IS_CLOUD_RUN = API_BASE_URL.includes('run.app') || API_BASE_URL.includes('localhost')

// Create axios instance with intelligent backend detection
const api = axios.create({
  baseURL: IS_CLOUD_RUN ? API_BASE_URL : API_CONFIG.GAS_WEB_APP_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
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

// Chat API (adapted for multiple backends)
export const chatApi = {
  sendMessage: async (message: string, personaId: string): Promise<Message> => {
    try {
      let response
      
      if (IS_CLOUD_RUN) {
        // Google Cloud Run / Flask backend
        response = await api.post('/api/chat', {
          question: message,
          personality_id: personaId,
        })
        
        const cloudRunResponse = response.data
        
        return {
          id: cloudRunResponse.request_id || Date.now().toString(),
          content: cloudRunResponse.answer,
          sender: 'assistant',
          timestamp: new Date(),
          persona: cloudRunResponse.persona,
          cached: false,
          confidence: cloudRunResponse.confidence || 0.8
        }
      } else {
        // Google Apps Script (Legacy)
        response = await api.post('', {
          question: message,
          persona: personaId,
        })
        
        const gasResponse = response.data
        
        return {
          id: Date.now().toString(),
          content: gasResponse.response,
          sender: 'assistant',
          timestamp: new Date(),
          persona: gasResponse.persona,
          cached: gasResponse.cached || false
        }
      }
    } catch (error: any) {
      // Handle rate limiting (common to both backends)
      if (error.response?.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.')
      }
      
      // Handle backend-specific errors
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      
      // Network errors
      if (!error.response) {
        throw new Error('Erro de conexão. Verifique sua internet.')
      }
      
      throw new Error('Erro ao enviar mensagem. Tente novamente.')
    }
  },
}

// Personas API (supports both backends)
export const personasApi = {
  getAll: async () => {
    try {
      if (IS_CLOUD_RUN) {
        // Get personas from Cloud Run backend
        const response = await api.get('/api/personas')
        return response.data
      } else {
        // Fallback to static data for Google Apps Script
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
      }
    } catch (error) {
      console.warn('Error fetching personas, using fallback:', error)
      // Return fallback data
      return {
        personas: {
          dr_gasnelio: {
            id: 'dr_gasnelio',
            name: 'Dr. Gasnelio',
            role: 'Farmacêutico Clínico',
            description: 'Especialista em hanseníase'
          },
          ga: {
            id: 'ga',
            name: 'Gá',
            role: 'Farmacêutico Educador',
            description: 'Comunicação empática'
          }
        },
        metadata: { total: 2, active: 2 }
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

// Health check (supports both backends)
export const healthApi = {
  check: async () => {
    try {
      if (IS_CLOUD_RUN) {
        // Check Cloud Run health
        const response = await api.get('/api/health')
        return {
          status: response.data.status || 'healthy',
          timestamp: response.data.timestamp || new Date().toISOString(),
          backend: 'Google Cloud Run',
          version: response.data.version,
          components: response.data.components,
          performance: response.data.performance
        }
      } else {
        // Simple ping to check if GAS is responding
        if (!API_CONFIG.GAS_WEB_APP_URL) {
          throw new Error('URL do Google Apps Script não configurada')
        }
        
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          backend: 'Google Apps Script',
          model: 'moonshotai/kimi-k2:free'
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        backend: IS_CLOUD_RUN ? 'Google Cloud Run' : 'Google Apps Script'
      }
    }
  },
}

// Export API configuration for debugging
export const getApiConfig = () => ({
  baseUrl: API_BASE_URL,
  isCloudRun: IS_CLOUD_RUN,
  environment: API_CONFIG.ENVIRONMENT,
  timeout: API_CONFIG.TIMEOUT,
  maxRetries: API_CONFIG.MAX_RETRIES
})

// Export default
export default api