// ADR-0026 — PKCE (RFC 7636) fuer den X-(Twitter)-OAuth-2.0-Handshake.
//
// X lehnt Authorization-Code-Requests ohne code_challenge grundsaetzlich ab, auch fuer
// confidential Clients mit Client-Secret. Kein externes Paket noetig - Node hat crypto
// nativ, S256 ist ein einzelner SHA-256-Hash mit Base64URL-Kodierung.

import crypto from 'crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function deriveCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}
