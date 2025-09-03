/**
 * Testes E2E para fluxos de persona unificado
 * Garante que todos os cenários funcionem conforme especificado na issue
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ValidPersonaId } from '@/types/personas';

// Mocks
vi.mock('next/navigation');
vi.mock('@/hooks/usePersonas');
vi.mock('@/hooks/useUserProfile');
vi.mock('@/hooks/useAnalytics');

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn()
};

const mockSearchParams = new URLSearchParams();

// Setup de mocks
beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue(mockRouter);
  vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
  
  // Limpar localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    writable: true
  });

  // Limpar mocks
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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

// Importações dinâmicas para evitar problemas de SSR em testes
const PersonaProvider = React.lazy(() => 
  import('@/contexts/PersonaContext').then(m => ({ default: m.PersonaProvider }))
);

const PersonaAccessibilityProvider = React.lazy(() => 
  import('@/components/accessibility/PersonaAccessibilityProvider').then(m => ({ default: m.PersonaAccessibilityProvider }))
);

const PersonaSelectorUnified = React.lazy(() => 
  import('@/components/home/PersonaSelectorUnified').then(m => ({ default: m.default }))
);

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

      // Verificar descrições
      expect(screen.getByText(/aspectos técnicos, protocolos/)).toBeInTheDocument();
      expect(screen.getByText(/cuidado humanizado/)).toBeInTheDocument();
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
      vi.mocked(usePersonas).mockReturnValue({
        personas: mockPersonas,
        loading: false,
        error: null,
        getRecommendedPersona: () => 'dr_gasnelio',
        refetch: vi.fn()
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
      vi.mocked(useSearchParams).mockReturnValue(mockParams);

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
      vi.mocked(useSearchParams).mockReturnValue(mockParams);

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
      vi.mocked(useSearchParams).mockReturnValue(mockParams);

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Não deve haver persona ativa
        expect(screen.queryByText('Ativo')).not.toBeInTheDocument();
      });
    });
  });

  describe('3. Persistência em localStorage', () => {
    
    it('deve salvar persona selecionada no localStorage', async () => {
      const user = userEvent.setup();
      const mockSetItem = vi.fn();
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
      const mockGetItem = vi.fn().mockReturnValue('ga');
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
      // Setup: localStorage tem 'ga', URL tem 'dr_gasnelio'
      const mockGetItem = vi.fn().mockReturnValue('ga');
      const mockParams = new URLSearchParams('persona=dr_gasnelio');
      
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem }
      });
      vi.mocked(useSearchParams).mockReturnValue(mockParams);

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <PersonaSelectorUnified />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        // Dr. Gasnelio deve estar ativo (prioridade da URL)
        const activeCards = screen.getAllByText('Ativo');
        expect(activeCards).toHaveLength(1);
        
        // Verificar se é o Dr. Gasnelio que está ativo
        const gasneliozCard = screen.getByLabelText(/Dr\. Gasnelio/);
        expect(gasneliozCard).toContainElement(screen.getByText('Ativo'));
      });
    });

    it('deve usar localStorage quando não há parâmetro na URL', async () => {
      const mockGetItem = vi.fn().mockReturnValue('dr_gasnelio');
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

      await waitFor(() => {
        // Dr. Gasnelio deve estar ativo
        const gasneliozCard = screen.getByLabelText(/Dr\. Gasnelio/);
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
      vi.mocked(usePersonas).mockReturnValue({
        personas: {},
        loading: true,
        error: null,
        refetch: vi.fn()
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
      vi.mocked(usePersonas).mockReturnValue({
        personas: {},
        loading: false,
        error: 'Erro de conexão',
        refetch: vi.fn()
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
      vi.mocked(usePersonas).mockReturnValue({
        personas: mockFallbackPersonas,
        loading: false,
        error: 'Usando fallback',
        refetch: vi.fn()
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
      const mockTrackEvent = vi.fn();
      vi.mocked(useAnalytics).mockReturnValue({
        trackEvent: mockTrackEvent,
        trackPageView: vi.fn()
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
    description: "Assistente empática focada no cuidado humanizado",
    avatar: "🤗",
    personality: "Empática e acolhedora",
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

// Importações necessárias para os testes
import React from 'react';
import { normalizePersonaId } from '@/types/personas';

// Mock padrão para usePersonas
vi.mocked(usePersonas).mockReturnValue({
  personas: mockPersonas,
  loading: false,
  error: null,
  getPersonaById: (id: ValidPersonaId) => mockPersonas[id] || null,
  getPersonasList: () => Object.entries(mockPersonas).map(([id, persona]) => ({ id: id as ValidPersonaId, persona })),
  getValidPersonasCount: () => 2,
  refetch: vi.fn()
});

// Mock padrão para useAnalytics
vi.mocked(useAnalytics).mockReturnValue({
  trackEvent: vi.fn(),
  trackPageView: vi.fn()
});