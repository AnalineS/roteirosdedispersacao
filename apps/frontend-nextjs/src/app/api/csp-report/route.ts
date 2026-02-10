import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Report endpoint.
 *
 * Receives reports from browsers when a CSP directive is violated.
 * Logs structured JSON for Cloud Run logging / Cloud Logging ingestion.
 *
 * Accepts two report formats:
 *  1. Legacy: Content-Type application/csp-report  (body: { "csp-report": {...} })
 *  2. Reporting API v1: Content-Type application/reports+json  (body: [ {...} ])
 *
 * No patient data is included in CSP reports (only URIs and directive names).
 */

interface CspViolation {
  'blocked-uri'?: string;
  'violated-directive'?: string;
  'document-uri'?: string;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
  'original-policy'?: string;
  'disposition'?: string;
  'effective-directive'?: string;
  'status-code'?: number;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = await request.text();

    if (!body || body.trim().length === 0) {
      return new NextResponse(null, { status: 400 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    // Extract violation(s) from either format
    const violations: CspViolation[] = [];

    if (contentType.includes('application/csp-report') || contentType.includes('application/json')) {
      // Legacy format: { "csp-report": { ... } }
      const legacy = parsed as { 'csp-report'?: CspViolation };
      if (legacy?.['csp-report']) {
        violations.push(legacy['csp-report']);
      }
    }

    if (contentType.includes('application/reports+json') || Array.isArray(parsed)) {
      // Reporting API v1: [ { type, body: { ... } } ]
      const reports = parsed as Array<{ type?: string; body?: CspViolation }>;
      for (const report of reports) {
        if (report?.type === 'csp-violation' && report.body) {
          violations.push(report.body);
        }
      }
    }

    // If neither format matched but we have a parsed object with violation fields, accept it
    if (violations.length === 0 && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as CspViolation;
      if (obj['blocked-uri'] || obj['violated-directive']) {
        violations.push(obj);
      }
    }

    // Log each violation as structured JSON for Cloud Logging
    for (const violation of violations) {
      console.log(JSON.stringify({
        severity: 'WARNING',
        type: 'csp-violation',
        blockedUri: violation['blocked-uri'] || 'unknown',
        violatedDirective: violation['violated-directive'] || 'unknown',
        effectiveDirective: violation['effective-directive'] || violation['violated-directive'] || 'unknown',
        documentUri: violation['document-uri'] || 'unknown',
        sourceFile: violation['source-file'] || null,
        lineNumber: violation['line-number'] || null,
        columnNumber: violation['column-number'] || null,
        disposition: violation['disposition'] || 'enforce',
        statusCode: violation['status-code'] || null,
        timestamp: new Date().toISOString(),
      }));
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}

// Reject non-POST methods
export async function GET() {
  return new NextResponse(null, { status: 405 });
}
