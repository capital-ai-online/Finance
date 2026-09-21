import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const readTypeScriptTree = (relativeDir: string): string => {
  const root = path.join(process.cwd(), relativeDir);
  const visit = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return visit(absolute);
      if (!/\.tsx?$/.test(entry.name)) return [];
      return [fs.readFileSync(absolute, 'utf8')];
    });
  return visit(root).join('\n');
};

const routes = read('src/app/routing/AppRoutes.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const landingPort = readTypeScriptTree('src/features/public/ui/frontend-port');
const landingNewsfeed = read('src/features/news/ui/LandingRealtimeAiNewsfeed.tsx');
const realtimeNewsfeed = read('src/features/news/ui/RealtimeAiNewsfeed.tsx');
const authenticatedTransport = read('src/features/news/authenticatedNewsFetch.ts');
const entitlement = read('server/middleware/realtimeAiNewsfeedEntitlement.ts');
const subscriptionEntitlements = read('src/config/subscriptionEntitlements.ts');

describe('LANDING-FIRST LF-01 news integration gate', () => {
  it('keeps productive news outside the Owner-selected FRONTEND design port', () => {
    expect(routes).not.toContain("import { LandingRealtimeAiNewsfeed } from '../../features/news/ui/LandingRealtimeAiNewsfeed';");
    expect(routes).not.toContain('newsfeed={<LandingRealtimeAiNewsfeed');
    expect(landing).toContain('ReferenceApp');
    expect(landingPort).not.toContain('LandingRealtimeAiNewsfeed');
    expect(landingPort).not.toMatch(/from\s+['"][^'"]*features\/news/);
    expect(landingPort).not.toContain('fetch(');
    expect(landingPort).not.toContain('/api/news');
    expect(landingPort).not.toContain('supabase');
  });

  it('derives paid-plan availability from the canonical entitlement contract instead of duplicating a plan matrix', () => {
    expect(landingNewsfeed).toContain("canUseFeature('registered', tier, 'realtime_ai_newsfeed')");
    expect(landingNewsfeed).toContain("['Free', 'Starter', 'Pro', 'Enterprise']");
    expect(subscriptionEntitlements).toContain("case 'realtime_ai_newsfeed':");
    expect(subscriptionEntitlements).toContain('return plan.realtimeAiNewsfeed;');
    expect(landingNewsfeed).not.toContain("NEWSFEED_ENABLED_TIERS = ['Pro', 'Enterprise']");
  });

  it('keeps the anonymous news projection read-only and separate from the landing design subtree', () => {
    expect(landingNewsfeed).not.toContain('fetchAuthenticatedNews');
    expect(landingNewsfeed).not.toContain('/api/news');
    expect(landingNewsfeed).not.toContain('supabase');
    expect(landingNewsfeed).toContain('keinen zweiten News-Datenpfad');
    expect(landingNewsfeed).toContain('keine Demo-Schlagzeilen');
    expect(landingNewsfeed).toContain('href="/login"');
  });

  it('preserves the existing authenticated news runtime and server-side access gate', () => {
    expect(realtimeNewsfeed).toContain('VerifiedNewsFeed');
    expect(authenticatedTransport).toContain('supabase.auth.getSession()');
    expect(authenticatedTransport).toContain("headers.set('Authorization'");
    expect(entitlement).toContain('resolveVerifiedIdentity');
    expect(entitlement).toContain("canUseFeature('registered', tier, 'realtime_ai_newsfeed')");
    expect(entitlement).toContain("reason: 'authentication-required'");
    expect(entitlement).toContain("reason: 'feature-not-entitled'");
  });
});
