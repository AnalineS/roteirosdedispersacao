'use client';

import React, { useState } from 'react';
import { ClinicalCase, getCaseDifficultyColor, formatCaseTime } from '@/types/clinicalCases';
import { modernChatTheme } from '@/config/modernTheme';
import { 
  BabyIcon,
  UserIcon,
  HeartIcon,
  PillIcon,
  AlertTriangleIcon,
  ClipboardListIcon,
  TargetIcon,
  SearchIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  LockIcon,
  PlayIcon,
  EyeIcon,
  ChevronRightIcon
} from '@/components/ui/EducationalIcons';

interface CaseSelectorProps {
  cases: ClinicalCase[];
  onSelectCase: (caseData: ClinicalCase) => void;
  onBack?: () => void;
  userType?: 'anonymous' | 'authenticated';
  completedCases?: string[]; // IDs of completed cases
}

export default function CaseSelector({ 
  cases, 
  onSelectCase, 
  onBack, 
  userType = 'anonymous',
  completedCases = []
}: CaseSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('todos');
  const [previewCase, setPreviewCase] = useState<ClinicalCase | null>(null);

  const categories = ['todos', 'pediatrico', 'adulto', 'gravidez', 'interacoes', 'complicacoes'];
  const difficulties = ['todos', 'básico', 'intermediário', 'avançado', 'complexo'];

  const filteredCases = cases.filter(case_ => {
    const categoryMatch = selectedCategory === 'todos' || case_.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'todos' || case_.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pediatrico': return BabyIcon;
      case 'adulto': return UserIcon;
      case 'gravidez': return HeartIcon;
      case 'interacoes': return PillIcon;
      case 'complicacoes': return AlertTriangleIcon;
      default: return ClipboardListIcon;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'pediatrico': return 'Pediátrico';
      case 'adulto': return 'Adulto';
      case 'gravidez': return 'Gravidez';
      case 'interacoes': return 'Interações';
      case 'complicacoes': return 'Complicações';
      default: return 'Todos';
    }
  };

  const isCompleted = (caseId: string) => completedCases.includes(caseId);
  const isAvailable = (case_: ClinicalCase) => {
    if (userType === 'authenticated') return true;
    // For anonymous users, only show first 2 cases as demo
    return ['caso_001_pediatrico_basico', 'caso_002_adulto_standard'].includes(case_.id);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: modernChatTheme.spacing.lg
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: modernChatTheme.spacing.xl
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, marginBottom: modernChatTheme.spacing.sm }}>
            <TargetIcon size={28} color={modernChatTheme.colors.personas.gasnelio.primary} />
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: modernChatTheme.colors.neutral.text,
              margin: 0
            }}>
              Escolha seu Caso Clínico
            </h1>
          </div>
          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.textMuted,
            margin: 0
          }}>
            {userType === 'authenticated' 
              ? 'Selecione um caso para iniciar sua prática educativa'
              : 'Explore nossos casos demonstrativos (versão limitada)'
            }
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              background: 'transparent',
              color: modernChatTheme.colors.neutral.textMuted,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: modernChatTheme.typography.meta.fontSize,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs
            }}
          >
            ← Voltar
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: modernChatTheme.spacing.lg,
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        marginBottom: modernChatTheme.spacing.xl,
        boxShadow: modernChatTheme.shadows.subtle
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, marginBottom: modernChatTheme.spacing.md }}>
          <SearchIcon size={20} color={modernChatTheme.colors.personas.gasnelio.primary} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            margin: 0
          }}>
            Filtros
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: modernChatTheme.spacing.lg
        }}>
          {/* Category Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, marginBottom: modernChatTheme.spacing.sm }}>
              <BookOpenIcon size={16} color={modernChatTheme.colors.neutral.text} />
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text
              }}>
                Categoria Clínica:
              </label>
            </div>
            <div style={{
              display: 'flex',
              gap: modernChatTheme.spacing.xs,
              flexWrap: 'wrap'
            }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                    background: selectedCategory === category 
                      ? modernChatTheme.colors.personas.gasnelio.primary
                      : 'transparent',
                    color: selectedCategory === category 
                      ? 'white'
                      : modernChatTheme.colors.neutral.textMuted,
                    border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.xs,
                    transition: modernChatTheme.transitions.fast
                  }}
                >
                  {React.createElement(getCategoryIcon(category), { size: 16, color: "currentColor" })} {getCategoryName(category)}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, marginBottom: modernChatTheme.spacing.sm }}>
              <TargetIcon size={16} color={modernChatTheme.colors.neutral.text} />
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text
              }}>
                Nível de Complexidade:
              </label>
            </div>
            <div style={{
              display: 'flex',
              gap: modernChatTheme.spacing.xs,
              flexWrap: 'wrap'
            }}>
              {difficulties.map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  style={{
                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                    background: selectedDifficulty === difficulty 
                      ? modernChatTheme.colors.personas.ga.primary
                      : 'transparent',
                    color: selectedDifficulty === difficulty 
                      ? 'white'
                      : modernChatTheme.colors.neutral.textMuted,
                    border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                    borderRadius: modernChatTheme.borderRadius.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: modernChatTheme.transitions.fast
                  }}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div style={{
          marginTop: modernChatTheme.spacing.md,
          padding: modernChatTheme.spacing.sm,
          background: modernChatTheme.colors.background.secondary,
          borderRadius: modernChatTheme.borderRadius.sm,
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted,
          textAlign: 'center'
        }}>
          Mostrando <strong>{filteredCases.length}</strong> de <strong>{cases.length}</strong> casos disponíveis
          {userType === 'anonymous' && ' (versão demonstrativa - faça login para acesso completo)'}
        </div>
      </div>

      {/* Case Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: modernChatTheme.spacing.lg
      }}>
        {filteredCases.map((case_, index) => {
          const available = isAvailable(case_);
          const completed = isCompleted(case_.id);
          
          return (
            <div
              key={case_.id}
              style={{
                background: 'white',
                border: `2px solid ${
                  completed 
                    ? '#10B981' + '50'
                    : available 
                      ? modernChatTheme.colors.neutral.border
                      : modernChatTheme.colors.neutral.border + '50'
                }`,
                borderRadius: modernChatTheme.borderRadius.lg,
                overflow: 'hidden',
                boxShadow: available ? modernChatTheme.shadows.subtle : 'none',
                opacity: available ? 1 : 0.6,
                transition: modernChatTheme.transitions.normal,
                position: 'relative'
              }}
            >
              {/* Header */}
              <div style={{
                padding: modernChatTheme.spacing.lg,
                background: available 
                  ? `linear-gradient(135deg, ${getCaseDifficultyColor(case_.difficulty)}15, ${getCaseDifficultyColor(case_.difficulty)}05)`
                  : modernChatTheme.colors.background.secondary,
                borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: modernChatTheme.spacing.md
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.sm
                  }}>
                    {React.createElement(getCategoryIcon(case_.category), { 
                      size: 28, 
                      color: getCaseDifficultyColor(case_.difficulty) 
                    })}
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: available ? modernChatTheme.colors.neutral.text : modernChatTheme.colors.neutral.textMuted,
                        marginBottom: modernChatTheme.spacing.xs
                      }}>
                        {case_.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: modernChatTheme.spacing.xs,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                          background: getCaseDifficultyColor(case_.difficulty) + '20',
                          color: available ? getCaseDifficultyColor(case_.difficulty) : modernChatTheme.colors.neutral.textMuted,
                          borderRadius: modernChatTheme.borderRadius.sm,
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {case_.difficulty}
                        </span>
                        <div style={{
                          padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                          background: modernChatTheme.colors.neutral.border,
                          color: available ? modernChatTheme.colors.neutral.text : modernChatTheme.colors.neutral.textMuted,
                          borderRadius: modernChatTheme.borderRadius.sm,
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: modernChatTheme.spacing.xs
                        }}>
                          <ClockIcon size={12} color="currentColor" />
                          {formatCaseTime(case_.estimatedTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div style={{ display: 'flex', gap: modernChatTheme.spacing.xs }}>
                    {completed && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#10B981',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}>
                        <CheckCircleIcon size={16} color="white" />
                      </div>
                    )}
                    
                    {!available && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: modernChatTheme.colors.neutral.textMuted,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        <LockIcon size={16} color="white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div style={{
                  display: 'flex',
                  gap: modernChatTheme.spacing.xs,
                  flexWrap: 'wrap'
                }}>
                  {case_.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      style={{
                        padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                        background: available 
                          ? modernChatTheme.colors.background.secondary
                          : modernChatTheme.colors.neutral.border + '50',
                        color: available ? modernChatTheme.colors.neutral.textMuted : modernChatTheme.colors.neutral.textMuted + '80',
                        borderRadius: modernChatTheme.borderRadius.sm,
                        fontSize: '10px',
                        fontWeight: '500'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {case_.tags.length > 3 && (
                    <span style={{
                      padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                      background: modernChatTheme.colors.neutral.textMuted + '20',
                      color: modernChatTheme.colors.neutral.textMuted,
                      borderRadius: modernChatTheme.borderRadius.sm,
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      +{case_.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: modernChatTheme.spacing.lg }}>
                {/* Patient Preview */}
                <div style={{ marginBottom: modernChatTheme.spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, marginBottom: modernChatTheme.spacing.sm }}>
                    <UserIcon size={16} color={available ? modernChatTheme.colors.neutral.text : modernChatTheme.colors.neutral.textMuted} />
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: available ? modernChatTheme.colors.neutral.text : modernChatTheme.colors.neutral.textMuted,
                      margin: 0
                    }}>
                      Paciente:
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: available ? modernChatTheme.colors.neutral.textMuted : modernChatTheme.colors.neutral.textMuted + '80',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {case_.patient.name}, {case_.patient.age} anos, {case_.patient.weight}kg • 
                    {case_.patient.clinicalPresentation.type === 'paucibacilar' ? ' Paucibacilar' : ' Multibacilar'}
                  </p>
                </div>

                {/* Learning Objectives Preview */}
                <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, marginBottom: modernChatTheme.spacing.sm }}>
                    <TargetIcon size={16} color={available ? modernChatTheme.colors.neutral.text : modernChatTheme.colors.neutral.textMuted} />
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: available ? modernChatTheme.colors.neutral.text : modernChatTheme.colors.neutral.textMuted,
                      margin: 0
                    }}>
                      Objetivos:
                    </h4>
                  </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: modernChatTheme.spacing.md,
                    fontSize: '12px',
                    color: available ? modernChatTheme.colors.neutral.textMuted : modernChatTheme.colors.neutral.textMuted + '80',
                    lineHeight: '1.4'
                  }}>
                    {case_.learningObjectives.slice(0, 2).map((objective, objIndex) => (
                      <li key={objIndex} style={{ marginBottom: modernChatTheme.spacing.xs }}>
                        {objective}
                      </li>
                    ))}
                    {case_.learningObjectives.length > 2 && (
                      <li style={{ 
                        fontStyle: 'italic', 
                        color: available ? modernChatTheme.colors.neutral.textMuted : modernChatTheme.colors.neutral.textMuted + '60'
                      }}>
                        ... e mais {case_.learningObjectives.length - 2} objetivos
                      </li>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: modernChatTheme.spacing.sm
                }}>
                  <button
                    onClick={() => available ? onSelectCase(case_) : alert('Faça login para acessar este caso!')}
                    disabled={!available}
                    style={{
                      flex: 1,
                      padding: modernChatTheme.spacing.md,
                      background: available 
                        ? (completed 
                            ? '#10B981'
                            : modernChatTheme.colors.personas.gasnelio.primary)
                        : modernChatTheme.colors.neutral.textMuted,
                      color: 'white',
                      border: 'none',
                      borderRadius: modernChatTheme.borderRadius.md,
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: available ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: modernChatTheme.spacing.xs
                    }}
                  >
                    {!available && <LockIcon size={16} color="currentColor" />}
                    {available && completed && <ChevronRightIcon size={16} color="currentColor" />}
                    {available && !completed && <PlayIcon size={16} color="currentColor" />}
                    {!available 
                      ? 'Faça Login'
                      : completed 
                        ? 'Refazer Caso' 
                        : 'Iniciar Caso'
                    }
                  </button>

                  {available && (
                    <button
                      onClick={() => setPreviewCase(case_)}
                      style={{
                        padding: modernChatTheme.spacing.md,
                        background: 'transparent',
                        color: modernChatTheme.colors.neutral.textMuted,
                        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                        borderRadius: modernChatTheme.borderRadius.md,
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <EyeIcon size={16} color="currentColor" />
                    </button>
                  )}
                </div>
              </div>

              {/* Locked Overlay for unavailable cases */}
              {!available && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: modernChatTheme.spacing.sm
                }}>
                  <LockIcon size={48} color={modernChatTheme.colors.neutral.textMuted} />
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: modernChatTheme.colors.neutral.textMuted,
                    textAlign: 'center'
                  }}>
                    Disponível na versão completa
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredCases.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: modernChatTheme.spacing.xxl,
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: modernChatTheme.spacing.lg }}>
            <SearchIcon size={48} color={modernChatTheme.colors.neutral.textMuted} />
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.sm
          }}>
            Nenhum caso encontrado
          </h3>
          <p>
            Experimente ajustar os filtros para encontrar casos que correspondam aos seus critérios.
          </p>
        </div>
      )}

      {/* Case Preview Modal */}
      {previewCase && (
        <CasePreviewModal
          case_={previewCase}
          onClose={() => setPreviewCase(null)}
          onStart={() => {
            setPreviewCase(null);
            onSelectCase(previewCase);
          }}
        />
      )}
    </div>
  );
}

