import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeStripeReturnUrl } from '../../server/middleware/stripeReturnUrlGuard';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Stripe return URL security boundary', () => {
  it('accepts only canonical CAPITAL-AI HTTPS origins in production', () => {
    expect(normalizeStripeReturnUrl('https://capital-ai.online/profile?tab=billing', true))
      .toBe('https://capital-ai.online/profile?tab=billing');
    expect(normalizeStripeReturnUrl('https://www.capital-ai.online/dashboard', true))
      .toBe('https://www.capital-ai.online/dashboard');

    expect(() => normalizeStripeReturnUrl('https://evil.example/phish', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('https://capital-ai.online.evil.example/phish', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('http://capital-ai.online/profile', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('https://user@capital-ai.online/profile', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('javascript:alert(1)', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('data:text/html,hello', true)).toThrow();
  });

  it('permits localhost only outside production through the existing CORS policy', () => {
    expect(normalizeStripeReturnUrl('http://localhost:5173/profile', false))
      .toBe('http://localhost:5173/profile');
    expect(normalizeStripeReturnUrl('https://127.0.0.1:3000/profile', false))
      .toBe('https://127.0.0.1:3000/profile');

    expect(() => normalizeStripeReturnUrl('http://localhost:5173/profile', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('https://example.test/profile', false)).toThrow();
  });

  it('fails closed for missing or malformed return targets', () => {
    expect(() => normalizeStripeReturnUrl(undefined, true)).toThrow();
    expect(() => normalizeStripeReturnUrl('', true)).toThrow();
    expect(() => normalizeStripeReturnUrl('/relative-only', true)).toThrow();
  });

  it('mounts the guard before the existing Stripe router without creating a second origin list', () => {
    const routes = source('server/routes/registerApplicationRoutes.ts');
    const guard = source('server/middleware/stripeReturnUrlGuard.ts');

    expect(routes).toContain("import { stripeReturnUrlGuard } from '../middleware/stripeReturnUrlGuard'");
    expect(routes).toContain("app.use('/api/stripe', stripeReturnUrlGuard, stripeRouter)");
    expect(guard).toContain("import { isOriginAllowed } from './cors'");
    expect(guard).not.toContain('capital-ai.online');
  });
});
