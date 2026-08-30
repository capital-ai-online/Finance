import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLoginStepUpMarkers,
  hasPassedLoginStepUpThisTab,
  markLoginStepUpPassed,
} from '../../src/lib/loginStepUp';

const loginStepUpSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/loginStepUp.ts'),
  'utf8',
);

describe('Login-Step-Up authority boundary', () => {
  it('enthaelt keine zweite fail-open MFA/AAL-Entscheidungslogik mehr', () => {
    expect(loginStepUpSource).not.toContain('loginStepUpRequirement');
    expect(loginStepUpSource).not.toContain("from '../supabaseClient'");
    expect(loginStepUpSource).not.toContain('supabase.auth.passkey.list');
    expect(loginStepUpSource).not.toContain(".select('totp_enabled')");
    expect(loginStepUpSource).toContain('authority lives exclusively in `LoginStepUpGate`');
  });
});

describe('Login-Step-Up sessionStorage marker', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() {
          return store.size;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('markiert eine bereits erfolgreich verifizierte Sitzung strikt pro Nutzer', () => {
    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(false);
    expect(hasPassedLoginStepUpThisTab('user-2')).toBe(false);

    markLoginStepUpPassed('user-1');

    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(true);
    expect(hasPassedLoginStepUpThisTab('user-2')).toBe(false);
  });

  it('entfernt alle tab-lokalen Marker beim Logout', () => {
    markLoginStepUpPassed('user-1');
    markLoginStepUpPassed('user-2');

    clearLoginStepUpMarkers();

    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(false);
    expect(hasPassedLoginStepUpThisTab('user-2')).toBe(false);
  });

  it('behandelt einen nicht lesbaren Marker-Speicher als unverifiziert', () => {
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
      },
    });

    expect(hasPassedLoginStepUpThisTab('user-1')).toBe(false);
  });
});
