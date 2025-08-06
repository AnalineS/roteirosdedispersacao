'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface ModuleSection {
  id: string;
  title: string;
  content: string;
  keyPoints?: string[];
  interactive?: {
    type: 'quiz' | 'checklist' | 'calculator' | 'timeline';
    data: any;
  };
  media?: {
    type: 'image' | 'video' | 'infographic';
    src: string;
    alt: string;
    caption?: string;
  };
}

export interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  level: 'Básico' | 'Intermediário' | 'Avançado';
  category: string;
  author?: string;
  institution?: string;
  lastUpdated?: string;
  sections: ModuleSection[];
  references?: string[];
  nextModule?: string;
  previousModule?: string;
}

interface ModuleTemplateProps {
  moduleData: ModuleData;
  onSectionComplete?: (sectionId: string) => void;
  onModuleComplete?: () => void;
  showChatIntegration?: boolean;
}

export default function ModuleTemplate({
  moduleData,
  onSectionComplete,
  onModuleComplete,
  showChatIntegration = true
}: ModuleTemplateProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const handleSectionComplete = (sectionId: string) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionId);
    setCompletedSections(newCompleted);
    
    if (onSectionComplete) {
      onSectionComplete(sectionId);
    }

    // Se todas as seções foram completadas
    if (newCompleted.size === moduleData.sections.length && onModuleComplete) {
      onModuleComplete();
    }
  };

  const progressPercentage = (completedSections.size / moduleData.sections.length) * 100;

  const renderContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null;
      
      // Títulos com **
      if (paragraph.includes('**') && paragraph.includes(':**')) {
        const title = paragraph.replace(/\*\*/g, '').replace(':', '');
        return (
          <h4 key={index} className="font-bold text-lg mb-3 mt-4" style={{ color: 'var(--color-primary)' }}>
            {title}
          </h4>
        );
      }
      
      // Lista com bullets •
      if (paragraph.trim().startsWith('•')) {
        return (
          <li key={index} className="ml-4 mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {paragraph.trim().substring(1).trim()}
          </li>
        );
      }
      
      // Parágrafo normal
      return (
        <p key={index} className="mb-3" style={{ 
          color: 'var(--color-text-secondary)',
          lineHeight: '1.7'
        }}>
          {paragraph.trim()}
        </p>
      );
    });
  };

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header do Módulo */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-background) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--color-primary)',
              marginBottom: '0.5rem',
              lineHeight: '1.2'
            }}>
              {moduleData.title}
            </h1>
            
            <p style={{ 
              fontSize: '1.25rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1.5rem'
            }}>
              {moduleData.subtitle}
            </p>
            
            <p style={{ 
              fontSize: '1rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: '1.7'
            }}>
              {moduleData.description}
            </p>

            {/* Metadados */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div className="badge" style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary)' }}>
                📚 {moduleData.level}
              </div>
              <div className="badge" style={{ backgroundColor: 'var(--color-secondary-100)', color: 'var(--color-secondary)' }}>
                🕒 {moduleData.duration}
              </div>
              <div className="badge badge-neutral">
                📂 {moduleData.category}
              </div>
              {moduleData.author && (
                <div className="badge badge-neutral">
                  👨‍🎓 {moduleData.author}
                </div>
              )}
            </div>

            {/* Progresso */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  Progresso do Módulo
                </span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  color: 'var(--color-primary)'
                }}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div style={{
                background: 'var(--color-border)',
                borderRadius: '6px',
                height: '8px'
              }}>
                <div style={{
                  background: 'var(--color-primary)',
                  height: '100%',
                  borderRadius: '6px',
                  width: `${progressPercentage}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
          
          {/* Navegação de seções */}
          <div style={{ minWidth: '200px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              Seções
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {moduleData.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`btn btn-ghost ${currentSection === index ? 'btn-primary' : ''}`}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    opacity: completedSections.has(section.id) ? 1 : 0.8
                  }}
                >
                  {completedSections.has(section.id) ? '✅' : '📖'} {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da Seção */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        {moduleData.sections[currentSection] && (
          <>
            <h2 style={{ 
              fontSize: '1.75rem',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              marginBottom: '1.5rem'
            }}>
              {moduleData.sections[currentSection].title}
            </h2>

            <div style={{ marginBottom: '2rem' }}>
              {renderContent(moduleData.sections[currentSection].content)}
            </div>

            {/* Key Points */}
            {moduleData.sections[currentSection].keyPoints && (
              <div className="card card-flat" style={{ 
                backgroundColor: 'var(--color-primary-50)', 
                border: '1px solid var(--color-primary-100)',
                marginBottom: '2rem'
              }}>
                <h4 style={{ 
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  marginBottom: '1rem'
                }}>
                  💡 Pontos-chave
                </h4>
                <ul style={{ marginLeft: '1rem' }}>
                  {moduleData.sections[currentSection].keyPoints!.map((point, index) => (
                    <li key={index} style={{ 
                      marginBottom: '0.5rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Media */}
            {moduleData.sections[currentSection].media && (
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <img 
                  src={moduleData.sections[currentSection].media!.src}
                  alt={moduleData.sections[currentSection].media!.alt}
                  style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                />
                {moduleData.sections[currentSection].media!.caption && (
                  <p style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    {moduleData.sections[currentSection].media!.caption}
                  </p>
                )}
              </div>
            )}

            {/* Chat Integration */}
            {showChatIntegration && (
              <div className="card card-flat" style={{ 
                backgroundColor: 'var(--color-secondary-50)',
                border: '1px solid var(--color-secondary-100)',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    👨‍⚕️
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Dúvidas sobre este conteúdo?
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Pergunte ao Dr. Gasnelio sobre qualquer aspecto desta seção
                    </p>
                  </div>
                  <Link href="/chat" className="btn btn-primary btn-sm">
                    💬 Conversar
                  </Link>
                </div>
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                className="btn btn-secondary"
              >
                ← Seção Anterior
              </button>

              <button
                onClick={() => handleSectionComplete(moduleData.sections[currentSection].id)}
                className={`btn ${completedSections.has(moduleData.sections[currentSection].id) ? 'btn-success' : 'btn-primary'}`}
                disabled={completedSections.has(moduleData.sections[currentSection].id)}
              >
                {completedSections.has(moduleData.sections[currentSection].id) ? '✅ Concluída' : '✓ Marcar como Lida'}
              </button>

              <button
                onClick={() => setCurrentSection(Math.min(moduleData.sections.length - 1, currentSection + 1))}
                disabled={currentSection === moduleData.sections.length - 1}
                className="btn btn-secondary"
              >
                Próxima Seção →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer do Módulo */}
      <div className="card card-flat">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {moduleData.previousModule && (
              <Link href={`/modules/${moduleData.previousModule}`} className="btn btn-ghost">
                ← Módulo Anterior
              </Link>
            )}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {completedSections.size} de {moduleData.sections.length} seções concluídas
            </p>
          </div>
          
          <div>
            {moduleData.nextModule && (
              <Link href={`/modules/${moduleData.nextModule}`} className="btn btn-ghost">
                Próximo Módulo →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}