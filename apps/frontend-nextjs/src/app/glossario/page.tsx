'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function GlossarioPage() {
  const unbColors = getUnbColors();

  const termos = [
    {
      termo: 'PQT-U',
      definicao: 'Poliquimioterapia Única - Esquema de tratamento padronizado para hanseníase'
    },
    {
      termo: 'MB (Multibacilar)',
      definicao: 'Forma da hanseníase com carga bacilar elevada, tratada por 12 meses'
    },
    {
      termo: 'PB (Paucibacilar)',
      definicao: 'Forma da hanseníase com baixa carga bacilar, tratada por 6 meses'
    },
    {
      termo: 'Rifampicina',
      definicao: 'Antibiótico bactericida principal no tratamento da hanseníase'
    },
    {
      termo: 'Clofazimina',
      definicao: 'Antimicobacteriano usado no tratamento MB, causa pigmentação cutânea'
    },
    {
      termo: 'Dapsona',
      definicao: 'Antimicobacteriano usado em ambas as formas de PQT'
    }
  ];

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
            📖 Glossário
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Termos técnicos da hanseníase e dispensação farmacêutica
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {termos.map((item, index) => (
              <div key={index} style={{
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  margin: '0 0 0.5rem', 
                  color: unbColors.primary,
                  fontSize: '1.1rem' 
                }}>
                  {item.termo}
                </h3>
                <p style={{ 
                  margin: 0, 
                  color: '#64748b',
                  lineHeight: '1.5' 
                }}>
                  {item.definicao}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}