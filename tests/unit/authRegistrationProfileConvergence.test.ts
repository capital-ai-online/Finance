import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('registration and profile convergence', () => {
  it('collects separate legal evidence and keeps optional marketing distinct', () => {
    const login = read('src/features/public/ui/LoginPage.tsx');
    const backend = read('server/routes/backendAuthRoutes.ts');
    expect(login).toContain('registration-terms');
    expect(login).toContain('registration-privacy');
    expect(login).toContain('registration-marketing');
    expect(backend).toContain('privacyAcknowledged');
    expect(backend).toContain("registration_locale: 'de-DE'");
  });

  it('persists profile fields and private avatar objects through backend authorization', () => {
    const route = read('server/routes/accountSecurityRoutes.ts');
    const migration = read('supabase/migrations/20260924011545_auth_registration_profile_convergence.sql');
    expect(route).toContain("resolveVerifiedBackendAuth(req, res)");
    expect(route).toContain(".from('profile-avatars')");
    expect(route).toContain(".from('profile-avatars').download(profile.avatar_url)");
    expect(route).toContain('sniffImage');
    expect(migration).toContain("'profile-avatars'");
    expect(migration).toContain('false,');
    expect(migration).toContain('2097152');
  });

  it('migrates every legacy usage identity before removing the old identity table', () => {
    const migration = read('supabase/migrations/20260924011545_auth_registration_profile_convergence.sql');
    expect(migration).toContain('LEGACY_IDENTITY_MAPPING_INCOMPLETE');
    expect(migration).toContain('LEGACY_USAGE_BACKFILL_INCOMPLETE');
    expect(migration).toContain('foreign key (user_id) references auth.users(id)');
    expect(migration).toContain('drop table public.users');
  });

  it('provides backend-owned TOTP enrollment while keeping passkey behind the user-test gate', () => {
    const route = read('server/routes/accountSecurityRoutes.ts');
    const panel = read('src/components/SecuritySettingsPanel.tsx');
    const render = read('render.yaml');
    expect(route).toContain("'/security/totp/enroll'");
    expect(route).toContain("'/security/totp/verify'");
    expect(route).toContain("releaseGate: 'USER_TEST_REQUIRED'");
    expect(panel).toContain('Freigabe nach erfolgreichem Benutzertest');
    expect(render).toMatch(/VITE_NATIVE_PASSKEY_LOGIN_ENABLED\s+value: "false"/);
  });

  it('configures branded token-hash mail flows and removes the retired vendor from the tree contract', () => {
    const control = read('scripts/operations/supabaseAuthRegistrationControl.mjs');
    const confirmation = read('supabase/templates/confirmation.html');
    const recovery = read('supabase/templates/recovery.html');
    const retiredVendor = ['h', 'captcha'].join('');
    expect(control).toContain('security_captcha_enabled: false');
    expect(control).toContain('password_hibp_enabled: true');
    expect(confirmation).toContain('/api/auth/email/confirm?token_hash={{ .TokenHash }}&amp;type=email');
    expect(recovery).toContain('/api/auth/email/confirm?token_hash={{ .TokenHash }}&amp;type=recovery');
    expect(loginAndAuthSources().toLowerCase()).not.toContain(retiredVendor);
    const repositoryScan = spawnSync('git', ['grep', '-I', '-i', retiredVendor], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(repositoryScan.stdout).toBe('');
  });
});

function loginAndAuthSources(): string {
  return [
    read('src/features/public/ui/LoginPage.tsx'),
    read('server/routes/backendAuthRoutes.ts'),
    read('server/routes/accountSecurityRoutes.ts'),
    read('scripts/operations/supabaseAuthRegistrationControl.mjs'),
  ].join('\n');
}
