'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function BibliografiaPage() {
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
            📚 Bibliografia
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Referências científicas e diretrizes utilizadas
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <h3 style={{ color: unbColors.primary, marginBottom: '1rem' }}>
              Principais Referências
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
                BRASIL. Ministério da Saúde. Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase. 
              </p>
              <p style={{ margin: 0, color: '#64748b' }}>
                Brasília: Ministério da Saúde, 2022.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
                WORLD HEALTH ORGANIZATION. Guidelines for the diagnosis, treatment and prevention of leprosy.
              </p>
              <p style={{ margin: 0, color: '#64748b' }}>
                Geneva: WHO, 2018.
              </p>
            </div>
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}