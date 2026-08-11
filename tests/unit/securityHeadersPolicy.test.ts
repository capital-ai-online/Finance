import { describe, expect, it } from 'vitest';
import {
  buildContentSecurityPolicy,
  buildFrameAncestors,
  buildScriptSrc,
} from '../../server/middleware/securityHeaders';

describe('ADR-0009 security header policy extraction', () => {
  it('keeps production frame ancestors restricted to self', () => {
    expect(buildFrameAncestors(true)).toBe("'self'");
  });

  it('allows localhost framing only outside production', () => {
    const value = buildFrameAncestors(false);
    expect(value).toContain("'self'");
    expect(value).toContain('http://localhost:*');
    expect(value).not.toContain('ai.studio');
  });

  it('keeps unsafe-inline and unsafe-eval out of production script-src', () => {
    const production = buildScriptSrc(true);
    expect(production).not.toContain("'unsafe-inline'");
    expect(production).not.toContain("'unsafe-eval'");
    expect(production).toContain('https://*.stripe.com');
    expect(production).toContain('https://cdn.cookiehub.eu');
    expect(production).toContain('https://www.googletagmanager.com');
  });

  it('preserves the existing production CSP dependency allowlist', () => {
    const csp = buildContentSecurityPolicy(true);
    expect(csp).toContain("default-src 'self' https:");
    expect(csp).toContain("style-src 'self' https://fonts.googleapis.com https://cdn.cookiehub.eu");
    expect(csp).toContain("img-src 'self' data: https: referrer");
    expect(csp).toContain("font-src 'self' data: https://fonts.gstatic.com");
    expect(csp).toContain("frame-src 'self' https://*.stripe.com");
    expect(csp).toContain("frame-ancestors 'self'");
  });
});
