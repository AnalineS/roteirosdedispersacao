import axios, { AxiosError } from 'axios'
import type { 
  ApiResponse, 
  ChatResponse,
  ScopeInfo, 
  ScopeAnalysis,
  FeedbackData,
  SystemStats 
} from '@/types'

// Helper function to handle API errors
const handleApiError = (error: unknown): ApiResponse<ChatResponse> => {
  console.error('🚨 API Error Details:', error)
  
  let errorMessage = 'Erro desconhecido'
  
  if (error instanceof Error) {
    errorMessage = error.message
    
    // Check for CORS error
    if (error.message.includes('fetch') || error.message.includes('CORS')) {
      errorMessage = 'Erro de conectividade. Verifique se o Google Apps Script está configurado corretamente.'
    }
  }
  
  // Return a proper error response instead of throwing
  return {
    error: errorMessage,
    data: {
      message: {
        id: Date.now().toString(),
        content: `Erro: ${errorMessage}. Tente novamente em alguns minutos.`,
        sender: 'assistant',
        timestamp: new Date(),
        persona: 'system'
      }
    },
    timestamp: new Date().toISOString()
  }
}

// API Configuration for Cloud Run backend
const API_CONFIG = {
  // Google Cloud Run (Only backend) - usando URL de produção como fallback
  CLOUD_RUN_URL: import.meta.env.VITE_API_URL || 'https://roteiros-de-dispensacao.web.app',
  // Environment
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'production',
  // Timeout settings
  TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '30000'),
  // Retry settings
  MAX_RETRIES: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3')
}


// Synchronous version for immediate use
const getApiBaseUrlSync = () => {
  // Prioridade: variável de ambiente > URL de produção > fallback local
  const cloudRunUrl = import.meta.env.VITE_API_URL || 
                      'https://roteiros-de-dispensacao.web.app' ||
                      'http://localhost:5000'
  
  console.log('🔗 Using backend URL:', cloudRunUrl)
  return cloudRunUrl
}

const API_BASE_URL = getApiBaseUrlSync()
const IS_CLOUD_RUN = true // Always Cloud Run now

// Create axios instance with Google Apps Script priority
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
})

// Debug logging for all environments to help with debugging
console.log('🔧 API Configuration:', {
  baseUrl: API_BASE_URL,
  isCloudRun: IS_CLOUD_RUN,
  environment: API_CONFIG.ENVIRONMENT,
  timeout: API_CONFIG.TIMEOUT,
  cloudRunUrl: API_CONFIG.CLOUD_RUN_URL
})


// Request interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    // Ensure proper content type
    config.headers['Content-Type'] = 'application/json'
    
    // Log requests in development
    if (API_CONFIG.ENVIRONMENT === 'development') {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: config.data
      })
    }
    
    return config
  },
  (error) => {
    console.error('📤 Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (API_CONFIG.ENVIRONMENT === 'development') {
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      })
    }
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    // Enhanced error logging
    console.error('📥 API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message
    })

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['x-ratelimit-reset']
      console.warn(`⏰ Rate limit exceeded. Retry after: ${retryAfter}`)
    }

    // Handle CORS errors
    if (error.message.includes('CORS') || error.message.includes('Network Error')) {
      console.error('🚫 CORS Error detected - check backend CORS configuration')
    }

    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

// Chat API (adapted for multiple backends)
export const chatApi = {
  sendMessage: async (message: string, personaId: string): Promise<ApiResponse<ChatResponse>> => {
    try {
      console.log('📤 Sending message to Cloud Run:', { 
        message, 
        personaId, 
        url: API_BASE_URL 
      })
      
      const requestData = {
        question: message,
        personality_id: personaId,
      }
      
      console.log('📋 Request data:', requestData)
      
      const response = await api.post('/api/chat', requestData)
      
      console.log('📊 Response status:', response.status)
      console.log('📥 Response data:', response.data)
      
      return {
        data: {
          message: {
            id: response.data.id || Date.now().toString(),
            content: response.data.response || response.data.answer || 'Resposta recebida',
            sender: 'assistant',
            timestamp: new Date(),
            persona: response.data.persona || personaId,
            cached: response.data.cached || false,
            confidence: response.data.confidence || 0.8
          }
        },
        request_id: response.data.request_id || Date.now().toString(),
        timestamp: new Date().toISOString()
      }
    } catch (error: unknown) {
      console.error('❌ Send message error:', error)
      return handleApiError(error)
    }
  },
}

