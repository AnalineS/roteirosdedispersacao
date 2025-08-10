'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function ComoCitarPage() {
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
            📝 Como Citar
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Instruções para citação acadêmica desta plataforma
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: unbColors.primary, marginBottom: '1rem' }}>
            Citação Sugerida (ABNT)
          </h3>
          
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            marginBottom: '1.5rem'
          }}>
            AUTOR. <strong>Sistema Educacional PQT-U: Roteiros de Dispensação para Hanseníase</strong>. 
            2024. Tese (Doutorado em Ciências Farmacêuticas) - Universidade de Brasília, Brasília, 2024. 
            Disponível em: https://roteirosdedispensacao.com. Acesso em: [data].
          </div>

          <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            Para citações específicas de conteúdo ou funcionalidades da plataforma, 
            recomenda-se incluir a seção específica utilizada e a data de acesso.
          </p>
        </section>
      </div>
    </EducationalLayout>
  );
}