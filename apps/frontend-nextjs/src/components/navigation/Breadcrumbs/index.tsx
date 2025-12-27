'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import ContextualBreadcrumbs from './ContextualBreadcrumbs';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string;
  isCurrentPage?: boolean;
  category?: 'learning' | 'interaction' | 'progress' | 'tools';
  estimatedTime?: string;
  completionRate?: number;
  level?: number; // Hierarquia de profundidade
  parentPath?: string; // Caminho do pai para navegação hierárquica
}

// Interface para páginas na hierarquia
interface HierarchyPage {
  level: number;
  label: string;
  icon: string;
  category: 'learning' | 'interaction' | 'progress' | 'tools';
  parent?: string;
  estimatedTime?: string;
  completionRate?: number;
}

// Definir estrutura hierárquica clara do site
const SITE_HIERARCHY: Record<string, HierarchyPage> = {
  '/': { level: 0, label: 'Sistema Educacional', icon: '🏠', category: 'learning' },
  
  // Área de Aprendizagem
  '/modules': { level: 1, parent: '/', label: 'Módulos Educacionais', icon: '📚', category: 'learning' },
  '/modules/hanseniase': { level: 2, parent: '/modules', label: 'Sobre a Hanseníase', icon: '🔬', category: 'learning', estimatedTime: '10 min' },
  '/modules/diagnostico': { level: 2, parent: '/modules', label: 'Diagnóstico', icon: '🩺', category: 'learning', estimatedTime: '15 min' },
  '/modules/tratamento': { level: 2, parent: '/modules', label: 'Tratamento PQT-U', icon: '💊', category: 'learning', estimatedTime: '20 min' },
  '/modules/roteiro-dispensacao': { level: 2, parent: '/modules', label: 'Roteiro de Dispensação', icon: '📋', category: 'learning', estimatedTime: '25 min' },
  '/modules/vida-com-doenca': { level: 2, parent: '/modules', label: 'Vida com Hanseníase', icon: '💚', category: 'learning', estimatedTime: '15 min' },
  
  // Ferramentas Práticas
  '/resources': { level: 1, parent: '/', label: 'Recursos Práticos', icon: '🛠️', category: 'tools' },
  '/resources/calculator': { level: 2, parent: '/resources', label: 'Calculadora de Doses', icon: '🧮', category: 'tools' },
  '/resources/checklist': { level: 2, parent: '/resources', label: 'Checklist Dispensação', icon: '✅', category: 'tools' },
  '/resources/interactions': { level: 2, parent: '/resources', label: 'Verificador de Interações', icon: '⚠️', category: 'tools' },
  
  // Interação
  '/chat': { level: 1, parent: '/', label: 'Assistentes Virtuais', icon: '💬', category: 'interaction' },
  '/dashboard': { level: 1, parent: '/', label: 'Dashboard', icon: '📊', category: 'progress' },
  '/progress': { level: 1, parent: '/', label: 'Meu Progresso', icon: '📈', category: 'progress', completionRate: 65 },
  
  // Área Administrativa
  '/admin': { level: 1, parent: '/', label: 'Administração', icon: '⚙️', category: 'tools' },
  '/admin/features': { level: 2, parent: '/admin', label: 'Feature Flags', icon: '🚩', category: 'tools' },
  '/admin/analytics': { level: 2, parent: '/admin', label: 'Analytics', icon: '📊', category: 'tools' },
  
  // Autenticação
  '/login': { level: 1, parent: '/', label: 'Login', icon: '🔐', category: 'tools' },
  '/cadastro': { level: 1, parent: '/', label: 'Cadastro', icon: '📝', category: 'tools' },
  '/esqueci-senha': { level: 1, parent: '/', label: 'Recuperar Senha', icon: '🔑', category: 'tools' },
  
  // Paginas Institucionais (Issue #13 - consolidadas)
  '/sobre': { level: 1, parent: '/', label: 'Sobre o Sistema', icon: '📚', category: 'learning' },
  '/equipe': { level: 1, parent: '/', label: 'Conheca a Equipe', icon: '👥', category: 'learning' },
  '/vida-com-hanseniase': { level: 1, parent: '/', label: 'Vida com Hanseniase', icon: '💚', category: 'learning' },
  
  // Ferramentas Individuais
  '/glossario': { level: 1, parent: '/', label: 'Glossário Médico', icon: '📖', category: 'tools' },
  '/downloads': { level: 1, parent: '/', label: 'Downloads', icon: '📄', category: 'tools' },
  '/sitemap': { level: 1, parent: '/', label: 'Mapa do Site', icon: '🗺️', category: 'tools' },
  
  // Legais
  '/privacidade': { level: 1, parent: '/', label: 'Política de Privacidade', icon: '🛡️', category: 'tools' },
  '/termos': { level: 1, parent: '/', label: 'Termos de Uso', icon: '📜', category: 'tools' },
  '/conformidade': { level: 1, parent: '/', label: 'Conformidade LGPD', icon: '⚖️', category: 'tools' }
};

