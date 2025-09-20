/**
 * Testes E2E para fluxos de persona unificado
 * Garante que todos os cenários funcionem conforme especificado na issue
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ValidPersonaId } from '@/types/personas';
import { normalizePersonaId } from '@/types/personas';
import { PersonaProvider } from '@/contexts/PersonaContext';
import PersonaAccessibilityProvider from '@/components/accessibility/PersonaAccessibilityProvider';
import { usePersonas } from '@/hooks/usePersonas';
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSafePersonaFromURL } from '@/hooks/useSafePersonaFromURL';
import PersonaSelectorUnified from '@/components/home/PersonaSelectorUnified';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn()
}));
jest.mock('@/hooks/usePersonas');
jest.mock('@/hooks/usePersonasEnhanced');
jest.mock('@/hooks/useUserProfile');
jest.mock('@/hooks/useAnalytics');
jest.mock('@/hooks/useSafePersonaFromURL');

// Mock framer-motion to avoid issues with animations in tests
jest.mock('framer-motion', () => ({
  motion: {
    button: 'button',
    div: 'div'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

const mockSearchParams = new URLSearchParams();

// Setup de mocks
beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  (usePathname as jest.Mock).mockReturnValue('/');
  
  // Mock crypto.randomUUID for test environment
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    },
    writable: true
  });
  
  // Limpar localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    },
    writable: true
  });

  // Limpar mocks e restaurar defaults
  jest.clearAllMocks();
  
  // Restaurar mocks padrão
  jest.mocked(usePersonasEnhanced).mockReturnValue({
    personas: mockPersonas,
    loading: false,
    error: null,
    refetch: jest.fn(),
    isPersonaAvailable: jest.fn().mockReturnValue(true),
    getPersonaConfig: jest.fn(),
    stats: { totalPersonas: 2, availablePersonas: 2, lastUpdated: Date.now() }
  });
  
  jest.mocked(useUserProfile).mockReturnValue({
    profile: null,
    loading: false,
    error: null,
    updateProfile: jest.fn(),
    refetch: jest.fn(),
    getRecommendedPersona: jest.fn().mockReturnValue(null) // Por padrão sem recomendação
  });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// ============================================
// COMPONENTES DE TESTE
// ============================================

// Wrapper de teste com providers necessários
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PersonaProvider>
      <PersonaAccessibilityProvider>
        {children}
      </PersonaAccessibilityProvider>
    </PersonaProvider>
  );
};

// Componente de teste simulado para PersonaSelectorUnified
const MockPersonaSelectorUnified: React.FC<any> = (props) => {
  return (
    <div data-testid="persona-selector-unified">
      <button 
        data-testid="persona-dr_gasnelio" 
        onClick={() => props.onPersonaSelected?.('dr_gasnelio')}
      >
        Dr. Gasnelio
      </button>
      <button 
        data-testid="persona-ga" 
        onClick={() => props.onPersonaSelected?.('ga')}
      >
        Gá
      </button>
    </div>
  );
};

// ============================================
// TESTES DE FLUXO PRINCIPAL
// ============================================

describe('Sistema Unificado de Personas - Fluxos E2E', () => {

  describe('1. Seleção de Persona na Home', () => {
    
    it('deve exibir os dois assistentes com CTAs "Iniciar Conversa"', async () => {
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
        expect(screen.getByText('Gá')).toBeInTheDocument();
      });

      // Verificar CTAs
      const startChatButtons = screen.getAllByText('🚀 Iniciar Conversa');
      expect(startChatButtons).toHaveLength(2);

      // Verificar descrições reais que são renderizadas (fallback do componente)
      expect(screen.getByText(/Especialista técnico em hanseníase e farmacologia/)).toBeInTheDocument();
      expect(screen.getByText(/Assistente empático focado no cuidado humanizado/)).toBeInTheDocument();
    });

    it('deve navegar para /chat com parâmetro ao selecionar Dr. Gasnelio', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      });

      // Clicar no card do Dr. Gasnelio
      const gasnelio = screen.getByLabelText(/Dr\. Gasnelio/);
      await user.click(gasnelio);

      // Verificar navegação
      expect(mockRouter.push).toHaveBeenCalledWith('/chat?persona=dr_gasnelio');
    });

    it('deve navegar para /chat com parâmetro ao selecionar Gá', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Gá')).toBeInTheDocument();
      });

      // Clicar no card da Gá
      const ga = screen.getByLabelText(/Gá/);
      await user.click(ga);

      // Verificar navegação
      expect(mockRouter.push).toHaveBeenCalledWith('/chat?persona=ga');
    });

    it('deve destacar persona recomendada', async () => {
      // Mock para retornar recomendação
      jest.mocked(usePersonas).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        getRecommendedPersona: () => 'dr_gasnelio',
        refetch: jest.fn()
      });

      // Mock para retornar recomendação de perfil
      jest.mocked(useUserProfile).mockReturnValue({
        profile: null,
        loading: false,
        error: null,
        updateProfile: jest.fn(),
        refetch: jest.fn(),
        getRecommendedPersona: jest.fn().mockReturnValue('dr_gasnelio')
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Recomendado')).toBeInTheDocument();
      });
    });
  });

  describe('2. Parâmetros de URL', () => {
    
    it('deve aceitar ?persona=dr_gasnelio na URL', async () => {
      const mockParams = new URLSearchParams('persona=dr_gasnelio');
      jest.mocked(useSearchParams).mockReturnValue(mockParams);

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Verificar se Dr. Gasnelio está marcado como ativo
        expect(screen.getByText('Ativo')).toBeInTheDocument();
      });
    });

    it('deve aceitar ?persona=ga na URL', async () => {
      const mockParams = new URLSearchParams('persona=ga');
      jest.mocked(useSearchParams).mockReturnValue(mockParams);

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Verificar se Gá está marcada como ativa
        expect(screen.getByText('Ativo')).toBeInTheDocument();
      });
    });

    it('deve normalizar aliases de persona na URL', () => {
      // Estes testes seriam para o middleware, simulando diferentes URLs
      const testCases = [
        { input: 'gasnelio', expected: 'dr_gasnelio' },
        { input: 'doctor', expected: 'dr_gasnelio' },
        { input: 'technical', expected: 'dr_gasnelio' },
        { input: 'empathetic', expected: 'ga' },
        { input: 'friendly', expected: 'ga' }
      ];

      testCases.forEach(({ input, expected }) => {
        // Testar função de normalização
        expect(normalizePersonaId(input)).toBe(expected);
      });
    });

    it('deve ignorar parâmetros de persona inválidos', async () => {
      const mockParams = new URLSearchParams('persona=invalid_persona');
      jest.mocked(useSearchParams).mockReturnValue(mockParams);
      
      // Mock para persona inválida da URL
      jest.mocked(useSafePersonaFromURL).mockReturnValue({
        personaFromURL: null, // Persona inválida retorna null
        updatePersonaInURL: jest.fn(),
        hasValidURLPersona: false,
        isLoading: false
      });
      
      // Mock para não retornar recomendação E limpar localStorage
      jest.mocked(useUserProfile).mockReturnValue({
        profile: null,
        loading: false,
        error: null,
        updateProfile: jest.fn(),
        refetch: jest.fn(),
        getRecommendedPersona: jest.fn().mockReturnValue(null) // Não retornar recomendação
      });

      // Mock para simular que nenhuma persona está disponível (para impedir fallbacks)
      jest.mocked(usePersonasEnhanced).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        refetch: jest.fn(),
        isPersonaAvailable: jest.fn().mockReturnValue(false), // Impede fallbacks
        getPersonaConfig: jest.fn(),
        stats: { totalPersonas: 2, availablePersonas: 0, lastUpdated: Date.now() }
      });

      // Limpar completamente o localStorage para este teste
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockReturnValue(null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn()
        },
        writable: true
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Com parâmetro inválido, sem localStorage e sem recomendação, não deve haver persona ativa
        expect(screen.queryByText('Ativo')).not.toBeInTheDocument();
      });
    });
  });

  describe('3. Persistência em localStorage', () => {
    
    it('deve salvar persona selecionada no localStorage', async () => {
      const user = userEvent.setup();
      const mockSetItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem }
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      });

      const gasnelio = screen.getByLabelText(/Dr\. Gasnelio/);
      await user.click(gasnelio);

      expect(mockSetItem).toHaveBeenCalledWith('selectedPersona', 'dr_gasnelio');
    });

    it('deve carregar persona do localStorage na inicialização', async () => {
      const mockGetItem = jest.fn().mockReturnValue('ga');
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem }
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      expect(mockGetItem).toHaveBeenCalledWith('selectedPersona');
      
      await waitFor(() => {
        // Verificar se Gá está ativa baseada no localStorage
        expect(screen.getByText('Ativo')).toBeInTheDocument();
      });
    });
  });

  describe('4. Ordem de Prioridade', () => {
    
    it('deve priorizar URL sobre localStorage', async () => {
      // Restaurar mock padrão para personas disponíveis
      jest.mocked(usePersonasEnhanced).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        refetch: jest.fn(),
        isPersonaAvailable: jest.fn().mockReturnValue(true), // Restaurar disponibilidade
        getPersonaConfig: jest.fn(),
        stats: { totalPersonas: 2, availablePersonas: 2, lastUpdated: Date.now() }
      });

      // Setup: localStorage tem 'ga', URL tem 'dr_gasnelio'
      const mockGetItem = jest.fn().mockReturnValue('ga');
      const mockParams = new URLSearchParams('persona=dr_gasnelio');
      
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem }
      });
      jest.mocked(useSearchParams).mockReturnValue(mockParams);

      // Mock para URL válida com Dr. Gasnelio
      jest.mocked(useSafePersonaFromURL).mockReturnValue({
        personaFromURL: 'dr_gasnelio', // URL tem prioridade
        updatePersonaInURL: jest.fn(),
        hasValidURLPersona: true,
        isLoading: false
      });

      // Garantir que o mock de UserProfile não interfira
      jest.mocked(useUserProfile).mockReturnValue({
        profile: null,
        loading: false,
        error: null,
        updateProfile: jest.fn(),
        refetch: jest.fn(),
        getRecommendedPersona: jest.fn().mockReturnValue(null) // Não dar recomendação para testar prioridades
      });

      // Limpar também o mock de usePersonas para não ter recomendação
      jest.mocked(usePersonas).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        getRecommendedPersona: jest.fn().mockReturnValue(null), // Sem recomendação
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Deve haver exatamente um badge "Ativo"
        expect(screen.queryByText('Ativo')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verificar se é o Dr. Gasnelio que está ativo (URL tem prioridade)
      const gasneliozCard = screen.getByLabelText(/Iniciar conversa com Dr. Gasnelio/);
      expect(gasneliozCard).toContainElement(screen.getByText('Ativo'));
    });

    it('deve usar localStorage quando não há parâmetro na URL', async () => {
      // Restaurar mock padrão para personas disponíveis
      jest.mocked(usePersonasEnhanced).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        refetch: jest.fn(),
        isPersonaAvailable: jest.fn().mockReturnValue(true), // Restaurar disponibilidade
        getPersonaConfig: jest.fn(),
        stats: { totalPersonas: 2, availablePersonas: 2, lastUpdated: Date.now() }
      });

      const mockGetItem = jest.fn().mockReturnValue('dr_gasnelio');
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem }
      });

      // Limpar também o mock de usePersonas para não ter recomendação
      jest.mocked(usePersonas).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        getRecommendedPersona: jest.fn().mockReturnValue(null), // Sem recomendação
        refetch: jest.fn()
      });

      // Garantir que o mock de UserProfile não interfira
      jest.mocked(useUserProfile).mockReturnValue({
        profile: null,
        loading: false,
        error: null,
        updateProfile: jest.fn(),
        refetch: jest.fn(),
        getRecommendedPersona: jest.fn().mockReturnValue(null) // Não dar recomendação para testar prioridades
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Dr. Gasnelio deve estar ativo
        const gasneliozCard = screen.getByLabelText(/Iniciar conversa com Dr. Gasnelio/);
        expect(gasneliozCard).toContainElement(screen.getByText('Ativo'));
      });
    });
  });

  describe('5. Acessibilidade', () => {
    
    it('deve ter ARIA labels apropriados', async () => {
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Verificar labels
        expect(screen.getByLabelText(/Iniciar conversa com Dr\. Gasnelio/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Iniciar conversa com Gá/)).toBeInTheDocument();
        
        // Verificar role
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('deve ser navegável por teclado', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      });

      // Testar navegação por Tab
      await user.tab();
      expect(screen.getByLabelText(/Dr\. Gasnelio/)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/Gá/)).toHaveFocus();

      // Testar ativação por Enter
      await user.keyboard('{Enter}');
      expect(mockRouter.push).toHaveBeenCalledWith('/chat?persona=ga');
    });

    it('deve anunciar mudanças de persona via screen reader', async () => {
      // Este teste seria mais complexo, verificando ARIA live regions
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      // Verificar presença de live regions
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('6. Estados de Erro e Loading', () => {
    
    it('deve exibir loading state', async () => {
      // Mock usePersonasEnhanced para loading state
      jest.mocked(usePersonasEnhanced).mockReturnValue({
        personas: {},
        loading: true,
        error: null,
        refetch: jest.fn(),
        isPersonaAvailable: jest.fn().mockReturnValue(true),
        getPersonaConfig: jest.fn(),
        stats: { totalPersonas: 0, availablePersonas: 0, lastUpdated: Date.now() }
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      expect(screen.getByText('Carregando assistentes virtuais...')).toBeInTheDocument();
    });

    it('deve exibir estado de erro', async () => {
      // Mock usePersonasEnhanced para error state
      jest.mocked(usePersonasEnhanced).mockReturnValue({
        personas: {},
        loading: false,
        error: 'Erro de conexão',
        refetch: jest.fn(),
        isPersonaAvailable: jest.fn().mockReturnValue(true),
        getPersonaConfig: jest.fn(),
        stats: { totalPersonas: 0, availablePersonas: 0, lastUpdated: Date.now() }
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      expect(screen.getByText(/Erro ao carregar assistentes/)).toBeInTheDocument();
    });

    it('deve usar personas estáticas como fallback', async () => {
      jest.mocked(usePersonas).mockReturnValue({
        personas: mockFallbackPersonas,
        loading: false,
        error: 'Usando fallback',
        refetch: jest.fn()
      });

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      // Deve ainda exibir os assistentes
      expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      expect(screen.getByText('Gá')).toBeInTheDocument();
    });
  });

  describe('7. Integração com Analytics', () => {
    
    it('deve trackear seleção de persona', async () => {
      const mockTrackEvent = jest.fn();
      jest.mocked(useAnalytics).mockReturnValue({
        trackEvent: mockTrackEvent,
        trackPageView: jest.fn()
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      });

      const gasnelio = screen.getByLabelText(/Dr\. Gasnelio/);
      await user.click(gasnelio);

      expect(mockTrackEvent).toHaveBeenCalledWith('persona_change', expect.objectContaining({
        to: 'dr_gasnelio',
        source: 'explicit'
      }));
    });
  });

  describe('8. Performance e Otimizações', () => {
    
    it('deve ter transições suaves', async () => {
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified enableAnimations={true} />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      });

      // Verificar se animações estão habilitadas (motion components)
      const cards = screen.getAllByRole('button');
      cards.forEach(card => {
        expect(card).toHaveStyle({ cursor: 'pointer' });
      });
    });

    it('deve funcionar sem animações para performance', async () => {
      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified enableAnimations={false} />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Gasnelio')).toBeInTheDocument();
      });

      // Componente deve funcionar normalmente
      const startButtons = screen.getAllByText('🚀 Iniciar Conversa');
      expect(startButtons).toHaveLength(2);
    });
  });
});

// ============================================
// MOCKS E HELPERS
// ============================================

const mockPersonas = {
  dr_gasnelio: {
    name: "Dr. Gasnelio",
    description: "Especialista técnico em hanseníase e farmacologia",
    avatar: "👨‍⚕️",
    personality: "Científico e técnico",
    expertise: ["farmacologia", "hanseníase", "PQT-U"],
    response_style: "Detalhado, técnico",
    target_audience: "Profissionais de saúde",
    system_prompt: "Você é Dr. Gasnelio...",
    capabilities: ["dosagem", "interações", "protocolos"],
    example_questions: ["Como calcular a dose?"],
    limitations: ["Não substitui consulta médica"],
    response_format: { technical: true, citations: true }
  },
  ga: {
    name: "Gá",
    description: "Assistente empático focado no cuidado humanizado",
    avatar: "🤗",
    personality: "Empático e acolhedor",
    expertise: ["cuidado humanizado", "orientação ao paciente"],
    response_style: "Simples, empático",
    target_audience: "Pacientes e familiares",
    system_prompt: "Você é Gá...",
    capabilities: ["orientação básica", "apoio emocional"],
    example_questions: ["Como tomar os remédios?"],
    limitations: ["Não substitui consulta médica"],
    response_format: { technical: false, empathetic: true }
  }
};

const mockFallbackPersonas = mockPersonas; // Mesmo conteúdo para fallback


// Mock padrão para usePersonas
jest.mocked(usePersonas).mockReturnValue({
  personas: mockPersonas,
  loading: false,
  error: null,
  getPersonaById: (id: ValidPersonaId) => mockPersonas[id] || null,
  getPersonasList: () => Object.entries(mockPersonas).map(([id, persona]) => ({ id: id as ValidPersonaId, persona })),
  getValidPersonasCount: () => 2,
  refetch: jest.fn()
});

// Mock padrão para usePersonasEnhanced
jest.mocked(usePersonasEnhanced).mockReturnValue({
  personas: mockPersonas,
  loading: false,
  error: null,
  refetch: jest.fn(),
  isPersonaAvailable: jest.fn().mockReturnValue(true),
  getPersonaConfig: jest.fn(),
  stats: { totalPersonas: 2, availablePersonas: 2, lastUpdated: Date.now() }
});

// Mock padrão para useUserProfile
jest.mocked(useUserProfile).mockReturnValue({
  profile: null,
  loading: false,
  error: null,
  updateProfile: jest.fn(),
  refetch: jest.fn(),
  getRecommendedPersona: jest.fn().mockReturnValue('ga')
});

// Mock padrão para useAnalytics
jest.mocked(useAnalytics).mockReturnValue({
  trackEvent: jest.fn(),
  trackPageView: jest.fn()
});

// Mock padrão para useSafePersonaFromURL
jest.mocked(useSafePersonaFromURL).mockReturnValue({
  personaFromURL: null, // Por padrão, nenhuma persona da URL
  updatePersonaInURL: jest.fn(),
  hasValidURLPersona: false,
  isLoading: false
});