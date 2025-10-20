/**
 * Medical Educational Component Template
 * Inspirado no SuperClaude Framework para componentes médico-educacionais
 *
 * Este template segue padrões específicos para:
 * - Validação de conteúdo médico
 * - Integração com personas Dr. Gasnelio e Gá
 * - Compliance LGPD e padrões médicos
 * - Acessibilidade WCAG 2.1 AA
 */

import React, { useState, useEffect } from 'react';
import { MedicalDisclaimer } from '@/components/compliance/MedicalDisclaimer';
import { PersonaSelector } from '@/components/chat/PersonaSelector';
import { AccessibilityWrapper } from '@/components/accessibility/AccessibilityWrapper';

// Tipos específicos para componentes médicos
interface MedicalComponentProps {
  /** Conteúdo médico validado */
  medicalContent: MedicalContent;
  /** Persona ativa (dr-gasnelio | ga) */
  activPersona?: 'dr-gasnelio' | 'ga';
  /** Nível de complexidade (básico | intermediário | avançado) */
  complexityLevel: 'basic' | 'intermediate' | 'advanced';
  /** Categoria médica */
  medicalCategory: 'hanseniase' | 'dispensacao' | 'farmacologia';
  /** Callback para interações */
  onMedicalInteraction?: (interaction: MedicalInteraction) => void;
}

interface MedicalContent {
  title: string;
  description: string;
  clinicalData?: ClinicalData;
  educationalGoals: string[];
  prerequisites?: string[];
  disclaimer: string;
}

interface ClinicalData {
  medications?: MedicationInfo[];
  dosage?: DosageInfo;
  contraindications?: string[];
  interactions?: string[];
}

interface MedicalInteraction {
  type: 'question' | 'calculation' | 'reference';
  content: string;
  persona: 'dr-gasnelio' | 'ga';
  timestamp: Date;
}

/**
 * Template de Componente Médico-Educacional
 * Baseado nos princípios do SuperClaude Framework
 */
export const MedicalComponentTemplate: React.FC<MedicalComponentProps> = ({
  medicalContent,
  activPersona = 'dr-gasnelio',
  complexityLevel,
  medicalCategory,
  onMedicalInteraction
}) => {
  const [currentPersona, setCurrentPersona] = useState(activPersona);
  const [userInteractions, setUserInteractions] = useState<MedicalInteraction[]>([]);

  // Validação de conteúdo médico na montagem
  useEffect(() => {
    validateMedicalContent(medicalContent);
  }, [medicalContent]);

  // Handler para interações médicas
  const handleMedicalInteraction = (interaction: MedicalInteraction) => {
    setUserInteractions(prev => [...prev, interaction]);
    onMedicalInteraction?.(interaction);
  };

  // Renderização adaptativa baseada na persona
  const renderPersonaSpecificContent = () => {
    if (currentPersona === 'dr-gasnelio') {
      return (
        <div className="technical-content">
          <h3>Análise Técnica - Dr. Gasnelio</h3>
          {medicalContent.clinicalData && (
            <ClinicalDataDisplay data={medicalContent.clinicalData} />
          )}
        </div>
      );
    }

    return (
      <div className="empathetic-content">
        <h3>Explicação Didática - Gá</h3>
        <SimplifiedExplanation content={medicalContent} />
      </div>
    );
  };

  return (
    <AccessibilityWrapper
      ariaLabel={`Componente educacional sobre ${medicalContent.title}`}
      role="article"
    >
      <div className="medical-component" data-category={medicalCategory}>
        {/* Header com seletor de persona */}
        <header className="component-header">
          <h2>{medicalContent.title}</h2>
          <PersonaSelector
            currentPersona={currentPersona}
            onPersonaChange={setCurrentPersona}
          />
        </header>

        {/* Conteúdo principal adaptativo */}
        <main className="component-content">
          <div className="description">
            <p>{medicalContent.description}</p>
          </div>

          {/* Objetivos educacionais */}
          <section className="educational-goals">
            <h3>Objetivos de Aprendizagem</h3>
            <ul>
              {medicalContent.educationalGoals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          </section>

          {/* Conteúdo específico da persona */}
          {renderPersonaSpecificContent()}

          {/* Pré-requisitos se existirem */}
          {medicalContent.prerequisites && (
            <section className="prerequisites">
              <h3>Pré-requisitos</h3>
              <ul>
                {medicalContent.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </section>
          )}
        </main>

        {/* Footer com disclaimer médico obrigatório */}
        <footer className="component-footer">
          <MedicalDisclaimer
            content={medicalContent.disclaimer}
            category={medicalCategory}
          />
        </footer>
      </div>
    </AccessibilityWrapper>
  );
};

// Componentes auxiliares específicos
const ClinicalDataDisplay: React.FC<{ data: ClinicalData }> = ({ data }) => (
  <div className="clinical-data">
    {data.medications && (
      <div className="medications">
        <h4>Medicamentos</h4>
        {data.medications.map((med, index) => (
          <div key={index} className="medication-item">
            <strong>{med.name}</strong>: {med.dosage}
          </div>
        ))}
      </div>
    )}

    {data.contraindications && (
      <div className="contraindications">
        <h4>Contraindicações</h4>
        <ul>
          {data.contraindications.map((contraind, index) => (
            <li key={index}>{contraind}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const SimplifiedExplanation: React.FC<{ content: MedicalContent }> = ({ content }) => (
  <div className="simplified-explanation">
    <p className="friendly-tone">
      Vou explicar de forma simples: {content.description}
    </p>
    {/* Explicação mais didática e empática */}
  </div>
);

// Função de validação de conteúdo médico
const validateMedicalContent = (content: MedicalContent) => {
  // Validações específicas para conteúdo médico
  if (!content.disclaimer || content.disclaimer.length < 50) {
    console.warn('Medical disclaimer may be insufficient');
  }

  if (!content.educationalGoals || content.educationalGoals.length === 0) {
    console.warn('Educational goals are required for medical content');
  }
};

// Tipos auxiliares
interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

interface DosageInfo {
  adult: string;
  pediatric?: string;
  elderly?: string;
  adjustments?: string[];
}

export default MedicalComponentTemplate;