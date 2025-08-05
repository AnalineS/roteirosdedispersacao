'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ContextualBreadcrumbs from './ContextualBreadcrumbs';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string;
  isCurrentPage?: boolean;
  category?: 'learning' | 'interaction' | 'progress' | 'tools';
  estimatedTime?: string;
  completionRate?: number;
}

export default function EducationalBreadcrumbs() {
  const pathname = usePathname();

  // Definir mapping de rotas para breadcrumbs educacionais
  const getEducationalBreadcrumbs = (path: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Sistema Educacional',
        href: '/',
        icon: '🏠',
        category: 'learning'
      }
    ];

    if (path === '/') {
      breadcrumbs[0].isCurrentPage = true;
      return breadcrumbs;
    }

    // Dashboard
    if (path.startsWith('/dashboard')) {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
        icon: '📊', 
        category: 'progress',
        isCurrentPage: path === '/dashboard'
      });
    }
    
    // Chat
    else if (path.startsWith('/chat')) {
      breadcrumbs.push({
        label: 'Assistentes Virtuais',
        href: '/chat',
        icon: '💬',
        category: 'interaction',
        isCurrentPage: path === '/chat'
      });
    }
    
    // Modules
    else if (path.startsWith('/modules')) {
      breadcrumbs.push({
        label: 'Módulos Educacionais',
        href: '/modules',
        icon: '📚',
        category: 'learning',
        isCurrentPage: path === '/modules'
      });

      // Sub-módulos específicos
      if (path === '/modules/hanseniase') {
        breadcrumbs.push({
          label: 'Sobre a Hanseníase',
          href: '/modules/hanseniase',
          icon: '🔬',
          category: 'learning',
          estimatedTime: '10 min',
          isCurrentPage: true
        });
      } else if (path === '/modules/diagnostico') {
        breadcrumbs.push({
          label: 'Diagnóstico',
          href: '/modules/diagnostico',
          icon: '🩺',
          category: 'learning',
          estimatedTime: '15 min',
          isCurrentPage: true
        });
      } else if (path === '/modules/tratamento') {
        breadcrumbs.push({
          label: 'Tratamento PQT-U',
          href: '/modules/tratamento',
          icon: '💊',
          category: 'learning',
          estimatedTime: '20 min',
          isCurrentPage: true
        });
      }
    }
    
    // Resources/Tools
    else if (path.startsWith('/resources')) {
      breadcrumbs.push({
        label: 'Recursos Práticos',
        href: '/resources',
        icon: '🛠️',
        category: 'tools',
        isCurrentPage: path === '/resources'
      });

      if (path === '/resources/calculator') {
        breadcrumbs.push({
          label: 'Calculadora de Doses',
          href: '/resources/calculator',
          icon: '🧮',
          category: 'tools',
          isCurrentPage: true
        });
      } else if (path === '/resources/checklist') {
        breadcrumbs.push({
          label: 'Checklist Dispensação',
          href: '/resources/checklist',
          icon: '✅',
          category: 'tools',
          isCurrentPage: true
        });
      }
    }
    
    // Progress
    else if (path.startsWith('/progress')) {
      breadcrumbs.push({
        label: 'Meu Progresso',
        href: '/progress',
        icon: '📈',
        category: 'progress',
        completionRate: 65,
        isCurrentPage: path === '/progress'
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getEducationalBreadcrumbs(pathname);

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'learning': return '#1976d2';
      case 'interaction': return '#4caf50';
      case 'progress': return '#ff9800';
      case 'tools': return '#9c27b0';
      default: return '#666';
    }
  };

  return (
    <nav aria-label="Educational breadcrumb navigation" role="navigation">
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        listStyle: 'none',
        margin: 0,
        padding: 0
      }}>
        {breadcrumbs.map((item, index) => (
          <li key={item.href} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Breadcrumb Item */}
            {item.isCurrentPage ? (
              <span
                aria-current="page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: getCategoryColor(item.category),
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                
                {/* Meta information for current page */}
                {item.estimatedTime && (
                  <span style={{
                    fontSize: '0.7rem',
                    opacity: 0.8,
                    marginLeft: '4px'
                  }}>
                    ⏱️ {item.estimatedTime}
                  </span>
                )}
                {item.completionRate !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    opacity: 0.8,
                    marginLeft: '4px'
                  }}>
                    📊 {item.completionRate}%
                  </span>
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                tabIndex={0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  color: getCategoryColor(item.category),
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${getCategoryColor(item.category)}20`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${getCategoryColor(item.category)}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = `${getCategoryColor(item.category)}10`;
                  e.currentTarget.style.outline = `2px solid ${getCategoryColor(item.category)}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.outline = 'none';
                }}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            )}

            {/* Separator */}
            {index < breadcrumbs.length - 1 && (
              <span style={{
                color: '#94a3b8',
                fontSize: '0.8rem',
                margin: '0 2px'
              }}>
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      {/* Contextual Educational Information */}
      <ContextualBreadcrumbs 
        currentPath={pathname}
        breadcrumbs={breadcrumbs}
      />
    </nav>
  );
}