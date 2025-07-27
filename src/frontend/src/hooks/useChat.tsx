import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { chatApi, personasApi } from '@services/api'
import type { Message, Persona } from '@/types'

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
  personas: Record<string, Persona> | undefined
  isPersonasLoading: boolean
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

  // Load personas
  const {
    data: personasData,
    isLoading: isPersonasLoading,
  } = useQuery({
    queryKey: ['personas'],
    queryFn: personasApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ message, personaId }: { message: string; personaId: string }) =>
      chatApi.sendMessage(message, personaId),
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
    onSuccess: (response: any) => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer || response.content || 'Resposta recebida',
        timestamp: new Date(),
        persona: state.selectedPersona || undefined,
        confidence: response.confidence || 0.8,
        metadata: {
          processing_time_ms: response.processing_time_ms,
          request_id: response.request_id,
          api_version: response.api_version,
          scope_analysis: response.scope_analysis,
        },
      }
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })
      dispatch({ type: 'SET_LOADING', payload: false })
    },
    onError: (error: any) => {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.error || 'Erro ao enviar mensagem' 
      })
    },
  })

  const sendMessage = useCallback((message: string) => {
    if (!state.selectedPersona) {
      dispatch({ type: 'SET_ERROR', payload: 'Selecione uma persona primeiro' })
      return
    }

    sendMessageMutation.mutate({
      message,
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

  const value = {
    state,
    personas: personasData || {},
    isPersonasLoading,
    sendMessage,
    setSelectedPersona,
    clearChat,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}