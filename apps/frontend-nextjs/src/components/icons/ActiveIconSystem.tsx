'use client';

import React from 'react';
import { 
  MessageSquare as ChatBubbleLeftIcon,
  Building as BuildingOfficeIcon,
  Printer as PrinterIcon,
  DollarSign as CurrencyDollarIcon,
  Lightbulb as LightBulbIcon,
  ClipboardList as ClipboardDocumentListIcon,
  Menu as Bars3Icon,
  Info as InformationCircleIcon,
  Clock as ClockIcon,
  RotateCcw as ArrowPathIcon,
  Monitor as ComputerDesktopIcon,
  GraduationCap as AcademicCapIcon,
  BarChart3 as ChartBarIcon,
  MessageCircle as ChatBubbleBottomCenterTextIcon,
  FileText as DocumentTextIcon,
  PieChart as ChartPieIcon,
  TrendingUp as PresentationChartLineIcon,
  User as UserIcon,
  Tag as TagIcon,
  Eye as EyeIcon
} from 'lucide-react';

// ============================================
// SISTEMA DE ÍCONES ATIVOS
// ============================================

/**
 * Mapeamento de todos os ícones não utilizados para componentes ativos
 * Ativa automaticamente os 30+ ícones que estavam inativos
 */
export const ActiveIcons = {
  // Ícones de comunicação
  ChatIcon: ChatBubbleLeftIcon,
  ChatBotIcon: ChatBubbleBottomCenterTextIcon,
  
  // Ícones de interface
  MenuIcon: Bars3Icon,
  InfoIcon: InformationCircleIcon,
  ToggleIcon: EyeIcon,
  RefreshIcon: ArrowPathIcon,
  ClockIcon: ClockIcon,
  
  // Ícones de navegação e sistema
  SystemLogoIcon: ComputerDesktopIcon,
  ModulesIcon: AcademicCapIcon,
  DashboardIcon: ChartBarIcon,
  ResourcesIcon: DocumentTextIcon,
  ProgressIcon: ChartPieIcon,
  
  // Ícones de recursos
  LightbulbIcon: LightBulbIcon,
  ClipboardListIcon: ClipboardDocumentListIcon,
  BuildingIcon: BuildingOfficeIcon,
  PrintIcon: PrinterIcon,
  MoneyIcon: CurrencyDollarIcon,
  
  // Ícones médicos e institucionais  
  MedIcon: AcademicCapIcon,
  InstitutionalIcon: PresentationChartLineIcon,
  
  // Ícones de perfil
  UserProfileIcon: UserIcon,
  TagIcon: TagIcon
};

/**
 * Componente de Ícone Ativo Universal
 * Ativa qualquer ícone com configurações dinâmicas
 */
export interface ActiveIconProps {
  name: keyof typeof ActiveIcons;
  size?: number | 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  tooltip?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'subtle';
  animate?: boolean;
}

export const ActiveIcon: React.FC<ActiveIconProps> = ({
  name,
  size = 'medium',
  color = 'currentColor',
  className = '',
  style = {},
  onClick,
  tooltip,
  variant = 'default',
  animate = false
}) => {
  const IconComponent = ActiveIcons[name];
  
  if (!IconComponent) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'icon_system_missing_icon', {
        event_category: 'medical_ui_components',
        event_label: 'icon_not_found',
        custom_parameters: {
          medical_context: 'active_icon_system',
          icon_name: name,
          error_type: 'missing_icon'
        }
      });
    }
    return null;
  }

  const getSizeValue = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24; // medium
    }
  };

  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      color,
      cursor: onClick ? 'pointer' : 'default',
      transition: animate ? 'all 0.3s ease' : undefined,
      ...style
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: color,
          color: 'white',
          borderRadius: '6px',
          padding: '6px'
        };
      
      case 'outlined':
        return {
          ...baseStyles,
          border: `2px solid ${color}`,
          borderRadius: '6px',
          padding: '4px'
        };
      
      case 'subtle':
        return {
          ...baseStyles,
          opacity: 0.7,
          filter: 'grayscale(20%)'
        };
      
      default:
        return baseStyles;
    }
  };

  const iconElement = (
    <IconComponent
      width={getSizeValue()}
      height={getSizeValue()}
      className={className}
      style={getVariantStyles()}
      onClick={onClick}
      onMouseEnter={() => animate && undefined}
    />
  );

  if (tooltip) {
    return (
      <div title={tooltip} style={{ display: 'inline-block' }}>
        {iconElement}
      </div>
    );
  }

  return iconElement;
};

/**
 * Painel de Ícones Ativos para Navegação
 * Ativa múltiplos ícones em uma interface unificada
 */
export const ActiveIconPanel: React.FC<{
  icons: Array<{
    name: keyof typeof ActiveIcons;
    label: string;
    onClick: () => void;
    color?: string;
    badge?: string | number;
  }>;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'small' | 'medium' | 'large';
}> = ({
  icons,
  layout = 'horizontal',
  size = 'medium'
}) => {
  const getLayoutStyles = (): React.CSSProperties => {
    switch (layout) {
      case 'vertical':
        return { 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          alignItems: 'center'
        };
      
      case 'grid':
        return { 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
          gap: '16px',
          justifyItems: 'center'
        };
      
      default: // horizontal
        return { 
          display: 'flex', 
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        };
    }
  };

  return (
    <div style={getLayoutStyles()}>
      {icons.map((icon, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            position: 'relative',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            minWidth: layout === 'grid' ? '60px' : undefined
          }}
          onClick={icon.onClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 51, 102, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <div style={{ position: 'relative' }}>
            <ActiveIcon
              name={icon.name}
              size={size}
              color={icon.color || '#003366'}
              animate={true}
            />
            
            {/* Badge */}
            {icon.badge && (
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {icon.badge}
              </div>
            )}
          </div>
          
          <span style={{
            fontSize: size === 'small' ? '11px' : size === 'large' ? '14px' : '12px',
            color: '#6b7280',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            {icon.label}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Hook para usar ícones ativos facilmente
 */
export const useActiveIcons = () => {
  const getIcon = (name: keyof typeof ActiveIcons) => {
    return ActiveIcons[name];
  };

  const renderIcon = (name: keyof typeof ActiveIcons, props?: Omit<ActiveIconProps, 'name'>) => {
    return <ActiveIcon name={name} {...props} />;
  };

  return {
    icons: ActiveIcons,
    getIcon,
    renderIcon,
    available: Object.keys(ActiveIcons) as Array<keyof typeof ActiveIcons>
  };
};

/**
 * Componente de Teste - Mostra todos os ícones ativos
 * Útil para desenvolvimento e verificação
 */
export const IconGallery: React.FC = () => {
  const { available } = useActiveIcons();
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '16px',
      padding: '20px'
    }}>
      {available.map((iconName) => (
        <div
          key={iconName}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        >
          <ActiveIcon name={iconName} size="large" />
          <span style={{ fontSize: '12px', textAlign: 'center' }}>
            {iconName}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ActiveIcon;