import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('auth CAPTCHA removal boundary', () => {
  it('keeps the public login surface free of hCaptcha runtime dependencies', () => {
    const login = read('src/features/public/ui/LoginPage.tsx');

    expect(login).not.toContain('hcaptcha');
    expect(login).not.toContain('Hcaptcha');
    expect(login).not.toContain('captchaToken');
    expect(login).not.toContain('requestHcaptchaToken');
    expect(login).not.toContain('preloadHcaptchaSdk');
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/hcaptcha.ts'))).toBe(false);
  });

  it('keeps backend email auth free of CAPTCHA token requirements', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');

    expect(routes).not.toContain('captchaToken');
    expect(routes).not.toContain('requireCaptchaToken');
    expect(routes).not.toContain('isCaptchaProviderError');
    expect(routes).not.toContain('CAPTCHA_TOKEN_MAX_LENGTH');
    expect(routes).toContain("supabase.auth.signInWithPassword({ email, password })");
  });

  it('removes hCaptcha from build/runtime projection and CSP', () => {
    const dockerfile = read('Dockerfile');
    const render = read('render.yaml');
    const env = read('.env.example');
    const securityResponse = read('server/securityResponse.ts');

    for (const source of [dockerfile, render, env, securityResponse]) {
      expect(source.toLowerCase()).not.toContain('hcaptcha');
    }
    expect(dockerfile).not.toContain('VITE_HCAPTCHA_SITE_KEY');
    expect(render).not.toContain('VITE_HCAPTCHA_SITE_KEY');
  });
});
