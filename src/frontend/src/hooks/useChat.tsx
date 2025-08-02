import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { chatApi, personasApi } from '@services/api'
import { errorHandler } from '@utils/errorHandler'
import type { Message, Persona, ApiResponse, ChatResponse } from '@/types'

interface ChatState {
  messages: Message[]
  selectedPersona: string | null
  isLoading: boolean
  error: string | null
}

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_PERSONA'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CHAT' }

const initialState: ChatState = {
  messages: [],
  selectedPersona: null,
  isLoading: false,
  error: null,
}

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'SET_PERSONA':
      return { ...state, selectedPersona: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_CHAT':
      return { ...state, messages: [], error: null }
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  selectedPersona: string | null
  personas: Record<string, Persona> | undefined
  isPersonasLoading: boolean
  personasError: Error | null
  sendMessage: (message: string) => void
  setSelectedPersona: (personaId: string) => void
  clearChat: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // Load personas with error handling
  const {
    data: personasData,
    isLoading: isPersonasLoading,
    error: personasError,
  } = useQuery({
    queryKey: ['personas'],
    queryFn: () => errorHandler.withRetry(
      () => personasApi.getAll(),
      'load-personas',
      2 // max retries for personas
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Let error handler manage retries
      const processedError = errorHandler.processError(error, 'personas-query')
      return processedError.retryable && failureCount < 2
    }
  })

  // Send message mutation with enhanced error handling
  const sendMessageMutation = useMutation({
    mutationFn: ({ message, personaId }: { message: string; personaId: string }) =>
      errorHandler.withRetry(
        () => chatApi.sendMessage(message, personaId),
        `sendMessage-${personaId}`,
        3 // max retries
      ),
    onMutate: ({ message }) => {
      // Add user message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        persona: state.selectedPersona || undefined,
      }
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
    },
    onSuccess: (response: ApiResponse<ChatResponse>) => {
      const message = response.data?.message
      if (!message) {
        throw new Error('Invalid response format')
      }
      
      const assistantMessage: Message = {
        id: message.id || crypto.randomUUID(),
        role: 'assistant',
        content: message.content,
        timestamp: message.timestamp,
        persona: message.persona,
        confidence: message.confidence || 0.8,
        metadata: {
          request_id: response.request_id,
        },
      }
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })
      dispatch({ type: 'SET_LOADING', payload: false })
      
      // Clear any previous errors
      dispatch({ type: 'SET_ERROR', payload: null })
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_LOADING', payload: false })
      
      // Process error through error handler
      const processedError = errorHandler.processError(error, 'chat-send-message')
      const userMessage = errorHandler.getUserMessage(processedError)
      
      // Log for debugging
      errorHandler.logError(processedError)
      
      // Set user-friendly error message
      dispatch({ 
        type: 'SET_ERROR', 
        payload: userMessage
      })
      
      // Add error context message for better UX
      if (processedError.retryable) {
        setTimeout(() => {
          dispatch({
            type: 'SET_ERROR',
            payload: `${userMessage} Tentando novamente automaticamente...`
          })
        }, 2000)
      }
    },
  })

  const sendMessage = useCallback((message: string) => {
    // Clear any existing errors
    dispatch({ type: 'SET_ERROR', payload: null })
    
    // Validation
    if (!message.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Por favor, digite uma mensagem' })
      return
    }
    
    if (!state.selectedPersona) {
      dispatch({ type: 'SET_ERROR', payload: 'Selecione um especialista virtual primeiro' })
      return
    }

    // Check for offensive content (basic check)
    const offensiveWords = ['spam', 'teste123']
    if (offensiveWords.some(word => message.toLowerCase().includes(word))) {
      dispatch({ type: 'SET_ERROR', payload: 'Mensagem contém conteúdo não permitido' })
      return
    }

    sendMessageMutation.mutate({
      message: message.trim(),
      personaId: state.selectedPersona,
    })
  }, [state.selectedPersona, sendMessageMutation])

  const setSelectedPersona = useCallback((personaId: string) => {
    dispatch({ type: 'SET_PERSONA', payload: personaId })
    dispatch({ type: 'CLEAR_CHAT' })
  }, [])

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' })
  }, [])

  const extractedPersonas = personasData && typeof personasData === 'object' && 'personas' in personasData 
    ? (personasData as { personas: Record<string, Persona> }).personas 
    : {}

  const value = {
    state,
    selectedPersona: state.selectedPersona,
    personas: extractedPersonas,
    isPersonasLoading,
    personasError,
    sendMessage,
    setSelectedPersona,
    clearChat,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}