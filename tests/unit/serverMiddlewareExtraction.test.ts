import { describe, expect, it } from 'vitest';
import { classifyProbePath, createReconnaissanceBurstDetector, isKnownProbePath } from '../../server/middleware/probeProtection';
import { isLocalDevOrigin, isOriginAllowed } from '../../server/middleware/cors';

describe('server middleware extraction invariants', () => {
  it('keeps production CORS restricted to explicit CAPITAL-AI origins', () => {
    expect(isOriginAllowed('https://capital-ai.online', true)).toBe(true);
    expect(isOriginAllowed('https://www.capital-ai.online', true)).toBe(true);
    expect(isOriginAllowed('https://ai.studio', true)).toBe(false);
    expect(isOriginAllowed('http://localhost:5173', true)).toBe(false);
    expect(isOriginAllowed('https://capital-ai.online.attacker.example', true)).toBe(false);
  });
  it('no longer grants the retired Google AI Studio origin exception, even in development', () => { expect(isOriginAllowed('https://ai.studio', false)).toBe(false); });
  it('recognizes only exact localhost development origins', () => {
    expect(isLocalDevOrigin('http://localhost:5173')).toBe(true);
    expect(isLocalDevOrigin('https://127.0.0.1:3000')).toBe(true);
    expect(isLocalDevOrigin('https://localhost.attacker.example')).toBe(false);
  });
  it('keeps common and encoded scanner paths out of the SPA fallback', () => {
    for (const path of ['/wp-login','/wp-admin/index.php','/wp-config.php','/.env','/%2eenv','/.git/config','/%2f.git%2fconfig','/phpinfo.php','/Dockerfile','/docker-compose.yml','/backup.sql','/.aws','/laravel','/_profiler']) expect(isKnownProbePath(path)).toBe(true);
    expect(isKnownProbePath('/api/health')).toBe(false);
    expect(isKnownProbePath('/assets/app.js')).toBe(false);
  });
  it('groups probe paths into stable reconnaissance families', () => {
    expect(classifyProbePath('/wp-json/gravitysmtp/v1/tests/mock-data')).toBe('wordpress');
    expect(classifyProbePath('/%2eenv.production')).toBe('secret-file');
    expect(classifyProbePath('/%2f.git%2fconfig')).toBe('vcs');
    expect(classifyProbePath('/phpinfo.php')).toBe('php');
    expect(classifyProbePath('/database.sql')).toBe('database-artifact');
    expect(classifyProbePath('/Dockerfile')).toBe('container-artifact');
    expect(classifyProbePath('/app/config.toml')).toBe('configuration');
    expect(classifyProbePath('/.aws')).toBe('cloud-credential');
    expect(classifyProbePath('/laravel')).toBe('cms-framework');
  });
  it('detects multi-framework technology enumeration for one pseudonymized client', () => {
    const detector = createReconnaissanceBurstDetector(); const key = 'hash-1|203.0.113.0/24';
    expect(detector.observe(key, 'wordpress', 1000).technologyEnumerationDetected).toBe(false);
    expect(detector.observe(key, 'secret-file', 2000).technologyEnumerationDetected).toBe(false);
    const third = detector.observe(key, 'container-artifact', 3000);
    expect(third.technologyEnumerationDetected).toBe(true); expect(third.distinctFamiliesInEnumerationWindow).toBe(3); expect(third.shouldAlert).toBe(true);
  });
  it('detects bursts, rate-limits alerts, and never aggregates unidentified clients', () => {
    const detector = createReconnaissanceBurstDetector(); const key = 'hash-2|198.51.100.0/24';
    let detection = detector.observe(key, 'secret-file', 10000);
    for (let index = 1; index < 8; index += 1) detection = detector.observe(key, 'secret-file', 10000 + index * 500);
    expect(detection.burstDetected).toBe(true); expect(detection.requestsInBurstWindow).toBe(8); expect(detection.shouldAlert).toBe(true);
    expect(detector.observe(key, 'vcs', 15000).shouldAlert).toBe(false);
    const unidentified = detector.observe(null, 'wordpress', 20000);
    expect(unidentified.burstDetected).toBe(false); expect(unidentified.technologyEnumerationDetected).toBe(false); expect(unidentified.shouldAlert).toBe(false);
  });
});