export default function EducationalBreadcrumbs() {
  const pathname = usePathname();

  // Gerar breadcrumbs hierárquicos baseados na estrutura do site
  const breadcrumbs = useMemo(() => {
    const currentPath = pathname || '/';
    const breadcrumbChain: BreadcrumbItem[] = [];
    
    // Função recursiva para construir a cadeia de breadcrumbs
    const buildBreadcrumbChain = (path: string): void => {
      const pageInfo = SITE_HIERARCHY[path];
      
      if (pageInfo) {
        // Adicionar o pai primeiro (se existir)
        if (pageInfo.parent && pageInfo.parent !== path) {
          buildBreadcrumbChain(pageInfo.parent);
        }
        
        // Adicionar a página atual
        breadcrumbChain.push({
          label: pageInfo.label,
          href: path,
          icon: pageInfo.icon,
          category: pageInfo.category,
          level: pageInfo.level,
          parentPath: pageInfo.parent,
          estimatedTime: pageInfo.estimatedTime,
          completionRate: pageInfo.completionRate,
          isCurrentPage: path === currentPath
        });
      } else {
        // Para paths não mapeados, tentar inferir a hierarquia
        const pathSegments = path.split('/').filter(Boolean);
        
        // Sempre começar com home
        if (breadcrumbChain.length === 0) {
          breadcrumbChain.push({
            label: 'Sistema Educacional',
            href: '/',
            icon: '🏠',
            category: 'learning',
            level: 0,
            isCurrentPage: currentPath === '/'
          });
        }
        
        // Tentar construir hierarquia baseada nos segmentos do path
        let currentBuildPath = '';
        pathSegments.forEach((segment, index) => {
          currentBuildPath += '/' + segment;
          const segmentInfo = SITE_HIERARCHY[currentBuildPath];
          
          if (segmentInfo) {
            // Verificar se não já está na cadeia
            const alreadyExists = breadcrumbChain.some(item => item.href === currentBuildPath);
            if (!alreadyExists) {
              breadcrumbChain.push({
                label: segmentInfo.label,
                href: currentBuildPath,
                icon: segmentInfo.icon,
                category: segmentInfo.category,
                level: segmentInfo.level,
                parentPath: segmentInfo.parent,
                estimatedTime: segmentInfo.estimatedTime,
                completionRate: segmentInfo.completionRate,
                isCurrentPage: currentBuildPath === currentPath
              });
            }
          } else if (currentBuildPath === currentPath) {
            // Página não mapeada, adicionar com informações básicas
            breadcrumbChain.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
              href: currentBuildPath,
              category: 'tools',
              level: index + 1,
              isCurrentPage: true
            });
          }
        });
      }
    };
    
    buildBreadcrumbChain(currentPath);
    
    return breadcrumbChain;
  }, [pathname]);

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'learning': return 'var(--color-primary-600)';
      case 'interaction': return 'var(--color-success-600)';
      case 'progress': return 'var(--color-warning-600)';
      case 'tools': return 'var(--color-purple-600)';
      default: return 'var(--color-neutral-600)';
    }
  };

  const getCategoryBackground = (category?: string) => {
    switch (category) {
      case 'learning': return 'var(--color-primary-50)';
      case 'interaction': return 'var(--color-success-50)';
      case 'progress': return 'var(--color-warning-50)';
      case 'tools': return 'var(--color-purple-50)';
      default: return 'var(--color-neutral-50)';
    }
  };

  // Para mobile, mostrar apenas os últimos 2 níveis para economia de espaço
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const displayBreadcrumbs = useMemo(() => {
    if (!isMobile || breadcrumbs.length <= 2) {
      return breadcrumbs;
    }
    
    // Em mobile, mostrar apenas home + atual se há muitos níveis
    if (breadcrumbs.length > 3) {
      const ellipsisItem: BreadcrumbItem & { isEllipsis: boolean } = {
        label: '...',
        href: '#',
        category: 'tools',
        level: -1,
        isEllipsis: true
      };
      
      return [
        breadcrumbs[0], // Home sempre
        ellipsisItem,
        ...breadcrumbs.slice(-1) // Página atual
      ];
    }
    
    return breadcrumbs;
  }, [breadcrumbs, isMobile]);

  return (
    <nav 
      aria-label="Navegação hierárquica do site" 
      role="navigation"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: isMobile ? 'var(--spacing-sm) var(--spacing-md)' : 'var(--spacing-md) var(--spacing-xl)'
      }}
    >
      {/* Breadcrumb trail */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-sm)'
      }}>
        <ol style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
          flexWrap: 'wrap',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          flex: 1
        }}>
          {displayBreadcrumbs.map((item, index) => {
            const isEllipsis = 'isEllipsis' in item && item.isEllipsis;
            
            return (
              <li key={`${item.href}-${index}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? 'var(--spacing-xs)' : 'var(--spacing-sm)'
              }}>
                {/* Breadcrumb Item */}
                {isEllipsis ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Expandir breadcrumbs completos em mobile
                      setIsMobile(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-neutral-500)',
                      cursor: 'pointer',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-neutral-100)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label="Mostrar caminho completo"
                    title="Clique para ver o caminho completo"
                  >
                    {item.label}
                  </button>
                ) : item.isCurrentPage ? (
                  <span
                    aria-current="page"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      padding: isMobile ? 'var(--spacing-xs) var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
                      background: getCategoryColor(item.category),
                      color: 'white',
                      borderRadius: 'var(--radius-md)',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {item.icon && <span role="img" aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                    
                    {/* Meta information for current page */}
                    {!isMobile && item.estimatedTime && (
                      <span style={{
                        fontSize: '0.7rem',
                        opacity: 0.9,
                        marginLeft: 'var(--spacing-xs)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        ⏱️ {item.estimatedTime}
                      </span>
                    )}
                    {!isMobile && item.completionRate !== undefined && (
                      <span style={{
                        fontSize: '0.7rem',
                        opacity: 0.9,
                        marginLeft: 'var(--spacing-xs)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        📊 {item.completionRate}%
                      </span>
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      padding: isMobile ? 'var(--spacing-xs) var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
                      color: getCategoryColor(item.category),
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      border: `1px solid transparent`,
                      background: getCategoryBackground(item.category)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = getCategoryColor(item.category);
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = getCategoryBackground(item.category);
                      e.currentTarget.style.color = getCategoryColor(item.category);
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${getCategoryColor(item.category)}`;
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                    aria-label={`Navegar para ${item.label}`}
                  >
                    {item.icon && <span role="img" aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Hierarchical Separator */}
                {index < displayBreadcrumbs.length - 1 && (
                  <span 
                    style={{
                      color: 'var(--color-neutral-400)',
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-hidden="true"
                  >
                    {item.level !== undefined && displayBreadcrumbs[index + 1]?.level !== undefined && 
                     displayBreadcrumbs[index + 1].level! > item.level ? '⤷' : '→'}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        
        {/* Contextual Actions */}
        {!isMobile && breadcrumbs.length > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            {/* Back Button */}
            {breadcrumbs.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const parentItem = breadcrumbs[breadcrumbs.length - 2];
                  if (parentItem && parentItem.href !== '#') {
                    window.location.href = parentItem.href;
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-neutral-100)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-primary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                aria-label="Voltar para página anterior"
                title={`Voltar para ${breadcrumbs[breadcrumbs.length - 2]?.label || 'página anterior'}`}
              >
                <span>←</span>
                <span>Voltar</span>
              </button>
            )}
            
            {/* Home shortcut */}
            {breadcrumbs.length > 2 && (
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary-50)';
                  e.currentTarget.style.color = 'var(--color-primary-600)';
                  e.currentTarget.style.borderColor = 'var(--color-primary-200)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-primary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
                aria-label="Ir para página inicial"
                title="Voltar ao início"
              >
                🏠
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Contextual Educational Information */}
      <ContextualBreadcrumbs 
        currentPath={pathname || '/'}
        breadcrumbs={breadcrumbs}
      />
    </nav>
  );
}