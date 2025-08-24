'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BeginnerIcon, IntermediateIcon, AdvancedIcon, ExpertIcon, TargetIcon } from '@/components/icons/FlatOutlineIcons';

interface ExperienceBannerProps {
  onComplete?: () => void;
}

export default function ExperienceBanner({ onComplete }: ExperienceBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const router = useRouter();

  // Show banner immediately, check localStorage after
  useEffect(() => {
    // Always show initially for better UX
    setIsVisible(true);
    
    // Check if already seen (but still show for now for testing)
    const hasSeenBanner = localStorage.getItem('experience_banner_seen');
    console.log('Experience banner seen before:', hasSeenBanner);
    
    // For testing, always show regardless of localStorage
    // Comment this line in production:
    // if (!hasSeenBanner) {
    //   setIsVisible(true);
    // }
  }, []);

  const experiences = [
    {
      id: 'beginner',
      title: 'Iniciante',
      description: 'Pouca experiência com hanseníase',
      icon: BeginnerIcon
    },
    {
      id: 'intermediate', 
      title: 'Intermediário',
      description: 'Conhecimento básico sobre hanseníase',
      icon: IntermediateIcon
    },
    {
      id: 'advanced',
      title: 'Avançado',
      description: 'Experiência significativa na área',
      icon: AdvancedIcon
    },
    {
      id: 'expert',
      title: 'Especialista',
      description: 'Ampla experiência e especialização',
      icon: ExpertIcon
    }
  ];

  const handleExperienceSelect = (experienceId: string) => {
    setSelectedExperience(experienceId);
    
    // Save to localStorage
    localStorage.setItem('user_experience_level', experienceId);
    localStorage.setItem('experience_banner_seen', 'true');
    
    // Hide banner with animation
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 1000);
  };

  const handleSkip = () => {
    localStorage.setItem('experience_banner_seen', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        padding: '10px 20px',
        animation: 'slideDown 0.5s ease-out',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          border: '4px solid #f59e0b',
          animation: selectedExperience ? 'pulse 0.6s ease-out' : 'none',
          position: 'relative',
          transform: 'translateY(0)'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#003366',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <TargetIcon size={28} color="#003366" />
              Qual é o seu nível de experiência?
            </h2>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '1rem'
            }}>
              Isso nos ajuda a personalizar o conteúdo para você
            </p>
          </div>

          {/* Experience Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {experiences.map((exp) => {
              const IconComponent = exp.icon;
              return (
                <button
                  key={exp.id}
                  onClick={() => handleExperienceSelect(exp.id)}
                  style={{
                    padding: '16px',
                    border: selectedExperience === exp.id ? '3px solid #f59e0b' : '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: selectedExperience === exp.id ? '#fef3c7' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedExperience !== exp.id) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedExperience !== exp.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <IconComponent size={32} color={selectedExperience === exp.id ? '#f59e0b' : '#003366'} />
                  </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#003366',
                  marginBottom: '4px'
                }}>
                  {exp.title}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  lineHeight: '1.3'
                }}>
                  {exp.description}
                </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px'
          }}>
            <button
              onClick={handleSkip}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '0.9rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Pular por enquanto
            </button>

            {selectedExperience && (
              <div style={{
                fontSize: '0.9rem',
                color: '#059669',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✓</span>
                Selecionado! Redirecionando...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}