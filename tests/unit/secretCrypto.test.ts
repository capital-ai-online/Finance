// Audit ARCH-AUDIT-0002 (D5, 30-Tage-Roadmap): Testabdeckung fuer den kritischen Auth-Pfad.
// src/platform/Security/secretCrypto.ts verschluesselt TOTP-Seeds ruhend (ADR-0003.5) - ein Fehler hier
// wuerde entweder Secrets im Klartext exponieren oder Step-Up/Break-Glass komplett brechen.

import { describe, it, expect, beforeAll } from 'vitest';
import { encryptSecret, decryptSecret, hashOpaqueToken, generateOpaqueToken } from '../../src/platform/Security/secretCrypto';

// getKey() liest TOTP_ENCRYPTION_KEY erst beim tatsaechlichen Aufruf von encryptSecret/
// decryptSecret (kein Modul-Top-Level-Zugriff), daher genuegt es, die Variable vor den
// Tests zu setzen - unabhaengig vom Importzeitpunkt.
beforeAll(() => {
  process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64); // 32 Byte Hex
});

describe('secretCrypto', () => {
  it('verschluesselt und entschluesselt einen Klartext verlustfrei (Roundtrip)', () => {
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it('erzeugt bei jeder Verschluesselung einen unterschiedlichen IV (kein deterministischer Ciphertext)', () => {
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const a = encryptSecret(plaintext);
    const b = encryptSecret(plaintext);
    expect(a).not.toBe(b);
  });

  it('liefert das Format iv:authTag:ciphertext (drei Hex-Segmente)', () => {
    const encrypted = encryptSecret('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12 Byte IV als Hex
    expect(parts[1]).toHaveLength(32); // 16 Byte GCM-Auth-Tag als Hex
  });

  it('schlaegt bei manipuliertem Ciphertext fehl (Authentizitaetspruefung greift)', () => {
    const encrypted = encryptSecret('geheim');
    const [iv, authTag, data] = encrypted.split(':');
    const tamperedData = Buffer.from(data, 'hex');
    tamperedData[0] ^= 0x01;
    const tampered = `${iv}:${authTag}:${tamperedData.toString('hex')}`;
    expect(tamperedData.toString('hex')).not.toBe(data);
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('schlaegt bei ungueltigem Format (fehlende Segmente) fehl', () => {
    expect(() => decryptSecret('nur-ein-segment')).toThrow('Ungültiges verschlüsseltes Secret-Format.');
  });

  it('hashOpaqueToken ist deterministisch und liefert SHA-256-Hex (64 Zeichen)', () => {
    const token = 'mein-token';
    const hash1 = hashOpaqueToken(token);
    const hash2 = hashOpaqueToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashOpaqueToken liefert fuer unterschiedliche Eingaben unterschiedliche Hashes', () => {
    expect(hashOpaqueToken('a')).not.toBe(hashOpaqueToken('b'));
  });

  it('generateOpaqueToken liefert eindeutige, ausreichend lange Tokens', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});
