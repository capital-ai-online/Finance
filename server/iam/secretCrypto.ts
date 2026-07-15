// ADR-0003.5 — Verschlüsselung für ruhende Secrets (TOTP-Seeds).
//
// AES-256-GCM mit Schlüssel ausschließlich aus einer Umgebungsvariable
// (TOTP_ENCRYPTION_KEY, 32 Byte / 64 Hex-Zeichen). Kein Secret liegt jemals
// im Klartext in der Datenbank.

import crypto from 'crypto';
import { getCleanEnv } from '../env';

function getKey(): Buffer {
  const raw = getCleanEnv('TOTP_ENCRYPTION_KEY');
  if (!raw) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY fehlt. Muss als 64-stelliger Hex-String (32 Byte) in den ' +
      'Umgebungsvariablen gesetzt sein, z.B. via: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32) {
    throw new Error('TOTP_ENCRYPTION_KEY muss genau 32 Byte (64 Hex-Zeichen) lang sein.');
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext, alles hex-kodiert
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Ungültiges verschlüsseltes Secret-Format.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Für Step-Up-Tokens und Break-Glass-Codes: Einweg-Hash (nie zu entschlüsseln, nur zu vergleichen). */
export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
