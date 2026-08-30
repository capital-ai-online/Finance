import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildStrictProductionCsp,
  resolveProductionCspMode,
} from '../../server/securityResponse';

describe('S1-R2-09 strict CSP promotion gate', () => {
  it('keeps production on report-only until ADR-0040 promotion evidence exists', () => {
    expect(resolveProductionCspMode(undefined)).toBe('report-only');
    expect(resolveProductionCspMode('')).toBe('report-only');
    expect(resolveProductionCspMode('unexpected-value')).toBe('report-only');
  });

  it('retains explicit strict target and baseline recovery modes', () => {
    expect(resolveProductionCspMode('report-only')).toBe('report-only');
    expect(resolveProductionCspMode('baseline')).toBe('baseline');
    expect(resolveProductionCspMode('strict')).toBe('strict');
  });

  it('keeps the strict target nonce-based and free of unsafe-eval', () => {
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
