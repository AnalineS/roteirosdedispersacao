/**
 * API Service - Implementação única consolidada
 * Compatível com React Query + sistema de fallback offline + logs para debug
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { getLocalPersonas, generateOfflineResponse } from '@/data/localPersonas'
import type { 
  ApiResponse, 
  ChatResponse,
  ScopeInfo, 
  ScopeAnalysis,
  FeedbackData,
  SystemStats 
} from '@/types'

// Interface para logs de debug
interface DebugLog {
  timestamp: string
  type: 'request' | 'response' | 'error'
  url: string
  method: string
  data?: any
  status?: number
  error?: string
}

// Classe principal do serviço de API
class ApiService {
  public api: AxiosInstance
  private logs: DebugLog[] = []
  private baseUrl: string

  constructor() {
    this.baseUrl = this.determineBaseUrl()
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    this.setupInterceptors()
    console.log(`🔗 API Service inicializado: ${this.baseUrl}`)
  }

  private determineBaseUrl(): string {
    const fallbackUrls = [
      import.meta.env.VITE_API_URL,
      'https://roteiros-de-dispensacao.web.app',
      'https://roteiro-dispensacao-api-1016586236354.us-central1.run.app'
    ]

    for (const url of fallbackUrls) {
      if (url && url !== 'undefined') {
        return url
      }
    }

    return 'https://roteiros-de-dispensacao.web.app'
  }

  private setupInterceptors(): void {
    // Request Interceptor com logs
    this.api.interceptors.request.use(
      (config) => {
        const log: DebugLog = {
          timestamp: new Date().toISOString(),
          type: 'request',
          url: config.url || '',
          method: config.method?.toUpperCase() || 'GET',
          data: config.data
        }
        
        this.addLog(log)
        console.log(`📤 [${log.method}] ${config.baseURL}${config.url}`)
        
        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response Interceptor com logs
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const log: DebugLog = {
          timestamp: new Date().toISOString(),
          type: 'response',
          url: response.config.url || '',
          method: response.config.method?.toUpperCase() || 'GET',
          status: response.status,
          data: response.data
        }
        
        this.addLog(log)
        console.log(`📥 [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`)
        
        return response
      },
      (error: AxiosError) => {
        const log: DebugLog = {
          timestamp: new Date().toISOString(),
          type: 'error',
          url: error.config?.url || '',
          method: error.config?.method?.toUpperCase() || 'GET',
          status: error.response?.status,
          error: error.message
        }
        
        this.addLog(log)
        console.error(`❌ [${error.response?.status || 'NETWORK'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
        
        return Promise.reject(this.processError(error))
      }
    )
  }

  private addLog(log: DebugLog): void {
    this.logs.push(log)
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50)
    }
  }

  private processError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      
      switch (status) {
        case 400:
          return new Error(data?.message || 'Dados inválidos')
        case 404:
          return new Error('Endpoint não encontrado')
        case 500:
          return new Error('Erro interno do servidor')
        default:
          return new Error(`Erro do servidor (${status})`)
      }
    } else if (error.request) {
      return new Error('Sem conexão com o servidor')
    } else {
      return new Error(`Erro na requisição: ${error.message}`)
    }
  }

  // Método para testar conectividade
  async testConnection(): Promise<{ success: boolean; status?: number; error?: string }> {
    try {
      const response = await this.api.get('/api/health')
      return { success: true, status: response.status }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return { success: false, error: errorMessage }
    }
  }

  // Método para enviar mensagens de chat
  async sendMessage(message: string, personaId: string): Promise<any> {
    try {
      const requestData = {
        question: message,
        personality_id: personaId
      }
      
      const response = await this.api.post<ApiResponse<ChatResponse>>('/api/chat', requestData)
      return response.data
    } catch (error) {
      console.warn('⚠️ Backend offline, gerando resposta local')
      return generateOfflineResponse(personaId, message)
    }
  }

  // Método para obter personas
  async getPersonas(): Promise<any> {
    try {
      const response = await this.api.get('/api/personas')
      return response.data
    } catch (error) {
      console.warn('⚠️ Backend offline, usando personas locais')
      return getLocalPersonas()
    }
  }

  // Obter logs de debug
  getLogs(): DebugLog[] {
    return [...this.logs]
  }

  // Informações de status para debug
  getStatus(): {
    baseUrl: string
    environment: string
    totalLogs: number
    lastLog?: DebugLog
  } {
    return {
      baseUrl: this.baseUrl,
      environment: import.meta.env.MODE,
      totalLogs: this.logs.length,
      lastLog: this.logs[this.logs.length - 1]
    }
  }
}

// Instância singleton
const apiService = new ApiService()

// === EXPORTS PRINCIPAIS (para useChat e DebugPanel) ===
export const chatApi = apiService
export const personasApi = apiService

// === COMPATIBILIDADE COM APIs EXISTENTES ===

// API para análise de escopo
export const scopeApi = {
  analyzeQuestion: async (question: string): Promise<ScopeInfo> => {
    try {
      const response = await apiService.api.post('/api/scope/analyze', { question })
      return response.data
    } catch (error) {
      console.warn('⚠️ Scope API offline')
      return {
        inScope: true,
        confidence: 0.5,
        persona: 'dr_gasnelio',
        reasoning: 'Análise offline - assumindo escopo válido'
      } as ScopeInfo
    }
  },

  getAnalysis: async (questionId: string): Promise<ScopeAnalysis> => {
    try {
      const response = await apiService.api.get(`/api/scope/analysis/${questionId}`)
      return response.data
    } catch (error) {
      console.warn('⚠️ Scope analysis offline')
      return {
        id: questionId,
        is_in_scope: true,
        analysis: 'Análise não disponível offline',
        recommendations: []
      } as ScopeAnalysis
    }
  },

  // Compatibilidade com método antigo
  getInfo: async (question: string): Promise<any> => {
    return scopeApi.analyzeQuestion(question)
  }
}

// API para feedback
export const feedbackApi = {
  submitFeedback: async (feedbackData: FeedbackData): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.api.post('/api/feedback', feedbackData)
      return response.data
    } catch (error) {
      console.warn('⚠️ Feedback API offline')
      return {
        data: null,
        error: 'Feedback não pôde ser enviado (offline)',
        timestamp: new Date().toISOString()
      } as ApiResponse<any>
    }
  }
}

// API para estatísticas
export const statsApi = {
  getSystemStats: async (): Promise<SystemStats> => {
    try {
      const response = await apiService.api.get('/api/stats')
      return response.data
    } catch (error) {
      console.warn('⚠️ Stats API offline')
      return {
        users: 0,
        questions: 0,
        responses: 0,
        uptime: '0s'
      } as SystemStats
    }
  },

  // Compatibilidade com método antigo
  getStats: async (): Promise<any> => {
    const stats = await statsApi.getSystemStats()
    return {
      system_stats: stats
    }
  }
}

// API de health check
export const healthApi = {
  checkHealth: async (): Promise<any> => {
    return apiService.testConnection()
  },

  getDetailedHealth: async (): Promise<any> => {
    try {
      const response = await apiService.api.get('/api/health')
      return response.data
    } catch (error) {
      return {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}

// Configuração da API
export const getApiConfig = () => ({
  baseUrl: apiService.getStatus().baseUrl,
  environment: import.meta.env.MODE,
  timeout: 30000
})

// Export default
export default apiService