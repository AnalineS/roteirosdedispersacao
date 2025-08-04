import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { LOCAL_PERSONAS, generateOfflineResponse } from './data/localPersonas'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  persona?: string
}

const ChatPageSimple = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar persona selecionada e mensagens do localStorage
  useEffect(() => {
    const storedPersona = localStorage.getItem('selectedPersona')
    const storedMessages = localStorage.getItem('chatMessages')
    
    if (storedPersona) {
      setSelectedPersona(storedPersona)
    }
    
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(parsedMessages)
      } catch (error) {
        console.warn('Erro ao carregar mensagens:', error)
      }
    }

    // Mensagem de boas-vindas se não houver mensagens e tiver persona
    if (storedPersona && (!storedMessages || JSON.parse(storedMessages || '[]').length === 0)) {
      const persona = LOCAL_PERSONAS[storedPersona as keyof typeof LOCAL_PERSONAS]
      if (persona) {
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: persona.greeting,
          timestamp: new Date(),
          persona: storedPersona
        }
        setMessages([welcomeMessage])
      }
    }
  }, [])

  // Salvar mensagens no localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedPersona) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      persona: selectedPersona
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Simular delay de resposta
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Gerar resposta offline usando o sistema existente
      const response = generateOfflineResponse(selectedPersona, userMessage.content)
      
      if (response.data?.message) {
        const assistantMessage: Message = {
          id: response.data.message.id,
          role: 'assistant',
          content: response.data.message.content,
          timestamp: new Date(response.data.message.timestamp),
          persona: selectedPersona
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
        timestamp: new Date(),
        persona: selectedPersona
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('chatMessages')
    
    // Adicionar mensagem de boas-vindas novamente
    if (selectedPersona) {
      const persona = LOCAL_PERSONAS[selectedPersona as keyof typeof LOCAL_PERSONAS]
      if (persona) {
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: persona.greeting,
          timestamp: new Date(),
          persona: selectedPersona
        }
        setMessages([welcomeMessage])
      }
    }
  }

  const getCurrentPersona = () => {
    if (!selectedPersona) return null
    return LOCAL_PERSONAS[selectedPersona as keyof typeof LOCAL_PERSONAS]
  }

  const currentPersona = getCurrentPersona()

  if (!selectedPersona || !currentPersona) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h1 style={{ marginBottom: '20px' }}>Nenhuma Persona Selecionada</h1>
          <p style={{ marginBottom: '30px' }}>
            Por favor, selecione um assistente virtual na página inicial.
          </p>
          <Link 
            to="/" 
            style={{
              display: 'inline-block',
              background: 'white',
              color: '#1976d2',
              padding: '12px 30px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Voltar para Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '15px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link 
            to="/" 
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ← Voltar
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{currentPersona.avatar}</span>
            <div>
              <div style={{ fontWeight: 'bold', color: 'white' }}>{currentPersona.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{currentPersona.role}</div>
            </div>
          </div>
        </div>
        
        <button
          onClick={clearChat}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Limpar Chat
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                background: message.role === 'user' 
                  ? 'rgba(255, 255, 255, 0.9)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: message.role === 'user' ? '#1976d2' : 'white',
                padding: '12px 16px',
                borderRadius: '18px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                wordWrap: 'break-word'
              }}
            >
              <div style={{ marginBottom: '5px' }}>{message.content}</div>
              <div style={{
                fontSize: '11px',
                opacity: 0.7,
                textAlign: 'right'
              }}>
                {message.timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '18px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span>Digitando</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s infinite 0.2s'
                  }} />
                  <div style={{
                    width: '4px',
                    height: '4px',
                    background: 'white',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s infinite 0.4s'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Converse com ${currentPersona.name}...`}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '12px 16px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '20px',
              maxHeight: '100px',
              outline: 'none',
              color: '#333'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              background: !inputValue.trim() || isLoading 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(255, 255, 255, 0.9)',
              color: !inputValue.trim() || isLoading ? 'rgba(255, 255, 255, 0.6)' : '#1976d2',
              border: 'none',
              borderRadius: '20px',
              padding: '12px 20px',
              cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            Enviar
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default ChatPageSimple