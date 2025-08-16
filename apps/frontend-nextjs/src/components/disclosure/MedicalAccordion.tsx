/**
 * Medical Accordion Component
 * Acordeons verticais mobile-optimized para conteúdo médico
 * Com solução híbrida: Tabs principais + Acordeons internos
 */

'use client';

import { useState, useCallback } from 'react';
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure';
import { DisclosureContent } from '@/types/disclosure';

interface AccordionSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  priority: number;
  content: DisclosureContent[];
  category: 'diagnostico' | 'tratamento' | 'monitoramento' | 'complicacoes';
}

interface MedicalAccordionProps {
  sections: AccordionSection[];
  className?: string;
  enableTabMode?: boolean; // Solução híbrida
}

export function MedicalAccordion({ 
  sections, 
  className = '',
  enableTabMode = false 
}: MedicalAccordionProps) {
  
  const {
    currentLevel,
    currentLevelConfig,
    filterContentByLevel,
    isSectionExpanded,
    toggleSection,
    toggleAllSections
  } = useProgressiveDisclosure();

  const [activeTab, setActiveTab] = useState<string>(sections[0]?.id || '');
  const [allExpanded, setAllExpanded] = useState(false);

  // Filtrar seções baseado no nível do usuário
  const visibleSections = sections
    .map(section => ({
      ...section,
      content: filterContentByLevel(section.content)
    }))
    .filter(section => section.content.length > 0)
    .sort((a, b) => a.priority - b.priority);

  // Toggle todas as seções
  const handleToggleAll = useCallback(() => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    toggleAllSections(newState);
  }, [allExpanded, toggleAllSections]);

  // Renderizar conteúdo híbrido (tabs + acordeons)
  if (enableTabMode) {
    return (
      <div className={`medical-accordion-hybrid ${className}`}>
        {/* Tabs principais para categorias */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {visibleSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`
                  flex-shrink-0
                  px-4
                  py-3
                  text-sm
                  font-medium
                  border-b-2
                  transition-colors
                  duration-200
                  min-h-[44px]
                  min-w-[120px]
                  ${activeTab === section.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-selected={activeTab === section.id}
                role="tab"
              >
                <div className="flex items-center">
                  {section.icon && <span className="mr-2">{section.icon}</span>}
                  {section.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo da tab ativa */}
        {visibleSections.map((section) => (
          <div
            key={section.id}
            className={`tab-content ${activeTab === section.id ? 'block' : 'hidden'}`}
            role="tabpanel"
          >
            <SimpleAccordion 
              sections={section.content} 
              sectionId={section.id}
            />
          </div>
        ))}
      </div>
    );
  }

  // Modo acordeon completo (padrão)
  return (
    <div className={`medical-accordion ${className}`}>
      {/* Header com controles */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Informações Médicas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Nível: {currentLevelConfig.name} • {visibleSections.length} seções
          </p>
        </div>

        <button
          onClick={handleToggleAll}
          className="
            flex
            items-center
            px-3
            py-2
            text-sm
            font-medium
            text-blue-600
            bg-blue-50
            border
            border-blue-200
            rounded
            hover:bg-blue-100
            transition-colors
            duration-200
            min-h-[44px]
          "
          aria-label={allExpanded ? 'Recolher todas as seções' : 'Expandir todas as seções'}
        >
          <svg 
            className={`w-4 h-4 mr-2 transition-transform duration-200 ${
              allExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {allExpanded ? 'Recolher todas' : 'Expandir todas'}
        </button>
      </div>

      {/* Seções acordeon */}
      <div className="space-y-2">
        {visibleSections.map((section, index) => (
          <AccordionSection
            key={section.id}
            section={section}
            index={index}
            isExpanded={isSectionExpanded(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Componente de seção individual do acordeon
function AccordionSection({
  section,
  index,
  isExpanded,
  onToggle
}: {
  section: AccordionSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header clicável */}
      <button
        onClick={onToggle}
        className="
          w-full
          flex
          items-center
          justify-between
          p-4
          text-left
          bg-white
          hover:bg-gray-50
          transition-colors
          duration-200
          min-h-[44px]
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:ring-inset
        "
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${section.id}`}
      >
        <div className="flex items-center">
          {/* Ícone da categoria */}
          <div className="flex items-center justify-center w-8 h-8 mr-3 bg-blue-100 rounded-full">
            {section.icon || getCategoryIcon(section.category)}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {section.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {section.content.length} {section.content.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>

        {/* Ícone de expandir/recolher */}
        <div className="flex items-center">
          {/* Badge de prioridade */}
          <span className={`
            px-2 py-1 text-xs font-medium rounded mr-3
            ${getPriorityBadgeStyle(section.priority)}
          `}>
            {getPriorityLabel(section.priority)}
          </span>

          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Conteúdo expansível */}
      <div
        id={`accordion-content-${section.id}`}
        className={`
          overflow-hidden
          transition-all
          duration-300
          ease-in-out
          ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!isExpanded}
      >
        <div className="p-4 pt-0 border-t border-gray-100">
          <SimpleAccordion 
            sections={section.content} 
            sectionId={section.id}
          />
        </div>
      </div>
    </div>
  );
}

// Acordeon simples para conteúdos internos
function SimpleAccordion({ 
  sections, 
  sectionId 
}: { 
  sections: DisclosureContent[]; 
  sectionId: string;
}) {
  const { getContentForLevel } = useProgressiveDisclosure();

  return (
    <div className="space-y-3">
      {sections.map((content, index) => (
        <div key={content.id} className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {content.title}
          </h4>
          
          <div className="text-sm text-gray-700 leading-relaxed">
            {getContentForLevel(content)}
          </div>

          {/* Metadados do conteúdo */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <span className={`
              px-2 py-1 text-xs font-medium rounded
              ${getContentTypeBadgeStyle(content.contentType)}
            `}>
              {getContentTypeLabel(content.contentType)}
            </span>
            
            <span className="text-xs text-gray-500">
              Prioridade: {content.priority}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Utilities
function getCategoryIcon(category: string) {
  const icons = {
    diagnostico: '🔍',
    tratamento: '💊',
    monitoramento: '📊',
    complicacoes: '⚠️'
  };
  return <span className="text-sm">{icons[category as keyof typeof icons] || '📋'}</span>;
}

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

// CSS adicional
const accordionStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .tab-content {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default MedicalAccordion;