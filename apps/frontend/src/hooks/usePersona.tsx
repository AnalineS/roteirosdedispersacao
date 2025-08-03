import { useState, useEffect, useCallback } from 'react'
import type { Persona } from '@/types'

// Indicadores para detecção de perfil
const PROFILE_INDICATORS = {
  technical: [
    'posologia', 'farmacocinética', 'mecanismo de ação',
    'interações medicamentosas', 'farmacologia clínica',
    'protocolo', 'diretrizes técnicas', 'evidência científica',
    'PQT-U', 'baciloscopia', 'multibacilar', 'paucibacilar',
    'rifampicina', 'dapsona', 'clofazimina', 'esquema terapêutico'
  ],
  empathetic: [
    'como tomar', 'efeitos', 'normal', 'preocupado',
    'posso', 'faz mal', 'é perigoso', 'vai passar',
    'medo', 'ansioso', 'família', 'cuidador',
    'dói', 'sinto', 'ajuda', 'entender', 'explicar'
  ]
}

// Configurações de transição
const TRANSITION_TRIGGERS = {
  toEmpathetic: ['não entendi', 'muito complicado', 'estou preocupado', 'tenho medo', 'me ajuda'],
  toTechnical: ['mais detalhes', 'informação técnica', 'protocolo', 'evidência', 'científico']
}

interface ProfileDetection {
  recommended: 'dr_gasnelio' | 'ga'
  confidence: number
  explanation: string
}

interface PersonaTransition {
  from: string
  to: string
  reason: string
  timestamp: Date
}

interface UsePersonaProps {
  selectedPersona: string | null
  personas: Record<string, Persona> | undefined
  onPersonaChange: (personaId: string) => void
}

export const usePersona = ({ selectedPersona, personas, onPersonaChange }: UsePersonaProps) => {
  const [personaHistory, setPersonaHistory] = useState<PersonaTransition[]>([])
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true)
  const [lastDetection, setLastDetection] = useState<ProfileDetection | null>(null)

  // Carregar preferências do localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('preferred-persona')
    const savedAutoDetect = localStorage.getItem('auto-detect-persona')
    
    if (savedPreference && !selectedPersona) {
      onPersonaChange(savedPreference)
    }
    
    if (savedAutoDetect !== null) {
      setAutoDetectEnabled(savedAutoDetect === 'true')
    }
  }, [selectedPersona, onPersonaChange])

  // Salvar preferência quando mudar
  useEffect(() => {
    if (selectedPersona) {
      localStorage.setItem('preferred-persona', selectedPersona)
    }
  }, [selectedPersona])

  // Contar correspondências de palavras-chave
  const countMatches = (text: string, indicators: string[]): number => {
    const lowerText = text.toLowerCase()
    return indicators.reduce((count, indicator) => {
      return count + (lowerText.includes(indicator) ? 1 : 0)
    }, 0)
  }

  // Detectar perfil baseado no texto
  const detectProfile = useCallback((text: string): ProfileDetection => {
    const technicalScore = countMatches(text, PROFILE_INDICATORS.technical)
    const empatheticScore = countMatches(text, PROFILE_INDICATORS.empathetic)
    
    const totalScore = Math.max(technicalScore + empatheticScore, 1)
    const confidence = Math.abs(technicalScore - empatheticScore) / totalScore
    
    let explanation = ''
    let recommended: 'dr_gasnelio' | 'ga' = 'ga'
    
    if (technicalScore > empatheticScore) {
      recommended = 'dr_gasnelio'
      explanation = 'Detectamos termos técnicos em sua mensagem. Dr. Gasnelio pode fornecer informações mais detalhadas.'
    } else if (empatheticScore > technicalScore) {
      recommended = 'ga'
      explanation = 'Percebemos que você busca orientações práticas. Gá pode explicar de forma mais simples e acolhedora.'
    } else {
      recommended = 'ga'
      explanation = 'Para uma primeira conversa, Gá pode ser mais adequada para entender suas necessidades.'
    }
    
    const detection = { recommended, confidence, explanation }
    setLastDetection(detection)
    return detection
  }, [])

  // Verificar se deve sugerir transição
  const checkTransitionTrigger = useCallback((message: string): string | null => {
    const lowerMessage = message.toLowerCase()
    
    // Verificar gatilhos para transição empática
    if (selectedPersona === 'dr_gasnelio') {
      for (const trigger of TRANSITION_TRIGGERS.toEmpathetic) {
        if (lowerMessage.includes(trigger)) {
          return 'ga'
        }
      }
    }
    
    // Verificar gatilhos para transição técnica
    if (selectedPersona === 'ga') {
      for (const trigger of TRANSITION_TRIGGERS.toTechnical) {
        if (lowerMessage.includes(trigger)) {
          return 'dr_gasnelio'
        }
      }
    }
    
    return null
  }, [selectedPersona])

  // Realizar transição de persona
  const transitionPersona = useCallback((to: string, reason: string) => {
    if (!selectedPersona || selectedPersona === to) return
    
    const transition: PersonaTransition = {
      from: selectedPersona,
      to,
      reason,
      timestamp: new Date()
    }
    
    setPersonaHistory(prev => [...prev, transition])
    onPersonaChange(to)
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'persona_transition', {
        from_persona: selectedPersona,
        to_persona: to,
        reason
      })
    }
  }, [selectedPersona, onPersonaChange])

  // Obter sugestão de transição com contexto
  const getTransitionSuggestion = useCallback((currentPersona: string, suggestedPersona: string): string => {
    const suggestions = {
      'dr_gasnelio_to_ga': 'Percebi que minha explicação ficou muito técnica. Que tal conversar com Gá? Ela explica de forma mais simples e acolhedora.',
      'ga_to_dr_gasnelio': 'Que bom que quer saber mais! Para informações técnicas detalhadas, Dr. Gasnelio é o especialista ideal. Posso apresentá-lo?'
    }
    
    const key = `${currentPersona}_to_${suggestedPersona}`
    return suggestions[key as keyof typeof suggestions] || 'Talvez outro assistente possa ajudar melhor com sua pergunta.'
  }, [])

  // Obter informações da persona atual
  const getCurrentPersonaInfo = useCallback(() => {
    if (!selectedPersona || !personas) return null
    return personas[selectedPersona]
  }, [selectedPersona, personas])

  // Toggle auto-detecção
  const toggleAutoDetect = useCallback(() => {
    const newValue = !autoDetectEnabled
    setAutoDetectEnabled(newValue)
    localStorage.setItem('auto-detect-persona', String(newValue))
  }, [autoDetectEnabled])

  // Resetar histórico
  const resetHistory = useCallback(() => {
    setPersonaHistory([])
  }, [])

  return {
    // Estado
    selectedPersona,
    personas,
    personaHistory,
    autoDetectEnabled,
    lastDetection,
    
    // Métodos
    setSelectedPersona: onPersonaChange,
    detectProfile,
    checkTransitionTrigger,
    transitionPersona,
    getTransitionSuggestion,
    getCurrentPersonaInfo,
    toggleAutoDetect,
    resetHistory,
    
    // Helpers
    isPersonaSelected: !!selectedPersona,
    currentPersonaName: getCurrentPersonaInfo()?.name || 'Não selecionado',
    transitionCount: personaHistory.length
  }
}