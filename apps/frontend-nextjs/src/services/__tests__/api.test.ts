import {
  getPersonas,
  sendChatMessage,
  checkAPIHealth,
  detectQuestionScope
} from '../api';
import type { ChatRequest, ChatResponse, PersonasResponse } from '../api';

// Mock fetch globally
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getPersonas', () => {
    it('should fetch personas successfully', async () => {
      const mockPersonas: PersonasResponse = {
        dr_gasnelio: {
          name: 'Dr. Gasnelio',
          description: 'Farmacêutico clínico especializado',
          avatar: '/avatars/gasnelio.png',
          personality: 'professional',
          response_style: 'technical',
          target_audience: 'healthcare_professionals'
        },
        ga: {
          name: 'Gá',
          description: 'Assistente empática e educacional',
          avatar: '/avatars/ga.png',
          personality: 'empathetic',
          response_style: 'simple',
          target_audience: 'patients'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPersonas
      });

      const result = await getPersonas();

      expect(result).toEqual(mockPersonas);
      expect(result.dr_gasnelio).toBeDefined();
      expect(result.ga).toBeDefined();
    });

    it('should fallback to static personas on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPersonas();

      // Should return static fallback, not throw
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message successfully', async () => {
      const request: ChatRequest = {
        question: 'Qual a dose de rifampicina para adultos?',
        personality_id: 'dr_gasnelio'
      };

      const mockResponse: ChatResponse = {
        answer: 'A dose padrão de rifampicina é 600mg mensal...',
        persona: 'dr_gasnelio',
        request_id: 'req_123',
        confidence: 0.95
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sendChatMessage(request);

      expect(result.answer).toBeDefined();
      expect(result.persona).toBe('dr_gasnelio');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should include attachment when provided', async () => {
      const request: ChatRequest = {
        question: 'O que mostra esta receita?',
        personality_id: 'ga',
        attachment: {
          fileName: 'receita.pdf',
          mimeType: 'application/pdf',
          base64Data: 'JVBERi0xLjQ=',
          sizeBytes: 1024
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          answer: 'Analisando o documento...',
          persona: 'ga',
          request_id: 'req_456'
        })
      });

      await sendChatMessage(request);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.attachment).toBeDefined();
      expect(callBody.attachment.fileName).toBe('receita.pdf');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const request: ChatRequest = {
        question: 'Test',
        personality_id: 'ga'
      };

      await expect(sendChatMessage(request)).rejects.toThrow();
    });
  });

  describe('checkAPIHealth', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'healthy',
        medical_system: 'operational',
        rag: 'OK',
        timestamp: '2026-02-12T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      });

      const result = await checkAPIHealth();

      expect(result.status).toBe('healthy');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/health'),
        expect.any(Object)
      );
    });

    it('should handle health check failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await checkAPIHealth();

      // checkAPIHealth returns offline status instead of throwing
      expect(result).toBeDefined();
    });
  });

  describe('detectQuestionScope', () => {
    it('should detect in-scope medical questions', async () => {
      const mockScope = {
        scope: 'hanseniase',
        confidence: 0.92,
        details: 'Pergunta sobre dosagem de medicamento para hanseníase',
        category: 'dosage',
        is_medical: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScope
      });

      const result = await detectQuestionScope('Qual a dose de dapsona?');

      expect(result.is_medical).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect out-of-scope questions', async () => {
      const mockScope = {
        scope: 'out_of_scope',
        confidence: 0.98,
        details: 'Pergunta não relacionada a hanseníase',
        is_medical: false
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScope
      });

      const result = await detectQuestionScope('Como fazer bolo?');

      expect(result.is_medical).toBe(false);
    });

    it('should handle scope detection errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Scope service error'));

      const result = await detectQuestionScope('Test question');

      // detectQuestionScope has offline fallback
      expect(result).toBeDefined();
      expect(result.scope).toBeDefined();
    });
  });
});
