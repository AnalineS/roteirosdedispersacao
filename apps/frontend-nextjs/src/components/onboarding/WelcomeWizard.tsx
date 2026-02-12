/**
 * Welcome Wizard Component - ETAPA 3 UX TRANSFORMATION
 * Sistema de Onboarding Inteligente - Redução de abandono 75% → 40%
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Simplicidade Médica: Interface limpa para profissionais de saúde
 * - Progressive Disclosure: Informação em 3 etapas máximo
 * - Mobile-First: Touch-friendly (min 44px)
 * - Performance: Lazy loading e memoização
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAnalyticsUX } from '@/components/analytics/GoogleAnalyticsSetup';
import { getPersonaAvatar } from '@/constants/avatars';

// Types para type safety e maintainability
interface UserRole {
  id: 'medical' | 'student' | 'patient';
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  recommendedPersona: 'dr-gasnelio' | 'ga';
}

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType<any>;
}

// Configuração seguindo princípio DRY
const USER_ROLES: UserRole[] = [
  {
    id: 'medical',
    title: 'Profissional de Saúde',
    description: 'Médico, farmacêutico, enfermeiro ou especialista',
    icon: '👨‍⚕️',
    benefits: [
      'Informações técnicas detalhadas',
      'Protocolos de dispensação PQT-U',
      'Referências científicas',
      'Calculadoras de dose'
    ],
    recommendedPersona: 'dr-gasnelio'
  },
  {
    id: 'student',
    title: 'Estudante da Área da Saúde',
    description: 'Graduação, pós-graduação ou residência',
    icon: '👩‍🎓',
    benefits: [
      'Material educacional estruturado',
      'Módulos de aprendizagem',
      'Simulações interativas',
      'Certificados de conclusão'
    ],
    recommendedPersona: 'dr-gasnelio'
  },
  {
    id: 'patient',
    title: 'Paciente ou Familiar',
    description: 'Informações acessíveis sobre tratamento',
    icon: '🤗',
    benefits: [
      'Linguagem simples e clara',
      'Orientações práticas',
      'Suporte empático',
      'Dúvidas frequentes'
    ],
    recommendedPersona: 'ga'
  }
];

// Step 1: Role Selection
const RoleSelectionStep = ({ onRoleSelect, selectedRole }: {
  onRoleSelect: (role: UserRole) => void;
  selectedRole: UserRole | null;
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo ao Sistema de Hanseníase
        </h2>
        <p className="text-gray-600">
          Para oferecer a melhor experiência, nos conte sobre você
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {USER_ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => onRoleSelect(role)}
            className={`
              p-6 rounded-xl border-2 text-left transition-all duration-200 min-h-[44px]
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              ${selectedRole?.id === role.id 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            aria-label={`Selecionar perfil: ${role.title}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" role="img">{role.icon}</span>
              <h3 className="font-semibold text-gray-900">{role.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{role.description}</p>
            <ul className="text-xs text-gray-500 space-y-1">
              {role.benefits.slice(0, 2).map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  {benefit}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
};

// Step 2: Persona Introduction
const PersonaIntroductionStep = ({ selectedRole }: { selectedRole: UserRole }) => {
  const persona = selectedRole.recommendedPersona;
  const personaData = {
    'dr-gasnelio': {
      name: 'Dr. Gasnelio',
      description: 'Especialista técnico em hanseníase',
      style: 'Científico e detalhado',
      avatar: getPersonaAvatar('dr_gasnelio')
    },
    'ga': {
      name: 'Gá',
      description: 'Assistente empático e acessível',
      style: 'Simples e acolhedor',
      avatar: getPersonaAvatar('ga')
    }
  }[persona];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conheça seu Assistente
        </h2>
        <p className="text-gray-600">
          Baseado no seu perfil, recomendamos:
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
        <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
          <Image
            src={personaData.avatar}
            alt={`Avatar de ${personaData.name}`}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {personaData.name}
        </h3>
        <p className="text-gray-600 mb-4">{personaData.description}</p>
        <div className="bg-white rounded-lg p-4 text-sm text-gray-700">
          <strong>Estilo de comunicação:</strong> {personaData.style}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-xl">💡</span>
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Você pode trocar de assistente a qualquer momento</p>
            <p className="text-amber-700">
              Experimente ambos e veja qual se adequa melhor às suas necessidades!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para questionário informativo (usuários logados)
interface SurveyAnswers {
  institution: string;
  role: string;
  experience: string;
  interests: string[];
}

const InformativeSurveyStep = ({ onComplete }: { onComplete: (data: SurveyAnswers) => void }) => {
  const [answers, setAnswers] = useState<SurveyAnswers>({
    institution: '',
    role: '',
    experience: '',
    interests: [] as string[]
  });

  const handleAnswerChange = <K extends keyof SurveyAnswers>(field: K, value: SurveyAnswers[K]) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setAnswers(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = () => {
    // Salvar dados do questionário no localStorage para administradores
    const surveyData = {
      timestamp: Date.now(),
      userId: Date.now().toString(), // Pode ser substituído por user.id quando disponível
      ...answers
    };
    
    // Salvar dados do survey
    const existingSurveys = JSON.parse(safeLocalStorage()?.getItem('admin_surveys') || '[]');
    existingSurveys.push(surveyData);
    safeLocalStorage()?.setItem('admin_surveys', JSON.stringify(existingSurveys));
    
    // Marcar como completado
    safeLocalStorage()?.setItem('user_survey_completed', 'true');
    
    onComplete(surveyData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          📊 Questionário Informativo
        </h3>
        <p className="text-gray-600">
          Ajude-nos a entender melhor nossos usuários (dados para administradores)
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instituição ou Local de Trabalho
          </label>
          <input
            type="text"
            value={answers.institution}
            onChange={(e) => handleAnswerChange('institution', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Hospital das Clínicas, UBS Centro, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Função/Cargo
          </label>
          <select
            value={answers.role}
            onChange={(e) => handleAnswerChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione sua função</option>
            <option value="medico">Médico</option>
            <option value="farmaceutico">Farmacêutico</option>
            <option value="enfermeiro">Enfermeiro</option>
            <option value="tecnico">Técnico em Enfermagem</option>
            <option value="estudante">Estudante</option>
            <option value="gestor">Gestor de Saúde</option>
            <option value="pesquisador">Pesquisador</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Experiência com Hanseníase
          </label>
          <select
            value={answers.experience}
            onChange={(e) => handleAnswerChange('experience', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione sua experiência</option>
            <option value="nenhuma">Nenhuma experiência</option>
            <option value="basica">Conhecimento básico</option>
            <option value="intermediaria">Experiência intermediária</option>
            <option value="avancada">Experiência avançada</option>
            <option value="especialista">Especialista na área</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Áreas de Interesse (selecione todas que se aplicam)
          </label>
          <div className="space-y-2">
            {[
              'Diagnóstico',
              'Tratamento/PQT-U',
              'Reações Hansênicas',
              'Prevenção de Incapacidades',
              'Aspectos Psicossociais',
              'Vigilância Epidemiológica',
              'Educação em Saúde'
            ].map(interest => (
              <label key={interest} className="flex items-center">
                <input
                  type="checkbox"
                  checked={answers.interests.includes(interest)}
                  onChange={() => handleInterestToggle(interest)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{interest}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                   transition-colors min-h-[44px] font-medium w-full"
        >
          Finalizar Questionário
        </button>
      </div>
    </div>
  );
};

// Step 3: Quick Demo
const QuickDemoStep = ({ selectedRole }: { selectedRole: UserRole }) => {
  const [currentExample, setCurrentExample] = useState(0);
  
  const examples = useMemo(() => {
    const baseExamples = [
      {
        question: "Como dispensar PQT-U?",
        preview: "Você receberá protocolos detalhados de dispensação..."
      },
      {
        question: "Quais são os efeitos colaterais?",
        preview: "Informações completas sobre reações adversas..."
      }
    ];

    if (selectedRole.id === 'patient') {
      return [
        {
          question: "Como tomar o remédio?",
          preview: "Explicações simples sobre horários e dosagem..."
        },
        {
          question: "É normal sentir enjoo?",
          preview: "Orientações claras sobre efeitos esperados..."
        }
      ];
    }

    return baseExamples;
  }, [selectedRole]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % examples.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [examples.length]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vamos começar!
        </h2>
        <p className="text-gray-600">
          Veja como é fácil obter respostas especializadas:
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 font-medium">
              &quot;{examples[currentExample].question}&quot;
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
            <p className="text-gray-700 text-sm">
              {examples[currentExample].preview}
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-4 gap-2">
          {examples.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentExample ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center text-sm">
        <div className="p-4 bg-green-50 rounded-lg">
          <span className="text-green-600 text-2xl block mb-2">⚡</span>
          <p className="font-medium">Respostas rápidas</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <span className="text-blue-600 text-2xl block mb-2">🎯</span>
          <p className="font-medium">Conteúdo especializado</p>
        </div>
      </div>
    </div>
  );
};

// Main WelcomeWizard Component
export function WelcomeWizard({ onComplete }: {
  onComplete: (role: UserRole) => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { trackCustomUXEvent } = useGoogleAnalyticsUX();

  // Memoized steps for performance
  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 1,
      title: 'Perfil',
      subtitle: 'Conte-nos sobre você',
      component: RoleSelectionStep
    },
    {
      id: 2,
      title: 'Assistente',
      subtitle: 'Conheça sua ajuda especializada',
      component: PersonaIntroductionStep
    },
    {
      id: 3,
      title: 'Demo',
      subtitle: 'Veja como funciona',
      component: QuickDemoStep
    }
  ], []);

  // Handlers with useCallback for performance
  const handleRoleSelect = useCallback((role: UserRole) => {
    setSelectedRole(role);
    trackCustomUXEvent('onboarding_role_selected', 'onboarding', undefined, {
      role_type: role.id,
      recommended_persona: role.recommendedPersona
    });
  }, [trackCustomUXEvent]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      trackCustomUXEvent('onboarding_step_advanced', 'onboarding');
    }
  }, [currentStep, steps.length, trackCustomUXEvent]);

  const handleComplete = useCallback(() => {
    if (selectedRole) {
      trackCustomUXEvent('onboarding_completed', 'onboarding', undefined, {
        role_type: selectedRole.id,
        recommended_persona: selectedRole.recommendedPersona
      });
      
      // Salvar no cache por 5 dias
      const cacheData = {
        timestamp: Date.now(),
        completed: true,
        selectedRole: selectedRole.id
      };
      safeLocalStorage()?.setItem('welcome_wizard_seen', JSON.stringify(cacheData));
      
      setIsVisible(false);
      
      // Delay for smooth animation
      setTimeout(() => {
        onComplete(selectedRole);
      }, 300);
    }
  }, [selectedRole, onComplete, trackCustomUXEvent]);

  const handleSkip = useCallback(() => {
    trackCustomUXEvent('onboarding_skipped', 'onboarding', currentStep);
    
    // Salvar no cache por 5 dias
    const cacheData = {
      timestamp: Date.now(),
      skipped: true,
      step: currentStep
    };
    safeLocalStorage()?.setItem('welcome_wizard_seen', JSON.stringify(cacheData));
    
    // Default to medical professional if skipped
    const defaultRole = USER_ROLES[0];
    setIsVisible(false);
    
    setTimeout(() => {
      onComplete(defaultRole);
    }, 300);
  }, [currentStep, onComplete, trackCustomUXEvent]);

  // Handler para completar o questionário informativo (usuários logados)
  const handleSurveyComplete = useCallback((surveyData: SurveyAnswers) => {
    trackCustomUXEvent('user_survey_completed', 'onboarding', undefined, {
      institution: surveyData.institution,
      role: surveyData.role,
      experience: surveyData.experience,
      interests_count: surveyData.interests.length,
      interests_list: surveyData.interests.join(', ')
    });
    setIsVisible(false);
    
    setTimeout(() => {
      // Para usuários logados, não passa papel específico
      onComplete({ id: 'medical', title: 'Questionário Completado', description: 'Survey completed', icon: '📝', benefits: [], recommendedPersona: 'dr-gasnelio' });
    }, 300);
  }, [onComplete, trackCustomUXEvent]);

  // Verificar cache por 5 dias
  useEffect(() => {
    const cacheKey = 'welcome_wizard_seen';
    const cachedData = safeLocalStorage()?.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const { timestamp, skipped } = JSON.parse(cachedData);
        const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        if (now - timestamp < fiveDaysInMs) {
          // Cache ainda válido, não mostrar o wizard
          queueMicrotask(() => setIsVisible(false));
          return;
        } else {
          // Cache expirado, remover
          safeLocalStorage()?.removeItem(cacheKey);
        }
      } catch {
        // Cache corrompido, remover
        safeLocalStorage()?.removeItem(cacheKey);
      }
    }
  }, []);

  // Para usuários logados, verificar se já completaram o questionário informativo
  const isLoggedIn = !!user;
  const hasCompletedUserSurvey = safeLocalStorage()?.getItem('user_survey_completed');
  
  if (isLoggedIn && hasCompletedUserSurvey) {
    return null;
  }
  
  // Para usuários não logados, verificar onboarding tradicional
  if (!isLoggedIn && safeLocalStorage()?.getItem('onboarding_completed')) {
    return null;
  }

  // Don't show if cache is valid
  if (!isVisible) {
    return null;
  }

  // Se usuário logado, mostrar questionário informativo
  if (isLoggedIn) {
    return (
      <div className={`
        fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4
        transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className={`
          bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto
          transform transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}
        `}>
          {/* Header para usuários logados */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Bem-vindo!
                </h1>
                <p className="text-sm text-gray-600">
                  Questionário rápido para administradores
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 text-sm px-3 py-1 rounded
                         hover:bg-gray-100 transition-colors min-h-[44px]"
                aria-label="Pular por agora"
              >
                Pular por agora
              </button>
            </div>
          </div>

          {/* Conteúdo do questionário */}
          <div className="p-6">
            <InformativeSurveyStep onComplete={handleSurveyComplete} />
          </div>
        </div>
      </div>
    );
  }

  // Para usuários não logados, continuar com onboarding tradicional
  const CurrentStepComponent = steps[currentStep - 1]?.component;
  const canProceed = currentStep === 1 ? selectedRole !== null : true;

  return (
    <div className={`
      fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4
      transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className={`
        bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto
        transform transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}
      `}>
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {steps[currentStep - 1]?.title}
              </h1>
              <p className="text-sm text-gray-600">
                {steps[currentStep - 1]?.subtitle}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 text-sm px-3 py-1 rounded
                       hover:bg-gray-100 transition-colors min-h-[44px]"
              aria-label="Pular por agora"
            >
              Pular por agora
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step.id <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {CurrentStepComponent && (
            <CurrentStepComponent
              onRoleSelect={handleRoleSelect}
              selectedRole={selectedRole}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            Voltar
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       min-h-[44px] font-medium"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                       transition-colors min-h-[44px] font-medium"
            >
              Começar a usar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WelcomeWizard;