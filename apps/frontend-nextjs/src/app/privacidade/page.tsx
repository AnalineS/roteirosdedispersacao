'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function PrivacidadePage() {
  const unbColors = getUnbColors();

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>
            🛡️ Política de Privacidade
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Proteção de dados pessoais e informações dos usuários
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            Esta plataforma educacional respeita a privacidade dos usuários e está em conformidade 
            com a Lei Geral de Proteção de Dados (LGPD). Não coletamos dados pessoais sem 
            consentimento explícito e utilizamos as informações apenas para fins educacionais 
            e de melhoria da experiência de aprendizagem.
          </p>
        </section>
      </div>
    </EducationalLayout>
  );
}