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

function RoteiroCompleto() {
  const handleDownloadPDF = () => {
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = '/documents/roteiro_hanseniase.pdf';
    link.download = 'Roteiro_Dispensacao_Hanseniase_PQT-U.pdf';
    link.click();
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Header with Download */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#1976d2' }}>
            📄 Roteiro Completo de Dispensação - Hanseníase PQT-U
          </h3>
          <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
            Conteúdo completo da tese de doutorado transcrito e organizado
          </p>
        </div>
        
        <button
          onClick={handleDownloadPDF}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1565c0';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1976d2';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Baixar PDF
        </button>
      </div>

      {/* Table of Contents */}
      <div style={{
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f9ff 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        border: '1px solid #e0f2fe'
      }}>
        <h4 style={{ color: '#1976d2', marginBottom: '15px', fontSize: '1.1rem' }}>
          📚 Índice do Conteúdo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md" style={{ fontSize: '0.9rem' }}>
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }} 
                  onClick={() => document.getElementById('introducao')?.scrollIntoView({ behavior: 'smooth' })}>
                • 1. Introdução
              </li>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('pqt-u')?.scrollIntoView({ behavior: 'smooth' })}>
                • 2. PQT-U - Poliquimioterapia Única
              </li>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('medicamentos')?.scrollIntoView({ behavior: 'smooth' })}>
                • 3. Medicamentos
              </li>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('posologia')?.scrollIntoView({ behavior: 'smooth' })}>
                • 4. Posologia e Administração
              </li>
            </ul>
          </div>
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('contraindicacoes')?.scrollIntoView({ behavior: 'smooth' })}>
                • 5. Contraindicações
              </li>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('reacoes-adversas')?.scrollIntoView({ behavior: 'smooth' })}>
                • 6. Reações Adversas
              </li>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('cuidados')?.scrollIntoView({ behavior: 'smooth' })}>
                • 7. Cuidados Especiais
              </li>
              <li style={{ color: '#1976d2', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => document.getElementById('referencias')?.scrollIntoView({ behavior: 'smooth' })}>
                • 8. Referências
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* 1. Introdução */}
        <section id="introducao" style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ color: '#1976d2', marginBottom: '20px', fontSize: '1.3rem' }}>
            1. Introdução
          </h4>
          <p style={{ lineHeight: '1.7', color: '#374151', marginBottom: '15px' }}>
            A hanseníase é uma doença crônica, infectocontagiosa, causada pelo <em>Mycobacterium leprae</em>. 
            O tratamento da hanseníase evoluiu significativamente com a introdução da PQT-U (Poliquimioterapia Única), 
            que representa um marco no controle da doença.
          </p>
          <p style={{ lineHeight: '1.7', color: '#374151', marginBottom: '15px' }}>
            Este roteiro foi desenvolvido baseado nas diretrizes do PCDT Hanseníase 2022 do Ministério da Saúde, 
            com o objetivo de padronizar e otimizar o processo de dispensação farmacêutica, garantindo segurança 
            e eficácia no tratamento.
          </p>
          <div style={{
            padding: '15px',
            background: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(25, 118, 210, 0.2)'
          }}>
            <strong style={{ color: '#1976d2' }}>💡 Objetivo Principal:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#374151' }}>
              Fornecer um guia prático e científico para farmacêuticos e profissionais de saúde 
              envolvidos na dispensação de medicamentos para hanseníase.
            </p>
          </div>
        </section>

        {/* 2. PQT-U */}
        <section id="pqt-u" style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #dcfce7'
        }}>
          <h4 style={{ color: '#16a34a', marginBottom: '20px', fontSize: '1.3rem' }}>
            2. PQT-U - Poliquimioterapia Única
          </h4>
          <p style={{ lineHeight: '1.7', color: '#374151', marginBottom: '15px' }}>
            A PQT-U é o esquema terapêutico padrão recomendado pela Organização Mundial da Saúde (OMS) 
            para todos os casos de hanseníase, independentemente da classificação operacional.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg" style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '20px',
              background: 'white',
              borderRadius: '8px',
              border: '2px solid #dcfce7'
            }}>
              <h5 style={{ color: '#16a34a', marginBottom: '10px' }}>⏱️ Duração do Tratamento</h5>
              <ul style={{ color: '#374151', lineHeight: '1.6', paddingLeft: '20px' }}>
                <li><strong>6 doses mensais supervisionadas</strong></li>
                <li>Prazo máximo: <strong>9 meses</strong></li>
                <li>Doses autoadministradas: <strong>diárias</strong></li>
              </ul>
            </div>
            
            <div style={{
              padding: '20px',
              background: 'white',
              borderRadius: '8px',
              border: '2px solid #dcfce7'
            }}>
              <h5 style={{ color: '#16a34a', marginBottom: '10px' }}>🎯 Vantagens</h5>
              <ul style={{ color: '#374151', lineHeight: '1.6', paddingLeft: '20px' }}>
                <li>Menor duração de tratamento</li>
                <li>Melhor adesão do paciente</li>
                <li>Redução de resistência</li>
                <li>Simplificação operacional</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Medicamentos */}
        <section id="medicamentos" style={{
          padding: '25px',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #fed7aa'
        }}>
          <h4 style={{ color: '#ea580c', marginBottom: '20px', fontSize: '1.3rem' }}>
            3. Medicamentos da PQT-U
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Rifampicina */}
            <div style={{
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              border: '2px solid #fed7aa'
            }}>
              <h5 style={{ color: '#dc2626', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🔴 Rifampicina (RMP)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div>
                  <strong style={{ color: '#374151' }}>Dose:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>600mg (mensal supervisionada)</p>
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Apresentação:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Cápsula 300mg (2 cápsulas)</p>
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Mecanismo:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Bactericida</p>
                </div>
              </div>
            </div>

            {/* Clofazimina */}
            <div style={{
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              border: '2px solid #fed7aa'
            }}>
              <h5 style={{ color: '#f59e0b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🟤 Clofazimina (CFZ)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div>
                  <strong style={{ color: '#374151' }}>Dose:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>300mg mensal + 50mg diária</p>
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Apresentação:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Cápsula 100mg + 50mg</p>
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Mecanismo:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Bactericida/Bacteriostática</p>
                </div>
              </div>
            </div>

            {/* Dapsona */}
            <div style={{
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              border: '2px solid #fed7aa'
            }}>
              <h5 style={{ color: '#2563eb', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                ⚪ Dapsona (DDS)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div>
                  <strong style={{ color: '#374151' }}>Dose:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>100mg diária</p>
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Apresentação:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Comprimido 100mg</p>
                </div>
                <div>
                  <strong style={{ color: '#374151' }}>Mecanismo:</strong>
                  <p style={{ margin: '5px 0', color: '#6b7280' }}>Bacteriostática</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* More sections would continue... */}
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '12px',
          border: '1px solid #bae6fd'
        }}>
          <h4 style={{ color: '#1976d2', marginBottom: '15px' }}>
            📖 Conteúdo Completo no PDF
          </h4>
          <p style={{ color: '#374151', marginBottom: '20px' }}>
            Este é apenas um resumo das seções principais. Para acessar todo o conteúdo detalhado 
            da pesquisa, incluindo contraindicações, reações adversas, cuidados especiais e todas as 
            referências científicas, faça o download do PDF completo.
          </p>
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '12px 24px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1565c0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1976d2';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PDF Completo
          </button>
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState<string>('roteiro');

  const tools: Tool[] = [
    {
      id: 'roteiro',
      title: 'Roteiro Completo',
      description: 'Conteúdo completo da pesquisa transcrito com download do PDF',
      category: 'Documentação',
      icon: '📄',
      component: RoteiroCompleto
    },
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