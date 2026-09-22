import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('superseded browser login step-up boundary', () => {
  it('keeps normal login free of browser MFA/AAL orchestration', () => {
    const session = fs.readFileSync(path.join(process.cwd(), 'src/app/auth/SessionComposition.tsx'), 'utf8');
    const login = fs.readFileSync(path.join(process.cwd(), 'src/features/public/ui/LoginPage.tsx'), 'utf8');
    const auth = fs.readFileSync(path.join(process.cwd(), 'src/platform/Security/authMiddleware.ts'), 'utf8');

    expect(session).not.toContain('LoginStepUpGate');
    expect(session).not.toContain('getAuthenticatorAssuranceLevel');
    expect(login).not.toContain('LoginStepUpGate');
    expect(auth).toContain('requireVerifiedAal2');
  });
});
