/**
 * Progressive Disclosure Demo Page
 * Página exemplo integrando todos os componentes do sistema
 * ETAPA 2 + ETAPA 4: Information Hierarchy + Mobile-First
 */

'use client';

import { useState } from 'react';
import { useProgressiveDisclosure, useMedicalTerminology } from '@/hooks/useProgressiveDisclosure';
import { MedicalAccordion } from '@/components/disclosure/MedicalAccordion';
import { DosageCard } from '@/components/disclosure/DosageCard';
import { ProgressiveCard, ProgressiveCardGrid } from '@/components/disclosure/ProgressiveCard';
import { MedicalTermPopup, MedicalTermModal } from '@/components/disclosure/MedicalTermPopup';
import { TouchButton, TouchButtonGroup, TouchFAB } from '@/components/ui/TouchButton';
import { DisclosureContent, MedicalTerm, UserLevel } from '@/types/disclosure';

// Dados exemplo para demonstração
const sampleMedicalTerms: MedicalTerm[] = [
  {
    term: 'Rifampicina',
    simple: 'Antibiótico usado no tratamento da hanseníase',
    detailed: 'A rifampicina é um antibiótico bactericida da classe das rifamicinas, que atua inibindo a RNA polimerase bacteriana, sendo essencial no tratamento da hanseníase multicilar.',
    context: 'Usado como primeira linha no esquema PQT/MB (poliquimioterapia multibacilar) conforme protocolo do Ministério da Saúde.',
    level: ['estudante', 'profissional', 'especialista'],
    category: 'drug'
  },
  {
    term: 'Dapsona',
    simple: 'Medicamento contra bactérias da hanseníase',
    detailed: 'A dapsona é um antibiótico bacteriostático da classe das sulfonas, que inibe a síntese do ácido fólico bacteriano, sendo componente fundamental dos esquemas de tratamento da hanseníase.',
    context: 'Componente do esquema PQT tanto em formas paucibacilares quanto multibacilares.',
    level: ['estudante', 'profissional', 'especialista'],
    category: 'drug'
  },
  {
    term: 'PQT',
    simple: 'Tratamento com vários medicamentos juntos',
    detailed: 'Poliquimioterapia: esquema de tratamento que combina múltiplos antibióticos para prevenir resistência bacteriana e garantir eficácia terapêutica.',
    context: 'Padrão ouro no tratamento da hanseníase, recomendado pela OMS e adotado pelo Ministério da Saúde do Brasil.',
    level: ['paciente', 'estudante', 'profissional', 'especialista'],
    category: 'procedure'
  }
];

const sampleDosageInfo = {
  id: 'pqt-mb',
  medicationName: 'PQT Multibacilar',
  simple: {
    instruction: '2 cápsulas por dia',
    timing: 'Uma pela manhã e uma à noite',
    duration: 'Por 12 meses',
    notes: 'Tomar com alimento para evitar mal-estar'
  },
  technical: {
    compound: 'Rifampicina 150mg + Dapsona 100mg + Clofazimina 50mg',
    dosage: '600mg rifampicina (dose supervisionada mensal) + 100mg dapsona (diário) + 300mg clofazimina (supervisionada) + 50mg clofazimina (diário)',
    pharmacokinetics: 'Rifampicina: pico em 2-4h, meia-vida 2-5h. Dapsona: pico em 1-3h, meia-vida 24-30h. Clofazimina: meia-vida 70 dias.',
    contraindications: 'Insuficiência hepática grave, hipersensibilidade conhecida aos componentes',
    interactions: 'Reduz eficácia de contraceptivos orais, warfarina, corticoides. Monitorar função hepática.'
  },
  medicalTerms: sampleMedicalTerms
};

const sampleContent: DisclosureContent[] = [
  {
    id: 'basic-info-hanseniase',
    title: 'O que é Hanseníase?',
    level: ['paciente', 'estudante', 'profissional', 'especialista'],
    contentType: 'basic_info',
    priority: 1,
    summary: 'A hanseníase é uma doença infecciosa curável, causada pela bactéria Mycobacterium leprae, que afeta principalmente pele e nervos.',
    detailed: 'A hanseníase é uma doença infecciosa crônica causada pelo Mycobacterium leprae (bacilo de Hansen), com período de incubação longo (2-7 anos) e manifestações dermatoneurológicas características. É completamente curável com o tratamento adequado.',
    technical: 'Doença granulomatosa crônica causada pelo M. leprae, bacilo álcool-ácido resistente, intracelular obrigatório com tropismo por células de Schwann e macrófagos. Transmissão via gotículas respiratórias de casos multibacilares não tratados.',
    medicalTerms: sampleMedicalTerms
  },
  {
    id: 'dosage-pqt',
    title: 'Como tomar o medicamento',
    level: ['paciente', 'estudante', 'profissional', 'especialista'],
    contentType: 'dosage_simple',
    priority: 1,
    summary: 'Tome os medicamentos todos os dias conforme orientação médica, sempre no mesmo horário e com alimento.',
    detailed: 'O esquema PQT deve ser tomado diariamente, preferencialmente pela manhã, com alimento para melhor absorção e menor irritação gástrica. A dose supervisionada mensal deve ser tomada na unidade de saúde.',
    technical: 'Esquema PQT/MB: Rifampicina 600mg supervisionada mensal + Dapsona 100mg diária + Clofazimina 300mg supervisionada + 50mg diária. Duração: 12 doses supervisionadas em até 18 meses.',
    medicalTerms: sampleMedicalTerms
  }
];

