export const PASSWORD_MIN_LENGTH = 14;

const REQUIRED_SYMBOL = /[^A-Za-z0-9]/;
const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range';
const HIBP_TIMEOUT_MS = 5000;

export class PasswordSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordSecurityError';
  }
}

export function validatePasswordStrength(password: string): void {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    throw new PasswordSecurityError(
      `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`,
    );
  }
  if (!/[a-z]/.test(password)) {
    throw new PasswordSecurityError('Das Passwort muss mindestens einen Kleinbuchstaben enthalten.');
  }
  if (!/[A-Z]/.test(password)) {
    throw new PasswordSecurityError('Das Passwort muss mindestens einen Großbuchstaben enthalten.');
  }
  if (!/[0-9]/.test(password)) {
    throw new PasswordSecurityError('Das Passwort muss mindestens eine Ziffer enthalten.');
  }
  if (!REQUIRED_SYMBOL.test(password)) {
    throw new PasswordSecurityError('Das Passwort muss mindestens ein Sonderzeichen enthalten.');
  }
}

async function sha1Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new PasswordSecurityError('Die sichere Passwortprüfung wird von diesem Browser nicht unterstützt.');
  }

  const digest = await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Privacy-preserving Pwned Passwords check.
 *
 * The plaintext password and the complete SHA-1 hash never leave the browser.
 * Only the first five hash characters are sent to HIBP (k-anonymity). Padding
 * reduces response-size correlation. The returned suffix list is compared
 * locally and discarded immediately.
 */
export async function assertPasswordNotPwned(password: string): Promise<void> {
  const sha1 = await sha1Hex(password);
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);

  try {
    const response = await fetch(`${HIBP_RANGE_URL}/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PasswordSecurityError(
        'Die Prüfung auf kompromittierte Passwörter ist derzeit nicht verfügbar.',
      );
    }

    const body = await response.text();
    for (const line of body.split(/\r?\n/)) {
      const [candidateSuffix, countValue] = line.trim().split(':');
      if (candidateSuffix?.toUpperCase() !== suffix) continue;

      const breachCount = Number.parseInt(countValue || '0', 10);
      if (Number.isFinite(breachCount) && breachCount > 0) {
        throw new PasswordSecurityError(
          'Dieses Passwort ist aus bekannten Datenlecks bekannt. Bitte verwenden Sie ein neues, einzigartiges Passwort.',
        );
      }
    }
  } catch (error) {
    if (error instanceof PasswordSecurityError) throw error;
    if ((error as Error)?.name === 'AbortError') {
      throw new PasswordSecurityError(
        'Die Prüfung auf kompromittierte Passwörter hat zu lange gedauert. Bitte versuchen Sie es erneut.',
      );
    }
    throw new PasswordSecurityError(
      'Die Prüfung auf kompromittierte Passwörter ist derzeit nicht verfügbar.',
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function assertStrongUncompromisedPassword(password: string): Promise<void> {
  validatePasswordStrength(password);
  await assertPasswordNotPwned(password);
}
