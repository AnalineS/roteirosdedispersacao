import {
  fetchPersonas,
  sendMessage,
  sendFeedback,
  verifyScope,
  fetchHealth,
  fetchStats
} from '../api';
import type { ChatMessage, Feedback, ScopeRequest } from '@/types/api';

describe('API Service', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  beforeEach(() => {
    fetch.resetMocks();
  });

  describe('fetchPersonas', () => {
    it('should fetch personas successfully', async () => {
      const mockPersonas = {
        personas: [
          {
            id: 'gasnelio',
            name: 'Dr. Gasnelio',
            description: 'Farmacêutico técnico especializado',
            avatar: '/avatars/gasnelio.png',
            tone: 'professional'
          },
          {
            id: 'ga',
            name: 'Gá',
            description: 'Assistente empática e educacional',
            avatar: '/avatars/ga.png',
            tone: 'empathetic'
          }
        ]
      };

      fetch.mockResponseOnce(JSON.stringify(mockPersonas));

      const result = await fetchPersonas();

      expect(result).toEqual(mockPersonas);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/personas`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );
    });

    it('should handle fetch errors', async () => {
      fetch.mockRejectOnce(new Error('Network error'));

      await expect(fetchPersonas()).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle HTTP errors', async () => {
      fetch.mockResponseOnce(
        JSON.stringify({ error: 'Server error' }),
        { status: 500 }
      );

      await expect(fetchPersonas()).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should support request cancellation', async () => {
      const controller = new AbortController();

      fetch.mockResponseOnce(JSON.stringify({ personas: [] }));

      const promise = fetchPersonas(controller.signal);
      controller.abort();

      await expect(promise).rejects.toThrow();

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1]?.signal).toBe(controller.signal);
    });
  });

  describe('sendMessage', () => {
    it('should send chat message successfully', async () => {
      const mockMessage: ChatMessage = {
        message: 'Qual a dose de rifampicina?',
        persona_id: 'gasnelio',
        session_id: 'test-session-123'
      };

      const mockResponse = {
        response: 'A dose padrão de rifampicina é...',
        persona_id: 'gasnelio',
        confidence: 0.95,
        sources: ['Roteiro de Dispensação - Hanseníase']
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendMessage(mockMessage);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockMessage)
        })
      );
    });

    it('should handle chat errors', async () => {
      const mockMessage: ChatMessage = {
        message: 'Test message',
        persona_id: 'gasnelio'
      };

      fetch.mockRejectOnce(new Error('Chat service unavailable'));

      await expect(sendMessage(mockMessage)).rejects.toThrow('Chat service unavailable');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid persona errors', async () => {
      const mockMessage: ChatMessage = {
        message: 'Test message',
        persona_id: 'invalid_persona'
      };

      fetch.mockResponseOnce(
        JSON.stringify({ error: 'Invalid persona' }),
        { status: 400 }
      );

      await expect(sendMessage(mockMessage)).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should support request cancellation', async () => {
      const controller = new AbortController();
      const mockMessage: ChatMessage = {
        message: 'Test',
        persona_id: 'gasnelio'
      };

      fetch.mockResponseOnce(JSON.stringify({ response: 'Test response' }));

      const promise = sendMessage(mockMessage, controller.signal);
      controller.abort();

      await expect(promise).rejects.toThrow();

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1]?.signal).toBe(controller.signal);
    });
  });

  describe('sendFeedback', () => {
    it('should send feedback successfully', async () => {
      const mockFeedback: Feedback = {
        message_id: 'msg-123',
        rating: 5,
        comment: 'Resposta muito útil',
        persona_id: 'gasnelio'
      };

      const mockResponse = {
        success: true,
        message: 'Feedback received'
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await sendFeedback(mockFeedback);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/feedback`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFeedback)
        })
      );
    });

    it('should handle feedback submission errors', async () => {
      const mockFeedback: Feedback = {
        message_id: 'msg-123',
        rating: 5,
        persona_id: 'gasnelio'
      };

      fetch.mockRejectOnce(new Error('Feedback service error'));

      await expect(sendFeedback(mockFeedback)).rejects.toThrow('Feedback service error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should support request cancellation', async () => {
      const controller = new AbortController();
      const mockFeedback: Feedback = {
        message_id: 'msg-123',
        rating: 5,
        persona_id: 'gasnelio'
      };

      fetch.mockResponseOnce(JSON.stringify({ success: true }));

      const promise = sendFeedback(mockFeedback, controller.signal);
      controller.abort();

      await expect(promise).rejects.toThrow();

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1]?.signal).toBe(controller.signal);
    });
  });

  describe('verifyScope', () => {
    it('should verify question scope successfully', async () => {
      const mockRequest: ScopeRequest = {
        question: 'Qual a dose de rifampicina para adultos?'
      };

      const mockResponse = {
        in_scope: true,
        confidence: 0.92,
        reason: 'Pergunta sobre dosagem de medicamento para hanseníase'
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await verifyScope(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/scope`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRequest)
        })
      );
    });

    it('should detect out-of-scope questions', async () => {
      const mockRequest: ScopeRequest = {
        question: 'Como fazer bolo de chocolate?'
      };

      const mockResponse = {
        in_scope: false,
        confidence: 0.98,
        reason: 'Pergunta não relacionada a hanseníase ou medicamentos'
      };

      fetch.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await verifyScope(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.in_scope).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle scope verification errors', async () => {
      const mockRequest: ScopeRequest = {
        question: 'Test question'
      };

      fetch.mockRejectOnce(new Error('Scope service error'));

      await expect(verifyScope(mockRequest)).rejects.toThrow('Scope service error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should support request cancellation', async () => {
      const controller = new AbortController();
      const mockRequest: ScopeRequest = {
        question: 'Test question'
      };

      fetch.mockResponseOnce(JSON.stringify({ in_scope: true }));

      const promise = verifyScope(mockRequest, controller.signal);
      controller.abort();

      await expect(promise).rejects.toThrow();

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1]?.signal).toBe(controller.signal);
    });
  });

  describe('fetchHealth', () => {
    it('should fetch health status successfully', async () => {
      const mockHealth = {
        status: 'healthy',
        version: '1.0.0',
        timestamp: '2025-01-09T12:00:00Z',
        services: {
          database: 'up',
          rag_system: 'up',
          openrouter: 'up'
        }
      };

      fetch.mockResponseOnce(JSON.stringify(mockHealth));

      const result = await fetchHealth();

      expect(result).toEqual(mockHealth);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/health`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );
    });

    it('should handle health check errors', async () => {
      fetch.mockRejectOnce(new Error('Health check failed'));

      await expect(fetchHealth()).rejects.toThrow('Health check failed');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should support request cancellation', async () => {
      const controller = new AbortController();

      fetch.mockResponseOnce(JSON.stringify({ status: 'healthy' }));

      const promise = fetchHealth(controller.signal);
      controller.abort();

      await expect(promise).rejects.toThrow();

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1]?.signal).toBe(controller.signal);
    });
  });

  describe('fetchStats', () => {
    it('should fetch system statistics successfully', async () => {
      const mockStats = {
        total_queries: 1523,
        avg_response_time: 1.2,
        user_satisfaction: 4.7,
        active_sessions: 42,
        cache_hit_rate: 0.85
      };

      fetch.mockResponseOnce(JSON.stringify(mockStats));

      const result = await fetchStats();

      expect(result).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/stats`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );
    });

    it('should handle stats fetch errors', async () => {
      fetch.mockRejectOnce(new Error('Stats service error'));

      await expect(fetchStats()).rejects.toThrow('Stats service error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle HTTP errors from stats endpoint', async () => {
      fetch.mockResponseOnce(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );

      await expect(fetchStats()).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should support request cancellation', async () => {
      const controller = new AbortController();

      fetch.mockResponseOnce(JSON.stringify({ total_queries: 100 }));

      const promise = fetchStats(controller.signal);
      controller.abort();

      await expect(promise).rejects.toThrow();

      const callArgs = fetch.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1]?.signal).toBe(controller.signal);
    });
  });
});
