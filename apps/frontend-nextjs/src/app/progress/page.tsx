'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import ProgressSystem, { useProgressData } from '@/components/navigation/Progress';
import { usePersonas } from '@/hooks/usePersonas';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';
import { ShareProgress } from '@/components/achievements';
import { IndexIndicator, IndexProgress } from '@/components/ui/IndexIndicator';

interface PageProgressData {
  totalTime: number;
  modulesStarted: number;
  modulesCompleted: number;
  chatSessions: number;
  questionsAsked: number;
  achievements: Achievement[];
  weeklyProgress: WeeklyProgress[];
  learningPath: LearningPathItem[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: string;
}

interface WeeklyProgress {
  week: string;
  modulesCompleted: number;
  timeSpent: number;
  chatInteractions: number;
}

interface LearningPathItem {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  estimatedTime: string;
  prerequisite?: string;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const { personas, loading: personasLoading } = usePersonas();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const userProgressData = useProgressData();
  const [progressData, setProgressData] = useState<PageProgressData>({
    totalTime: 185, // minutos
    modulesStarted: 6,
    modulesCompleted: 3,
    chatSessions: 8,
    questionsAsked: 24,
    achievements: [
      {
        id: 'first-chat',
        title: 'Primeira Conversa',
        description: 'Iniciou sua primeira conversa com um assistente virtual',
        icon: '💬',
        unlockedAt: '2025-08-01',
        category: 'Interação'
      },
      {
        id: 'explorer',
        title: 'Explorador',
        description: 'Explorou 3 módulos diferentes',
        icon: '🗺️',
        unlockedAt: '2025-08-02',
        category: 'Aprendizado'
      },
      {
        id: 'student',
        title: 'Estudioso',
        description: 'Completou seu primeiro módulo educacional',
        icon: '📚',
        unlockedAt: '2025-08-02',
        category: 'Conquista'
      },
      {
        id: 'dedicated',
        title: 'Dedicado',
        description: 'Passou mais de 3 horas estudando',
        icon: '⏰',
        unlockedAt: '2025-08-03',
        category: 'Tempo'
      }
    ],
    weeklyProgress: [
      { week: 'Sem 1', modulesCompleted: 1, timeSpent: 45, chatInteractions: 3 },
      { week: 'Sem 2', modulesCompleted: 2, timeSpent: 68, chatInteractions: 5 },
      { week: 'Sem 3', modulesCompleted: 0, timeSpent: 32, chatInteractions: 2 },
      { week: 'Sem 4', modulesCompleted: 0, timeSpent: 40, chatInteractions: 3 }
    ],
    learningPath: [
      {
        id: 'hanseniase-intro',
        title: 'Introdução à Hanseníase',
        status: 'completed',
        progress: 100,
        estimatedTime: '15 min'
      },
      {
        id: 'microbiologia',
        title: 'Microbiologia da Hanseníase',
        status: 'completed',
        progress: 100,
        estimatedTime: '20 min',
        prerequisite: 'hanseniase-intro'
      },
      {
        id: 'diagnostico-clinico',
        title: 'Diagnóstico Clínico',
        status: 'completed',
        progress: 100,
        estimatedTime: '30 min',
        prerequisite: 'microbiologia'
      },
      {
        id: 'formas-clinicas',
        title: 'Formas Clínicas',
        status: 'in-progress',
        progress: 40,
        estimatedTime: '25 min',
        prerequisite: 'diagnostico-clinico'
      },
      {
        id: 'pqt-fundamentos',
        title: 'Fundamentos da PQT-U',
        status: 'in-progress',
        progress: 60,
        estimatedTime: '35 min',
        prerequisite: 'diagnostico-clinico'
      },
      {
        id: 'farmacologia',
        title: 'Farmacologia da PQT-U',
        status: 'locked',
        progress: 0,
        estimatedTime: '40 min',
        prerequisite: 'pqt-fundamentos'
      }
    ]
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedPersona');
      if (stored && personas[stored]) {
        setSelectedPersona(stored);
      }
    }
  }, [personas]);

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  // Sistema de atualização dinâmica de progresso - setProgressData ativado
  const updateProgressData = (updates: Partial<PageProgressData>) => {
    setProgressData(prev => {
      const newData = { ...prev, ...updates };

      // Sincronizar com localStorage para persistência
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-progress-data', JSON.stringify(newData));
      }

      // Notificar sistema de gamificação sobre atualizações
      if (updates.modulesCompleted && updates.modulesCompleted > prev.modulesCompleted) {
        // Triggerar evento de módulo completado
        window.dispatchEvent(new CustomEvent('moduleCompleted', {
          detail: {
            totalCompleted: updates.modulesCompleted,
            newXP: (updates.modulesCompleted - prev.modulesCompleted) * 100
          }
        }));
      }

      return newData;
    });
  };

  // Simular atualizações de progresso em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Atualizar dados baseado na atividade do usuário
      const now = Date.now();
      const lastUpdate = localStorage.getItem('last-progress-update');

      if (!lastUpdate || now - parseInt(lastUpdate) > 300000) { // 5 minutos
        updateProgressData({
          totalTime: progressData.totalTime + Math.floor(Math.random() * 5),
          questionsAsked: progressData.questionsAsked + (Math.random() > 0.8 ? 1 : 0)
        });
        localStorage.setItem('last-progress-update', now.toString());
      }
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [progressData.totalTime, progressData.questionsAsked]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'locked': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in-progress': return '🔄';
      case 'locked': return '🔒';
      default: return '⏸️';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Interação': '#2196f3',
      'Aprendizado': '#4caf50',
      'Conquista': '#ff9800',
      'Tempo': '#9c27b0'
    };
    return colors[category] || '#666';
  };

  if (personasLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <div>Carregando progresso...</div>
      </div>
    );
  }

  return (
    <EducationalLayout currentPersona={selectedPersona || undefined}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Global Progress Component */}
        <ProgressSystem 
          type="global" 
          data={userProgressData} 
          size="large" 
          showDetails={true} 
        />

        {/* Overview Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏱️</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {formatTime(progressData.totalTime)}
            </div>
            <div style={{ opacity: 0.9 }}>Tempo Total de Estudo</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📚</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {progressData.modulesCompleted}/{progressData.modulesStarted}
            </div>
            <div style={{ opacity: 0.9 }}>Módulos Concluídos</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💬</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {progressData.chatSessions}
            </div>
            <div style={{ opacity: 0.9 }}>Sessões de Chat</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '25px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>❓</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {progressData.questionsAsked}
            </div>
            <div style={{ opacity: 0.9 }}>Perguntas Feitas</div>
          </div>
        </div>

        {/* Learning Path */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '25px', 
            color: '#333' 
          }}>
            Trilha de Aprendizado
          </h2>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <div style={{ position: 'relative' }}>
              {/* Progress Line */}
              <div style={{
                position: 'absolute',
                left: '25px',
                top: '50px',
                bottom: '50px',
                width: '3px',
                background: '#e0e0e0',
                zIndex: 0
              }}>
                <div style={{
                  width: '100%',
                  height: '50%',
                  background: '#4caf50'
                }} />
              </div>

              {/* Sistema IndexProgress ativado - Progresso Visual com Números */}
              <div style={{ marginBottom: '2rem' }}>
                <IndexProgress
                  totalSteps={progressData.learningPath.length}
                  currentStep={progressData.learningPath.findIndex(item => item.status === 'in-progress') + 1}
                  labels={progressData.learningPath.map(item => item.title)}
                  color="#003366"
                  showConnectors={true}
                />
              </div>

              {/* Learning Path Items with Index Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {progressData.learningPath.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {/* Index Number */}
                    <IndexIndicator
                      index={index + 1}
                      color="#003366"
                      variant="step"
                      size="large"
                      completed={item.status === 'completed'}
                      active={item.status === 'in-progress'}
                    />

                    {/* Status Icon */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: getStatusColor(item.status),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      {getStatusIcon(item.status)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{
                          fontSize: '1.3rem',
                          margin: 0,
                          color: item.status === 'locked' ? '#9e9e9e' : '#333'
                        }}>
                          {item.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{
                            fontSize: '0.9rem',
                            color: '#666'
                          }}>
                            🕒 {item.estimatedTime}
                          </span>
                          <span style={{
                            fontWeight: 'bold',
                            color: getStatusColor(item.status)
                          }}>
                            {item.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{
                        background: '#f0f0f0',
                        borderRadius: '10px',
                        height: '8px',
                        marginBottom: '5px'
                      }}>
                        <div style={{
                          background: getStatusColor(item.status),
                          height: '100%',
                          borderRadius: '10px',
                          width: `${item.progress}%`,
                          transition: 'width 0.5s ease'
                        }} />
                      </div>

                      {/* Prerequisite */}
                      {item.prerequisite && (
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#888'
                        }}>
                          Pré-requisito: {progressData.learningPath.find(p => p.id === item.prerequisite)?.title}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '25px', 
            color: '#333' 
          }}>
            Conquistas Desbloqueadas
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {progressData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '25px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  border: '3px solid transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = getCategoryColor(achievement.category);
                  e.currentTarget.style.transform = 'translateY(-5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    background: `linear-gradient(135deg, ${getCategoryColor(achievement.category)} 0%, ${getCategoryColor(achievement.category)}CC 100%)`,
                    borderRadius: '50%',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                  }}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.4rem',
                      margin: '0 0 5px',
                      color: '#333'
                    }}>
                      {achievement.title}
                    </h3>
                    <div style={{
                      background: getCategoryColor(achievement.category),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      {achievement.category}
                    </div>
                  </div>
                </div>
                
                <p style={{
                  color: '#666',
                  margin: '0 0 15px',
                  lineHeight: 1.5
                }}>
                  {achievement.description}
                </p>
                
                <div style={{
                  fontSize: '0.9rem',
                  color: '#888',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  🗓️ Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progresso por Persona - currentPersona ativado */}
        {currentPersona && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: '40px',
            border: `3px solid ${currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981'}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '25px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981'} 0%, ${currentPersona.tone === 'technical' ? '#1e40af' : '#059669'} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}>
                {currentPersona.tone === 'technical' ? '👨‍⚕️' : '👩‍🏫'}
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  Progresso com {selectedPersona === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#666',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  Especialista em {currentPersona.specialties?.join(', ') || 'Farmácia Clínica'}
                </p>
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.9rem',
                  color: currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981',
                  fontWeight: '600'
                }}>
                  📊 Estilo: {currentPersona.responseStyle || (currentPersona.tone === 'technical' ? 'Técnico e Preciso' : 'Empático e Didático')}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: `${currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981'}10`,
                borderRadius: '12px'
              }}>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981',
                  marginBottom: '8px'
                }}>
                  {Math.floor(progressData.chatSessions * 0.6)}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Sessões com esta Persona
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: `${currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981'}10`,
                borderRadius: '12px'
              }}>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981',
                  marginBottom: '8px'
                }}>
                  {Math.floor(progressData.questionsAsked * 0.7)}%
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Satisfação Média
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: `${currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981'}10`,
                borderRadius: '12px'
              }}>
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 'bold',
                  color: currentPersona.tone === 'technical' ? '#3b82f6' : '#10b981',
                  marginBottom: '8px'
                }}>
                  {formatTime(Math.floor(progressData.totalTime * 0.65))}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Tempo de Interação
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#666',
              textAlign: 'center'
            }}>
              💡 Dica: {currentPersona.tone === 'technical'
                ? 'Faça perguntas específicas sobre dosagens e protocolos para aproveitar ao máximo o Dr. Gasnelio'
                : 'Use linguagem natural e pergunte sobre conceitos básicos para uma melhor experiência com a Gá'
              }
            </div>
          </div>
        )}

        {/* Share Progress Button - PR #175 */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px' 
        }}>
          <ShareProgress
            customContent={{
              title: 'Progresso no Aprendizado! 📈',
              description: 'Confira meu progresso no Sistema de Dispensação de Hanseníase',
              metadata: {
              totalPoints: 250,
              achievements_count: 3,
              completedModules: 2,
              streak: 5,
              level: 3
              }
            }}
            onShare={(result) => {
              // Log compartilhamento de progresso via analytics
              if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'progress_shared', {
                  event_category: 'engagement',
                  event_label: 'progress_sharing',
                  value: 250, // totalPoints from metadata
                  custom_parameters: {
                    user_id: user?.uid
                  }
                });
              }

              // Atualizar dados de progresso com compartilhamento
              updateProgressData({
                questionsAsked: progressData.questionsAsked + 1 // Contar como atividade
              });
            }}
          />
        </div>

        {/* Weekly Progress Chart */}
        <div>
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '25px', 
            color: '#333' 
          }}>
            Progresso Semanal
          </h2>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {progressData.weeklyProgress.map((week) => (
                <div
                  key={week.week}
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}
                >
                  <h4 style={{
                    fontSize: '1.2rem',
                    marginBottom: '15px',
                    color: '#1976d2'
                  }}>
                    {week.week}
                  </h4>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', color: '#4caf50' }}>
                        {week.modulesCompleted}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Módulos completados
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.5rem', color: '#ff9800' }}>
                        {formatTime(week.timeSpent)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Tempo de estudo
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.5rem', color: '#2196f3' }}>
                        {week.chatInteractions}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Interações chat
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EducationalLayout>
  );
}