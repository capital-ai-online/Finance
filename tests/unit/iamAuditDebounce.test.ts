// F-01 — Verdichtung wiederholter DENIED-Einträge in `iam_access_log`.

import { describe, expect, it } from 'vitest';
import {
  annotateReason,
  buildDebounceKey,
  createIamAuditDebounce,
} from '../../src/platform/Security/iamAuditDebounce';

const KEY = buildDebounceKey({
  role: 'unknown',
  zone: 'orchestrator-config',
  reason: 'no-bearer-token',
  ip: '203.0.113.7',
});

describe('F-01 IAM-Audit-Entprellung', () => {
  it('schreibt die erste Abweisung immer', () => {
    const debounce = createIamAuditDebounce(60_000);
    expect(debounce.decide(KEY, 0)).toEqual({ write: true, suppressedSincePrevious: 0 });
  });

  it('unterdrückt Wiederholungen innerhalb des Fensters', () => {
    const debounce = createIamAuditDebounce(60_000);
    debounce.decide(KEY, 0);
    // Der beobachtete Panel-Poll: alle 2 Sekunden derselbe Denial.
    for (let t = 2_000; t < 60_000; t += 2_000) {
      expect(debounce.decide(KEY, t).write).toBe(false);
    }
  });

  it('verliert keine Evidenz — der Zähler reist mit dem nächsten Datensatz mit', () => {
    const debounce = createIamAuditDebounce(60_000);
    debounce.decide(KEY, 0);
    for (let t = 2_000; t < 60_000; t += 2_000) debounce.decide(KEY, t);

    const afterWindow = debounce.decide(KEY, 60_000);
    expect(afterWindow.write).toBe(true);
    // 29 unterdrückte Versuche zwischen 2 s und 58 s.
    expect(afterWindow.suppressedSincePrevious).toBe(29);
  });

  it('trennt Merkmalskombinationen — andere IP oder Zone wird eigenständig geführt', () => {
    const debounce = createIamAuditDebounce(60_000);
    debounce.decide(KEY, 0);

    const otherIp = buildDebounceKey({
      role: 'unknown',
      zone: 'orchestrator-config',
      reason: 'no-bearer-token',
      ip: '198.51.100.4',
    });
    const otherZone = buildDebounceKey({
      role: 'unknown',
      zone: 'system-events:read',
      reason: 'no-bearer-token',
      ip: '203.0.113.7',
    });

    // Eine zweite Quelle oder eine Zonen-Enumeration darf nicht durch die erste maskiert werden.
    expect(debounce.decide(otherIp, 1_000).write).toBe(true);
    expect(debounce.decide(otherZone, 1_000).write).toBe(true);
  });

  it('begrenzt den Speicher, damit variierende IPs die Map nicht sprengen', () => {
    const debounce = createIamAuditDebounce(60_000, 100);
    for (let i = 0; i < 1_000; i++) {
      debounce.decide(buildDebounceKey({ role: 'unknown', zone: 'z', ip: `10.0.0.${i}` }), i);
    }
    expect(debounce.trackedKeys()).toBeLessThanOrEqual(100);
  });

  it('schreibt den Zähler in den Grund, statt ihn nur im Prozessspeicher zu halten', () => {
    expect(annotateReason('no-bearer-token', 0)).toBe('no-bearer-token');
    expect(annotateReason('no-bearer-token', 29)).toBe(
      'no-bearer-token (+29 identische Wiederholungen unterdrückt)',
    );
    expect(annotateReason(null, 3)).toBe('denied (+3 identische Wiederholungen unterdrückt)');
  });
});
