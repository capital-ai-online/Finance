import { describe, expect, it } from 'vitest';
import { EDGE_TRUST_HEADER } from '../../src/platform/Security/edgeTrust';
import { getClientIp } from '../../src/platform/Security/rateLimiter';

const EDGE_SECRET = '0123456789abcdef0123456789abcdef';

function trustedRenderRequest(overrides: Record<string, unknown> = {}) {
  return {
    headers: {
      host: 'capital-ai.online',
      'x-forwarded-proto': 'https',
      [EDGE_TRUST_HEADER]: EDGE_SECRET,
      'cf-connecting-ip': '203.0.113.10',
      'cf-ray': '230b030023ae2822-FRA',
      'x-forwarded-for': '198.51.100.99',
      ...overrides,
    },
    ip: '10.0.0.1',
    socket: { remoteAddress: '10.0.0.2' },
  };
}

describe('getClientIp security boundary', () => {
  it('uses the Cloudflare visitor IP only after verified Cloudflare -> Render provenance', () => {
    expect(getClientIp(trustedRenderRequest(), {
      isRender: true,
      sharedSecret: EDGE_SECRET,
    })).toBe('203.0.113.10');
  });

  it('never uses raw X-Forwarded-For as the identity source', () => {
    expect(getClientIp({
      headers: { 'x-forwarded-for': '198.51.100.99' },
      ip: '10.0.0.1',
      socket: { remoteAddress: '10.0.0.2' },
    }, { isRender: false })).toBe('10.0.0.1');
  });

  it('rejects a malformed Cloudflare client IP even when the remaining edge proof is valid', () => {
    expect(getClientIp(trustedRenderRequest({
      'cf-connecting-ip': '203.0.113.10, 198.51.100.2',
    }), {
      isRender: true,
      sharedSecret: EDGE_SECRET,
    })).toBe('10.0.0.1');
  });

  it('returns unknown when no syntactically valid trusted IP source exists', () => {
    expect(getClientIp({
      headers: { 'x-forwarded-for': '198.51.100.99' },
      ip: 'not-an-ip',
      socket: { remoteAddress: 'also-not-an-ip' },
    }, { isRender: false })).toBe('unknown');
  });
});
