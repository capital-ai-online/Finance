import crypto from 'node:crypto';
import { PasswordSecurityError, validatePasswordStrength } from '../../src/lib/passwordSecurity';

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range';
const HIBP_TIMEOUT_MS = 5_000;
const HIBP_USER_AGENT = 'CAPITAL-AI/0.6.0 password-security';

export class ServerPasswordSecurityError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 503) {
    super(message);
    this.name = 'ServerPasswordSecurityError';
    this.statusCode = statusCode;
  }
}

function sha1Hex(value: string): string {
  return crypto.createHash('sha1').update(value, 'utf8').digest('hex').toUpperCase();
}

/**
 * Checks HIBP Pwned Passwords through its k-anonymity range endpoint.
 *
 * Security invariants:
 * - plaintext passwords are never logged or persisted here;
 * - the complete SHA-1 digest never leaves this process;
 * - only the first five hexadecimal hash characters are sent to HIBP;
 * - padded responses reduce response-size correlation;
 * - external-check failure is fail-closed.
 */
export async function getPwnedPasswordCount(password: string): Promise<number> {
  try {
    validatePasswordStrength(password);
  } catch (error) {
    if (error instanceof PasswordSecurityError) throw error;
    throw new PasswordSecurityError('Das Passwort erfüllt die Sicherheitsanforderungen nicht.');
  }

  const fullHash = sha1Hex(password);
  const prefix = fullHash.slice(0, 5);
  const suffix = fullHash.slice(5);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

  try {
    const response = await fetch(`${HIBP_RANGE_URL}/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': HIBP_USER_AGENT,
        'Add-Padding': 'true',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ServerPasswordSecurityError(
        'Die Prüfung auf kompromittierte Passwörter ist derzeit nicht verfügbar.',
      );
    }

    const body = await response.text();
    for (const line of body.split(/\r?\n/)) {
      const [candidateSuffix, countValue] = line.trim().split(':');
      if (candidateSuffix?.toUpperCase() !== suffix) continue;

      const breachCount = Number.parseInt(countValue || '0', 10);
      return Number.isFinite(breachCount) && breachCount > 0 ? breachCount : 0;
    }

    return 0;
  } catch (error) {
    if (error instanceof ServerPasswordSecurityError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      throw new ServerPasswordSecurityError(
        'Die Prüfung auf kompromittierte Passwörter hat zu lange gedauert. Bitte versuchen Sie es erneut.',
      );
    }
    throw new ServerPasswordSecurityError(
      'Die Prüfung auf kompromittierte Passwörter ist derzeit nicht verfügbar.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function assertServerPasswordSafe(password: string): Promise<void> {
  const breachCount = await getPwnedPasswordCount(password);
  if (breachCount > 0) {
    throw new ServerPasswordSecurityError(
      'Dieses Passwort ist aus bekannten Datenlecks bekannt. Bitte verwenden Sie ein neues, einzigartiges Passwort.',
      422,
    );
  }
}
