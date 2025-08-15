/**
 * Testes para serviço API
 * Cobertura: Personas, chat, fallback
 */

import { jest } from '@jest/globals';
import { getPersonas, sendChatMessage, checkAPIHealth, detectQuestionScope, apiClient } from '../api';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

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
        json: async () => ({ personas: mockPersonas }),
      } as Response);

      const result = await getPersonas();
      expect(result).toEqual(mockPersonas);
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/api/v1/personas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle personas fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getPersonas()).rejects.toThrow('Network error');
    });

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(getPersonas()).rejects.toThrow('HTTP error! status: 500');
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
      } as Response);

      const request = {
        question: 'Test message',
        personality_id: 'dr_gasnelio'
      };

      const result = await sendChatMessage(request);
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });
    });

    it('should handle message send error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = { question: 'Test', personality_id: 'ga' };
      await expect(sendChatMessage(request)).rejects.toThrow('Network error');
    });
  });

  describe('apiClient', () => {
    it('should send POST request successfully', async () => {
      const mockData = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await apiClient.post('/test', { data: 'test' });
      
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' })
      });
    });

    it('should handle POST request error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.post('/test', {})).rejects.toThrow('Network error');
    });
  });

  describe('checkAPIHealth', () => {
    it('should check system health', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await checkAPIHealth();
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5000/api/health');
    });

    it('should handle health check error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkAPIHealth();
      
      expect(result).toBe(false);
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
      } as Response);

      const result = await detectQuestionScope('Qual a dose de rifampicina?');
      
      expect(result).toEqual(mockScope);
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockFetch.mockRejectedValueOnce(timeoutError);

      await expect(getPersonas()).rejects.toThrow('Request timeout');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      } as Response);

      await expect(getPersonas()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('request parameters', () => {
    it('should handle empty message gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ answer: 'Please provide a message', request_id: 'req-123' }),
      } as Response);

      const request = { question: '', personality_id: 'dr_gasnelio' };
      const result = await sendChatMessage(request);
      expect(result.answer).toBeTruthy();
    });

    it('should handle invalid persona', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const request = { question: 'Test', personality_id: 'invalid_persona' };
      await expect(sendChatMessage(request)).rejects.toThrow('HTTP error! status: 400');
    });
  });
});