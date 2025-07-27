import axios, { AxiosError } from 'axios'
import type { 
  ApiResponse, 
  Message, 
  Persona, 
  ScopeInfo, 
  ScopeAnalysis,
  FeedbackData,
  SystemStats 
} from '@types'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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

// Chat API
export const chatApi = {
  sendMessage: async (message: string, personaId: string): Promise<Message> => {
    const response = await api.post<Message>('/chat', {
      question: message,
      personality_id: personaId,
    })
    return response.data
  },
}

// Personas API
export const personasApi = {
  getAll: async () => {
    const response = await api.get<{
      personas: Record<string, Persona>
      metadata: any
      usage_guide: any
    }>('/personas')
    return response.data
  },
}

// Scope API
export const scopeApi = {
  getInfo: async (): Promise<ScopeInfo> => {
    const response = await api.get<ScopeInfo>('/scope')
    return response.data
  },

  checkQuestion: async (question: string): Promise<{
    question: string
    analysis: ScopeAnalysis
    recommendation: any
    metadata: any
  }> => {
    const response = await api.post('/scope', { question })
    return response.data
  },
}

// Feedback API
export const feedbackApi = {
  submit: async (data: FeedbackData) => {
    const response = await api.post('/feedback', data)
    return response.data
  },
}

// Stats API
export const statsApi = {
  getStats: async (): Promise<{ system_stats: SystemStats; metadata: any }> => {
    const response = await api.get('/stats')
    return response.data
  },
}

// Health check
export const healthApi = {
  check: async () => {
    const response = await api.get('/health')
    return response.data
  },
}

// Export default
export default api