import { describe, expect, it } from 'vitest';
import { isKnownProbePath } from '../../server/middleware/probeProtection';
import { isLocalDevOrigin, isOriginAllowed } from '../../server/middleware/cors';

describe('server middleware extraction invariants', () => {
  it('keeps production CORS restricted to explicit CAPITAL-AI origins', () => {
    expect(isOriginAllowed('https://capital-ai.online', true)).toBe(true);
    expect(isOriginAllowed('https://www.capital-ai.online', true)).toBe(true);
    expect(isOriginAllowed('https://ai.studio', true)).toBe(false);
    expect(isOriginAllowed('http://localhost:5173', true)).toBe(false);
    expect(isOriginAllowed('https://capital-ai.online.attacker.example', true)).toBe(false);
  });

  it('no longer grants the retired Google AI Studio origin exception, even in development', () => {
    expect(isOriginAllowed('https://ai.studio', false)).toBe(false);
  });

  it('recognizes only exact localhost development origins', () => {
    expect(isLocalDevOrigin('http://localhost:5173')).toBe(true);
    expect(isLocalDevOrigin('https://127.0.0.1:3000')).toBe(true);
    expect(isLocalDevOrigin('https://localhost.attacker.example')).toBe(false);
  });

  it('keeps common scanner paths out of the SPA fallback', () => {
    for (const path of [
      '/wp-login',
      '/wp-admin/index.php',
      '/wp-config.php',
      '/.env',
      '/.git/config',
      '/phpinfo.php',
    ]) {
      expect(isKnownProbePath(path)).toBe(true);
    }

    expect(isKnownProbePath('/api/health')).toBe(false);
    expect(isKnownProbePath('/assets/app.js')).toBe(false);
  });
});
