import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('superseded browser onboarding login boundary', () => {
  it('keeps onboarding out of the productive browser login/session composition', () => {
    const session = fs.readFileSync(path.join(process.cwd(), 'src/app/auth/SessionComposition.tsx'), 'utf8');
    const login = fs.readFileSync(path.join(process.cwd(), 'src/features/public/ui/LoginPage.tsx'), 'utf8');

    expect(session).not.toContain('needsOnboarding');
    expect(session).not.toContain('readAuthGatePolicy');
    expect(session).not.toContain('RegistrationCompletionGate');
    expect(login).not.toContain('signUp');
  });
});
