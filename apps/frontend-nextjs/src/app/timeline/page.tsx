'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import AnonymousTimeline from '@/components/educational/AnonymousTimeline';
import { getUnbColors } from '@/config/modernTheme';
import { ClockIcon, InfoIcon } from '@/components/icons/EducationalIcons';

export default function TimelinePage() {
  const unbColors = getUnbColors();

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '3rem 2rem',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '20px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <ClockIcon size={48} color="white" />
            <h1 style={{
              margin: 0,
              fontSize: '2.75rem',
              fontWeight: 'bold'
            }}>
              Timeline de Tratamento
            </h1>
          </div>

          <p style={{
            margin: 0,
            fontSize: '1.3rem',
            opacity: 0.95,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}>
            Acompanhe o cronograma completo do tratamento PQT-U para hanseníase
          </p>
        </header>

        {/* Educational Info */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <InfoIcon size={32} color={unbColors.primary} />
            <div>
              <h2 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: unbColors.primary
              }}>
                Sobre o Protocolo PQT-U
              </h2>
              <p style={{
                margin: 0,
                fontSize: '1.1rem',
                color: '#64748b',
                lineHeight: '1.6'
              }}>
                A Poliquimioterapia Única (PQT-U) é o tratamento padrão para hanseníase no Brasil,
                recomendado pelo Ministério da Saúde e pela Organização Mundial da Saúde.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⏰ Duração
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.95rem'
              }}>
                <strong>6 meses</strong> de tratamento com doses supervisionadas mensais
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💊 Medicações
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.95rem'
              }}>
                <strong>3 medicamentos:</strong> Rifampicina, Clofazimina e Dapsona
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ✅ Eficácia
              </h3>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '0.95rem'
              }}>
                <strong>100% de cura</strong> quando seguido corretamente
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Component */}
        <AnonymousTimeline
          showProgress={true}
          interactive={true}
        />

        {/* Footer Information */}
        <div style={{
          background: 'white',
          border: `1px solid ${unbColors.primary}30`,
          borderRadius: '16px',
          padding: '2rem',
          marginTop: '3rem',
          textAlign: 'center'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: unbColors.primary
          }}>
            Precisa de Ajuda?
          </h3>

          <p style={{
            margin: '0 0 1.5rem 0',
            color: '#64748b',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            Este timeline é baseado nos protocolos oficiais do Ministério da Saúde.
            Para dúvidas específicas sobre seu tratamento, consulte sempre um profissional de saúde.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#f0f9ff',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid #bae6fd',
              textAlign: 'left'
            }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#0369a1'
              }}>
                📞 Disque Saúde
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#0369a1'
              }}>
                136 - Atendimento 24h
              </p>
            </div>

            <div style={{
              background: '#f0fdf4',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid #bbf7d0',
              textAlign: 'left'
            }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#15803d'
              }}>
                🏥 Unidade de Saúde
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#15803d'
              }}>
                Procure a UBS mais próxima
              </p>
            </div>

            <div style={{
              background: '#fef3c7',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid #fde047',
              textAlign: 'left'
            }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#92400e'
              }}>
                🎓 Material Educativo
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#92400e'
              }}>
                Baseado em tese de doutorado
              </p>
            </div>
          </div>
        </div>
      </div>
    </EducationalLayout>
  );
}