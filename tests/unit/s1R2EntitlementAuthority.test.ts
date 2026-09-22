import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

function productionSourceFiles(directory: string): string[] {
  const absolute = path.join(root, directory);
  const result: string[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'tests') continue;
      result.push(...productionSourceFiles(relative));
    } else if (
      /\.(?:ts|tsx|mjs|js)$/.test(entry.name) &&
      !/\.(?:test|spec)\.(?:ts|tsx|mjs|js)$/.test(entry.name)
    ) {
      result.push(relative);
    }
  }
  return result;
}

describe('S1-R2-00 entitlement authority boundary', () => {
  it('keeps browser checkout free of simulated subscription activation', () => {
    const compatibilityCheckout = read('src/components/Checkout.tsx');
    const checkout = read('src/features/billing/ui/Checkout.tsx');

    expect(compatibilityCheckout).toContain("export { Checkout } from '../features/billing/ui/Checkout'");
    expect(checkout).toContain("authFetch('/api/stripe/create-checkout-session'");
    expect(checkout).toContain('successUrl: `${window.location.origin}/dashboard?checkout=pending`');
    expect(checkout).toContain('window.location.assign(data.checkoutUrl);');
    expect(checkout).not.toContain('setDemoMode(');
    expect(checkout).not.toContain('Development-Sandbox');
    expect(checkout).not.toContain('DEV-Upgrade simulieren');
    expect(checkout).not.toContain('onSuccess(planId)');
  });

  it('projects subscription tier through the verified backend session endpoint', () => {
    const session = read('src/app/auth/SessionComposition.tsx');
    const backendRoutes = read('server/routes/backendAuthRoutes.ts');

    expect(session).toContain("fetch('/api/auth/session'");
    expect(session).toContain('isSubscriptionTier(user.subscriptionTier)');
    expect(session).toContain('subscriptionTier: user.subscriptionTier');
    expect(session).not.toContain('supabase');
    expect(session).not.toContain('Authorization');

    expect(backendRoutes).toContain('const verified = await resolveVerifiedBackendAuth(req, res)');
    expect(backendRoutes).toContain('getSubscription(user.id)');
    expect(backendRoutes).toContain('subscriptionTier: tier');
    expect(backendRoutes).not.toContain('req.query.userId');
    expect(backendRoutes).not.toContain('req.query.email');
  });

  it('derives protected quota decisions from verified identity plus server subscription state', () => {
    const quota = read('server/quota.ts');
    expect(quota).toContain('const identity = await resolveVerifiedIdentity(req);');
    expect(quota).toContain('normalizeSubscriptionTier(await getSubscription(identity.userId))');
    expect(quota).not.toMatch(/req\.body[^\n]*(?:tier|subscriptionTier)/i);
    expect(quota).not.toMatch(/req\.query[^\n]*(?:tier|subscriptionTier)/i);
  });

  it('requires the authenticated server ledger before committing a compliance PDF export', () => {
    const exporter = read('src/components/ComplianceExporter.tsx');
    const modal = read('src/components/PdfExportModal.tsx');

    const clickStart = exporter.indexOf('const handleExportClick');
    const prepareStart = exporter.indexOf('const preparePDFReport');
    expect(clickStart).toBeGreaterThan(-1);
    expect(prepareStart).toBeGreaterThan(clickStart);
    const clickHandler = exporter.slice(clickStart, prepareStart);

    expect(clickHandler).toContain('setShowExportModal(true);');
    expect(clickHandler).not.toContain('generatePDFReport');
    expect(exporter).toContain('{showExportModal && (');
    expect(exporter).not.toContain('{showExportModal && userEmail && (');

    expect(modal).toContain("authFetch('/api/stripe/pdf-credits')");
    expect(modal).toContain("authFetch('/api/stripe/consume-pdf-credit'");
    expect(modal).toContain("authFetch('/api/stripe/create-checkout-session'");
    expect(modal).toContain('if (isOpen) {');
    expect(modal).not.toContain('if (isOpen && email)');
  });

  it('has no production invocation of the privileged direct subscription writer', () => {
    const db = read('server/db.ts');
    expect(db).toMatch(/export async function saveSubscription\s*\(/);

    const files = [...productionSourceFiles('server'), ...productionSourceFiles('src')];
    const invocationSites: string[] = [];
    for (const file of files) {
      const source = read(file);
      const lines = source.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        const isCommentLine =
          trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
        const mentionsInvocationSyntax = /\bsaveSubscription\s*\(/.test(line);
        const isFunctionDeclaration = /\bfunction\s+saveSubscription\s*\(/.test(line);
        if (!isCommentLine && mentionsInvocationSyntax && !isFunctionDeclaration) {
          invocationSites.push(`${file}:${index + 1}:${trimmed}`);
        }
      });
    }

    expect(invocationSites).toEqual([]);
  });

  it('binds checkout price selection to an allowlisted server plan and verified identity', () => {
    const stripe = read('server/stripe.ts');
    expect(stripe).toContain('const planUpper = String(planId).toUpperCase();');
    expect(stripe).toContain("if (planUpper === 'STARTER')");
    expect(stripe).toContain("else if (planUpper === 'PRO')");
    expect(stripe).toContain("else if (planUpper === 'ENTERPRISE')");
    expect(stripe).toContain("priceId = getStripeVar('STRIPE_PRICE_ID_PRO_MONTHLY')");
    expect(stripe).toContain('const identity = await resolveVerifiedIdentity(req);');
    expect(stripe).toContain('userId = identity.userId;');
    expect(stripe).not.toMatch(/(?:const|let|var)\s+userId\s*=\s*req\.body/);
    expect(stripe).not.toMatch(/priceId\s*=\s*req\.body/);
  });

  it('keeps the authenticated subscription read endpoint bound to the verified principal', () => {
    const stripe = read('server/stripe.ts');
    expect(stripe).toContain("stripeRouter.get('/user-subscription'");
    expect(stripe).toContain('const identity = await resolveVerifiedIdentity(req);');
    expect(stripe).toContain('const tier = await getSubscription(identity.userId);');
    expect(stripe).toContain('userId: identity.userId');
  });
});