// Case Preview Modal
function CasePreviewModal({ 
  case_, 
  onClose, 
  onStart 
}: { 
  case_: ClinicalCase; 
  onClose: () => void; 
  onStart: () => void; 
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: modernChatTheme.zIndex.modal,
      padding: modernChatTheme.spacing.lg
    }}>
      <div style={{
        background: 'white',
        borderRadius: modernChatTheme.borderRadius.lg,
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: modernChatTheme.shadows.emphasis
      }}>
        {/* Header */}
        <div style={{
          padding: modernChatTheme.spacing.xl,
          borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`,
          background: `linear-gradient(135deg, ${getCaseDifficultyColor(case_.difficulty)}15, ${getCaseDifficultyColor(case_.difficulty)}05)`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: modernChatTheme.spacing.md
          }}>
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.sm
              }}>
                {case_.title}
              </h2>
              <div style={{ display: 'flex', gap: modernChatTheme.spacing.sm }}>
                <span style={{
                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                  background: getCaseDifficultyColor(case_.difficulty) + '20',
                  color: getCaseDifficultyColor(case_.difficulty),
                  borderRadius: modernChatTheme.borderRadius.sm,
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {case_.difficulty}
                </span>
                <div style={{
                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                  background: modernChatTheme.colors.neutral.border,
                  color: modernChatTheme.colors.neutral.text,
                  borderRadius: modernChatTheme.borderRadius.sm,
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs
                }}>
                  <ClockIcon size={12} color="currentColor" />
                  {formatCaseTime(case_.estimatedTime)}
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                padding: modernChatTheme.spacing.sm,
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: modernChatTheme.colors.neutral.textMuted
              }}
            >
              ✕
            </button>
          </div>
          
          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.textMuted,
            margin: 0,
            lineHeight: '1.5'
          }}>
            {case_.scenario.presentation}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: modernChatTheme.spacing.xl }}>
          {/* Patient Details */}
          <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, marginBottom: modernChatTheme.spacing.md }}>
              <UserIcon size={20} color={modernChatTheme.colors.neutral.text} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                margin: 0
              }}>
                Informações do Paciente
              </h3>
            </div>
            <div style={{
              background: modernChatTheme.colors.background.secondary,
              padding: modernChatTheme.spacing.md,
              borderRadius: modernChatTheme.borderRadius.md
            }}>
              <p style={{
                fontSize: '14px',
                color: modernChatTheme.colors.neutral.text,
                margin: 0
              }}>
                <strong>{case_.patient.name}</strong>, {case_.patient.gender}, {case_.patient.age} anos, {case_.patient.weight}kg<br/>
                Apresentação: {case_.patient.clinicalPresentation.type}<br/>
                Lesões: {case_.patient.clinicalPresentation.lesions.join(', ')}
              </p>
            </div>
          </div>

          {/* Learning Objectives */}
          <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, marginBottom: modernChatTheme.spacing.md }}>
              <TargetIcon size={20} color={modernChatTheme.colors.neutral.text} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                margin: 0
              }}>
                Objetivos de Aprendizagem
              </h3>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: modernChatTheme.spacing.md,
              fontSize: '14px',
              color: modernChatTheme.colors.neutral.text,
              lineHeight: '1.5'
            }}>
              {case_.learningObjectives.map((objective, index) => (
                <li key={index} style={{ marginBottom: modernChatTheme.spacing.sm }}>
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps Preview */}
          <div style={{ marginBottom: modernChatTheme.spacing.xl }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, marginBottom: modernChatTheme.spacing.md }}>
              <ClipboardListIcon size={20} color={modernChatTheme.colors.neutral.text} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                margin: 0
              }}>
                Etapas do Caso ({case_.steps.length})
              </h3>
            </div>
            <div style={{ display: 'grid', gap: modernChatTheme.spacing.sm }}>
              {case_.steps.map((step, index) => (
                <div
                  key={step.id}
                  style={{
                    padding: modernChatTheme.spacing.md,
                    border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                    borderRadius: modernChatTheme.borderRadius.md,
                    background: 'white'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: modernChatTheme.spacing.sm,
                    marginBottom: modernChatTheme.spacing.xs
                  }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      background: modernChatTheme.colors.personas.gasnelio.primary,
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {step.stepNumber}
                    </span>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: modernChatTheme.colors.neutral.text,
                      margin: 0
                    }}>
                      {step.title}
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: modernChatTheme.colors.neutral.textMuted,
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: modernChatTheme.spacing.md,
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
                background: 'transparent',
                color: modernChatTheme.colors.neutral.textMuted,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
            <button
              onClick={onStart}
              style={{
                padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              <PlayIcon size={16} color="currentColor" />
              Iniciar Caso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
