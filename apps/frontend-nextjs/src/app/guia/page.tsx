'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function GuiaPage() {
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
            📖 Guia do Usuário
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Manual completo de utilização da plataforma
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: unbColors.primary, marginBottom: '1rem' }}>
            Como Navegar na Plataforma
          </h3>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p>
              <strong>1. Página Inicial:</strong> Escolha seu assistente preferido clicando nos cards 
              Dr. Gasnelio (técnico) ou Gá (acolhedora).
            </p>
            
            <p>
              <strong>2. Chat:</strong> Converse diretamente com os assistentes sobre dúvidas 
              específicas de dispensação.
            </p>
            
            <p>
              <strong>3. Recursos:</strong> Acesse calculadoras, checklists e guias práticos 
              para seu dia a dia profissional.
            </p>
            
            <p>
              <strong>4. Módulos:</strong> Explore conteúdo educacional estruturado sobre 
              hanseníase e dispensação farmacêutica.
            </p>
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}