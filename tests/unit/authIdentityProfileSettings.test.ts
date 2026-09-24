import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('account identity and settings convergence', () => {
  it('resolves username login on the backend without exposing privileged credentials', () => {
    const backend = read('server/routes/backendAuthRoutes.ts');
    const login = read('src/features/public/ui/LoginPage.tsx');

    expect(backend).toContain('resolvePasswordLoginEmail(identifier)');
    expect(backend).toContain(".eq('username', username)");
    expect(backend).toContain('auth.admin.getUserById(profile.id)');
    expect(login).toContain('E-Mail-Adresse oder Benutzername');
    expect(login).toContain('identifier: loginEmail');
    expect(login).not.toContain('service_role');
  });

  it('gates paid SMS flows until the provider is explicitly enabled', () => {
    const backend = read('server/routes/backendAuthRoutes.ts');
    const account = read('server/routes/accountSecurityRoutes.ts');

    expect(backend).toContain("process.env.CAPITAL_AI_PHONE_AUTH_ENABLED === 'true'");
    expect(backend).toContain("'/password/phone/start'");
    expect(backend).toContain("type: 'sms'");
    expect(account).toContain("'/security/phone/start'");
    expect(account).toContain("type: 'phone_change'");
    expect(account).toContain('PHONE_AUTH_PROVIDER_PENDING');
  });

  it('keeps a primary-login session pending until TOTP verification succeeds', () => {
    const session = read('server/auth/backendAuth.ts');
    const backend = read('server/routes/backendAuthRoutes.ts');
    const login = read('src/features/public/ui/LoginPage.tsx');

    expect(session).toContain('mfaPending');
    expect(session).toContain('resolvePendingBackendAuth');
    expect(backend).toContain("'/login/totp/verify'");
    expect(backend).toContain('{ mfaPending: true }');
    expect(login).toContain('2FA-Anmeldung bestätigen');
    expect(login).toContain("postAuthJson('/api/auth/login/totp/verify'");
  });

  it('ships the versioned profile schema and trigger without public function access', () => {
    const migration = read('supabase/migrations/20260924070530_profile_identity_settings.sql');

    expect(migration).toContain('profiles_username_lower_unique_idx');
    expect(migration).toContain('favorite_cryptocurrencies text[]');
    expect(migration).toContain('portfolio_assets text[]');
    expect(migration).toContain('sync_profile_identity_from_auth_user');
    expect(migration).toContain('revoke all on function public.sync_profile_identity_from_auth_user() from public');
  });

  it('renders branded profile and settings tabs with passkey and TOTP checkboxes', () => {
    const profile = read('src/components/ProfilePage.tsx');
    const settings = read('src/components/SecuritySettingsPanel.tsx');
    const routes = read('src/app/routing/AppRoutes.tsx');

    expect(profile).toContain('Profil');
    expect(profile).toContain('Einstellungen');
    expect(settings).toContain('Neues Passwort vergeben');
    expect(settings).toContain('Anmeldung &amp; 2FA');
    expect(settings).toContain('Anmeldung über Passkey aktivieren');
    expect(settings).toContain('2FA über Authenticator-App aktivieren');
    expect(routes).toContain('Sitzung erneut prüfen');
  });
});
