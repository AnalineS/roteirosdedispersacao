'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function EticaPage() {
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
            ⚖️ Código de Ética
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Princípios éticos da pesquisa e desenvolvimento
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            O desenvolvimento desta plataforma seguiu rigorosamente os princípios éticos em 
            pesquisa científica, com aprovação do Comitê de Ética da UnB e aderência às 
            diretrizes da Resolução CNS nº 466/2012. Priorizamos a beneficência, não-maleficência, 
            autonomia e justiça em todas as etapas do projeto.
          </p>
        </section>
      </div>
    </EducationalLayout>
  );
}