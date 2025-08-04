'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  component: React.ComponentType;
}

function DoseCalculator() {
  const [weight, setWeight] = useState<number>(70);
  const [age, setAge] = useState<number>(30);
  const [classification, setClassification] = useState<'MB' | 'PB'>('MB');

  const calculateDoses = () => {
    const rifampicin = classification === 'MB' ? 600 : 600;
    const clofazimine = classification === 'MB' ? 300 : 0;
    const dapsone = classification === 'MB' ? 100 : 100;

    return { rifampicin, clofazimine, dapsone };
  };

  const doses = calculateDoses();

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1976d2' }}>
        💊 Calculadora de Doses PQT-U
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '25px'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Peso (kg):
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Idade (anos):
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Classificação:
          </label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value as 'MB' | 'PB')}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              fontSize: '1rem',
              background: 'white'
            }}
          >
            <option value="MB">Multibacilar (MB)</option>
            <option value="PB">Paucibacilar (PB)</option>
          </select>
        </div>
      </div>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h4 style={{ marginBottom: '15px', color: '#333' }}>
          Doses Recomendadas - Esquema PQT-U:
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🔴</div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>Rifampicina</div>
            <div style={{ fontSize: '1.2rem', color: '#1976d2', fontWeight: 'bold' }}>
              {doses.rifampicin}mg
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>1x por semana</div>
          </div>

          {classification === 'MB' && (
            <div style={{
              background: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🟤</div>
              <div style={{ fontWeight: 'bold', color: '#333' }}>Clofazimina</div>
              <div style={{ fontSize: '1.2rem', color: '#1976d2', fontWeight: 'bold' }}>
                {doses.clofazimine}mg
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>1x por mês</div>
            </div>
          )}

          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>⚪</div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>Dapsona</div>
            <div style={{ fontSize: '1.2rem', color: '#1976d2', fontWeight: 'bold' }}>
              {doses.dapsone}mg
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Diário</div>
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#1976d2'
        }}>
          <strong>📋 Duração do Tratamento:</strong><br />
          • Paucibacilar (PB): 6 doses em até 9 meses<br />
          • Multibacilar (MB): 12 doses em até 18 meses
        </div>
      </div>
    </div>
  );
}

function DispensationChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const checklistItems = [
    { id: '1', text: 'Conferir prescrição médica e dosagem', category: 'Prescrição' },
    { id: '2', text: 'Verificar identidade do paciente', category: 'Identificação' },
    { id: '3', text: 'Avaliar alergias e contraindicações', category: 'Segurança' },
    { id: '4', text: 'Conferir estoque e validade dos medicamentos', category: 'Estoque' },
    { id: '5', text: 'Explicar esquema terapêutico ao paciente', category: 'Orientação' },
    { id: '6', text: 'Demonstrar forma correta de tomar os medicamentos', category: 'Orientação' },
    { id: '7', text: 'Alertar sobre possíveis reações adversas', category: 'Segurança' },
    { id: '8', text: 'Agendar retorno para dispensação supervisionada', category: 'Seguimento' },
    { id: '9', text: 'Registrar dispensação no sistema', category: 'Documentação' },
    { id: '10', text: 'Entregar cartão de controle ao paciente', category: 'Documentação' }
  ];

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const progress = (checkedItems.size / checklistItems.length) * 100;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1976d2' }}>
        📋 Checklist de Dispensação
      </h3>

      <div style={{
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <span style={{ fontWeight: 'bold' }}>Progresso</span>
          <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
            {checkedItems.size}/{checklistItems.length} ({Math.round(progress)}%)
          </span>
        </div>
        <div style={{
          background: '#e0e0e0',
          borderRadius: '10px',
          height: '10px'
        }}>
          <div style={{
            background: '#4caf50',
            height: '100%',
            borderRadius: '10px',
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {checklistItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              background: checkedItems.has(item.id) ? '#e8f5e8' : '#f9f9f9',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: checkedItems.has(item.id) ? '2px solid #4caf50' : '2px solid transparent'
            }}
            onClick={() => toggleItem(item.id)}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              border: '2px solid #1976d2',
              background: checkedItems.has(item.id) ? '#4caf50' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {checkedItems.has(item.id) ? '✓' : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: checkedItems.has(item.id) ? 'bold' : 'normal',
                color: checkedItems.has(item.id) ? '#4caf50' : '#333',
                textDecoration: checkedItems.has(item.id) ? 'line-through' : 'none'
              }}>
                {item.text}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#666',
                marginTop: '2px'
              }}>
                {item.category}
              </div>
            </div>
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e8f5e8',
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px solid #4caf50'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎉</div>
          <div style={{ fontWeight: 'bold', color: '#4caf50', fontSize: '1.1rem' }}>
            Dispensação Completa!
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Todos os itens do checklist foram verificados
          </div>
        </div>
      )}
    </div>
  );
}

