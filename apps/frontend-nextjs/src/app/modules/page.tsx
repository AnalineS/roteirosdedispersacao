'use client';

import { useState } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
  duration: string;
  topics: string[];
  completed: boolean;
  progress: number;
  icon: string;
  prerequisite?: string;
}

export default function ModulesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const modules: Module[] = [
    {
      id: 'sobre-a-tese',
      title: 'Sobre a Tese',
      description: 'Conheça a pesquisa de doutorado que fundamenta esta plataforma: metodologia, objetivos e contribuições para o cuidado farmacêutico.',
      category: 'Fundamentos',
      difficulty: 'Básico',
      duration: '15 min',
      topics: ['Contexto da pesquisa', 'Metodologia científica', 'Roteiro de dispensação', 'Resultados e impactos', 'Dr. Gasnelio IA'],
      completed: false,
      progress: 0,
      icon: '🎓'
    },
    {
      id: 'hanseniase-intro',
      title: 'Introdução à Hanseníase',
      description: 'Fundamentos sobre a doença: histórico, epidemiologia, transmissão e prevenção. Base essencial para profissionais de saúde.',
      category: 'Fundamentos',
      difficulty: 'Básico',
      duration: '15 min',
      topics: ['História da hanseníase', 'Epidemiologia mundial', 'Transmissão', 'Prevenção', 'Mitos e verdades'],
      completed: true,
      progress: 100,
      icon: '🔬',
      prerequisite: 'sobre-a-tese'
    },
    {
      id: 'microbiologia',
      title: 'Microbiologia da Hanseníase',
      description: 'Mycobacterium leprae: características do patógeno, ciclo de vida, resistência e fatores de virulência.',
      category: 'Fundamentos',
      difficulty: 'Intermediário',
      duration: '20 min',
      topics: ['M. leprae', 'Características bacteriológicas', 'Resistência antimicrobiana', 'Fatores de virulência'],
      completed: true,
      progress: 100,
      icon: '🦠',
      prerequisite: 'hanseniase-intro'
    },
    {
      id: 'diagnostico-clinico',
      title: 'Diagnóstico Clínico',
      description: 'Reconhecimento de sinais e sintomas, classificação operacional, exames complementares e diagnóstico diferencial.',
      category: 'Diagnóstico',
      difficulty: 'Intermediário',
      duration: '30 min',
      topics: ['Sinais cardinais', 'Classificação MB/PB', 'Baciloscopia', 'Biópsia', 'Diagnóstico diferencial'],
      completed: true,
      progress: 100,
      icon: '🩺',
      prerequisite: 'microbiologia'
    },
    {
      id: 'formas-clinicas',
      title: 'Formas Clínicas',
      description: 'Espectro clínico da hanseníase: tuberculoide, lepromatosa, borderline e suas características específicas.',
      category: 'Diagnóstico',
      difficulty: 'Avançado',
      duration: '25 min',
      topics: ['Hanseníase tuberculoide', 'Hanseníase lepromatosa', 'Formas borderline', 'Hanseníase indeterminada'],
      completed: false,
      progress: 40,
      icon: '🔍',
      prerequisite: 'diagnostico-clinico'
    },
    {
      id: 'pqt-fundamentos',
      title: 'Fundamentos da PQT-U',
      description: 'Poliquimioterapia única: esquema terapêutico, mecanismo de ação dos medicamentos e resistência.',
      category: 'Tratamento',
      difficulty: 'Intermediário',
      duration: '35 min',
      topics: ['Rifampicina', 'Clofazimina', 'Dapsona', 'Esquema PQT-U', 'Resistência medicamentosa'],
      completed: true,
      progress: 100,
      icon: '💊',
      prerequisite: 'diagnostico-clinico'
    },
    {
      id: 'farmacologia',
      title: 'Farmacologia da PQT-U',
      description: 'Farmacocinética, farmacodinâmica, interações medicamentosas e contraindicações dos fármacos da PQT-U.',
      category: 'Tratamento',
      difficulty: 'Avançado',
      duration: '40 min',
      topics: ['Farmacocinética', 'Farmacodinâmica', 'Interações', 'Contraindicações', 'Populações especiais'],
      completed: false,
      progress: 0,
      icon: '⚗️',
      prerequisite: 'pqt-fundamentos'
    },
    {
      id: 'dispensacao-farmaceutica',
      title: 'Roteiro de Dispensação',
      description: 'Procedimentos farmacêuticos: orientação ao paciente, adesão terapêutica e seguimento farmacoterapêutico.',
      category: 'Dispensação',
      difficulty: 'Avançado',
      duration: '45 min',
      topics: ['Procedimentos de dispensação', 'Orientação ao paciente', 'Adesão terapêutica', 'Seguimento farmacoterapêutico'],
      completed: false,
      progress: 60,
      icon: '📋',
      prerequisite: 'pqt-fundamentos'
    },
    {
      id: 'reacoes-adversas',
      title: 'Reações Adversas',
      description: 'Identificação, classificação e manejo das reações adversas aos medicamentos da PQT-U.',
      category: 'Farmacovigilância',
      difficulty: 'Avançado',
      duration: '30 min',
      topics: ['RAMs da rifampicina', 'RAMs da clofazimina', 'RAMs da dapsona', 'Manejo clínico', 'Notificação'],
      completed: false,
      progress: 0,
      icon: '⚠️',
      prerequisite: 'farmacologia'
    },
    {
      id: 'estados-reacionais',
      title: 'Estados Reacionais',
      description: 'Reconhecimento e tratamento das reações tipo 1 (reversa) e tipo 2 (eritema nodoso hansênico).',
      category: 'Complicações',
      difficulty: 'Avançado',
      duration: '35 min',
      topics: ['Reação tipo 1', 'Reação tipo 2', 'Fenômeno de Lúcio', 'Tratamento das reações', 'Corticoterapia'],
      completed: false,
      progress: 0,
      icon: '🔥',
      prerequisite: 'formas-clinicas'
    },
    {
      id: 'casos-clinicos',
      title: 'Casos Clínicos Práticos',
      description: 'Aplicação prática dos conhecimentos através de casos clínicos reais e simulações de atendimento.',
      category: 'Prática',
      difficulty: 'Avançado',
      duration: '50 min',
      topics: ['Casos de diagnóstico', 'Casos de tratamento', 'Casos de complicações', 'Tomada de decisão'],
      completed: false,
      progress: 0,
      icon: '🎯',
      prerequisite: 'dispensacao-farmaceutica'
    }
  ];

  const categories = ['all', ...Array.from(new Set(modules.map(m => m.category)))];
  const difficulties = ['all', 'Básico', 'Intermediário', 'Avançado'];

  const filteredModules = modules.filter(module => {
    const categoryMatch = selectedCategory === 'all' || module.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || module.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return '#4caf50';
      case 'Intermediário': return '#ff9800';
      case 'Avançado': return '#f44336';
      default: return '#666';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Fundamentos': '#2196f3',
      'Diagnóstico': '#9c27b0',
      'Tratamento': '#4caf50',
      'Dispensação': '#ff5722',
      'Farmacovigilância': '#ff9800',
      'Complicações': '#f44336',
      'Prática': '#607d8b'
    };
    return colors[category] || '#666';
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#1976d2',
            marginBottom: '10px' 
          }}>
            Módulos Educacionais
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            margin: 0 
          }}>
            Conteúdo estruturado sobre hanseníase e PQT-U
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem', 
            marginBottom: '20px', 
            color: '#333' 
          }}>
            Filtros
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                <option value="all">Todas as categorias</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#333'
              }}>
                Dificuldade
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                <option value="all">Todas as dificuldades</option>
                {difficulties.slice(1).map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '25px'
        }}>
          {filteredModules.map((module) => (
            <div
              key={module.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: module.completed ? '3px solid #4caf50' : '3px solid transparent',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              }}
            >
              {/* Status Badge */}
              {module.completed && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: '#4caf50',
                  color: 'white',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  ✓ CONCLUÍDO
                </div>
              )}

              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '3rem' }}>{module.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    margin: '0 0 8px', 
                    color: '#1976d2',
                    lineHeight: 1.3
                  }}>
                    {module.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      background: getCategoryColor(module.category),
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {module.category}
                    </span>
                    <span style={{
                      background: getDifficultyColor(module.difficulty),
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {module.difficulty}
                    </span>
                    <span style={{
                      background: '#666',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      🕒 {module.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ 
                color: '#666', 
                marginBottom: '20px', 
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}>
                {module.description}
              </p>

              {/* Topics */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '10px', 
                  color: '#333' 
                }}>
                  Tópicos abordados:
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {module.topics.map((topic, index) => (
                    <span
                      key={index}
                      style={{
                        background: '#f0f0f0',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#555'
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prerequisite */}
              {module.prerequisite && (
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.9rem'
                }}>
                  <strong>📚 Pré-requisito:</strong> Complete primeiro o módulo anterior
                </div>
              )}

              {/* Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    Progresso
                  </span>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    color: module.completed ? '#4caf50' : '#1976d2'
                  }}>
                    {module.progress}%
                  </span>
                </div>
                <div style={{
                  background: '#f0f0f0',
                  borderRadius: '10px',
                  height: '10px'
                }}>
                  <div style={{
                    background: module.completed ? '#4caf50' : '#1976d2',
                    height: '100%',
                    borderRadius: '10px',
                    width: `${module.progress}%`,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/modules/${module.id}`}
                style={{
                  display: 'block',
                  background: module.completed ? '#4caf50' : '#1976d2',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = module.completed ? '#45a049' : '#1565c0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = module.completed ? '#4caf50' : '#1976d2';
                }}
              >
                {module.completed ? '📖 Revisar Módulo' : module.progress > 0 ? '▶️ Continuar' : '🚀 Iniciar Módulo'}
              </Link>
            </div>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
              Nenhum módulo encontrado
            </h3>
            <p>Tente ajustar os filtros para encontrar o conteúdo desejado.</p>
          </div>
        )}
      </div>
    </EducationalLayout>
  );
}