// Audit ARCH-AUDIT-0002 (D5): Testabdeckung fuer den kritischen Auth-Pfad.
// src/platform/Security/totp.ts implementiert RFC 6238 (TOTP) ohne externe Abhaengigkeit - ein Fehler
// hier wuerde entweder legitime Codes ablehnen (Owner ausgesperrt) oder falsche akzeptieren.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateBase32Secret, verifyTotp, buildOtpAuthUri } from '../../src/platform/Security/totp';

describe('totp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateBase32Secret liefert einen gueltigen Base32-String plausibler Laenge', () => {
    const secret = generateBase32Secret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(32); // 20 Byte -> mind. 32 Base32-Zeichen
  });

  it('generateBase32Secret liefert bei jedem Aufruf ein anderes Secret', () => {
    expect(generateBase32Secret()).not.toBe(generateBase32Secret());
  });

  // RFC 6238 Anhang B, Testvektor fuer SHA1: Secret "12345678901234567890" (ASCII), T=59s
  // -> erwarteter Code "94287082" (8-stellig im RFC). Diese Implementierung liefert
  // ausschliesslich 6-stellige Codes (siehe hotp(): `% 1_000_000`), daher wird hier gegen die
  // auf 6 Stellen gekuerzte Fassung desselben Testvektors geprueft (letzte 6 Ziffern: "287082"),
  // um die HMAC-SHA1/HOTP-Kernberechnung unabhaengig zu verifizieren.
  it('erzeugt fuer den RFC-6238-Referenzzeitpunkt T=59s den erwarteten 6-stelligen Code', () => {
    const secretAscii = '12345678901234567890';
    const base32Secret = asciiToBase32(secretAscii);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(59 * 1000)); // RFC-Testzeitpunkt
    expect(verifyTotp(base32Secret, '287082')).toBe(true);
  });

  it('akzeptiert einen gueltigen Code aus dem vorherigen 30s-Zeitfenster (Clock-Drift-Toleranz)', () => {
    const secretAscii = '12345678901234567890';
    const base32Secret = asciiToBase32(secretAscii);
    // T=59s liegt im Fenster [30,60). Server-Uhr 25s spaeter (T=84s) liegt im naechsten
    // Fenster [60,90) - mit windowSteps=1 muss der Code aus dem Vorfenster noch akzeptiert werden.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(84 * 1000));
    expect(verifyTotp(base32Secret, '287082')).toBe(true);
  });

  it('lehnt einen Code ausserhalb der Toleranz ab', () => {
    const secretAscii = '12345678901234567890';
    const base32Secret = asciiToBase32(secretAscii);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(59 * 1000));
    expect(verifyTotp(base32Secret, '287082', 0)).toBe(true);
    vi.setSystemTime(new Date((59 + 120) * 1000)); // 4 Zeitfenster spaeter, ausserhalb ±1
    expect(verifyTotp(base32Secret, '287082')).toBe(false);
  });

  it('lehnt Codes mit falschem Format ab (nicht 6-stellig oder nicht-numerisch)', () => {
    const secret = generateBase32Secret();
    expect(verifyTotp(secret, '12345')).toBe(false);
    expect(verifyTotp(secret, '1234567')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '')).toBe(false);
  });

  it('buildOtpAuthUri erzeugt eine wohlgeformte otpauth-URI mit Issuer und Konto', () => {
    const uri = buildOtpAuthUri('JBSWY3DPEHPK3PXP', 'owner@capital-ai.online');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=CAPITAL-AI');
    expect(decodeURIComponent(uri)).toContain('CAPITAL-AI:owner@capital-ai.online');
  });
});

function asciiToBase32(ascii: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = Buffer.from(ascii, 'ascii');
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}
