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
      marginTop: '12px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      borderRadius: '8px',
      border: '1px solid #cbd5e1'
    }}>
      {/* Description */}
      <p style={{
        margin: '0 0 8px',
        fontSize: '0.9rem',
        color: '#475569',
        fontStyle: 'italic'
      }}>
        {context.description}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginTop: '8px'
      }}>
        {/* Learning Objectives */}
        {context.objectives && (
          <div>
            <h4 style={{
              margin: '0 0 4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🎯 Objetivos
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              {context.objectives.map((objective, index) => (
                <li key={index} style={{ marginBottom: '2px' }}>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prerequisites */}
        {context.prerequisite && (
          <div>
            <h4 style={{
              margin: '0 0 4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📋 Pré-requisito
            </h4>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              {context.prerequisite}
            </p>
          </div>
        )}

        {/* Tips */}
        {context.tips && (
          <div>
            <h4 style={{
              margin: '0 0 4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',  
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              💡 Dicas
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              {context.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: '2px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Step */}
        {context.nextStep && (
          <div>
            <h4 style={{
              margin: '0 0 4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ➡️ Próximo Passo
            </h4>
            <a
              href={context.nextStep.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: '#1976d2',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1565c0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1976d2';
              }}
            >
              {context.nextStep.label} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}