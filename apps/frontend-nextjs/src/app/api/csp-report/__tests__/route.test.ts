/**
 * Tests for the CSP violation report endpoint.
 */

import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

function createReportRequest(
  body: string,
  contentType: string = 'application/csp-report',
): NextRequest {
  return new NextRequest('https://roteirosdispensacao.com.br/api/csp-report', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
}

describe('/api/csp-report', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('POST - Legacy CSP report format', () => {
    it('should return 204 for valid legacy report', async () => {
      const report = {
        'csp-report': {
          'blocked-uri': 'https://evil.com/script.js',
          'violated-directive': 'script-src',
          'document-uri': 'https://roteirosdispensacao.com.br/',
          'source-file': 'https://roteirosdispensacao.com.br/page.js',
          'line-number': 42,
        },
      };

      const request = createReportRequest(
        JSON.stringify(report),
        'application/csp-report',
      );

      const response = await POST(request);
      expect(response.status).toBe(204);
    });

    it('should log the violation as structured JSON', async () => {
      const report = {
        'csp-report': {
          'blocked-uri': 'https://evil.com/tracker.js',
          'violated-directive': 'script-src',
          'document-uri': 'https://roteirosdispensacao.com.br/',
        },
      };

      const request = createReportRequest(JSON.stringify(report));
      await POST(request);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedJson = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedJson.type).toBe('csp-violation');
      expect(loggedJson.severity).toBe('WARNING');
      expect(loggedJson.blockedUri).toBe('https://evil.com/tracker.js');
      expect(loggedJson.violatedDirective).toBe('script-src');
    });
  });

  describe('POST - Reporting API v1 format', () => {
    it('should return 204 for valid Reporting API report', async () => {
      const reports = [
        {
          type: 'csp-violation',
          body: {
            'blocked-uri': 'https://malicious.com/style.css',
            'violated-directive': 'style-src',
            'document-uri': 'https://roteirosdispensacao.com.br/chat',
          },
        },
      ];

      const request = createReportRequest(
        JSON.stringify(reports),
        'application/reports+json',
      );

      const response = await POST(request);
      expect(response.status).toBe(204);
    });

    it('should handle multiple reports in one request', async () => {
      const reports = [
        {
          type: 'csp-violation',
          body: {
            'blocked-uri': 'https://a.com/1.js',
            'violated-directive': 'script-src',
          },
        },
        {
          type: 'csp-violation',
          body: {
            'blocked-uri': 'https://b.com/2.css',
            'violated-directive': 'style-src',
          },
        },
      ];

      const request = createReportRequest(
        JSON.stringify(reports),
        'application/reports+json',
      );

      await POST(request);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST - Error handling', () => {
    it('should return 400 for empty body', async () => {
      const request = createReportRequest('');
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for malformed JSON', async () => {
      const request = createReportRequest('not valid json {{{');
      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 204 for valid JSON with violation fields', async () => {
      const directReport = {
        'blocked-uri': 'https://unknown.com/resource',
        'violated-directive': 'default-src',
      };

      const request = createReportRequest(
        JSON.stringify(directReport),
        'application/json',
      );

      const response = await POST(request);
      expect(response.status).toBe(204);
    });
  });

  describe('GET', () => {
    it('should return 405 Method Not Allowed', async () => {
      const response = await GET();
      expect(response.status).toBe(405);
    });
  });
});
