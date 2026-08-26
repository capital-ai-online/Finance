// F-02 — Korrelationsmerkmale der HTTP-Telemetrie.
//
// Kernanforderung: Scanner-Verkehr auf der HTTP-Ebene muss mit Abweisungen auf der Auth-Ebene
// verknüpfbar sein, ohne rohe IPs in die Render-App-Logs zu schreiben.

import { describe, expect, it } from 'vitest';
import {
  buildTelemetryClientContext,
  clientNetworkPrefix,
  hashClientIp,
  truncateUserAgent,
  utcDayKey,
} from '../../server/telemetryClientContext';

const SALT = 'test-salt';

describe('F-02 Telemetrie-Client-Kontext', () => {
  it('erzeugt für dieselbe IP am selben Tag denselben Hash', () => {
    const a = hashClientIp('203.0.113.7', '2026-08-26', SALT);
    const b = hashClientIp('203.0.113.7', '2026-08-26', SALT);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });

  it('verkettet nicht über Tagesgrenzen hinweg', () => {
    expect(hashClientIp('203.0.113.7', '2026-08-26', SALT))
      .not.toBe(hashClientIp('203.0.113.7', '2026-08-27', SALT));
  });

  it('trennt verschiedene IPs', () => {
    expect(hashClientIp('203.0.113.7', '2026-08-26', SALT))
      .not.toBe(hashClientIp('203.0.113.8', '2026-08-26', SALT));
  });

  it('enthält die rohe IP nicht', () => {
    const hash = hashClientIp('203.0.113.7', '2026-08-26', SALT);
    expect(hash).not.toContain('203');
    expect(hash).not.toContain('113');
  });

  it('gibt für fehlende oder ungültige Quellen null zurück', () => {
    // getClientIp() liefert 'unknown', wenn keine vertrauenswürdige IP vorliegt - fail-closed.
    for (const value of [null, undefined, '', 'unknown', 'not-an-ip', '999.999.999.999']) {
      expect(hashClientIp(value as string, '2026-08-26', SALT)).toBeNull();
    }
  });

  it('kürzt IPv4 auf /24 und IPv6 auf /48', () => {
    expect(clientNetworkPrefix('203.0.113.7')).toBe('203.0.113.0/24');
    expect(clientNetworkPrefix('2001:db8:abcd:1234::1')).toBe('2001:db8:abcd::/48');
    expect(clientNetworkPrefix('not-an-ip')).toBeNull();
    expect(clientNetworkPrefix(null)).toBeNull();
  });

  it('gruppiert Hosts desselben Netzes, ohne den Host zu identifizieren', () => {
    expect(clientNetworkPrefix('47.64.48.251')).toBe(clientNetworkPrefix('47.64.48.9'));
    expect(clientNetworkPrefix('47.64.48.251')).not.toBe(clientNetworkPrefix('47.64.51.52'));
  });

  it('kürzt den User-Agent und normalisiert Leerwerte', () => {
    expect(truncateUserAgent('Mozilla/5.0')).toBe('Mozilla/5.0');
    expect(truncateUserAgent('   ')).toBeNull();
    expect(truncateUserAgent(undefined)).toBeNull();
    expect(truncateUserAgent('x'.repeat(400))).toHaveLength(120);
  });

  it('liefert einen UTC-Tagesschlüssel', () => {
    expect(utcDayKey(new Date('2026-08-26T23:59:59Z'))).toBe('2026-08-26');
    expect(utcDayKey(new Date('2026-08-27T00:00:01Z'))).toBe('2026-08-27');
  });

  it('baut den vollständigen Kontext ohne rohe IP', () => {
    const ctx = buildTelemetryClientContext('203.0.113.7', 'curl/8.0');
    expect(ctx.clientIpHash).toMatch(/^[0-9a-f]{16}$/);
    expect(ctx.clientNetwork).toBe('203.0.113.0/24');
    expect(ctx.userAgent).toBe('curl/8.0');
    expect(JSON.stringify(ctx)).not.toContain('203.0.113.7');
  });
});
