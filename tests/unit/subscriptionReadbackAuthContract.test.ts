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

  it('keeps Dashboard readback for existing account state while pricing presentation is archived', () => {
    const dashboard = readRepoFile('src/app/dashboard/Dashboard.tsx');
    const compatibility = readRepoFile('src/components/Abonnements.tsx');
    const subscriptions = readRepoFile('src/features/billing/ui/Abonnements.tsx');

    expect(dashboard).toContain('readAuthenticatedSubscriptionTier');
    expect(subscriptions).not.toContain('readAuthenticatedSubscriptionTier');
    expect(subscriptions).toContain('Pricing-Modell archiviert');
    expect(compatibility).toContain("export { Abonnements } from '../features/billing/ui/Abonnements'");

    for (const source of [dashboard, subscriptions, compatibility]) {
      expect(source).not.toContain('user-subscription?email=');
      expect(source).not.toContain('user-subscription?userId=');
      expect(source).not.toContain('fetch(\`/api/stripe/user-subscription');
    }
  });

  it('keeps Dashboard entitlement bound to the live authenticated UserSession without a legacy profile cache', () => {
    const source = readRepoFile('src/app/dashboard/Dashboard.tsx');

    expect(source).not.toContain('if (savedStr)');
    expect(source).not.toContain('capital_ai_user_profile');
    expect(source).toContain('email: userSession.email');
    expect(source).toContain(
      "subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier",
    );
    expect(source).toContain('React.useEffect(() => {');
    expect(source).toContain('setProfile({');
    expect(source).toContain('}, [userSession]);');
  });

  it('does not issue authenticated subscription reads for guest sessions', () => {
    const dashboard = readRepoFile('src/app/dashboard/Dashboard.tsx');
    expect(dashboard).toContain("userSession.type === 'registered' && userSession.id");
  });

  it('does not trust historical checkout return parameters as tier authority', () => {
    const dashboard = readRepoFile('src/app/dashboard/Dashboard.tsx');
    expect(dashboard).toContain('if (payment || plan)');
    expect(dashboard).not.toContain("subscriptionTier: plan as UserUI.UserProfile['subscriptionTier']");
  });
});
