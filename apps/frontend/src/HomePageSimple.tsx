import { Link } from 'react-router-dom'

const HomePageSimple = () => {
  const personas = {
    dr_gasnelio: {
      name: 'Dr. Gasnelio',
      role: 'Especialista em Hanseníase',
      emoji: '👨‍⚕️',
      description: 'Para profissionais de saúde e informações técnicas detalhadas'
    },
    ga: {
      name: 'Gá',
      role: 'Assistente Educacional',
      emoji: '🤝',
      description: 'Para pacientes e familiares com linguagem simples e acolhedora'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      color: 'white',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        paddingTop: '40px'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          Sistema Inteligente de Dispensação PQT-U
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          marginBottom: '40px',
          opacity: 0.9
        }}>
          Assistente virtual especializado em poliquimioterapia única para hanseníase
        </p>
      </div>

      {/* Personas Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        marginTop: '60px'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          fontSize: '2rem'
        }}>
          Escolha seu Assistente Virtual
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {Object.entries(personas).map(([id, persona]) => (
            <div
              key={id}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onClick={() => {
                localStorage.setItem('selectedPersona', id)
                window.location.href = '/chat'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                {persona.emoji}
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                {persona.name}
              </h3>
              <p style={{ fontSize: '1rem', marginBottom: '10px', opacity: 0.9 }}>
                {persona.role}
              </p>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                {persona.description}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <Link
            to="/chat"
            style={{
              display: 'inline-block',
              background: 'white',
              color: '#1976d2',
              padding: '15px 40px',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            Iniciar Conversa
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        textAlign: 'center',
        marginTop: '80px',
        opacity: 0.7,
        fontSize: '0.875rem'
      }}>
        <p>Plataforma educacional com assistentes virtuais especializados</p>
        <p>Baseado em evidências científicas e diretrizes do Ministério da Saúde</p>
      </div>
    </div>
  )
}

export default HomePageSimple