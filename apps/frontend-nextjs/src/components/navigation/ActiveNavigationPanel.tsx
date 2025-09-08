'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActiveIcon, ActiveIconPanel } from '@/components/icons/ActiveIconSystem';

/**
 * Painel de Navegação com Ícones Ativos
 * Ativa todos os ícones de navegação que estavam inativos
 */
export const ActiveNavigationPanel: React.FC<{
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'floating' | 'fixed' | 'inline';
  showLabels?: boolean;
}> = ({
  position = 'bottom',
  variant = 'floating',
  showLabels = true
}) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'SystemLogoIcon' as const,
      label: 'Início',
      href: '/',
      color: '#003366'
    },
    {
      name: 'ChatBotIcon' as const,
      label: 'Chat IA',
      href: '/chat',
      color: '#059669',
      badge: pathname === '/chat' ? '●' : undefined
    },
    {
      name: 'ModulesIcon' as const,
      label: 'Módulos',
      href: '/modules',
      color: '#7c2d12'
    },
    {
      name: 'ResourcesIcon' as const,
      label: 'Recursos',
      href: '/resources',
      color: '#0284c7'
    },
    {
      name: 'ProgressIcon' as const,
      label: 'Progresso',
      href: '/progress',
      color: '#7c3aed'
    },
    {
      name: 'DashboardIcon' as const,
      label: 'Dashboard',
      href: '/dashboard',
      color: '#dc2626'
    }
  ];

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      zIndex: 1000,
      background: variant === 'floating' ? 'rgba(255, 255, 255, 0.95)' : 'white',
      backdropFilter: variant === 'floating' ? 'blur(10px)' : undefined,
      boxShadow: variant === 'floating' ? '0 8px 32px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
      borderRadius: variant === 'floating' ? '16px' : '0',
      padding: '12px'
    };

    if (variant === 'fixed') {
      base.position = 'fixed';
      
      switch (position) {
        case 'top':
          return { ...base, top: 0, left: 0, right: 0, borderRadius: '0' };
        case 'bottom':
          return { ...base, bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
        case 'left':
          return { ...base, left: '20px', top: '50%', transform: 'translateY(-50%)', flexDirection: 'column' };
        case 'right':
          return { ...base, right: '20px', top: '50%', transform: 'translateY(-50%)', flexDirection: 'column' };
      }
    }

    return base;
  };

  return (
    <nav style={getPositionStyles()}>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexDirection: position === 'left' || position === 'right' ? 'column' : 'row'
      }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                background: isActive ? 'rgba(0, 51, 102, 0.1)' : 'transparent',
                border: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                minWidth: position === 'left' || position === 'right' ? '60px' : undefined
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(0, 51, 102, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ position: 'relative' }}>
                <ActiveIcon
                  name={item.name}
                  size={position === 'left' || position === 'right' ? 'large' : 'medium'}
                  color={isActive ? item.color : '#6b7280'}
                  animate={true}
                />
                
                {item.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: '8px',
                      fontWeight: 'bold'
                    }}>
                      {item.badge}
                    </span>
                  </div>
                )}
              </div>
              
              {showLabels && (
                <span style={{
                  fontSize: '11px',
                  color: isActive ? item.color : '#6b7280',
                  fontWeight: isActive ? '600' : '400',
                  whiteSpace: 'nowrap'
                }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Barra de Ferramentas com Ícones Ativos
 * Ativa ícones de funcionalidades como Print, Menu, Info, etc.
 */
export const ActiveToolbar: React.FC<{
  tools?: Array<{
    name: keyof typeof import('@/components/icons/ActiveIconSystem').ActiveIcons;
    label: string;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
  }>;
}> = ({
  tools = []
}) => {
  const defaultTools = [
    {
      name: 'MenuIcon' as const,
      label: 'Menu',
      onClick: () => console.log('Menu clicked'),
      color: '#374151'
    },
    {
      name: 'PrintIcon' as const,
      label: 'Imprimir',
      onClick: () => window.print(),
      color: '#059669'
    },
    {
      name: 'RefreshIcon' as const,
      label: 'Atualizar',
      onClick: () => window.location.reload(),
      color: '#0284c7'
    },
    {
      name: 'InfoIcon' as const,
      label: 'Informações',
      onClick: () => alert('Sistema de Roteiros de Dispensação PQT-U\nVersão: 1.0\nDesenvolvido pela UnB'),
      color: '#7c3aed'
    }
  ];

  const allTools = [...defaultTools, ...tools];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      {allTools.map((tool, index) => (
        <button
          key={index}
          onClick={tool.onClick}
          disabled={'disabled' in tool ? tool.disabled : false}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '8px',
            background: 'transparent',
            cursor: ('disabled' in tool && tool.disabled) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: ('disabled' in tool && tool.disabled) ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!('disabled' in tool && tool.disabled)) {
              e.currentTarget.style.background = `${tool.color}15`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <ActiveIcon
            name={tool.name}
            size="small"
            color={tool.color}
          />
          <span style={{
            fontSize: '12px',
            color: tool.color,
            fontWeight: '500'
          }}>
            {tool.label}
          </span>
        </button>
      ))}
    </div>
  );
};

/**
 * Barra de Status com Ícones Ativos
 * Mostra status do sistema usando ícones antes inativos
 */
export const ActiveStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusItems = [
    {
      name: 'ClockIcon' as const,
      label: currentTime.toLocaleTimeString(),
      color: '#374151'
    },
    {
      name: 'SystemLogoIcon' as const,
      label: 'Sistema Online',
      color: '#059669'
    },
    {
      name: 'LightbulbIcon' as const,
      label: 'IA Ativa',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '8px 16px',
      background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
      borderTop: '1px solid #e2e8f0',
      alignItems: 'center'
    }}>
      {statusItems.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ActiveIcon
            name={item.name}
            size="small"
            color={item.color}
          />
          <span style={{
            fontSize: '12px',
            color: item.color,
            fontWeight: '500'
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ActiveNavigationPanel;