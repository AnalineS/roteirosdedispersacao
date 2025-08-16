/**
 * Progressive Card Component
 * Card adaptativo para exibição de conteúdo com progressive disclosure
 * Mobile-first com touch-friendly interactions
 */

'use client';

import { useState } from 'react';
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure';
import { DisclosureContent, MedicalTerm } from '@/types/disclosure';
import { MedicalTermPopup } from './MedicalTermPopup';
import { TouchButton, TouchIconButton } from '@/components/ui/TouchButton';

interface ProgressiveCardProps {
  content: DisclosureContent;
  medicalTerms?: MedicalTerm[];
  showPriority?: boolean;
  expandable?: boolean;
  className?: string;
}

export function ProgressiveCard({
  content,
  medicalTerms = [],
  showPriority = true,
  expandable = true,
  className = ''
}: ProgressiveCardProps) {
  
  const {
    currentLevel,
    currentLevelConfig,
    getContentForLevel,
    shouldShowContent,
    isSectionExpanded,
    toggleSection
  } = useProgressiveDisclosure();

  const [localExpanded, setLocalExpanded] = useState(false);
  const sectionId = `card-${content.id}`;
  const isExpanded = expandable ? (isSectionExpanded(sectionId) || localExpanded) : true;

  // Verificar se o conteúdo deve ser mostrado para o nível atual
  if (!content.level.includes(currentLevel) || !shouldShowContent(content.contentType)) {
    return null;
  }

  const handleToggle = () => {
    if (expandable) {
      const newState = !isExpanded;
      setLocalExpanded(newState);
      toggleSection(sectionId);
    }
  };

  const displayContent = getContentForLevel(content);
  const hasMoreContent = content.detailed || content.technical || content.expert;

  return (
    <div className={`progressive-card ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex-1 mr-3">
            <h3 className="text-medical-instruction font-medium">
              {content.title}
            </h3>
            
            {/* Metadados */}
            <div className="flex items-center gap-2 mt-1">
              {showPriority && (
                <span className={`
                  px-2 py-1 text-xs font-medium rounded
                  ${getPriorityBadgeStyle(content.priority)}
                `}>
                  {getPriorityLabel(content.priority)}
                </span>
              )}
              
              <span className={`
                px-2 py-1 text-xs font-medium rounded
                ${getContentTypeBadgeStyle(content.contentType)}
              `}>
                {getContentTypeLabel(content.contentType)}
              </span>
              
              <span className={`
                px-2 py-1 text-xs font-medium rounded
                ${getLevelBadgeStyle(currentLevel)}
              `}>
                {currentLevelConfig.name}
              </span>
            </div>
          </div>

          {/* Toggle button */}
          {expandable && hasMoreContent && (
            <TouchIconButton
              icon={
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              }
              onClick={handleToggle}
              aria-label={isExpanded ? 'Recolher conteúdo' : 'Expandir conteúdo'}
              aria-expanded={isExpanded}
              variant="ghost"
              size="sm"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Always visible summary */}
          <div className="text-medical-text leading-relaxed mb-4">
            {renderContentWithTerms(content.summary, medicalTerms)}
          </div>

          {/* Expandable detailed content */}
          {isExpanded && hasMoreContent && (
            <div className="border-t border-gray-100 pt-4">
              <div className="text-medical-text leading-relaxed">
                {renderContentWithTerms(displayContent, medicalTerms)}
              </div>
              
              {/* Additional info for higher levels */}
              {content.technical && shouldShowContent('dosage_technical') && currentLevelConfig.complexity >= 3 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Informação Técnica
                  </h4>
                  <div className="text-sm text-blue-800">
                    {renderContentWithTerms(content.technical, medicalTerms)}
                  </div>
                </div>
              )}

              {/* Expert content for specialists */}
              {content.expert && currentLevelConfig.complexity === 4 && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                  <h4 className="text-sm font-medium text-purple-900 mb-2">
                    Nota do Especialista
                  </h4>
                  <div className="text-sm text-purple-800">
                    {renderContentWithTerms(content.expert, medicalTerms)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
          {/* Quick actions based on content type */}
          <div className="flex gap-2">
            {content.contentType === 'dosage_simple' && (
              <TouchButton
                variant="outline"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Lembrete
              </TouchButton>
            )}
            
            {shouldShowContent('contraindications') && (
              <TouchButton
                variant="outline"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              >
                Alertas
              </TouchButton>
            )}
          </div>

          {/* Level indicator */}
          <div className="text-xs text-gray-500">
            Complexidade: {currentLevelConfig.complexity}/4
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper para renderizar texto com termos médicos clicáveis
function renderContentWithTerms(text: string, medicalTerms: MedicalTerm[]) {
  if (!medicalTerms.length) {
    return <span>{text}</span>;
  }

  let processedText = text;
  
  // Substituir termos médicos por marcadores
  medicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
    processedText = processedText.replace(regex, `<medical-term>${term.term}</medical-term>`);
  });

  // Dividir texto e criar elementos
  const parts = processedText.split(/(<medical-term>.*?<\/medical-term>)/);
  
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('<medical-term>')) {
          const termText = part.replace(/<\/?medical-term>/g, '');
          const termObj = medicalTerms.find(t => t.term.toLowerCase() === termText.toLowerCase());
          
          if (termObj) {
            return (
              <MedicalTermPopup key={index} term={termObj}>
                {termText}
              </MedicalTermPopup>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

// Utility functions
function getPriorityBadgeStyle(priority: number): string {
  if (priority === 1) return 'bg-red-100 text-red-800';
  if (priority <= 2) return 'bg-orange-100 text-orange-800';
  if (priority <= 3) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

function getPriorityLabel(priority: number): string {
  if (priority === 1) return 'Alta';
  if (priority <= 2) return 'Média';
  if (priority <= 3) return 'Baixa';
  return 'Info';
}

function getContentTypeBadgeStyle(contentType: string): string {
  const styles = {
    basic_info: 'bg-blue-100 text-blue-800',
    dosage_simple: 'bg-green-100 text-green-800',
    dosage_technical: 'bg-purple-100 text-purple-800',
    side_effects_common: 'bg-yellow-100 text-yellow-800',
    side_effects_rare: 'bg-red-100 text-red-800',
    contraindications: 'bg-red-100 text-red-800',
    drug_interactions: 'bg-orange-100 text-orange-800'
  };
  return styles[contentType as keyof typeof styles] || 'bg-gray-100 text-gray-800';
}

function getContentTypeLabel(contentType: string): string {
  const labels = {
    basic_info: 'Básico',
    dosage_simple: 'Dosagem',
    dosage_technical: 'Técnico',
    side_effects_common: 'Efeitos',
    side_effects_rare: 'Raros',
    contraindications: 'Contraindicações',
    drug_interactions: 'Interações'
  };
  return labels[contentType as keyof typeof labels] || 'Conteúdo';
}

function getLevelBadgeStyle(level: string): string {
  const styles = {
    paciente: 'bg-green-100 text-green-800',
    estudante: 'bg-blue-100 text-blue-800',
    profissional: 'bg-purple-100 text-purple-800',
    especialista: 'bg-orange-100 text-orange-800'
  };
  return styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800';
}

// Grid layout para múltiplos cards
interface ProgressiveCardGridProps {
  content: DisclosureContent[];
  medicalTerms?: MedicalTerm[];
  columns?: 1 | 2 | 3;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressiveCardGrid({
  content,
  medicalTerms = [],
  columns = 1,
  gap = 'md',
  className = ''
}: ProgressiveCardGridProps) {
  
  const { filterContentByLevel } = useProgressiveDisclosure();
  const visibleContent = filterContentByLevel(content);

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={`
      grid
      ${columnClasses[columns]}
      ${gapClasses[gap]}
      ${className}
    `}>
      {visibleContent.map((item) => (
        <ProgressiveCard
          key={item.id}
          content={item}
          medicalTerms={medicalTerms}
        />
      ))}
    </div>
  );
}

export default ProgressiveCard;