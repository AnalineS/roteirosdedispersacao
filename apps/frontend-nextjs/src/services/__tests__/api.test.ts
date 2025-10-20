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
        dr_gasnelio: {
          name: "Dr. Gasnelio",
          description: "Especialista técnico em hanseníase e farmacologia",
          avatar: "👨‍⚕️",
          personality: "Científico e técnico",
          expertise: ["farmacologia", "hanseníase", "PQT-U", "protocolos clínicos"],
          response_style: "Detalhado, técnico, com base em evidências científicas",
          target_audience: "Profissionais de saúde e estudantes",
          system_prompt: "Você é Dr. Gasnelio, especialista em hanseníase. Forneça respostas técnicas baseadas em evidências.",
          capabilities: ["dosagem", "interações", "protocolos", "farmacologia"],
          example_questions: [
            "Como calcular a dose de rifampicina?",
            "Quais são as interações da clofazimina?",
            "Protocolo PQT-U completo"
          ],
          limitations: ["Não substitui consulta médica", "Informações gerais apenas"],
          response_format: {
            technical: true,
            citations: true,
            structured: true
          }
        },
        ga: {
          name: "Gá",
          description: "Assistente empático focado no cuidado humanizado",
          avatar: "🤗",
          personality: "Empático e acolhedor",
          expertise: ["cuidado humanizado", "orientação ao paciente", "apoio emocional"],
          response_style: "Simples, empático, linguagem acessível",
          target_audience: "Pacientes e familiares",
          system_prompt: "Você é Gá, assistente empático. Use linguagem simples e acolhedora.",
          capabilities: ["orientação básica", "apoio emocional", "explicações simples"],
          example_questions: [
            "Como tomar os remédios?",
            "É normal o xixi ficar laranja?",
            "Quando vou melhorar?"
          ],
          limitations: ["Não substitui consulta médica", "Orientações gerais apenas"],
          response_format: {
            technical: false,
            citations: false,
            empathetic: true
          }
        }
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
        answer: '👨‍⚕️ Dr. Gasnelio aqui. Atualmente funcionando em modo offline.\n\nSua consulta: "Test message"\n\n📋 **Informações gerais sobre PQT-U:**\n• Duração: 6 meses para hanseníase paucibacilar\n• Medicamentos: Rifampicina, Dapsona, Clofazimina\n• Administração: Dose supervisionada mensal + autoadministração diária\n\n⚠️ **Importante:** Para orientações específicas sobre dosagem, interações medicamentosas ou efeitos adversos, consulte sempre um profissional de saúde qualificado.\n\n📖 Consulte o material técnico disponível nesta plataforma para informações detalhadas baseadas no PCDT Hanseníase 2022.',
        persona: 'Dr. Gasnelio',
        request_id: 'offline_1758333443204',
        timestamp: '2025-09-20T01:57:23.204Z',
        processing_time_ms: 100,
        confidence: 0.8,
        name: 'Dr. Gasnelio',
        api_version: 'offline_v1.0',
        metadata: {
          tokens_used: 0,
          model_used: 'offline_fallback',
          context_retrieved: false,
          scope_detected: 'offline_mode'
        }
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