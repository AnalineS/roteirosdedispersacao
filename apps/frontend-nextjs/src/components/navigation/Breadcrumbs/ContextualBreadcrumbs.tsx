'use client';

import { BreadcrumbItem } from './index';

interface ContextualBreadcrumbsProps {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
}

export default function ContextualBreadcrumbs({ currentPath, breadcrumbs }: ContextualBreadcrumbsProps) {
  const currentItem = breadcrumbs.find(item => item.isCurrentPage);
  
  // Não mostrar informações contextuais na homepage
  if (currentPath === '/' || !currentItem) {
    return null;
  }

  const getEducationalContext = (path: string) => {
    // Contexto específico para cada seção educacional
    switch (true) {
      case path.startsWith('/modules/hanseniase'):
        return {
          description: 'Aprenda os conceitos fundamentais sobre hanseníase',
          objectives: ['Entender a fisiopatologia', 'Conhecer os tipos clínicos', 'Identificar fatores de risco'],
          prerequisite: 'Conhecimento básico em saúde',
          nextStep: { label: 'Diagnóstico', href: '/modules/diagnostico' }
        };
        
      case path.startsWith('/modules/diagnostico'):
        return {
          description: 'Dominar as técnicas de diagnóstico da hanseníase',
          objectives: ['Reconhecer sinais e sintomas', 'Interpretar exames', 'Aplicar critérios diagnósticos'],
          prerequisite: 'Módulo: Sobre a Hanseníase',
          nextStep: { label: 'Tratamento PQT-U', href: '/modules/tratamento' }
        };
        
      case path.startsWith('/modules/tratamento'):
        return {
          description: 'Aprenda a aplicar a Poliquimioterapia Única (PQT-U)',
          objectives: ['Calcular doses corretas', 'Monitorar tratamento', 'Identificar reações adversas'],
          prerequisite: 'Módulo: Diagnóstico',
          nextStep: { label: 'Recursos Práticos', href: '/resources' }
        };
        
      case path.startsWith('/dashboard'):
        return {
          description: 'Acompanhe seu progresso educacional em hanseníase',
          objectives: ['Visualizar conquistas', 'Identificar lacunas', 'Planejar estudos'],
          tips: ['Revise módulos com baixa pontuação', 'Pratique com calculadoras', 'Converse com assistentes']
        };
        
      case path.startsWith('/chat'):
        return {
          description: 'Tire dúvidas com especialistas virtuais em PQT-U',
          objectives: ['Dr. Gasnelio: Suporte técnico', 'Gá: Orientação empática', 'Esclarecimento de dúvidas'],
          tips: ['Seja específico nas perguntas', 'Use exemplos de casos', 'Peça orientações práticas']
        };
        
      case path.startsWith('/resources'):
        return {
          description: 'Utilize ferramentas práticas para o dia a dia clínico',
          objectives: ['Calcular doses PQT-U', 'Verificar procedimentos', 'Consultar referencias rápidas'],
          tips: ['Bookmark para acesso rápido', 'Teste com casos reais', 'Integre ao fluxo de trabalho']
        };
        
      case path.startsWith('/progress'):
        return {
          description: 'Monitore seu desenvolvimento profissional contínuo',
          objectives: ['Avaliar competências', 'Identificar progressos', 'Definir metas de aprendizagem'],
          tips: ['Atualize regularmente', 'Comemore conquistas', 'Identifique áreas para melhorar']
        };
        
      default:
        return null;
    }
  };

  const context = getEducationalContext(currentPath);
  
  if (!context) {
    return null;
  }

  return (
    <div style={{
      marginTop: 'var(--spacing-md)',
      padding: 'var(--spacing-md) var(--spacing-lg)',
      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--color-neutral-50) 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Hierarchical position indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-sm)',
        padding: 'var(--spacing-xs) 0',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: '600'
        }}>
          📍 Você está em:
        </span>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          Nível {currentItem?.level || 1} → {currentItem?.category === 'learning' ? 'Aprendizagem' : 
                                           currentItem?.category === 'interaction' ? 'Interação' :
                                           currentItem?.category === 'progress' ? 'Progresso' : 'Ferramentas'}
        </span>
      </div>

      {/* Description */}
      <p style={{
        margin: '0 0 var(--spacing-md)',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        lineHeight: 1.5
      }}>
        {context.description}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--spacing-md)',
        marginTop: 'var(--spacing-md)'
      }}>
        {/* Learning Objectives */}
        {context.objectives && (
          <div style={{
            background: 'var(--bg-primary)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-primary-100)'
          }}>
            <h4 style={{
              margin: '0 0 var(--spacing-sm)',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: 'var(--color-primary-700)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              <span>🎯</span> Objetivos de Aprendizagem
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: 'var(--spacing-lg)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}>
              {context.objectives.map((objective, index) => (
                <li key={index} style={{ marginBottom: 'var(--spacing-xs)' }}>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prerequisites */}
        {context.prerequisite && (
          <div style={{
            background: 'var(--color-warning-50)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-warning-200)'
          }}>
            <h4 style={{
              margin: '0 0 var(--spacing-sm)',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: 'var(--color-warning-700)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              <span>📋</span> Pré-requisitos
            </h4>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: 'var(--color-warning-700)',
              lineHeight: 1.4
            }}>
              {context.prerequisite}
            </p>
          </div>
        )}

        {/* Tips */}
        {context.tips && (
          <div style={{
            background: 'var(--color-success-50)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-success-200)'
          }}>
            <h4 style={{
              margin: '0 0 var(--spacing-sm)',
              fontSize: '0.8rem',
              fontWeight: 'bold',  
              color: 'var(--color-success-700)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              <span>💡</span> Dicas Práticas
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: 'var(--spacing-lg)',
              fontSize: '0.8rem',
              color: 'var(--color-success-700)',
              lineHeight: 1.4
            }}>
              {context.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: 'var(--spacing-xs)' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Step */}
        {context.nextStep && (
          <div style={{
            background: 'var(--color-purple-50)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-purple-200)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}>
            <h4 style={{
              margin: '0 0 var(--spacing-sm)',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: 'var(--color-purple-700)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              <span>➡️</span> Próxima Etapa
            </h4>
            <a
              href={context.nextStep.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'var(--color-primary-600)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-700)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-600)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              aria-label={`Continuar para ${context.nextStep.label}`}
            >
              <span>{context.nextStep.label}</span>
              <span>→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}