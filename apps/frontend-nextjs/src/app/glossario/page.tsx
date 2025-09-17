'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';
import MedicalTermTooltip from '@/components/glossary/MedicalTermTooltip';
import { BookIcon, TargetIcon } from '@/components/icons/EducationalIcons';

export default function GlossarioPage() {
  const unbColors = getUnbColors();

  // Termos médicos disponíveis com tooltips interativos
  const termosComTooltip = [
    'PQT-U',
    'dermatoneurológico',
    'baciloscopia',
    'Mycobacterium leprae',
    'clofazimina',
    'rifampicina',
    'dapsona',
    'neurite',
    'estado reacional',
    'SINAN',
    'PCDT'
  ];

  const categorias = {
    'Siglas e Protocolos': ['PQT-U', 'SINAN', 'PCDT'],
    'Farmacologia': ['rifampicina', 'clofazimina', 'dapsona'],
    'Patologia': ['Mycobacterium leprae', 'neurite', 'estado reacional'],
    'Procedimentos': ['baciloscopia', 'dermatoneurológico']
  };

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
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <BookIcon size={40} color="white" /> Glossário
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Termos técnicos da hanseníase e dispensação farmacêutica
          </p>
        </header>

        {/* Seção de demonstração dos tooltips */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TargetIcon size={24} color={unbColors.primary} /> Glossário Interativo
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#64748b', lineHeight: '1.6' }}>
            Passe o mouse sobre os termos destacados para ver definições detalhadas, pronúncia e termos relacionados:
          </p>

          <div style={{
            padding: '1.5rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            lineHeight: '1.8',
            fontSize: '1.1rem'
          }}>
            <p style={{ margin: '0 0 1rem' }}>
              A <MedicalTermTooltip term="hanseníase">hanseníase</MedicalTermTooltip> é uma doença{' '}
              <MedicalTermTooltip term="dermatoneurológico">dermatoneurológica</MedicalTermTooltip> causada pelo{' '}
              <MedicalTermTooltip term="Mycobacterium leprae">Mycobacterium leprae</MedicalTermTooltip>.
            </p>
            <p style={{ margin: '0 0 1rem' }}>
              O tratamento padrão é a <MedicalTermTooltip term="PQT-U">PQT-U</MedicalTermTooltip>, que utiliza três medicamentos:{' '}
              <MedicalTermTooltip term="rifampicina">rifampicina</MedicalTermTooltip>,{' '}
              <MedicalTermTooltip term="clofazimina">clofazimina</MedicalTermTooltip> e{' '}
              <MedicalTermTooltip term="dapsona">dapsona</MedicalTermTooltip>.
            </p>
            <p style={{ margin: '0' }}>
              O diagnóstico pode incluir <MedicalTermTooltip term="baciloscopia">baciloscopia</MedicalTermTooltip> e deve ser notificado no{' '}
              <MedicalTermTooltip term="SINAN">SINAN</MedicalTermTooltip> conforme o{' '}
              <MedicalTermTooltip term="PCDT">PCDT</MedicalTermTooltip>.
            </p>
          </div>
        </section>

        {/* Termos por categoria */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookIcon size={24} color={unbColors.primary} /> Termos por Categoria
          </h2>

          {Object.entries(categorias).map(([categoria, termos]) => (
            <div key={categoria} style={{ marginBottom: '2rem' }}>
              <h3 style={{
                margin: '0 0 1rem',
                color: unbColors.secondary,
                fontSize: '1.2rem',
                borderBottom: `2px solid ${unbColors.secondary}`,
                paddingBottom: '0.5rem'
              }}>
                {categoria}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {termos.map((termo) => (
                  <div key={termo} style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <MedicalTermTooltip term={termo}>
                      <span style={{
                        color: unbColors.primary,
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        cursor: 'help',
                        borderBottom: '2px dotted',
                        paddingBottom: '2px'
                      }}>
                        {termo}
                      </span>
                    </MedicalTermTooltip>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </EducationalLayout>
  );
}