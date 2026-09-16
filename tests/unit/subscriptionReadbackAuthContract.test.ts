import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('authenticated subscription readback contract', () => {
  it('centralizes the readback on authFetch without client-supplied identity query parameters', () => {
    const source = readRepoFile('src/lib/subscriptionReadback.ts');

    expect(source).toContain("authFetch('/api/stripe/user-subscription')");
    expect(source).toContain('isSubscriptionTier');
    expect(source).not.toContain('?email=');
    expect(source).not.toContain('?userId=');
  });

  it('keeps Dashboard and the canonical subscription surface on authenticated readback', () => {
    const dashboard = readRepoFile('src/app/dashboard/Dashboard.tsx');
    const compatibility = readRepoFile('src/components/Abonnements.tsx');
    const subscriptions = readRepoFile('src/features/billing/ui/Abonnements.tsx');

    expect(dashboard).toContain('readAuthenticatedSubscriptionTier');
    expect(subscriptions).toContain('readAuthenticatedSubscriptionTier');
    expect(compatibility).toContain("export { Abonnements } from '../features/billing/ui/Abonnements'");

    for (const source of [dashboard, subscriptions, compatibility]) {
      expect(source).not.toContain('user-subscription?email=');
      expect(source).not.toContain('user-subscription?userId=');
      expect(source).not.toContain('fetch(`/api/stripe/user-subscription');
    }
  });

  it('keeps cached Dashboard entitlement subordinate to the live authenticated UserSession', () => {
    const source = readRepoFile('src/app/dashboard/Dashboard.tsx');
    const cacheStart = source.indexOf('if (savedStr)');
    const cacheEnd = source.indexOf('const handleUpdateProfile', cacheStart);
    const cacheBlock = source.slice(cacheStart, cacheEnd);

    expect(cacheStart).toBeGreaterThan(-1);
    expect(cacheBlock).toContain('email: userSession.email');
    expect(cacheBlock).toContain(
      "subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier",
    );
  });

  it('does not issue authenticated subscription reads for guest sessions', () => {
    const dashboard = readRepoFile('src/app/dashboard/Dashboard.tsx');
    const subscriptions = readRepoFile('src/features/billing/ui/Abonnements.tsx');

    expect(dashboard).toContain("userSession.type === 'registered' && userSession.id");
    expect(subscriptions).toContain('if (!userId) {');
    expect(subscriptions).toContain('if (userId) void synchronizeTier();');
    expect(subscriptions).toContain('if (!checkoutReturn || !userId) return;');
  });
});
