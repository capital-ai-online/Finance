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
  it('keeps canonical Stripe checkout server-backed with no browser success simulation', () => {
    const compatibilityPath = path.resolve(process.cwd(), 'src/components/Checkout.tsx');
    const canonicalPath = path.resolve(process.cwd(), 'src/features/billing/ui/Checkout.tsx');
    const compatibility = fs.readFileSync(compatibilityPath, 'utf8');
    const source = fs.readFileSync(canonicalPath, 'utf8');

    expect(compatibility).toContain("export { Checkout } from '../features/billing/ui/Checkout'");
    expect(source).toContain("authFetch('/api/stripe/create-checkout-session'");
    expect(source).toContain('successUrl: `${window.location.origin}/dashboard?checkout=pending`');
    expect(source).toContain('window.location.assign(data.checkoutUrl);');
    expect(source).not.toContain('setDemoMode(');
    expect(source).not.toContain('Development-Sandbox aktiv');
    expect(source).not.toContain('DEV-Upgrade simulieren');
    expect(source).not.toContain('Demo-Upgrade simulieren');
    expect(source).not.toContain('Switching to sandbox/demo mode.');
    expect(source).not.toContain('onSuccess(planId)');
  });
});
