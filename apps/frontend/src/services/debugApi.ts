/**
 * Serviço de API robusto com debug completo
 * FASE 3: Correções sistemáticas
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import type { ApiResponse, ChatResponse } from '@/types'

interface DebugLog {
  timestamp: string
  type: 'request' | 'response' | 'error'
  url: string
  method: string
  data?: any
  status?: number
  error?: string
}

class DebugApiService {
  private api: AxiosInstance
  private logs: DebugLog[] = []
  private baseUrl: string

  constructor() {
    // Determinar URL base com fallbacks múltiplos
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
    this.logSystemInfo()
  }

  private determineBaseUrl(): string {
    const fallbackUrls = [
      import.meta.env.VITE_API_URL,
      'https://roteiros-de-dispensacao.web.app',
      'https://roteiro-dispensacao-api-1016586236354.us-central1.run.app',
      'http://localhost:5000'
    ]

    for (const url of fallbackUrls) {
      if (url && url !== 'undefined') {
        console.log(`🔗 Usando URL da API: ${url}`)
        return url
      }
    }

    console.warn('⚠️ Nenhuma URL válida encontrada, usando fallback')
    return 'https://roteiros-de-dispensacao.web.app'
  }

  private logSystemInfo(): void {
    console.group('🔍 Debug API Service - Informações do Sistema')
    console.log('📊 Environment:', import.meta.env.MODE)
    console.log('🔗 Base URL:', this.baseUrl)
    console.log('🌐 VITE_API_URL:', import.meta.env.VITE_API_URL)
    console.log('⚙️ VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT)
    console.log('📱 User Agent:', navigator.userAgent)
    console.log('🌍 Location:', window.location.href)
    console.groupEnd()
  }

  private addLog(log: DebugLog): void {
    this.logs.push(log)
    // Manter apenas os últimos 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50)
    }
  }

  private setupInterceptors(): void {
    // Request Interceptor
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
        console.log(`📤 [${log.method}] ${config.baseURL}${config.url}`, config.data)
        
        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response Interceptor
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
        console.log(`📥 [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
        
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
        console.error(`❌ [${error.response?.status || 'NETWORK'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        return Promise.reject(this.processError(error))
      }
    )
  }

  private processError(error: AxiosError): Error {
    if (error.response) {
      // Erro de resposta do servidor
      const status = error.response.status
      const data = error.response.data as any
      
      switch (status) {
        case 400:
          return new Error(data?.message || 'Dados inválidos enviados para o servidor')
        case 401:
          return new Error('Não autorizado - verifique suas credenciais')
        case 403:
          return new Error('Acesso negado - sem permissão para esta operação')
        case 404:
          return new Error('Endpoint não encontrado - verifique a URL da API')
        case 500:
          return new Error('Erro interno do servidor - tente novamente em alguns minutos')
        case 502:
        case 503:
        case 504:
          return new Error('Servidor temporariamente indisponível - tente novamente')
        default:
          return new Error(`Erro do servidor (${status}): ${data?.message || 'Erro desconhecido'}`)
      }
    } else if (error.request) {
      // Erro de rede
      return new Error('Sem conexão com o servidor - verifique sua internet e a URL da API')
    } else {
      // Erro na configuração
      return new Error(`Erro na requisição: ${error.message}`)
    }
  }

  // Método de teste de conectividade
  async testConnection(): Promise<{ success: boolean; status?: number; error?: string }> {
    try {
      console.log('🔍 Testando conectividade...')
      const response = await this.api.get('/api/health')
      return { success: true, status: response.status }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      return { success: false, error: errorMessage }
    }
  }

  // Método principal para enviar mensagens
  async sendMessage(message: string, personaId: string): Promise<ApiResponse<ChatResponse>> {
    try {
      console.group(`💬 Enviando mensagem para ${personaId}`)
      console.log('📝 Mensagem:', message)
      console.log('👤 Persona:', personaId)
      
      const requestData = {
        question: message,
        personality_id: personaId
      }
      
      console.log('📦 Dados da requisição:', requestData)
      
      const response = await this.api.post<ApiResponse<ChatResponse>>('/api/chat', requestData)
      
      console.log('✅ Resposta recebida:', response.data)
      console.groupEnd()
      
      return response.data
    } catch (error) {
      console.groupEnd()
      throw error
    }
  }

  // Obter personas disponíveis
  async getPersonas(): Promise<any> {
    try {
      console.log('👥 Buscando personas...')
      const response = await this.api.get('/api/personas')
      return response.data
    } catch (error) {
      console.error('❌ Erro ao buscar personas:', error)
      throw error
    }
  }

  // Obter logs de debug
  getLogs(): DebugLog[] {
    return [...this.logs]
  }

  // Limpar logs
  clearLogs(): void {
    this.logs = []
    console.log('🧹 Logs limpos')
  }

  // Informações de status
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
export const debugApi = new DebugApiService()

// Export para compatibilidade
export { debugApi as chatApi }
export default debugApi