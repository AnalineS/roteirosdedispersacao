'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import KeyboardNavigationValidator from '@/components/accessibility/KeyboardNavigationValidator';
import { getUnbColors } from '@/config/modernTheme';
import { ChecklistIcon, EyeIcon, TargetIcon, SearchIcon } from '@/components/icons/EducationalIcons';

export default function AcessibilidadePage() {
  const unbColors = getUnbColors();

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ChecklistIcon size={40} color="white" /> Acessibilidade
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Validação WCAG 2.1 AA e ferramentas de acessibilidade para interfaces médicas
          </p>
        </header>

        {/* Informações sobre acessibilidade */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TargetIcon size={24} color={unbColors.primary} /> Sobre Acessibilidade Médica
          </h2>
          <p style={{ marginBottom: '1rem', color: '#64748b', lineHeight: '1.6' }}>
            A acessibilidade em sistemas médicos é fundamental para garantir que todos os profissionais de saúde e pacientes
            possam utilizar a plataforma de forma eficaz, independentemente de suas habilidades ou limitações.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChecklistIcon size={20} color="#0369a1" /> Navegação por Teclado
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e' }}>
                Todos os elementos interativos devem ser acessíveis via teclado para profissionais com limitações motoras.
              </p>
            </div>

            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <EyeIcon size={20} color="#15803d" /> Leitores de Tela
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#14532d' }}>
                Conteúdo médico deve ser claramente estruturado para profissionais com deficiência visual.
              </p>
            </div>

            <div style={{
              padding: '1rem',
              background: '#fefce8',
              borderRadius: '8px',
              border: '1px solid #fde047'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', color: '#a16207', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TargetIcon size={20} color="#a16207" /> Alto Contraste
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#713f12' }}>
                Cores e contrastes adequados são essenciais em ambientes médicos com diferentes condições de iluminação.
              </p>
            </div>
          </div>
        </section>

        {/* Validador de navegação por teclado */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SearchIcon size={24} color={unbColors.primary} /> Validador de Navegação por Teclado
          </h2>

          <div style={{
            padding: '1rem',
            background: '#fef3f2',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <TargetIcon size={16} color="#991b1b" />
              <span><strong>Ferramenta de Desenvolvimento:</strong> Este validador analisa a acessibilidade
              da página em tempo real, verificando conformidade com WCAG 2.1 AA.</span>
            </p>
          </div>

          <KeyboardNavigationValidator />
        </section>
      </div>
    </EducationalLayout>
  );
}