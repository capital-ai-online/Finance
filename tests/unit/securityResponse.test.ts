import { afterEach, describe, expect, it } from 'vitest';
import { attachSecurityResponseContext } from '../../server/securityResponse';

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
    },
  } as any;
}

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe('ADR-0035 security response context', () => {
  it('injects the same cryptographic nonce into CSP and HTML and disables HTML caching', () => {
    process.env.NODE_ENV = 'production';
    const req = createHtmlRequest();
    const mock = createMockResponse();

    attachSecurityResponseContext(req, mock.res);
    mock.res.setHeader('Content-Type', 'text/html; charset=utf-8');
    mock.res.end('<html><head><script nonce="__CSP_NONCE__" src="/app.js"></script></head></html>');

    const csp = String(mock.headers.get('content-security-policy'));
    const nonceMatch = csp.match(/'nonce-([^']+)'/);

    expect(nonceMatch).not.toBeNull();
    const nonce = nonceMatch![1];
    expect(nonce.length).toBeGreaterThanOrEqual(20);
    expect(mock.body()).toContain(`nonce="${nonce}"`);
    expect(mock.body()).not.toContain('__CSP_NONCE__');
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(mock.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(req.headers['if-none-match']).toBeUndefined();
    expect(req.headers['if-modified-since']).toBeUndefined();
  });

  it('generates a different nonce for separate HTML responses', () => {
    process.env.NODE_ENV = 'production';

    const first = createMockResponse();
    attachSecurityResponseContext(createHtmlRequest(), first.res);
    const firstCsp = String(first.headers.get('content-security-policy'));
    const firstNonce = firstCsp.match(/'nonce-([^']+)'/)?.[1];

    const second = createMockResponse();
    attachSecurityResponseContext(createHtmlRequest(), second.res);
    const secondCsp = String(second.headers.get('content-security-policy'));
    const secondNonce = secondCsp.match(/'nonce-([^']+)'/)?.[1];

    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });
});
