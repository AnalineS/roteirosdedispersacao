/**
 * Personas locais para fallback quando backend não estiver disponível
 * FASE 7: Plano B - Dados locais como alternativa
 */

export const LOCAL_PERSONAS = {
  dr_gasnelio: {
    id: 'dr_gasnelio',
    name: 'Dr. Gasnelio',
    role: 'Especialista em Hanseníase',
    description: 'Médico especialista com anos de experiência no tratamento de hanseníase',
    avatar: '👨‍⚕️',
    specialties: [
      'Diagnóstico clínico',
      'Tratamento medicamentoso',
      'Acompanhamento de casos',
      'Orientações técnicas'
    ],
    greeting: 'Olá! Sou o Dr. Gasnelio, especialista em hanseníase. Como posso ajudá-lo hoje?',
    style: 'técnico e preciso'
  },
  ga: {
    id: 'ga',
    name: 'Gá',
    role: 'Assistente Educacional',
    description: 'Assistente empático especializado em apoio emocional e orientações práticas',
    avatar: '🤝',
    specialties: [
      'Apoio emocional',
      'Orientações práticas',
      'Esclarecimento de dúvidas',
      'Suporte ao paciente'
    ],
    greeting: 'Oi! Eu sou a Gá, sua assistente educacional. Estou aqui para te apoiar e esclarecer suas dúvidas de forma simples e acolhedora.',
    style: 'empático e acolhedor'
  }
}

// Função para simular resposta do backend
export function getLocalPersonas() {
  return {
    status: 'success',
    data: {
      personas: LOCAL_PERSONAS
    },
    timestamp: new Date().toISOString()
  }
}

// Função para simular chat offline
export function generateOfflineResponse(personaId: string, _message: string) {
  const persona = LOCAL_PERSONAS[personaId as keyof typeof LOCAL_PERSONAS]
  
  if (!persona) {
    return {
      error: 'Persona não encontrada'
    }
  }
  
  const offlineResponses = {
    dr_gasnelio: [
      'Desculpe, estou temporariamente offline. Por favor, consulte um profissional de saúde para orientações sobre hanseníase.',
      'No momento estou sem conexão com o servidor. Recomendo que procure atendimento médico presencial para suas dúvidas.',
      'Sistema temporariamente indisponível. Para informações urgentes sobre hanseníase, procure uma unidade de saúde.'
    ],
    ga: [
      'Oi! Parece que estamos sem conexão no momento. Mas não se preocupe, logo voltaremos!',
      'Ops! Estou temporariamente offline. Enquanto isso, lembre-se: você não está sozinho nessa jornada!',
      'Estamos com um probleminha técnico, mas já estamos trabalhando para resolver. Volte em breve!'
    ]
  }
  
  const responses = offlineResponses[personaId as keyof typeof offlineResponses] || []
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  
  return {
    status: 'offline',
    data: {
      message: {
        id: `offline-${Date.now()}`,
        content: randomResponse,
        persona: personaId,
        timestamp: new Date(),
        confidence: 0,
        metadata: {
          offline: true
        }
      }
    }
  }
}