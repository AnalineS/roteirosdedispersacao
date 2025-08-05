'use client';

import { useRouter } from 'next/navigation';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { usePersonas } from '@/hooks/usePersonas';
import { useUserProfile } from '@/hooks/useUserProfile';
import PersonaSelector from '@/components/personas/PersonaSelector';
import type { UserProfile } from '@/hooks/useUserProfile';

export default function HomePage() {
  const { personas, loading, error, getValidPersonasCount } = usePersonas();
  const { saveProfile } = useUserProfile();
  const router = useRouter();

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

  const handlePersonaSelect = (personaId: string, userProfile: UserProfile) => {
    // Salvar perfil com persona selecionada
    const profileWithPersona = {
      ...userProfile,
      selectedPersona: personaId
    };
    
    saveProfile(profileWithPersona);
    
    // Navegar para o chat
    router.push('/chat');
  };

  return (
    <EducationalLayout showSidebar={false} showBreadcrumbs={false}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        color: 'white',
        padding: '20px',
        margin: '-20px',
        position: 'relative'
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

        {/* Persona Selector */}
        <PersonaSelector 
          personas={personas}
          onPersonaSelect={handlePersonaSelect}
        />

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
            Sistema com IA e prompts especializados • {getValidPersonasCount()} assistentes disponíveis
          </p>
        </div>
      </div>
    </EducationalLayout>
  );
}