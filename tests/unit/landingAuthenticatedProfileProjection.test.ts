import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => fs.readFileSync(path, 'utf8');

describe('LF-02 authenticated landing profile projection', () => {
  it('keeps root public while projecting an established registered session', () => {
    const routes = read('src/app/routing/AppRoutes.tsx');
    expect(routes).toContain("if (userSession?.type === 'registered')");
    expect(routes).toContain('authenticatedProfile={{');
    expect(routes).toContain('subscriptionTier: userSession.subscriptionTier');
    expect(routes).toContain('<LandingPage onLoginNavigate={clearJustLoggedOut} />');
  });

  it('converges authenticated /login back to the canonical root', () => {
    const routes = read('src/app/routing/AppRoutes.tsx');
    const loginRoute = routes.slice(routes.indexOf("if (currentPath === '/login')"));
    expect(loginRoute).toContain("if (userSession?.type === 'registered')");
    expect(loginRoute).toContain('<RouteRedirect to="/" label="Zur Landingpage" />');
  });

  it('projects session state without a second Supabase or Stripe authority', () => {
    const landing = read('src/features/public/ui/LandingPage.tsx');
    const context = read('src/features/public/ui/LandingSessionContext.tsx');
    const header = read('src/features/public/ui/frontend-port/components/Header.tsx');
    const badge = read('src/features/public/ui/SubscriptionStatusBadge.tsx');

    expect(landing).toContain('<LandingSessionProvider profile={authenticatedProfile}>');
    expect(header).toContain('useLandingSessionProfile()');
    expect(header).toContain('data-authenticated-sideboard-profile="true"');
    expect(header).toContain('<SubscriptionStatusBadge tier={authenticatedProfile.subscriptionTier} />');
    expect(context).not.toContain('supabase');
    expect(header).not.toContain("authFetch('/api/stripe/user-subscription')");
    expect(badge).not.toContain('supabase');
  });

  it('binds the uploaded tier artwork and preserves a Free fallback', () => {
    const badge = read('src/features/public/ui/SubscriptionStatusBadge.tsx');
    expect(badge).toContain('/brand/subscriptions/starter.webp');
    expect(badge).toContain('/brand/subscriptions/pro.webp');
    expect(badge).toContain('/brand/subscriptions/enterprise.webp');
    expect(badge).toContain('/brand/subscriptions/founder.webp');
    expect(badge).toContain('FREE · ABONNEMENT');
  });
});
