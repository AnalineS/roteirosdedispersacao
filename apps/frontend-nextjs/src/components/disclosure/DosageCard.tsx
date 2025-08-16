/**
 * Dosage Card Component
 * Mostra primeiro dosagem simples, depois técnica
 * Mobile-optimized com progressive disclosure
 */

'use client';

import { useState } from 'react';
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure';
import { MedicalTermPopup } from './MedicalTermPopup';
import { MedicalTerm } from '@/types/disclosure';

interface DosageInfo {
  id: string;
  medicationName: string;
  simple: {
    instruction: string;        // "2 comprimidos por dia"
    timing: string;            // "De manhã e à noite"
    duration: string;          // "Por 6 meses"
    notes?: string;           // "Com alimento"
  };
  technical: {
    compound: string;          // "Rifampicina 150mg + Dapsona 100mg"
    dosage: string;           // "300mg/dia rifampicina, 100mg/dia dapsona"
    pharmacokinetics?: string; // "Absorção: 2-4h, meia-vida: 2-5h"
    contraindications?: string;
    interactions?: string;
  };
  medicalTerms: MedicalTerm[];
}

interface DosageCardProps {
  dosage: DosageInfo;
  className?: string;
}

export function DosageCard({ dosage, className = '' }: DosageCardProps) {
  const { 
    currentLevel, 
    currentLevelConfig,
    shouldShowContent,
    isSectionExpanded,
    toggleSection 
  } = useProgressiveDisclosure();

  const [showTechnical, setShowTechnical] = useState(false);
  
  const sectionId = `dosage-${dosage.id}`;
  const isExpanded = isSectionExpanded(sectionId);
  
  // Determinar que informações mostrar baseado no nível
  const showSimpleFirst = ['paciente', 'estudante'].includes(currentLevel);
  const canShowTechnical = shouldShowContent('dosage_technical');
  const autoShowTechnical = currentLevelConfig.terminology === 'technical' || currentLevelConfig.terminology === 'expert';

  return (
    <div className={`medical-card ${className}`}>
      {/* Header sempre visível */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-primary">{dosage.medicationName}</h3>
        
        {/* Indicador de nível */}
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${getLevelBadgeStyle(currentLevel)}
        `}>
          {currentLevelConfig.name}
        </span>
      </div>

      {/* Dosagem Simples (sempre primeiro para pacientes/estudantes) */}
      {showSimpleFirst && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <h4 className="text-medical-instruction font-medium">Como tomar</h4>
            </div>
            
            <div className="space-y-3 ml-11">
              <div className="text-medical-dosage">
                {dosage.simple.instruction}
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {dosage.simple.timing}
                </div>
                
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dosage.simple.duration}
                </div>
              </div>

              {dosage.simple.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-yellow-800">{dosage.simple.notes}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botão para mostrar informações técnicas */}
      {canShowTechnical && !autoShowTechnical && (
        <div className="mb-4">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="
              w-full
              flex
              items-center
              justify-between
              p-3
              text-left
              bg-gray-50
              border
              border-gray-200
              rounded-lg
              hover:bg-gray-100
              transition-colors
              duration-200
              min-h-[44px]
            "
            aria-expanded={showTechnical}
          >
            <span className="text-sm font-medium text-gray-700">
              Informações técnicas
            </span>
            
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                showTechnical ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Dosagem Técnica */}
      {(showTechnical || autoShowTechnical) && canShowTechnical && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header técnico */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Informações Técnicas</h4>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Composição */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Composição</h5>
              <div className="text-medical-dosage">
                {renderTermsWithPopups(dosage.technical.compound, dosage.medicalTerms)}
              </div>
            </div>

            {/* Posologia técnica */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Posologia</h5>
              <div className="text-medical-technical">
                {renderTermsWithPopups(dosage.technical.dosage, dosage.medicalTerms)}
              </div>
            </div>

            {/* Farmacocinética (apenas para níveis avançados) */}
            {dosage.technical.pharmacokinetics && shouldShowContent('pharmacokinetics') && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Farmacocinética</h5>
                <div className="text-medical-technical">
                  {renderTermsWithPopups(dosage.technical.pharmacokinetics, dosage.medicalTerms)}
                </div>
              </div>
            )}

            {/* Contraindicações */}
            {dosage.technical.contraindications && shouldShowContent('contraindications') && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Contraindicações</h5>
                <div className="text-medical-warning text-sm">
                  {renderTermsWithPopups(dosage.technical.contraindications, dosage.medicalTerms)}
                </div>
              </div>
            )}

            {/* Interações */}
            {dosage.technical.interactions && shouldShowContent('drug_interactions') && (
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Interações Medicamentosas</h5>
                <div className="text-medical-technical">
                  {renderTermsWithPopups(dosage.technical.interactions, dosage.medicalTerms)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer com nível de evidência */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Baseado em: PCDT Hanseníase 2022 - Ministério da Saúde</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            Evidência: A
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper para renderizar texto com termos médicos clicáveis
function renderTermsWithPopups(text: string, medicalTerms: MedicalTerm[]) {
  let processedText = text;
  
  // Substituir termos médicos por componentes clicáveis
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

// Utility para estilos de badge por nível
function getLevelBadgeStyle(level: string): string {
  const styles = {
    paciente: 'bg-green-100 text-green-800',
    estudante: 'bg-blue-100 text-blue-800',
    profissional: 'bg-purple-100 text-purple-800',
    especialista: 'bg-orange-100 text-orange-800'
  };
  return styles[level as keyof typeof styles] || 'bg-gray-100 text-gray-800';
}

export default DosageCard;