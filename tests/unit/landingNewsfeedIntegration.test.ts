import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const landingNewsfeed = read('src/features/news/ui/LandingRealtimeAiNewsfeed.tsx');
const realtimeNewsfeed = read('src/features/news/ui/RealtimeAiNewsfeed.tsx');
const authenticatedTransport = read('src/features/news/authenticatedNewsFetch.ts');
const entitlement = read('server/middleware/realtimeAiNewsfeedEntitlement.ts');
const subscriptionEntitlements = read('src/config/subscriptionEntitlements.ts');

describe('LANDING-INTEGRATION-02 canonical AI Newsfeed binding', () => {
  it('composes the news capability at the app layer instead of creating a cross-feature dependency in LandingPage', () => {
    expect(routes).toContain("import { LandingRealtimeAiNewsfeed } from '../../features/news/ui/LandingRealtimeAiNewsfeed';");
    expect(routes).toContain('newsfeed={<LandingRealtimeAiNewsfeed onLoginNavigate={clearJustLoggedOut} />}');
    expect(landing).toContain('{newsfeed}');
    expect(landing).not.toContain('LandingRealtimeAiNewsfeed');
    expect(landing).not.toMatch(/from\s+['"][^'"]*features\/news/);
  });

  it('derives paid-plan availability from the canonical entitlement contract instead of duplicating a plan matrix', () => {
    expect(landingNewsfeed).toContain("canUseFeature('registered', tier, 'realtime_ai_newsfeed')");
    expect(landingNewsfeed).toContain("['Free', 'Starter', 'Pro', 'Enterprise']");
    expect(subscriptionEntitlements).toContain("case 'realtime_ai_newsfeed':");
    expect(subscriptionEntitlements).toContain('return plan.realtimeAiNewsfeed;');
    expect(landingNewsfeed).not.toContain("NEWSFEED_ENABLED_TIERS = ['Pro', 'Enterprise']");
  });

  it('keeps the anonymous landing projection read-only and never calls the protected news transport', () => {
    expect(landingNewsfeed).not.toContain('fetchAuthenticatedNews');
    expect(landingNewsfeed).not.toContain('/api/news');
    expect(landingNewsfeed).not.toContain('supabase');
    expect(landingNewsfeed).toContain('keinen zweiten News-Datenpfad');
    expect(landingNewsfeed).toContain('keine Demo-Schlagzeilen');
    expect(landingNewsfeed).toContain('href="/login"');
  });

  it('preserves the existing authenticated runtime and server-side access gate', () => {
    expect(realtimeNewsfeed).toContain('VerifiedNewsFeed');
    expect(authenticatedTransport).toContain('supabase.auth.getSession()');
    expect(authenticatedTransport).toContain("headers.set('Authorization'");
    expect(entitlement).toContain('resolveVerifiedIdentity');
    expect(entitlement).toContain("canUseFeature('registered', tier, 'realtime_ai_newsfeed')");
    expect(entitlement).toContain("reason: 'authentication-required'");
    expect(entitlement).toContain("reason: 'feature-not-entitled'");
  });

  it('does not leak later landing phases into the newsfeed slice', () => {
    expect(landingNewsfeed).not.toContain('Market Overview');
    expect(landingNewsfeed).not.toContain('Enterprise Scorer');
    expect(landingNewsfeed).not.toContain('Universe Sideboard');
    expect(landingNewsfeed).not.toContain('price');
  });
});
