'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';

export default function ContatoPage() {
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
            📞 Contato
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Canais de comunicação e suporte
          </p>
        </header>

        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{
              padding: '1.5rem',
              background: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #e0f2fe'
            }}>
              <h3 style={{ color: unbColors.primary, margin: '0 0 1rem' }}>
                🎓 Informações Acadêmicas
              </h3>
              <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>
                <strong>Programa de Pós-Graduação em Ciências Farmacêuticas</strong><br />
                Universidade de Brasília (UnB)<br />
                Campus Universitário Darcy Ribeiro<br />
                Brasília - DF, Brasil
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #dcfce7'
            }}>
              <h3 style={{ color: unbColors.secondary, margin: '0 0 1rem' }}>
                💬 Suporte Técnico
              </h3>
              <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>
                Para questões técnicas sobre a plataforma ou dúvidas sobre 
                funcionalidades, utilize os assistentes Dr. Gasnelio e Gá 
                disponíveis na seção Chat.
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: '#fefce8',
              borderRadius: '12px',
              border: '1px solid #fef3c7'
            }}>
              <h3 style={{ color: '#d97706', margin: '0 0 1rem' }}>
                🤝 Colaborações
              </h3>
              <p style={{ margin: 0, color: '#64748b', lineHeight: '1.6' }}>
                Interessado em colaborar com pesquisas sobre hanseníase 
                ou cuidado farmacêutico? Entre em contato através dos 
                canais institucionais da UnB.
              </p>
            </div>
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}