'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { usePersonas } from '@/hooks/usePersonas';

interface UserProgress {
  modulesCompleted: number;
  totalModules: number;
  chatInteractions: number;
  lastAccess: string;
  currentLevel: string;
  achievements: string[];
}

interface EducationalModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
  estimatedTime: string;
  completed: boolean;
  progress: number;
  icon: string;
}

export default function DashboardPage() {
  const { personas, loading: personasLoading } = usePersonas();
  const [userProgress, setUserProgress] = useState<UserProgress>({
    modulesCompleted: 3,
    totalModules: 12,
    chatInteractions: 15,
    lastAccess: new Date().toLocaleDateString('pt-BR'),
    currentLevel: 'Intermediário',
    achievements: ['Primeiro Chat', 'Explorador', 'Estudioso']
  });

  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  // Carregar persona selecionada
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedPersona');
      if (stored && personas[stored]) {
        setSelectedPersona(stored);
      }
    }
  }, [personas]);

  const educationalModules: EducationalModule[] = [
    {
      id: 'hanseniase-intro',
      title: 'Introdução à Hanseníase',
      description: 'Conceitos básicos sobre a doença, transmissão e prevenção',
      difficulty: 'Básico',
      estimatedTime: '15 min',
      completed: true,
      progress: 100,
      icon: '🔬'
    },
    {
      id: 'diagnostico',
      title: 'Diagnóstico Clínico',
      description: 'Sinais, sintomas e métodos diagnósticos',
      difficulty: 'Intermediário',
      estimatedTime: '25 min',
      completed: true,
      progress: 100,
      icon: '🩺'
    },
    {
      id: 'pqt-fundamentos',
      title: 'Fundamentos da PQT-U',
      description: 'Poliquimioterapia única: medicamentos e protocolos',
      difficulty: 'Intermediário',
      estimatedTime: '30 min',
      completed: true,
      progress: 100,
      icon: '💊'
    },
    {
      id: 'dispensacao',
      title: 'Roteiro de Dispensação',
      description: 'Procedimentos farmacêuticos e orientações ao paciente',
      difficulty: 'Avançado',
      estimatedTime: '35 min',
      completed: false,
      progress: 60,
      icon: '📋'
    },
    {
      id: 'farmacovigilancia',
      title: 'Farmacovigilância',
      description: 'Monitoramento de reações adversas e manejo',
      difficulty: 'Avançado',
      estimatedTime: '20 min',
      completed: false,
      progress: 0,
      icon: '⚠️'
    },
    {
      id: 'casos-clinicos',
      title: 'Casos Clínicos',
      description: 'Situações práticas e tomada de decisão',
      difficulty: 'Avançado',
      estimatedTime: '40 min',
      completed: false,
      progress: 0,
      icon: '🎯'
    }
  ];

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;
  const progressPercentage = (userProgress.modulesCompleted / userProgress.totalModules) * 100;

  if (personasLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <div>Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navigation currentPersona={currentPersona?.name} />
      
      <div className="main-content" style={{ padding: '20px', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#1976d2',
            marginBottom: '10px' 
          }}>
            Dashboard Educacional
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666',
            margin: 0 
          }}>
            Acompanhe seu progresso no aprendizado sobre PQT-U
          </p>
        </div>

        {/* Progress Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          borderRadius: '16px',
          padding: '30px',
          color: 'white',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontSize: '1.8rem', margin: '0 0 10px' }}>
                Seu Progresso
              </h3>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                height: '12px',
                marginBottom: '10px'
              }}>
                <div style={{
                  background: 'white',
                  height: '100%',
                  borderRadius: '8px',
                  width: `${progressPercentage}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>
                {userProgress.modulesCompleted} de {userProgress.totalModules} módulos concluídos
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📊</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {Math.round(progressPercentage)}%
              </div>
              <div style={{ opacity: 0.9 }}>Completo</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💬</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {userProgress.chatInteractions}
              </div>
              <div style={{ opacity: 0.9 }}>Conversas</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏆</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {userProgress.achievements.length}
              </div>
              <div style={{ opacity: 0.9 }}>Conquistas</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>💬</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1976d2' }}>
              Continuar Chat
            </h3>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
              Converse com {currentPersona?.name || 'um assistente virtual'} sobre suas dúvidas
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📚</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1976d2' }}>
              Próximo Módulo
            </h3>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
              Continue com "Roteiro de Dispensação" - 60% concluído
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🎯</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1976d2' }}>
              Ferramentas
            </h3>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
              Calculadora de doses, checklists e recursos práticos
            </p>
          </div>
        </div>

        {/* Educational Modules */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '20px', 
            color: '#333' 
          }}>
            Módulos Educacionais
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {educationalModules.map((module) => (
              <div
                key={module.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: module.completed ? '2px solid #4caf50' : '2px solid transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontSize: '2rem' }}>{module.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '5px'
                    }}>
                      <h3 style={{ 
                        fontSize: '1.3rem', 
                        margin: 0, 
                        color: '#1976d2' 
                      }}>
                        {module.title}
                      </h3>
                      {module.completed && (
                        <span style={{
                          background: '#4caf50',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          ✓ CONCLUÍDO
                        </span>
                      )}
                    </div>
                    <p style={{ 
                      color: '#666', 
                      margin: '0 0 10px', 
                      fontSize: '0.95rem' 
                    }}>
                      {module.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '15px',
                      fontSize: '0.85rem',
                      color: '#888'
                    }}>
                      <span>📊 {module.difficulty}</span>
                      <span>⏱️ {module.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  background: '#f0f0f0',
                  borderRadius: '6px',
                  height: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    background: module.completed ? '#4caf50' : '#1976d2',
                    height: '100%',
                    borderRadius: '6px',
                    width: `${module.progress}%`,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  textAlign: 'right'
                }}>
                  {module.progress}% completo
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '20px', 
            color: '#333' 
          }}>
            Suas Conquistas
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            {userProgress.achievements.map((achievement, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
                  color: '#333',
                  padding: '10px 20px',
                  borderRadius: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                }}
              >
                <span>🏆</span>
                {achievement}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}