export const PASSWORD_MIN_LENGTH = 14;

const REQUIRED_SYMBOL = /[^A-Za-z0-9]/;
const PASSWORD_SCREENING_ENDPOINT = '/api/auth/password-security/check';
const COMPROMISE_CHECK_TIMEOUT_MS = 7_000;

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

/**
 * Calls the first-party backend screening boundary. The browser never talks to
 * HIBP directly; the backend performs the SHA-1 k-anonymity range lookup and
 * never persists or logs the supplied password.
 */
export async function assertPasswordNotPwned(password: string): Promise<void> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), COMPROMISE_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(PASSWORD_SCREENING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ password }),
      signal: controller.signal,
    });

    if (response.status === 204) return;

    let message = 'Die Prüfung auf kompromittierte Passwörter ist derzeit nicht verfügbar.';
    try {
      const payload = await response.json();
      if (typeof payload?.error === 'string' && payload.error.trim()) {
        message = payload.error;
      }
    } catch {
      // Keep the generic fail-closed message; never expose upstream response bodies.
    }

    throw new PasswordSecurityError(message);
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
