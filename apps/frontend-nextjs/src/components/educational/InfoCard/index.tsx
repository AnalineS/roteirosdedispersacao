'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';

interface InfoCardData {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: 'disease' | 'treatment' | 'medication' | 'procedure' | 'symptom' | 'educational';
  status: 'available' | 'coming-soon' | 'under-development';
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  icon?: string;
  primaryColor?: string;
  href?: string;
  onClick?: () => void;
  statistics?: {
    completionRate?: number;
    usersHelped?: number;
    satisfaction?: number;
  };
  tags?: string[];
  prerequisites?: string[];
}

interface InfoCardProps {
  data: InfoCardData;
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  isSelected?: boolean;
  interactive?: boolean;
  showStatistics?: boolean;
  className?: string;
}

export default function InfoCard({
  data,
  variant = 'default',
  isSelected = false,
  interactive = true,
  showStatistics = true,
  className = ''
}: InfoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryConfig = () => {
    const configs = {
      disease: { 
        icon: '🔬', 
        color: '#dc2626', 
        label: 'Doença',
        bgGradient: 'from-red-50 to-red-100'
      },
      treatment: { 
        icon: '🏥', 
        color: '#059669', 
        label: 'Tratamento',
        bgGradient: 'from-green-50 to-green-100'
      },
      medication: { 
        icon: '💊', 
        color: '#7c3aed', 
        label: 'Medicamento',
        bgGradient: 'from-purple-50 to-purple-100'
      },
      procedure: { 
        icon: '🩺', 
        color: '#1d4ed8', 
        label: 'Procedimento',
        bgGradient: 'from-blue-50 to-blue-100'
      },
      symptom: { 
        icon: '⚠️', 
        color: '#ea580c', 
        label: 'Sintoma',
        bgGradient: 'from-orange-50 to-orange-100'
      },
      educational: { 
        icon: '📚', 
        color: '#0891b2', 
        label: 'Educacional',
        bgGradient: 'from-cyan-50 to-cyan-100'
      }
    };
    return configs[data.category];
  };

  const getDifficultyConfig = () => {
    const configs = {
      basic: { color: '#22c55e', label: 'Básico', icon: '●' },
      intermediate: { color: '#f59e0b', label: 'Intermediário', icon: '●●' },
      advanced: { color: '#ef4444', label: 'Avançado', icon: '●●●' }
    };
    return data.difficulty ? configs[data.difficulty] : null;
  };

  const getStatusConfig = () => {
    const configs = {
      available: { 
        icon: '✅', 
        label: 'Disponível', 
        color: '#22c55e',
        bgColor: '#dcfce7',
        textColor: '#166534'
      },
      'coming-soon': { 
        icon: '⏰', 
        label: 'Em breve', 
        color: '#f59e0b',
        bgColor: '#fef3c7',
        textColor: '#92400e'
      },
      'under-development': { 
        icon: '🚧', 
        label: 'Em desenvolvimento', 
        color: '#6b7280',
        bgColor: '#f3f4f6',
        textColor: '#374151'
      }
    };
    return configs[data.status];
  };

  const categoryConfig = getCategoryConfig();
  const difficultyConfig = getDifficultyConfig();
  const statusConfig = getStatusConfig();
  const isClickable = data.status === 'available' && (data.href || data.onClick);

  const cardContent = (
    <div
      className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-300 bg-white
        ${isSelected ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
        ${isClickable ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : 'cursor-default'}
        ${data.status !== 'available' ? 'opacity-75' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isClickable ? data.onClick : undefined}
      style={{
        background: `linear-gradient(135deg, ${data.primaryColor || categoryConfig.color}08 0%, transparent 100%)`
      }}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm"
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.textColor
          }}
        >
          <span>{statusConfig.icon}</span>
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0"
            style={{ backgroundColor: data.primaryColor || categoryConfig.color }}
          >
            {data.icon || categoryConfig.icon}
          </div>

          {/* Title and Category */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {data.title}
              </h3>
              {difficultyConfig && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ 
                    backgroundColor: `${difficultyConfig.color}20`,
                    color: difficultyConfig.color 
                  }}
                >
                  {difficultyConfig.icon} {difficultyConfig.label}
                </span>
              )}
            </div>
            
            {data.subtitle && (
              <p className="text-sm text-gray-600 mb-1">{data.subtitle}</p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span 
                className="px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${categoryConfig.color}15`,
                  color: categoryConfig.color 
                }}
              >
                {categoryConfig.icon} {categoryConfig.label}
              </span>
              {data.estimatedTime && (
                <span className="flex items-center gap-1">
                  ⏱️ {data.estimatedTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
          {data.description}
        </p>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {data.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {data.tags.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                +{data.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Statistics */}
        {showStatistics && data.statistics && variant !== 'minimal' && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              {data.statistics.completionRate !== undefined && (
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {data.statistics.completionRate}%
                  </div>
                  <div className="text-xs text-gray-500">Conclusão</div>
                </div>
              )}
              {data.statistics.usersHelped !== undefined && (
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {data.statistics.usersHelped.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Usuários</div>
                </div>
              )}
              {data.statistics.satisfaction !== undefined && (
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {data.statistics.satisfaction}%
                  </div>
                  <div className="text-xs text-gray-500">Satisfação</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {data.prerequisites && data.prerequisites.length > 0 && variant === 'detailed' && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Pré-requisitos:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {data.prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Area */}
        {isClickable && (
          <div className={`
            flex items-center justify-between p-3 rounded-lg transition-all
            ${isHovered ? 'bg-blue-50' : 'bg-gray-50'}
          `}>
            <span 
              className="text-sm font-medium"
              style={{ color: data.primaryColor || categoryConfig.color }}
            >
              {data.status === 'available' ? 'Acessar conteúdo' : 'Visualizar'}
            </span>
            <span 
              className="text-lg transition-transform"
              style={{ 
                color: data.primaryColor || categoryConfig.color,
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
              }}
            >
              →
            </span>
          </div>
        )}
      </div>

      {/* Disabled Overlay */}
      {data.status !== 'available' && (
        <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[0.5px] rounded-xl" />
      )}
    </div>
  );

  // Wrap with Link if href is provided
  if (data.href && isClickable) {
    return (
      <Link href={data.href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// Variant compact
export function CompactInfoCard({ data, ...props }: Omit<InfoCardProps, 'variant'>) {
  const categoryConfig = data.category === 'disease' ? { icon: '🔬', color: '#dc2626' } :
                         data.category === 'treatment' ? { icon: '🏥', color: '#059669' } :
                         data.category === 'medication' ? { icon: '💊', color: '#7c3aed' } :
                         { icon: '📚', color: '#0891b2' };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ backgroundColor: data.primaryColor || categoryConfig.color }}
      >
        {data.icon || categoryConfig.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{data.title}</h4>
        <p className="text-sm text-gray-600 truncate">{data.description}</p>
      </div>
      {data.estimatedTime && (
        <span className="text-xs text-gray-500 flex-shrink-0">
          ⏱️ {data.estimatedTime}
        </span>
      )}
    </div>
  );
}

// Grid layout for multiple cards
interface InfoCardGridProps {
  cards: InfoCardData[];
  columns?: 1 | 2 | 3 | 4;
  variant?: InfoCardProps['variant'];
  className?: string;
}

export function InfoCardGrid({ 
  cards, 
  columns = 3, 
  variant = 'default',
  className = '' 
}: InfoCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
      {cards.map(card => (
        <InfoCard
          key={card.id}
          data={card}
          variant={variant}
        />
      ))}
    </div>
  );
}

// Example data for hanseníase
export const hanseniaseInfoCards: InfoCardData[] = [
  {
    id: 'hanseniase-overview',
    title: 'Sobre a Hanseníase',
    subtitle: 'Conceitos fundamentais',
    description: 'Aprenda sobre a doença, suas causas, formas de transmissão e principais características clínicas.',
    category: 'disease',
    status: 'available',
    difficulty: 'basic',
    estimatedTime: '15 min',
    icon: '🔬',
    primaryColor: '#dc2626',
    href: '/modules/hanseniase',
    tags: ['básico', 'introdução', 'conceitos'],
    statistics: {
      completionRate: 85,
      usersHelped: 1240,
      satisfaction: 92
    }
  },
  {
    id: 'pqt-u-treatment',
    title: 'Tratamento PQT-U',
    subtitle: 'Poliquimioterapia Única',
    description: 'Protocolo completo do esquema PQT-U: medicamentos, doses, duração e monitoramento.',
    category: 'treatment',
    status: 'available',
    difficulty: 'intermediate',
    estimatedTime: '25 min',
    icon: '💊',
    primaryColor: '#059669',
    href: '/modules/tratamento',
    tags: ['PQT-U', 'medicamentos', 'protocolo'],
    prerequisites: ['Conhecimentos básicos sobre hanseníase'],
    statistics: {
      completionRate: 78,
      usersHelped: 890,
      satisfaction: 88
    }
  },
  {
    id: 'diagnosis-guide',
    title: 'Guia de Diagnóstico',
    subtitle: 'Exames e procedimentos',
    description: 'Técnicas diagnósticas, interpretação de exames e classificação operacional da hanseníase.',
    category: 'procedure',
    status: 'available',
    difficulty: 'advanced',
    estimatedTime: '30 min',
    icon: '🩺',
    primaryColor: '#1d4ed8',
    href: '/modules/diagnostico',
    tags: ['diagnóstico', 'exames', 'classificação'],
    prerequisites: ['Conceitos básicos da hanseníase', 'Conhecimento em semiologia'],
    statistics: {
      completionRate: 65,
      usersHelped: 567,
      satisfaction: 85
    }
  }
];