const accordionSections = [
  {
    id: 'diagnostico',
    title: 'Diagnóstico',
    icon: '🔍',
    priority: 1,
    content: sampleContent.filter(c => c.contentType === 'basic_info'),
    category: 'diagnostico' as const
  },
  {
    id: 'tratamento', 
    title: 'Tratamento',
    icon: '💊',
    priority: 2,
    content: sampleContent.filter(c => c.contentType === 'dosage_simple'),
    category: 'tratamento' as const
  }
];

export default function ProgressiveDisclosureDemoPage() {
  const { 
    currentLevel, 
    currentLevelConfig, 
    changeLevel 
  } = useProgressiveDisclosure();
  
  const { 
    activeModal, 
    hideModal 
  } = useMedicalTerminology();

  const [activeDemo, setActiveDemo] = useState<'cards' | 'accordion' | 'dosage'>('cards');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Progressive Disclosure Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                ETAPA 2 + ETAPA 4: Information Hierarchy + Mobile-First Interface
              </p>
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Nível:</span>
              <select
                value={currentLevel}
                onChange={(e) => changeLevel(e.target.value as UserLevel)}
                className="
                  px-3 py-2 text-sm border border-gray-300 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  min-h-[44px]
                "
              >
                <option value="paciente">Paciente</option>
                <option value="estudante">Estudante</option>
                <option value="profissional">Profissional</option>
                <option value="especialista">Especialista</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-blue-700 font-medium">
                {currentLevelConfig.name}
              </span>
              <span className="text-blue-600">
                Complexidade: {currentLevelConfig.complexity}/4
              </span>
              <span className="text-blue-600">
                Terminologia: {currentLevelConfig.terminology}
              </span>
            </div>
            
            <div className="hidden sm:block text-blue-600">
              {currentLevelConfig.description}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <TouchButtonGroup spacing="normal">
            <TouchButton
              variant={activeDemo === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveDemo('cards')}
            >
              Progressive Cards
            </TouchButton>
            <TouchButton
              variant={activeDemo === 'dosage' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveDemo('dosage')}
            >
              Dosage Card
            </TouchButton>
            <TouchButton
              variant={activeDemo === 'accordion' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveDemo('accordion')}
            >
              Medical Accordion
            </TouchButton>
          </TouchButtonGroup>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        
        {/* Progressive Cards Demo */}
        {activeDemo === 'cards' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Progressive Cards
              </h2>
              <p className="text-gray-600 mb-6">
                Cards adaptativos que mostram conteúdo baseado no nível do usuário atual: {currentLevelConfig.name}
              </p>
              
              <ProgressiveCardGrid
                content={sampleContent}
                medicalTerms={sampleMedicalTerms}
                columns={2}
                gap="md"
              />
            </div>
          </div>
        )}

        {/* Dosage Card Demo */}
        {activeDemo === 'dosage' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dosage Card - Simple → Technical Progression
              </h2>
              <p className="text-gray-600 mb-6">
                Card de dosagem que adapta a exibição: simples primeiro para pacientes/estudantes, 
                com opção de ver informações técnicas para níveis mais avançados.
              </p>
              
              <div className="max-w-2xl">
                <DosageCard dosage={sampleDosageInfo} />
              </div>
            </div>
          </div>
        )}

        {/* Medical Accordion Demo */}
        {activeDemo === 'accordion' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Medical Accordion - Mobile Optimized
              </h2>
              <p className="text-gray-600 mb-6">
                Acordeons verticais otimizados para mobile com solução híbrida (tabs + acordeons).
                Mostra diferentes conteúdos baseado no nível: {currentLevelConfig.name}
              </p>
              
              <div className="space-y-8">
                {/* Modo Accordion padrão */}
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Modo Accordion Completo
                  </h3>
                  <MedicalAccordion 
                    sections={accordionSections}
                    enableTabMode={false}
                  />
                </div>

                {/* Modo Híbrido (Tabs + Accordion) */}
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Modo Híbrido (Tabs + Accordions)
                  </h3>
                  <MedicalAccordion 
                    sections={accordionSections}
                    enableTabMode={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Features Box */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Funcionalidades Demonstradas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">✅ 4 Níveis de Usuário</h4>
              <p className="text-gray-700">Paciente → Estudante → Profissional → Especialista</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">✅ Progressive Disclosure</h4>
              <p className="text-gray-700">Conteúdo adaptativo baseado no nível do usuário</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">✅ Mobile-First Design</h4>
              <p className="text-gray-700">Touch targets mínimos de 44px, otimizado para mobile</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">✅ Medical Terminology</h4>
              <p className="text-gray-700">
                <MedicalTermPopup 
                  term={sampleMedicalTerms[0]}
                >
                  Rifampicina
                </MedicalTermPopup>
                {' '}inline + Modal para termos médicos
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-2">✅ Dosage Progression</h4>
              <p className="text-gray-700">Simples primeiro, depois técnico</p>
            </div>
            
            <ProgressiveCard 
              content={sampleContent[0]}
              medicalTerms={sampleMedicalTerms}
              className="bg-white rounded-lg p-4 border border-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Modal para termos médicos */}
      {activeModal && (
        <MedicalTermModal
          term={sampleMedicalTerms.find(t => t.term === activeModal)!}
          isOpen={!!activeModal}
          onClose={hideModal}
        />
      )}

      {/* FAB para ações rápidas */}
      <TouchFAB
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
        aria-label="Ações rápidas"
        onClick={() => console.log('FAB clicked')}
      />
    </div>
  );
}