// Personas API (supports both backends)
export const personasApi = {
  getAll: async () => {
    try {
      // Try to get from Cloud Run first, fallback to static
      try {
        const response = await api.get('/api/personas')
        console.log('📋 Personas loaded from Cloud Run API')
        return response.data
      } catch (error) {
        console.warn('⚠️ Cloud Run personas failed, using static data:', error)
      }
      
      console.log('📋 Using static personas data')
      return {
          personas: {
            dr_gasnelio: {
              id: 'dr_gasnelio',
              name: 'Dr. Gasnelio',
              avatar: 'Dr',
              role: 'Farmacêutico Clínico',
              description: 'Farmacêutico clínico especialista em hanseníase PQT-U',
              greeting: 'Olá! Como posso ajudar com a dispensação de PQT-U hoje?',
              system_prompt: 'Você é Dr. Gasnelio, um farmacêutico clínico especialista em hanseníase e dispensação de PQT-U.',
              audience: 'Profissionais de saúde',
              language_style: 'Técnico e preciso',
              capabilities: ['Protocolos farmacológicos', 'Dispensação PQT-U', 'Validação técnica'],
              example_questions: ['Qual a dosagem correta de rifampicina para um paciente de 65kg?'],
              limitations: {
                scope: 'Hanseníase e dispensação de medicamentos PQT-U',
                not_covered: ['Outras doenças', 'Medicamentos não relacionados'],
                redirects_to: {}
              },
              response_format: {
                structure: ['Informação técnica', 'Protocolo', 'Recomendações'],
                tone: 'Profissional e preciso'
              }
            },
            ga: {
              id: 'ga',
              name: 'Gá',
              avatar: 'Gá',
              role: 'Farmacêutico Educador',
              description: 'Farmacêutico empático e acessível',
              greeting: 'Oi! Estou aqui para ajudar com suas dúvidas sobre o tratamento de hanseníase.',
              system_prompt: 'Você é Gá, um farmacêutico educador empático especializado em comunicação clara sobre hanseníase.',
              audience: 'Pacientes e familiares',
              language_style: 'Simples e acolhedor',
              capabilities: ['Educação ao paciente', 'Comunicação empática', 'Orientações práticas'],
              example_questions: ['Como explicar os efeitos colaterais para um paciente idoso?'],
              limitations: {
                scope: 'Hanseníase e educação do paciente',
                not_covered: ['Outras doenças', 'Prescrições médicas'],
                redirects_to: {}
              },
              response_format: {
                structure: ['Explicação simples', 'Orientações práticas', 'Apoio'],
                tone: 'Caloroso e educativo'
              }
            }
          },
          metadata: {
            total: 2,
            active: 2
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
    recommendation: Record<string, unknown>
    metadata: Record<string, unknown>
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
  getStats: async (): Promise<{ system_stats: SystemStats; metadata: Record<string, unknown> }> => {
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
        throw new Error('Backend não é Cloud Run')
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

  // Teste simples de conexão CORS
  testConnection: async () => {
    try {
      console.log('🔍 Testando conexão com backend...')
      const response = await api.get('/api/test')
      console.log('✅ Conexão bem-sucedida:', response.data)
      return {
        success: true,
        data: response.data,
        message: 'Conexão estabelecida com sucesso!'
      }
    } catch (error: unknown) {
      console.error('❌ Erro na conexão:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      const isAxiosError = (err: unknown): err is AxiosError => typeof err === 'object' && err !== null && 'isAxiosError' in err
      
      return {
        success: false,
        error: errorMessage,
        details: {
          status: isAxiosError(error) ? error.response?.status : undefined,
          statusText: isAxiosError(error) ? error.response?.statusText : undefined,
          url: isAxiosError(error) ? error.config?.url : undefined,
          method: isAxiosError(error) ? error.config?.method : undefined
        }
      }
    }
  }
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