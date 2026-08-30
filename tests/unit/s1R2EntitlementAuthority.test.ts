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
      result.push(...productionSourceFiles(relative));
    } else if (/\.(?:ts|tsx|mjs|js)$/.test(entry.name)) {
      result.push(relative);
    }
  }
  return result;
}

describe('S1-R2-00 entitlement authority boundary', () => {
  it('keeps browser checkout simulation development-only', () => {
    const checkout = read('src/components/Checkout.tsx');
    const activation = checkout.indexOf('setDemoMode(true)');
    expect(activation).toBeGreaterThan(-1);
    const precedingGuard = checkout.slice(Math.max(0, activation - 300), activation);
    expect(precedingGuard).toContain('(import.meta as any).env?.DEV === true');
    expect(checkout).toContain('Production checkout denied.');
    expect(checkout).toContain("setError('Stripe Checkout ist derzeit nicht verfügbar.");
  });

  it('projects subscription tier from the authenticated server endpoint rather than browser state', () => {
    const session = read('src/app/auth/SessionComposition.tsx');
    expect(session).toContain('/api/stripe/user-subscription?userId=');
    expect(session).toContain('Authorization: `Bearer ${session.access_token}`');
    expect(session).toContain("let tier: SubscriptionTier = 'Free';");
    expect(session).toContain('if (data?.subscriptionTier) tier = data.subscriptionTier;');
    expect(session).toContain("subscriptionTier: 'Free'");
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

  it('does not expose the privileged direct subscription writer through production source call sites', () => {
    const files = [...productionSourceFiles('server'), ...productionSourceFiles('src')];
    const callSites: string[] = [];
    for (const file of files) {
      const source = read(file);
      const lines = source.split('\n');
      lines.forEach((line, index) => {
        if (/\bsaveSubscription\s*\(/.test(line)) callSites.push(`${file}:${index + 1}:${line.trim()}`);
      });
    }

    expect(callSites).toHaveLength(1);
    expect(callSites[0]).toMatch(/^server\/db\.ts:\d+:export async function saveSubscription\(/);
    expect(read('server/stripe.ts')).not.toContain('saveSubscription');
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