import { afterEach, describe, expect, it } from 'vitest';
import {
  attachSecurityResponseContext,
  buildBaselineProductionCsp,
  buildStrictProductionCsp,
  resolveProductionCspMode,
} from '../../server/securityResponse';

function createMockResponse() {
  const headers = new Map<string, unknown>();
  let body = '';

  const res: any = {
    locals: {},
    setHeader(name: string, value: unknown) {
      headers.set(name.toLowerCase(), value);
      return res;
    },
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
    },
    removeHeader(name: string) {
      headers.delete(name.toLowerCase());
    },
    write(chunk: unknown) {
      body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk ?? '');
      return true;
    },
    end(chunk?: unknown) {
      if (chunk !== undefined && chunk !== null) {
        body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      }
      return res;
    },
  };

  return {
    res,
    headers,
    body: () => body,
  };
}

function createHtmlRequest() {
  return {
    method: 'GET',
    path: '/',
    headers: {
      accept: 'text/html',
      'if-none-match': 'old-etag',
      'if-modified-since': 'yesterday',
      range: 'bytes=0-100',
    },
  } as any;
}

const originalNodeEnv = process.env.NODE_ENV;
const originalCspMode = process.env.CSP_MODE;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalCspMode === undefined) delete process.env.CSP_MODE;
  else process.env.CSP_MODE = originalCspMode;
});

describe('ADR-0035 / ADR-0040 security response context', () => {
  it('defaults production to enforced strict CSP with no report-only duplicate', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CSP_MODE;
    const req = createHtmlRequest();
    const mock = createMockResponse();

    attachSecurityResponseContext(req, mock.res);
    mock.res.setHeader('Content-Type', 'text/html; charset=utf-8');
    mock.res.end('<html><head><script nonce="__CSP_NONCE__" src="/assets/app.js"></script></head></html>');

    const enforced = String(mock.headers.get('content-security-policy'));
    const nonce = enforced.match(/'nonce-([^']+)'/)?.[1];

    expect(enforced).toContain("'strict-dynamic'");
    expect(enforced).not.toContain("'unsafe-eval'");
    expect(mock.headers.has('content-security-policy-report-only')).toBe(false);
    expect(nonce).toBeTruthy();
    expect(mock.body()).toContain(`nonce="${nonce}"`);
    expect(mock.body()).not.toContain('__CSP_NONCE__');
    expect(mock.headers.get('x-csp-mode')).toBe('strict');
    expect(mock.headers.get('x-csp-policy')).toBe('ADR-0035+ADR-0040');
    expect(mock.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(req.headers['if-none-match']).toBeUndefined();
    expect(req.headers['if-modified-since']).toBeUndefined();
    expect(req.headers.range).toBeUndefined();
  });

  it('keeps explicit strict selection equivalent to the production default', () => {
    process.env.NODE_ENV = 'production';
    process.env.CSP_MODE = 'strict';
    const mock = createMockResponse();

    attachSecurityResponseContext(createHtmlRequest(), mock.res);
    mock.res.setHeader('Content-Type', 'text/html; charset=utf-8');
    mock.res.end('<script nonce="__CSP_NONCE__" src="/assets/app.js"></script>');

    const enforced = String(mock.headers.get('content-security-policy'));
    expect(enforced).toContain("'strict-dynamic'");
    expect(mock.headers.has('content-security-policy-report-only')).toBe(false);
    expect(mock.headers.get('x-csp-mode')).toBe('strict');
  });

  it('supports an explicit baseline recovery mode without a report-only policy', () => {
    process.env.NODE_ENV = 'production';
    process.env.CSP_MODE = 'baseline';
    const mock = createMockResponse();

    attachSecurityResponseContext(createHtmlRequest(), mock.res);

    const enforced = String(mock.headers.get('content-security-policy'));
    expect(enforced).toContain("script-src 'self'");
    expect(enforced).not.toContain("'strict-dynamic'");
    expect(mock.headers.has('content-security-policy-report-only')).toBe(false);
    expect(mock.headers.get('x-csp-mode')).toBe('baseline');
  });

  it('supports explicit report-only recovery and fails closed to strict for unknown modes', () => {
    expect(resolveProductionCspMode('unexpected')).toBe('strict');
    expect(resolveProductionCspMode('STRICT')).toBe('strict');
    expect(resolveProductionCspMode('report-only')).toBe('report-only');
  });

  it('keeps the baseline and strict policy builders independently testable', () => {
    const baseline = buildBaselineProductionCsp('nonce-value');
    const strict = buildStrictProductionCsp('nonce-value');

    expect(baseline).toContain("script-src 'self' 'nonce-nonce-value'");
    expect(baseline).not.toContain("'strict-dynamic'");
    expect(strict).toContain("'nonce-nonce-value'");
    expect(strict).toContain("'strict-dynamic'");
    expect(strict).toContain("object-src 'none'");
    expect(strict).toContain("base-uri 'none'");
  });

  it('prevents a later legacy CSP setter from replacing the authoritative policy', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CSP_MODE;
    const mock = createMockResponse();

    attachSecurityResponseContext(createHtmlRequest(), mock.res);
    const expectedEnforced = mock.headers.get('content-security-policy');
    const expectedReportOnly = mock.headers.get('content-security-policy-report-only');

    mock.res.setHeader('Content-Security-Policy', "default-src 'none'");
    mock.res.setHeader('Content-Security-Policy-Report-Only', "default-src 'none'");

    expect(mock.headers.get('content-security-policy')).toBe(expectedEnforced);
    expect(mock.headers.get('content-security-policy-report-only')).toBe(expectedReportOnly);
  });

  it('generates a different nonce for separate production responses', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CSP_MODE;

    const first = createMockResponse();
    attachSecurityResponseContext(createHtmlRequest(), first.res);
    const firstNonce = String(first.headers.get('content-security-policy'))
      .match(/'nonce-([^']+)'/)?.[1];

    const second = createMockResponse();
    attachSecurityResponseContext(createHtmlRequest(), second.res);
    const secondNonce = String(second.headers.get('content-security-policy'))
      .match(/'nonce-([^']+)'/)?.[1];

    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });
});
