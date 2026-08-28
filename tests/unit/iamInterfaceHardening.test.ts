import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Request } from 'express';
import { extractBearerToken } from '../../src/platform/Security/authMiddleware';
import { isOriginAllowed } from '../../server/middleware/cors';

function req(authorization?: string): Pick<Request, 'headers'> {
  return { headers: authorization ? { authorization } : {} } as Pick<Request, 'headers'>;
}

describe('IAM and interface hardening', () => {
  it('accepts exactly one syntactically bounded Bearer credential', () => {
    expect(extractBearerToken(req('Bearer abc.def.ghi'))).toBe('abc.def.ghi');
    expect(extractBearerToken(req('bearer abc_def-123'))).toBe('abc_def-123');
  });

  it('rejects malformed, joined, whitespace-bearing and unbounded credentials before Supabase', () => {
    expect(extractBearerToken(req())).toBeNull();
    expect(extractBearerToken(req('Basic abc'))).toBeNull();
    expect(extractBearerToken(req('Bearer one, Bearer two'))).toBeNull();
    expect(extractBearerToken(req('Bearer one two'))).toBeNull();
    expect(extractBearerToken(req(`Bearer ${'x'.repeat(8193)}`))).toBeNull();
  });

  it('keeps production browser origins on an explicit allowlist', () => {
    expect(isOriginAllowed('https://capital-ai.online', true)).toBe(true);
    expect(isOriginAllowed('https://www.capital-ai.online', true)).toBe(true);
    expect(isOriginAllowed('https://evil.example', true)).toBe(false);
    expect(isOriginAllowed('http://localhost:5173', true)).toBe(false);
  });

  it('never persists a raw Bearer prefix as IAM token evidence', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/platform/Security/authMiddleware.ts'), 'utf8');
    expect(source).toContain('tok_sha256_');
    expect(source).toContain('hashOpaqueToken(ctx.tokenRef)');
    expect(source).not.toContain('ctx.tokenRef.slice(0, 10)');
  });

  it('rejects disallowed Origin requests at the server boundary and varies cache by Origin', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'server/middleware/cors.ts'), 'utf8');
    expect(source).toContain("res.vary('Origin')");
    expect(source).toContain("return res.status(403).json({ error: 'Origin nicht erlaubt.' })");
    expect(source).toContain('x-step-up-token');
  });
});
