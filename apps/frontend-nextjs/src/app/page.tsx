'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { usePersonas } from '@/hooks/usePersonas';

export default function HomePage() {
  const { personas, loading, error, getValidPersonasCount } = usePersonas();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
          <p>Carregando assistentes virtuais...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⚠️</div>
          <p>Erro ao carregar assistentes: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: 'white',
              color: '#1976d2',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const personasList = Object.entries(personas);

  return (
    <>
      <Navigation />
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
          {personasList.map(([id, persona]) => (
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
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('selectedPersona', id);
                  window.location.href = '/chat';
                }
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                {persona.avatar}
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                {persona.name}
              </h3>
              <p style={{ fontSize: '1rem', marginBottom: '10px', opacity: 0.9 }}>
                {persona.personality}
              </p>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                {persona.description}
              </p>
              <div style={{ marginTop: '15px', fontSize: '0.75rem', opacity: 0.7 }}>
                <strong>Para:</strong> {persona.target_audience}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <Link
            href="/chat"
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
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
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
        <p style={{ marginTop: '20px', fontSize: '0.75rem' }}>
          Conectado com IA e prompts especializados • {getValidPersonasCount()} assistentes disponíveis
        </p>
      </div>
    </div>
    </>
  );
}