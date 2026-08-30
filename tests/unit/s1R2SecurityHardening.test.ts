import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildStrictProductionCsp,
  resolveProductionCspMode,
} from '../../server/securityResponse';

describe('S1-R2-09 strict CSP promotion', () => {
  it('uses strict CSP as the production default', () => {
    expect(resolveProductionCspMode(undefined)).toBe('strict');
    expect(resolveProductionCspMode('')).toBe('strict');
    expect(resolveProductionCspMode('unexpected-value')).toBe('strict');
  });

  it('retains explicit report-only and baseline rollback modes', () => {
    expect(resolveProductionCspMode('report-only')).toBe('report-only');
    expect(resolveProductionCspMode('baseline')).toBe('baseline');
    expect(resolveProductionCspMode('strict')).toBe('strict');
  });

  it('enforces nonce + strict-dynamic without unsafe-eval', () => {
    const csp = buildStrictProductionCsp('r2-test-nonce');
    expect(csp).toContain("script-src 'nonce-r2-test-nonce'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });
});

describe('S1-R2-10 production billing sandbox isolation', () => {
  it('permits simulated Stripe success only behind the Vite DEV boundary', () => {
    const checkoutPath = path.resolve(process.cwd(), 'src/components/Checkout.tsx');
    const source = fs.readFileSync(checkoutPath, 'utf8');

    expect(source).toContain("if ((import.meta as any).env?.DEV === true)");
    expect(source).toContain('Production checkout denied.');
    expect(source).toContain('Stripe Checkout ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.');
    expect(source).toContain('Development-Sandbox aktiv');
    expect(source).toContain('DEV-Upgrade simulieren');
    expect(source.match(/setDemoMode\(true\)/g)).toHaveLength(1);
    expect(source).not.toContain('Switching to sandbox/demo mode.');
    expect(source).not.toContain('Demo-Upgrade simulieren');
  });
});
