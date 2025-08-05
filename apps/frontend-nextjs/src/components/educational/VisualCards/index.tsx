'use client';

import { useState } from 'react';
import { theme } from '@/config/theme';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  critical: boolean;
  description?: string;
}

interface InfographicData {
  title: string;
  items: {
    label: string;
    value: string;
    icon: string;
    color: string;
  }[];
}

interface VisualCardProps {
  type: 'infographic' | 'checklist' | 'timeline' | 'comparison';
  title: string;
  data: any;
  variant?: 'default' | 'compact' | 'detailed';
  interactive?: boolean;
  className?: string;
}

// Dados de exemplo para infográficos
const hanseniaseInfographic: InfographicData = {
  title: 'Dados Epidemiológicos da Hanseníase no Brasil',
  items: [
    { label: 'Casos Novos/Ano', value: '27.864', icon: '📊', color: theme.colors.primary[500] },
    { label: 'Taxa por 100mil hab', value: '13,23', icon: '📈', color: theme.colors.secondary[600] },
    { label: 'Cura Esperada', value: '95%', icon: '💚', color: theme.colors.educational.success },
    { label: 'Tempo de Tratamento', value: '6-12 meses', icon: '⏰', color: theme.colors.educational.warning }
  ]
};

const pqtuInfographic: InfographicData = {
  title: 'Esquema PQT-U - Componentes',
  items: [
    { label: 'Rifampicina', value: '600mg', icon: '🔴', color: theme.colors.educational.error },
    { label: 'Dapsona', value: '100mg', icon: '🔵', color: theme.colors.primary[600] },
    { label: 'Clofazimina', value: '300mg', icon: '🟤', color: theme.colors.educational.warning },
    { label: 'Administração', value: 'Dose única', icon: '💊', color: theme.colors.educational.progress }
  ]
};

// Dados de exemplo para checklists
const dispensationChecklist: ChecklistItem[] = [
  {
    id: 'verify-prescription',
    text: 'Verificar prescrição médica válida',
    completed: false,
    critical: true,
    description: 'Confirmar se a prescrição está legível, datada e assinada pelo médico'
  },
  {
    id: 'check-patient-id',
    text: 'Confirmar identidade do paciente',
    completed: false,
    critical: true,
    description: 'Verificar documento de identidade e dados pessoais'
  },
  {
    id: 'calculate-doses',
    text: 'Calcular doses baseadas no peso',
    completed: false,
    critical: true,
    description: 'Usar calculadora para determinar doses exatas por kg de peso'
  },
  {
    id: 'explain-administration',
    text: 'Orientar sobre administração supervisionada',
    completed: false,
    critical: false,
    description: 'Explicar que a primeira dose deve ser tomada na presença do profissional'
  },
  {
    id: 'adverse-reactions',
    text: 'Informar sobre reações adversas',
    completed: false,
    critical: false,
    description: 'Explicar possíveis efeitos colaterais e quando procurar ajuda'
  },
  {
    id: 'schedule-follow-up',
    text: 'Agendar próximo acompanhamento',
    completed: false,
    critical: true,
    description: 'Marcar retorno para avaliação em 30 dias'
  },
  {
    id: 'document-dispensation',
    text: 'Registrar dispensação no sistema',
    completed: false,
    critical: true,
    description: 'Fazer anotações no prontuário e sistema informatizado'
  }
];

const diagnosticTimeline = [
  {
    phase: 'Suspeita Clínica',
    description: 'Identificação de sinais e sintomas sugestivos',
    duration: 'Imediato',
    icon: '👁️',
    color: '#f59e0b',
    details: ['Manchas na pele', 'Alterações de sensibilidade', 'Espessamento neural']
  },
  {
    phase: 'Avaliação Inicial',
    description: 'Exame físico completo e anamnese dirigida',
    duration: '30-60 min',
    icon: '🩺',
    color: '#3b82f6',
    details: ['Inspeção cutânea', 'Teste de sensibilidade', 'Palpação neural']
  },
  {
    phase: 'Exames Complementares',
    description: 'Baciloscopia e outros exames quando indicados',
    duration: '1-7 dias',
    icon: '🔬',
    color: '#8b5cf6',
    details: ['Baciloscopia', 'Biópsia (se necessário)', 'Teste histamina (opcional)']
  },
  {
    phase: 'Diagnóstico Final',
    description: 'Classificação operacional e definição do tratamento',
    duration: 'Mesmo dia',
    icon: '✅',
    color: '#22c55e',
    details: ['Paucibacilar vs Multibacilar', 'Grau de incapacidade', 'Esquema terapêutico']
  }
];

