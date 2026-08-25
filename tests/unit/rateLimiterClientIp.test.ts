import { afterEach, describe, expect, it } from 'vitest';
import { getClientIp } from '../../src/platform/Security/rateLimiter';

const originalRender = process.env.RENDER;

afterEach(() => {
  if (originalRender === undefined) delete process.env.RENDER;
  else process.env.RENDER = originalRender;
});

describe('getClientIp security boundary', () => {
  it('uses a syntactically valid Render edge client IP when running on Render', () => {
    process.env.RENDER = 'true';
    expect(getClientIp({
      headers: {
        'cf-connecting-ip': '203.0.113.10',
        'x-forwarded-for': '198.51.100.99',
      },
      ip: '10.0.0.1',
      socket: { remoteAddress: '10.0.0.2' },
    })).toBe('203.0.113.10');
  });

  it('never uses raw X-Forwarded-For as the identity source', () => {
    delete process.env.RENDER;
    expect(getClientIp({
      headers: { 'x-forwarded-for': '198.51.100.99' },
      ip: '10.0.0.1',
      socket: { remoteAddress: '10.0.0.2' },
    })).toBe('10.0.0.1');
  });

  it('rejects a malformed Render edge header and falls back to the direct Express peer', () => {
    process.env.RENDER = 'true';
    expect(getClientIp({
      headers: { 'cf-connecting-ip': '203.0.113.10, 198.51.100.2' },
      ip: '10.0.0.1',
      socket: { remoteAddress: '10.0.0.2' },
    })).toBe('10.0.0.1');
  });

  it('returns unknown when no syntactically valid trusted IP source exists', () => {
    delete process.env.RENDER;
    expect(getClientIp({
      headers: { 'x-forwarded-for': '198.51.100.99' },
      ip: 'not-an-ip',
      socket: { remoteAddress: 'also-not-an-ip' },
    })).toBe('unknown');
  });
});
