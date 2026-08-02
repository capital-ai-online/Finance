// ADR-0003.5 — TOTP (RFC 6238) ohne externe Abhängigkeit.
//
// Bewusst gegen eine zusätzliche npm-Dependency (z.B. otplib) entschieden: der Algorithmus
// ist klein, stabil und gut spezifiziert (RFC 4648 Base32 + RFC 2104 HMAC + RFC 6238 TOTP).
// Kompatibel mit allen gängigen Authenticator-Apps (Google Authenticator, Authy, 1Password,
// Microsoft Authenticator etc.), da diese nur den offenen Standard implementieren.

import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(bytes = 20): string {
  const buf = crypto.randomBytes(bytes);
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // 64-bit counter, big-endian; JS numbers safe up to 2^53, ample for TOTP counters.
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter % 2 ** 32, 4);

  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 1_000_000).padStart(6, '0');
}

/**
 * Verifiziert einen 6-stelligen TOTP-Code mit ±1 Zeitfenster (30s Schritt) Toleranz
 * gegen Client-Uhr-Drift, wie in RFC 6238 empfohlen.
 */
export function verifyTotp(base32Secret: string, code: string, windowSteps = 1): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const secret = base32Decode(base32Secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let errorWindow = -windowSteps; errorWindow <= windowSteps; errorWindow++) {
    const expected = hotp(secret, counter + errorWindow);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(code))) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(base32Secret: string, accountEmail: string, issuer = 'CAPITAL-AI'): string {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret: base32Secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