export default function VisualCard({ 
  type, 
  title, 
  data, 
  variant = 'default',
  interactive = true,
  className = '' 
}: VisualCardProps) {
  const [checklistState, setChecklistState] = useState<ChecklistItem[]>(
    type === 'checklist' ? data : []
  );

  const toggleChecklistItem = (id: string) => {
    if (!interactive) return;
    
    setChecklistState(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getCompletionRate = () => {
    if (checklistState.length === 0) return 0;
    return Math.round((checklistState.filter(item => item.completed).length / checklistState.length) * 100);
  };

  // Renderizar Infográfico
  if (type === 'infographic') {
    const infographicData = data as InfographicData;
    
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-blue-100 text-sm">Dados atualizados e relevantes para sua prática</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {infographicData.items.map((item, index) => (
              <div 
                key={index}
                className="text-center p-4 rounded-lg border-2 transition-all hover:shadow-md"
                style={{ borderColor: item.color + '30', backgroundColor: item.color + '10' }}
              >
                <div 
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-3 shadow-lg"
                  style={{ backgroundColor: item.color }}
                >
                  <span className="text-white">{item.icon}</span>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar Checklist
  if (type === 'checklist') {
    const completionRate = getCompletionRate();
    const criticalIncomplete = checklistState.filter(item => item.critical && !item.completed).length;
    
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <div className="flex items-center gap-2">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: completionRate === 100 ? theme.colors.educational.success : completionRate > 50 ? theme.colors.educational.warning : theme.colors.educational.error }}
              >
                {completionRate}%
              </div>
            </div>
          </div>
          
          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${completionRate}%`,
                backgroundColor: completionRate === 100 ? theme.colors.educational.success : completionRate > 50 ? theme.colors.educational.warning : theme.colors.educational.error
              }}
            />
          </div>
          
          {criticalIncomplete > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <span>⚠️</span>
                <span className="font-medium">
                  {criticalIncomplete} item{criticalIncomplete !== 1 ? 's' : ''} crítico{criticalIncomplete !== 1 ? 's' : ''} pendente{criticalIncomplete !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {checklistState.map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  item.completed 
                    ? 'bg-green-50 border-green-200' 
                    : item.critical 
                      ? 'bg-red-50 border-red-200 hover:border-red-300' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleChecklistItem(item.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {item.completed && <span className="text-white text-sm">✓</span>}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${item.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {item.text}
                      </span>
                      {item.critical && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          CRÍTICO
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className={`text-sm ${item.completed ? 'text-green-600' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {interactive && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setChecklistState(prev => prev.map(item => ({ ...item, completed: false })))}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                🔄 Resetar Lista
              </button>
              {completionRate === 100 && (
                <div className="text-green-700 font-medium flex items-center gap-2">
                  <span>🎉</span>
                  <span>Lista Completa!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Renderizar Timeline
  if (type === 'timeline') {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">Sequência padronizada para diagnóstico eficaz</p>
        </div>

        <div className="p-6">
          <div className="relative">
            {diagnosticTimeline.map((phase, index) => (
              <div key={index} className="relative flex items-start gap-6 pb-8 last:pb-0">
                {/* Timeline Line */}
                {index < diagnosticTimeline.length - 1 && (
                  <div 
                    className="absolute left-8 top-16 w-0.5 h-full -ml-px"
                    style={{ backgroundColor: phase.color + '40' }}
                  />
                )}
                
                {/* Phase Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg z-10"
                  style={{ backgroundColor: phase.color }}
                >
                  <span className="text-white">{phase.icon}</span>
                </div>

                {/* Phase Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{phase.phase}</h4>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{phase.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {phase.details.map((detail, detailIndex) => (
                      <div 
                        key={detailIndex}
                        className="text-sm px-3 py-2 rounded-lg"
                        style={{ backgroundColor: phase.color + '15', color: phase.color }}
                      >
                        • {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar Comparação
  if (type === 'comparison') {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            Componente de comparação em desenvolvimento...
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Componentes específicos exportados
export function HanseniaseInfographic() {
  return (
    <VisualCard
      type="infographic"
      title="Hanseníase no Brasil"
      data={hanseniaseInfographic}
    />
  );
}

export function PQTUInfographic() {
  return (
    <VisualCard
      type="infographic"
      title="Esquema PQT-U"
      data={pqtuInfographic}
    />
  );
}

export function DispensationChecklist() {
  return (
    <VisualCard
      type="checklist"
      title="Checklist de Dispensação PQT-U"
      data={dispensationChecklist}
      interactive={true}
    />
  );
}

export function DiagnosticTimeline() {
  return (
    <VisualCard
      type="timeline"
      title="Fluxo de Diagnóstico da Hanseníase"
      data={diagnosticTimeline}
    />
  );
}

// Grid para múltiplos cards visuais
interface VisualCardGridProps {
  cards: Array<{
    id: string;
    component: React.ComponentType;
    title: string;
  }>;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function VisualCardGrid({ cards, columns = 2, className = '' }: VisualCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
      {cards.map(card => (
        <card.component key={card.id} />
      ))}
    </div>
  );
}