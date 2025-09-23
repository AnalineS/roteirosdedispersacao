'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';
import { ChecklistIcon } from '@/components/icons/NavigationIcons';

interface ChecklistItem {
  id: string;
  category: string;
  text: string;
  description?: string;
  mandatory: boolean;
  completed: boolean;
}

interface ChecklistSummary {
  total: number;
  completed: number;
  mandatory: number;
  mandatoryCompleted: number;
  percentage: number;
  readyToDispense: boolean;
}

export default function ChecklistPage() {
  const unbColors = getUnbColors();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Verificações pré-dispensação
    {
      id: 'doc-identity',
      category: 'Documentação',
      text: 'Documento de identidade do paciente apresentado',
      description: 'RG, CNH ou documento oficial com foto',
      mandatory: true,
      completed: false
    },
    {
      id: 'prescription-valid',
      category: 'Documentação', 
      text: 'Prescrição médica válida e legível',
      description: 'Receita dentro da validade com carimbo e assinatura',
      mandatory: true,
      completed: false
    },
    {
      id: 'patient-data',
      category: 'Documentação',
      text: 'Dados do paciente conferidos',
      description: 'Nome, idade, peso e classificação MB/PB',
      mandatory: true,
      completed: false
    },
    
    // Avaliação clínica
    {
      id: 'classification-confirmed',
      category: 'Avaliação Clínica',
      text: 'Classificação operacional confirmada (MB/PB)',
      mandatory: true,
      completed: false
    },
    {
      id: 'contraindications-checked',
      category: 'Avaliação Clínica',
      text: 'Contraindicações e alergias verificadas',
      description: 'Histórico de reações adversas aos medicamentos da PQT',
      mandatory: true,
      completed: false
    },
    {
      id: 'drug-interactions',
      category: 'Avaliação Clínica',
      text: 'Interações medicamentosas avaliadas',
      description: 'Medicamentos em uso que podem interagir com PQT-U',
      mandatory: true,
      completed: false
    },
    {
      id: 'pregnancy-status',
      category: 'Avaliação Clínica',
      text: 'Status de gravidez/amamentação verificado (se aplicável)',
      mandatory: true,
      completed: false
    },

    // Orientações ao paciente
    {
      id: 'treatment-duration',
      category: 'Orientações',
      text: 'Duração do tratamento explicada',
      description: '6 meses para PB ou 12 meses para MB',
      mandatory: true,
      completed: false
    },
    {
      id: 'administration-schedule',
      category: 'Orientações',
      text: 'Esquema de administração orientado',
      description: 'Diferença entre doses supervisionadas e auto-administradas',
      mandatory: true,
      completed: false
    },
    {
      id: 'side-effects-explained',
      category: 'Orientações',
      text: 'Possíveis efeitos adversos explicados',
      description: 'Coloração da pele/urina, náuseas, alterações hepáticas',
      mandatory: true,
      completed: false
    },
    {
      id: 'monthly-visits',
      category: 'Orientações',
      text: 'Importância das consultas mensais reforçada',
      mandatory: true,
      completed: false
    },
    {
      id: 'adherence-importance',
      category: 'Orientações',
      text: 'Importância da adesão ao tratamento esclarecida',
      description: 'Não interrupção mesmo com melhora dos sintomas',
      mandatory: true,
      completed: false
    },

    // Dispensação
    {
      id: 'correct-medications',
      category: 'Dispensação',
      text: 'Medicamentos corretos separados',
      description: 'Rifampicina, Clofazimina e Dapsona nas doses corretas',
      mandatory: true,
      completed: false
    },
    {
      id: 'expiration-checked',
      category: 'Dispensação',
      text: 'Prazo de validade dos medicamentos verificado',
      mandatory: true,
      completed: false
    },
    {
      id: 'quantity-correct',
      category: 'Dispensação',
      text: 'Quantidade correta dispensada para 30 dias',
      mandatory: true,
      completed: false
    },
    {
      id: 'labeling-correct',
      category: 'Dispensação',
      text: 'Etiquetagem adequada realizada',
      description: 'Identificação clara de cada medicamento e posologia',
      mandatory: true,
      completed: false
    },

    // Registros e documentação
    {
      id: 'dispensing-recorded',
      category: 'Registros',
      text: 'Dispensação registrada no sistema/prontuário',
      mandatory: true,
      completed: false
    },
    {
      id: 'next-visit-scheduled',
      category: 'Registros',
      text: 'Próxima consulta agendada',
      mandatory: true,
      completed: false
    },

    // Itens opcionais/recomendados
    {
      id: 'educational-material',
      category: 'Material Educativo',
      text: 'Material educativo fornecido',
      description: 'Folders ou cartilhas sobre hanseníase',
      mandatory: false,
      completed: false
    },
    {
      id: 'contact-info',
      category: 'Suporte',
      text: 'Informações de contato fornecidas',
      description: 'Telefone da unidade para dúvidas ou emergências',
      mandatory: false,
      completed: false
    },
    {
      id: 'family-guidance',
      category: 'Suporte',
      text: 'Orientações para familiares fornecidas',
      description: 'Transmissão, cuidados e apoio ao tratamento',
      mandatory: false,
      completed: false
    }
  ]);

  const [summary, setSummary] = useState<ChecklistSummary>({
    total: 0,
    completed: 0,
    mandatory: 0,
    mandatoryCompleted: 0,
    percentage: 0,
    readyToDispense: false
  });

  // Calcular resumo automaticamente
  useEffect(() => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.completed).length;
    const mandatory = checklistItems.filter(item => item.mandatory).length;
    const mandatoryCompleted = checklistItems.filter(item => item.mandatory && item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const readyToDispense = mandatoryCompleted === mandatory;

    setSummary({
      total,
      completed,
      mandatory,
      mandatoryCompleted,
      percentage,
      readyToDispense
    });
  }, [checklistItems]);

  const toggleItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const resetChecklist = () => {
    setChecklistItems(items =>
      items.map(item => ({ ...item, completed: false }))
    );
  };

  const printChecklist = () => {
    const printContent = `
      <html>
        <head>
          <title>Checklist de Dispensação PQT-U</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .category { margin-bottom: 20px; }
            .category h3 { color: #003366; border-bottom: 2px solid #003366; }
            .item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            .mandatory { background-color: #fff3cd; }
            .completed { background-color: #d4edda; }
            .checkbox { margin-right: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Checklist de Dispensação PQT-U</h1>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
            <p>Progresso: ${summary.completed}/${summary.total} itens (${summary.percentage}%)</p>
          </div>
          ${Object.entries(
            checklistItems.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {} as Record<string, ChecklistItem[]>)
          ).map(([category, items]) => `
            <div class="category">
              <h3>${category}</h3>
              ${items.map(item => `
                <div class="item ${item.mandatory ? 'mandatory' : ''} ${item.completed ? 'completed' : ''}">
                  <input type="checkbox" class="checkbox" ${item.completed ? 'checked' : ''} />
                  <strong>${item.text}</strong>
                  ${item.mandatory ? ' (Obrigatório)' : ''}
                  ${item.description ? `<br><small>${item.description}</small>` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Create print document safely using DOM methods
      const doc = printWindow.document;
      doc.open();

      // Create HTML structure
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const body = doc.createElement('body');

      // Add title and styles
      const title = doc.createElement('title');
      title.textContent = 'Checklist de Dispensação';

      const style = doc.createElement('style');
      style.textContent = `
        body { font-family: Arial, sans-serif; margin: 20px; }
        .print-header { text-align: center; margin-bottom: 30px; }
        .category { margin-bottom: 25px; }
        .category h3 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
        .checklist-item { margin: 10px 0; padding: 8px; border-left: 3px solid #e2e8f0; }
        .checkbox { margin-right: 8px; }
      `;

      head.appendChild(title);
      head.appendChild(style);

      // Add header
      const header = doc.createElement('div');
      header.className = 'print-header';
      const h1 = doc.createElement('h1');
      h1.textContent = 'Checklist de Dispensação PQT-U';
      const subtitle = doc.createElement('p');
      subtitle.textContent = 'Hanseníase - Protocolo Clínico e Diretrizes Terapêuticas';
      header.appendChild(h1);
      header.appendChild(subtitle);
      body.appendChild(header);

      // Add checklist items
      Object.entries(groupedItems).forEach(([category, items]) => {
        const categoryDiv = doc.createElement('div');
        categoryDiv.className = 'category';

        const categoryTitle = doc.createElement('h3');
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);

        items.forEach((item, index) => {
          const itemDiv = doc.createElement('div');
          itemDiv.className = 'checklist-item';

          const checkbox = doc.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'checkbox';
          checkbox.id = `print-${category}-${index}`;

          const label = doc.createElement('label');
          label.setAttribute('for', `print-${category}-${index}`);
          label.textContent = item.title;

          if (item.description) {
            const desc = doc.createElement('div');
            desc.style.fontSize = '0.9em';
            desc.style.color = '#64748b';
            desc.style.marginLeft = '24px';
            desc.textContent = item.description;
            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            itemDiv.appendChild(desc);
          } else {
            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
          }

          categoryDiv.appendChild(itemDiv);
        });

        body.appendChild(categoryDiv);
      });

      html.appendChild(head);
      html.appendChild(body);
      doc.appendChild(html);
      doc.close();

      printWindow.print();
    }
  };

  // Agrupar itens por categoria
  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem 0',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '1rem' }}>
            <ChecklistIcon size={48} color="white" />
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>
              Checklist de Dispensação
            </h1>
          </div>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto' }}>
            Lista de verificação para dispensação segura da Poliquimioterapia Única (PQT-U)
          </p>
        </header>

        {/* Resumo do progresso */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          border: summary.readyToDispense ? `3px solid #10B981` : `2px solid ${unbColors.alpha.primary}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem', color: unbColors.primary, fontSize: '1.5rem' }}>
                📊 Progresso da Verificação
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: unbColors.secondary }}>
                    {summary.percentage}%
                  </span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: unbColors.neutral }}>
                    {summary.completed}/{summary.total} itens concluídos
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: summary.readyToDispense ? '#10B981' : '#EF4444' }}>
                    {summary.mandatoryCompleted}/{summary.mandatory}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: unbColors.neutral }}>
                    itens obrigatórios
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {summary.readyToDispense ? (
                <div style={{
                  background: '#10B981',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  ✅ Pronto para Dispensar
                </div>
              ) : (
                <div style={{
                  background: '#FEF3F2',
                  color: '#DC2626',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  border: '1px solid #FCA5A5'
                }}>
                  ⚠️ Verificações Pendentes
                </div>
              )}
            </div>
          </div>

          {/* Barra de progresso */}
          <div style={{
            marginTop: '1.5rem',
            background: '#E2E8F0',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${summary.percentage}%`,
              height: '100%',
              background: summary.readyToDispense ? '#10B981' : unbColors.secondary,
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Botões de ação */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={printChecklist}
              style={{
                padding: '12px 20px',
                background: unbColors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = unbColors.primary}
              onMouseLeave={(e) => e.currentTarget.style.background = unbColors.secondary}
            >
              🖨️ Imprimir Checklist
            </button>
            
            <button
              onClick={resetChecklist}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                color: unbColors.neutral,
                border: `2px solid ${unbColors.neutral}`,
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = unbColors.neutral;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = unbColors.neutral;
              }}
            >
              🔄 Resetar Lista
            </button>
          </div>
        </div>

        {/* Checklist por categoria */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                margin: '0 0 1.5rem', 
                color: unbColors.primary, 
                fontSize: '1.3rem',
                borderBottom: `2px solid ${unbColors.alpha.secondary}`,
                paddingBottom: '0.5rem'
              }}>
                {category}
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                {items.map((item) => (
                  <div key={item.id} style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: item.completed ? '#f0fdf4' : (item.mandatory ? '#fefce8' : '#f8fafc'),
                    borderColor: item.completed ? '#22c55e' : (item.mandatory ? '#eab308' : '#e2e8f0'),
                    transition: 'all 0.2s ease'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleItem(item.id)}
                        style={{
                          transform: 'scale(1.3)',
                          marginTop: '2px',
                          accentColor: unbColors.secondary
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: item.mandatory ? 'bold' : '600',
                          color: item.completed ? '#16a34a' : unbColors.neutral,
                          marginBottom: '4px'
                        }}>
                          {item.text}
                          {item.mandatory && (
                            <span style={{ 
                              marginLeft: '8px',
                              fontSize: '0.8rem',
                              background: '#dc2626',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              OBRIGATÓRIO
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: '#64748b',
                            lineHeight: '1.4'
                          }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Informações importantes */}
        <section style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary }}>
            📚 Observações Importantes
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#fef3f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <h3 style={{ color: '#dc2626', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                ⚠️ Itens Obrigatórios
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                Todos os itens marcados como obrigatórios devem ser verificados antes da dispensação. 
                A não observância pode comprometer a segurança do tratamento.
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #93c5fd' }}>
              <h3 style={{ color: '#1d4ed8', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                📋 Registro e Documentação
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                Mantenha registro de todas as verificações realizadas. 
                Este checklist pode ser impresso e anexado ao prontuário do paciente.
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <h3 style={{ color: '#16a34a', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                ✅ Boas Práticas
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>
                Use este checklist em todas as dispensações de PQT-U. 
                A padronização do processo garante qualidade e segurança consistentes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}