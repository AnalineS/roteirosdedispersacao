'use client';

import { UserProgressData } from './index';
import ProgressIndicator from './ProgressIndicator';

interface GlobalProgressProps {
  userData: UserProgressData;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export default function GlobalProgress({ 
  userData, 
  size = 'medium', 
  showDetails = true 
}: GlobalProgressProps) {
  
  const getAchievementColor = (category: string) => {
    switch (category) {
      case 'learning': return '#1976d2';
      case 'engagement': return '#ff9800';
      case 'mastery': return '#4caf50';
      case 'time': return '#9c27b0';
      default: return '#666';
    }
  };

  const formatTimeSpent = (timeString: string) => {
    return timeString.replace('h', ' horas').replace('min', ' minutos');
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: size === 'small' ? '16px' : size === 'large' ? '32px' : '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: size === 'small' ? '1.5rem' : '2rem' }}>📊</div>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: size === 'small' ? '1.2rem' : size === 'large' ? '1.8rem' : '1.5rem',
            color: '#1976d2',
            fontWeight: 'bold'
          }}>
            Meu Progresso Geral
          </h3>
          <p style={{
            margin: 0,
            fontSize: size === 'small' ? '0.8rem' : '0.9rem',
            color: '#666'
          }}>
            Acompanhe sua jornada de aprendizagem
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: size === 'small' ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Overall Progress */}
        <div style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {userData.overallCompletionRate}%
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Progresso Geral
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
            {userData.completedModules}/{userData.totalModules} módulos
          </div>
        </div>

        {/* Streak */}
        <div style={{
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            🔥 {userData.currentStreak}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Dias Consecutivos
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
            Continue assim!
          </div>
        </div>

        {/* Time Spent */}
        <div style={{
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
            ⏱️
          </div>
          <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            {userData.totalTimeSpent}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
            Tempo estudado
          </div>
        </div>
      </div>

      {/* Module Progress List */}
      {showDetails && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{
            fontSize: '1.2rem',
            color: '#333',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📚 Progresso por Módulo
          </h4>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {userData.modules.map((module) => (
              <ProgressIndicator
                key={module.moduleId}
                progress={module}
                size={size}
                showDetails={true}
                interactive={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {userData.achievements.length > 0 && showDetails && (
        <div>
          <h4 style={{
            fontSize: '1.2rem',
            color: '#333',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏆 Conquistas Recentes
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: size === 'small' ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {userData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: `2px solid ${getAchievementColor(achievement.category)}20`
                }}
              >
                <div style={{
                  fontSize: '1.5rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: getAchievementColor(achievement.category),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {achievement.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '2px'
                  }}>
                    {achievement.name}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    {achievement.description}
                  </div>
                  {achievement.unlockedAt && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: getAchievementColor(achievement.category),
                      fontWeight: 'bold'
                    }}>
                      {achievement.unlockedAt.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        borderRadius: '8px',
        borderLeft: '4px solid #1976d2'
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: '#1976d2',
          fontWeight: 'bold',
          marginBottom: '4px'
        }}>
          💪 Continue assim!
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: '#333'
        }}>
          {userData.overallCompletionRate < 50 
            ? 'Você está no caminho certo! Continue estudando para dominar a hanseníase e PQT-U.'
            : userData.overallCompletionRate < 80
            ? 'Excelente progresso! Você já domina a maior parte do conteúdo sobre hanseníase.'
            : 'Parabéns! Você é um especialista em hanseníase e PQT-U. Continue praticando!'
          }
        </div>
      </div>
    </div>
  );
}