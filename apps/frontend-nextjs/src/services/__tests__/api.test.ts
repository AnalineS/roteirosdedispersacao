/**
 * Testes para serviço API
 * Cobertura: Personas, chat, fallback
 */

import { jest } from '@jest/globals';
import { getPersonas, sendChatMessage, checkAPIHealth, detectQuestionScope, apiClient } from '../api';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

// Mock environment
(global as any).process = {
  env: {
    NODE_ENV: 'test'
  }
};

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonas', () => {
    it('should fetch personas successfully', async () => {
      const mockPersonas = {
        dr_gasnelio: { name: 'Dr. Gasnelio', avatar: 'avatar.png' },
        ga: { name: 'Gá', avatar: 'ga.png' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPersonas,
      } as any);

      const result = await getPersonas();
      expect(result).toEqual(mockPersonas);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/personas', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: expect.any(AbortSignal)
      });
    });

    it('should handle personas fetch error with fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error') as any);

      const result = await getPersonas();
      // Should return static personas as fallback, not throw
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle non-ok response with fallback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const result = await getPersonas();
      // Should return static personas as fallback, not throw
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('sendChatMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        answer: 'Test response',
        persona: 'dr_gasnelio',
        request_id: 'req-123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const request = {
        question: 'Test message',
        personality_id: 'dr_gasnelio'
      };

      const result = await sendChatMessage(request);
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: expect.any(AbortSignal)
      });
    });

    it('should handle message send error with offline fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error') as any);

      const request = { question: 'Test', personality_id: 'ga' };
      const result = await sendChatMessage(request);
      // Should return offline response, not throw
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe('string');
    });
  });

  describe('apiClient', () => {
    it('should send POST request successfully', async () => {
      const mockData = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as any);

      const result = await apiClient.post('/test', { data: 'test' });
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' })
      });
    });

    it('should handle POST request error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error') as any);

      await expect(apiClient.post('/test', {})).rejects.toThrow('Network error');
    });
  });

  describe('checkAPIHealth', () => {
    it('should check system health', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as any);

      const result = await checkAPIHealth();
      
      expect(result).toEqual({
        available: true,
        url: 'http://localhost:8080',
        fallbackActive: false
      });
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: expect.any(AbortSignal)
      });
    });

    it('should handle health check error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error') as any);

      const result = await checkAPIHealth();
      
      expect(result.available).toBe(false);
      expect(result.fallbackActive).toBe(true);
    });
  });

  describe('detectQuestionScope', () => {
    it('should detect question scope', async () => {
      const mockScope = {
        scope: 'medical',
        confidence: 0.9
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockScope,
      } as any);

      const result = await detectQuestionScope('Qual a dose de rifampicina?');
      
      expect(result).toEqual(mockScope);
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await getPersonas();
      // Should return static personas as fallback, not throw
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as any);

      const result = await getPersonas();
      // Should return static personas as fallback, not throw
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('request parameters', () => {
    it('should handle empty message gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ answer: 'Please provide a message', request_id: 'req-123' }),
      } as any);

      const request = { question: '', personality_id: 'dr_gasnelio' };
      const result = await sendChatMessage(request);
      expect(result.answer).toBeTruthy();
    });

    it('should handle invalid persona', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as any);

      const request = { question: 'Test', personality_id: 'invalid_persona' };
      const result = await sendChatMessage(request);
      // Should return offline response as fallback, not throw
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    });
  });
});