function AdverseReactionGuide() {
  const reactions = [
    {
      drug: 'Rifampicina',
      color: '#f44336',
      reactions: [
        { type: 'Gastrointestinal', symptoms: 'Náuseas, vômitos, dor abdominal', frequency: 'Comum' },
        { type: 'Hepática', symptoms: 'Hepatotoxicidade, icterícia', frequency: 'Raro' },
        { type: 'Cutânea', symptoms: 'Coloração alaranjada da urina/suor', frequency: 'Muito comum' },
        { type: 'Hematológica', symptoms: 'Trombocitopenia', frequency: 'Raro' }
      ]
    },
    {
      drug: 'Clofazimina',
      color: '#ff9800',
      reactions: [
        { type: 'Cutânea', symptoms: 'Hiperpigmentação cutânea', frequency: 'Muito comum' },
        { type: 'Gastrointestinal', symptoms: 'Dor abdominal, diarreia', frequency: 'Comum' },
        { type: 'Ocular', symptoms: 'Depósitos corneanos', frequency: 'Comum' },
        { type: 'Ressecamento', symptoms: 'Pele seca, descamação', frequency: 'Comum' }
      ]
    },
    {
      drug: 'Dapsona',
      color: '#2196f3',
      reactions: [
        { type: 'Hematológica', symptoms: 'Anemia hemolítica, meta-hemoglobinemia', frequency: 'Comum' },
        { type: 'Cutânea', symptoms: 'Dermatite esfoliativa', frequency: 'Raro' },
        { type: 'Neurológica', symptoms: 'Neuropatia periférica', frequency: 'Raro' },
        { type: 'Gastrointestinal', symptoms: 'Náuseas, anorexia', frequency: 'Comum' }
      ]
    }
  ];

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Muito comum': return '#f44336';
      case 'Comum': return '#ff9800';
      case 'Raro': return '#4caf50';
      default: return '#666';
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1976d2' }}>
        ⚠️ Guia de Reações Adversas
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {reactions.map((drug) => (
          <div key={drug.drug} style={{
            border: `3px solid ${drug.color}`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h4 style={{
              fontSize: '1.3rem',
              marginBottom: '15px',
              color: drug.color,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              💊 {drug.drug}
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {drug.reactions.map((reaction, index) => (
                <div key={index} style={{
                  background: '#f9f9f9',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {reaction.type}
                    </span>
                    <span style={{
                      background: getFrequencyColor(reaction.frequency),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      {reaction.frequency}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#666',
                    lineHeight: 1.4
                  }}>
                    {reaction.symptoms}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '25px',
        padding: '20px',
        background: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>
          📞 Condutas em Casos de Reações Adversas:
        </h4>
        <ul style={{ margin: 0, color: '#333', lineHeight: 1.6 }}>
          <li>Suspender temporariamente o medicamento suspeito</li>
          <li>Avaliar a gravidade da reação</li>
          <li>Notificar ao sistema de farmacovigilância</li>
          <li>Encaminhar ao médico responsável</li>
          <li>Documentar detalhadamente o evento</li>
        </ul>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<string>('calculator');

  const tools: Tool[] = [
    {
      id: 'calculator',
      title: 'Calculadora de Doses',
      description: 'Calcule as doses corretas da PQT-U baseadas no peso e classificação',
      category: 'Cálculos',
      icon: '💊',
      component: DoseCalculator
    },
    {
      id: 'checklist',
      title: 'Checklist de Dispensação',
      description: 'Lista de verificação para dispensação segura e completa',
      category: 'Procedimentos',
      icon: '📋',
      component: DispensationChecklist
    },
    {
      id: 'reactions',
      title: 'Guia de Reações Adversas',
      description: 'Identificação e manejo das principais reações adversas',
      category: 'Segurança',
      icon: '⚠️',
      component: AdverseReactionGuide
    }
  ];

  const ActiveComponent = tools.find(tool => tool.id === activeTab)?.component || DoseCalculator;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navigation />
      
      <div className="main-content" style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#1976d2',
            marginBottom: '10px' 
          }}>
            Recursos Práticos
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            margin: 0 
          }}>
            Ferramentas para apoiar sua prática profissional
          </p>
        </div>

        {/* Tool Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                style={{
                  background: activeTab === tool.id ? '#1976d2' : '#f8f9fa',
                  color: activeTab === tool.id ? 'white' : '#333',
                  border: activeTab === tool.id ? '2px solid #1976d2' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tool.id) {
                    e.currentTarget.style.background = '#e3f2fd';
                    e.currentTarget.style.borderColor = '#1976d2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tool.id) {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{tool.icon}</span>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {tool.title}
                    </h3>
                    <div style={{
                      fontSize: '0.8rem',
                      opacity: 0.8,
                      marginTop: '2px'
                    }}>
                      {tool.category}
                    </div>
                  </div>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  opacity: 0.9,
                  lineHeight: 1.4
                }}>
                  {tool.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tool */}
        <ActiveComponent />
      </div>
    </div>
  );
}