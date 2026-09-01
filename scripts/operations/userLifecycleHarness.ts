import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PRICES_EUR } from '../../src/features/billing/billingContract';
import { getAnnualPricePreviewEur } from '../../src/config/subscriptionEntitlements';

export type LifecycleResult = 'PASS' | 'FAIL' | 'NOT_AVAILABLE';
export type ProviderMode = 'repository_contract' | 'supabase_local_mailpit' | 'stripe_sandbox_test_clock';

export const REQUIRED_LIFECYCLE_SCENARIOS = [
  'registration',
  'email_or_auth_verification',
  'login',
  'session_creation',
  'multiple_sessions_or_devices',
  'local_logout',
  'global_logout',
  'subscription_creation',
  'checkout_to_webhook_transition',
  'subscription_projection',
  'server_side_entitlement_readback',
  'renewal',
  'payment_failure',
  'cancel_at_period_end',
  'subscription_expiry',
  'reactivation_if_supported_by_existing_contract',
  'mail_outbox_processing',
  'provider_retry',
  'duplicate_provider_event',
] as const;

export type LifecycleScenario = (typeof REQUIRED_LIFECYCLE_SCENARIOS)[number];

export interface ScenarioEvidence {
  scenario: LifecycleScenario | string;
  provider: ProviderMode;
  result: LifecycleResult;
  detail: string;
  knownLimitations: string[];
}

export interface LifecycleEvidenceReport {
  repository_sha: string;
  branch: string;
  work_claim: string;
  environment: string;
  provider_mode: ProviderMode | 'combined';
  start_time: string;
  end_time: string;
  exact_test_command: string;
  result: LifecycleResult;
  known_limitations: string[];
  scenarios: ScenarioEvidence[];
}

const WORK_CLAIM = 'CAPITAL-AI-OPS-USER-LIFECYCLE-SIMULATION-2026-09-01';
const EXPECTED_PRO_YEARLY_EUR = 248;
const root = process.cwd();

function gitValue(args: string[], fallback: string): string {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function evidence(
  scenario: LifecycleScenario | string,
  provider: ProviderMode,
  result: LifecycleResult,
  detail: string,
  knownLimitations: string[] = [],
): ScenarioEvidence {
  return { scenario, provider, result, detail: redactEvidence(detail), knownLimitations: knownLimitations.map(redactEvidence) };
}

export function redactEvidence(value: string): string {
  return value
    .replace(/\b(sk_(?:live|test)_[A-Za-z0-9_-]+)\b/g, '[REDACTED_STRIPE_KEY]')
    .replace(/\b(whsec_[A-Za-z0-9_-]+)\b/g, '[REDACTED_WEBHOOK_SECRET]')
    .replace(/\b(sb_(?:secret|publishable)_[A-Za-z0-9_-]+)\b/g, '[REDACTED_SUPABASE_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]');
}

export function aggregateResult(items: ScenarioEvidence[]): LifecycleResult {
  if (items.some((item) => item.result === 'FAIL')) return 'FAIL';
  if (items.some((item) => item.result === 'NOT_AVAILABLE')) return 'NOT_AVAILABLE';
  return 'PASS';
}

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function listFilesRecursive(relativeDir: string): string[] {
  const absolute = path.join(root, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  const result: string[] = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const rel = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) result.push(...listFilesRecursive(rel));
    else result.push(rel);
  }
  return result;
}

export function runRepositoryContractChecks(): ScenarioEvidence[] {
  const results: ScenarioEvidence[] = [];
  const app = read('server.application.ts');
  const stripe = read('server/stripe.ts');
  const inbox = read('server/stripeEventInbox.ts');
  const mailer = read('server/mailer.ts');
  const outbox = read('server/outbox.ts');
  const readback = read('src/lib/subscriptionReadback.ts');

  const webhookRoute = app.indexOf("app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler)");
  const jsonParser = app.indexOf('app.use(express.json())');
  const signature = app.includes('stripe.webhooks.constructEvent(req.body, sig, webhookSecret)');
  results.push(evidence(
    'checkout_to_webhook_transition',
    'repository_contract',
    webhookRoute >= 0 && jsonParser > webhookRoute && signature ? 'PASS' : 'FAIL',
    'Stripe webhook uses the unmodified raw request body before the global JSON parser and verifies the provider signature.',
  ));

  const inboxContract =
    inbox.includes("claimStatus: 'duplicate_processing'") &&
    inbox.includes("p_payload_hash: payloadHash") &&
    stripe.includes("claim.claimStatus === 'integrity_conflict'") &&
    stripe.includes('if (!claim.claimed)');
  results.push(evidence(
    'duplicate_provider_event',
    'repository_contract',
    inboxContract ? 'PASS' : 'FAIL',
    'Existing Stripe inbox preserves event-id deduplication and payload-integrity fail-closed behavior.',
  ));
  results.push(evidence(
    'provider_retry',
    'repository_contract',
    inbox.includes("claimStatus: 'claimed_local_dev'") && stripe.includes('markStripeEventFailed') ? 'PASS' : 'FAIL',
    'Failed provider side effects remain retryable through the existing inbox contract; production never relies on process-local deduplication.',
  ));

  const readbackContract =
    readback.includes("authFetch('/api/stripe/user-subscription')") &&
    !readback.includes('?email=') &&
    !readback.includes('?userId=') &&
    stripe.includes('const identity = await resolveVerifiedIdentity(req);') &&
    stripe.includes('const tier = await getSubscription(identity.userId);');
  results.push(evidence(
    'server_side_entitlement_readback',
    'repository_contract',
    readbackContract ? 'PASS' : 'FAIL',
    'Entitlement readback resolves the authenticated server-side principal and does not accept client-supplied identity query parameters.',
  ));

  const outboxContract =
    mailer.includes("jobType: 'subscription_confirmation_mail'") &&
    mailer.includes('idempotencyKey: `subscription_confirmation_mail:${sessionId}:${kind}`') &&
    outbox.includes("status = 'processing'") === false &&
    outbox.includes("enqueue_outbox_job") &&
    outbox.includes("claim_outbox_job");
  results.push(evidence(
    'mail_outbox_processing',
    'repository_contract',
    outboxContract ? 'PASS' : 'FAIL',
    'Subscription mail retries reuse the existing durable outbox and a session/recipient idempotency key.',
  ));

  const canonicalYearly = SUBSCRIPTION_PRICES_EUR.Pro.yearly;
  results.push(evidence(
    'subscription_creation',
    'repository_contract',
    canonicalYearly === EXPECTED_PRO_YEARLY_EUR ? 'PASS' : 'FAIL',
    `Canonical billing contract resolves annual Pro to ${canonicalYearly.toFixed(2)} EUR; Governance expectation is ${EXPECTED_PRO_YEARLY_EUR.toFixed(2)} EUR.`,
  ));

  const previewYearly = getAnnualPricePreviewEur('Pro');
  results.push(evidence(
    'subscription_projection',
    'repository_contract',
    previewYearly === canonicalYearly ? 'PASS' : 'FAIL',
    previewYearly === canonicalYearly
      ? 'Shared entitlement preview agrees with the canonical billing contract.'
      : `Open finding: shared entitlement preview resolves annual Pro to ${String(previewYearly)} EUR while the canonical billing contract resolves ${canonicalYearly.toFixed(2)} EUR. This harness does not create a second price authority.`,
    previewYearly === canonicalYearly ? [] : ['Pricing projection drift requires remediation by the owning shared/frontend contract before it can be represented as authoritative.'],
  ));

  const migrationSources = listFilesRecursive('supabase/migrations')
    .filter((file) => file.endsWith('.sql'))
    .map((file) => read(file));
  const projectionFunctionVersioned = migrationSources.some((source) =>
    source.includes('CREATE OR REPLACE FUNCTION public.sync_stripe_subscription_to_public') ||
    source.includes('create or replace function public.sync_stripe_subscription_to_public'),
  );
  results.push(evidence(
    'subscription_projection_source_control',
    'repository_contract',
    projectionFunctionVersioned ? 'PASS' : 'FAIL',
    projectionFunctionVersioned
      ? 'The Stripe-to-public subscription projection function is represented in repository migrations.'
      : 'Open finding: the hosted sync_stripe_subscription_to_public() function is observable in Supabase but no canonical CREATE OR REPLACE definition is present in repository migrations, so a clean local replay cannot prove the current hosted projection.',
    projectionFunctionVersioned ? [] : ['Import/correlate the current remote schema baseline before treating Supabase Local subscription projection as reproducible.'],
  ));

  return results;
}

function unavailableSupabaseScenarios(reason: string): ScenarioEvidence[] {
  const scenarios: LifecycleScenario[] = [
    'registration',
    'email_or_auth_verification',
    'login',
    'session_creation',
    'multiple_sessions_or_devices',
    'local_logout',
    'global_logout',
    'subscription_projection',
    'server_side_entitlement_readback',
  ];
  return scenarios.map((scenario) => evidence(scenario, 'supabase_local_mailpit', 'NOT_AVAILABLE', reason, [
    'Provider verification is intentionally not inferred from mocks or hosted-production state.',
  ]));
}

async function refreshTokenRequest(url: string, key: string, refreshToken: string): Promise<Response> {
  return fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

async function mailpitContains(mailpitUrl: string, recipient: string): Promise<boolean> {
  const base = mailpitUrl.replace(/\/$/, '');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    for (const endpoint of ['/api/v1/messages', `/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`]) {
      try {
        const response = await fetch(`${base}${endpoint}`);
        if (response.ok) {
          const body = await response.text();
          if (body.toLowerCase().includes(recipient.toLowerCase())) return true;
        }
      } catch {
        // Retry below; no provider payload is copied into evidence.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function createSupabase(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function createEphemeralTestCredential(): string {
  return `Ops-${crypto.randomBytes(18).toString('base64url')}!9a`;
}

export async function runSupabaseLocalScenarios(): Promise<ScenarioEvidence[]> {
  const url = process.env.SUPABASE_LOCAL_URL || 'http://127.0.0.1:54321';
  const mailpit = process.env.MAILPIT_URL || 'http://127.0.0.1:54324';
  const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || '';
  if (!anonKey || !serviceRoleKey) {
    return unavailableSupabaseScenarios('SUPABASE_LOCAL_ANON_KEY and SUPABASE_LOCAL_SERVICE_ROLE_KEY are required for an actual local provider run.');
  }

  try {
    const [authHealth, mailHealth] = await Promise.all([
      fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, { headers: { apikey: anonKey } }),
      fetch(mailpit),
    ]);
    if (!authHealth.ok || !mailHealth.ok) {
      return unavailableSupabaseScenarios('Supabase Local Auth and Mailpit must both be reachable before provider verification can run.');
    }
  } catch {
    return unavailableSupabaseScenarios('Supabase Local or Mailpit is not reachable on the configured loopback endpoints.');
  }

  const results: ScenarioEvidence[] = [];
  const suffix = crypto.randomUUID();
  const registrationEmail = `ops-lifecycle-registration-${suffix}@example.test`;
  const sessionEmail = `ops-lifecycle-session-${suffix}@example.test`;
  const testCredential = createEphemeralTestCredential();
  const anon = createSupabase(url, anonKey);
  const admin = createSupabase(url, serviceRoleKey);

  const registration = await anon.auth.signUp({ email: registrationEmail, password: testCredential });
  results.push(evidence(
    'registration',
    'supabase_local_mailpit',
    registration.error ? 'FAIL' : 'PASS',
    registration.error ? `Local registration failed with provider code ${registration.error.code || 'unknown'}.` : 'Unique local registration request was accepted by Supabase Auth.',
  ));

  const mailObserved = !registration.error && await mailpitContains(mailpit, registrationEmail);
  results.push(evidence(
    'email_or_auth_verification',
    'supabase_local_mailpit',
    registration.error ? 'FAIL' : (mailObserved ? 'PASS' : 'FAIL'),
    mailObserved ? 'Mailpit captured the registration lifecycle email for the unique local test identity.' : 'Registration email was not observed in Mailpit within the bounded polling window.',
  ));

  const created = await admin.auth.admin.createUser({ email: sessionEmail, password: testCredential, email_confirm: true });
  if (created.error || !created.data.user) {
    const reason = `Unable to create the confirmed local session fixture (${created.error?.code || 'unknown'}).`;
    for (const scenario of ['login', 'session_creation', 'multiple_sessions_or_devices', 'local_logout', 'global_logout'] as LifecycleScenario[]) {
      results.push(evidence(scenario, 'supabase_local_mailpit', 'FAIL', reason));
    }
    return results;
  }

  const clientA = createSupabase(url, anonKey);
  const clientB = createSupabase(url, anonKey);
  const loginA = await clientA.auth.signInWithPassword({ email: sessionEmail, password: testCredential });
  const loginB = await clientB.auth.signInWithPassword({ email: sessionEmail, password: testCredential });
  const sessionA = loginA.data.session;
  const sessionB = loginB.data.session;
  const sessionsReady = !loginA.error && !loginB.error && !!sessionA?.refresh_token && !!sessionB?.refresh_token;
  results.push(evidence('login', 'supabase_local_mailpit', sessionsReady ? 'PASS' : 'FAIL', sessionsReady ? 'Two independent password logins succeeded against Supabase Local.' : 'At least one local password login failed.'));
  results.push(evidence('session_creation', 'supabase_local_mailpit', sessionsReady ? 'PASS' : 'FAIL', sessionsReady ? 'Both logins returned independent provider sessions.' : 'Provider sessions were not created deterministically.'));
  results.push(evidence('multiple_sessions_or_devices', 'supabase_local_mailpit', sessionsReady ? 'PASS' : 'FAIL', sessionsReady ? 'Independent clients hold concurrent sessions for the same local user.' : 'Concurrent local sessions could not be established.'));

  if (sessionsReady && sessionA && sessionB) {
    const localLogout = await clientA.auth.signOut({ scope: 'local' });
    const [refreshAAfterLocal, refreshBAfterLocal] = await Promise.all([
      refreshTokenRequest(url, anonKey, sessionA.refresh_token),
      refreshTokenRequest(url, anonKey, sessionB.refresh_token),
    ]);
    const localCorrect = !localLogout.error && !refreshAAfterLocal.ok && refreshBAfterLocal.ok;
    results.push(evidence(
      'local_logout',
      'supabase_local_mailpit',
      localCorrect ? 'PASS' : 'FAIL',
      localCorrect
        ? 'Local logout invalidated the intended refresh token while an unrelated concurrent session remained refreshable.'
        : 'Local logout did not preserve the required current-session-only refresh-token behavior.',
      ['Already-issued access JWTs may remain usable until expiry; this test intentionally verifies refresh/session invalidation instead of claiming instantaneous universal JWT revocation.'],
    ));

    const clientC = createSupabase(url, anonKey);
    const loginC = await clientC.auth.signInWithPassword({ email: sessionEmail, password: testCredential });
    const sessionC = loginC.data.session;
    const globalLogout = await clientB.auth.signOut({ scope: 'global' });
    const [refreshBAfterGlobal, refreshCAfterGlobal] = sessionC
      ? await Promise.all([
          refreshTokenRequest(url, anonKey, sessionB.refresh_token),
          refreshTokenRequest(url, anonKey, sessionC.refresh_token),
        ])
      : [null, null];
    const globalCorrect = !globalLogout.error && !!sessionC && !refreshBAfterGlobal?.ok && !refreshCAfterGlobal?.ok;
    results.push(evidence(
      'global_logout',
      'supabase_local_mailpit',
      globalCorrect ? 'PASS' : 'FAIL',
      globalCorrect ? 'Explicit global logout invalidated refresh capability across the independent remaining sessions.' : 'Global logout did not invalidate all tested refresh tokens.',
      ['Already-issued access JWTs may remain usable until expiry; no immediate access-token revocation claim is made.'],
    ));
  }

  const userA = created.data.user.id;
  const secondUser = await admin.auth.admin.createUser({ email: `ops-lifecycle-rls-${suffix}@example.test`, password: testCredential, email_confirm: true });
  if (!secondUser.error && secondUser.data.user) {
    const rowA = { user_id: userA, status: 'active', tier: 'Pro', email: sessionEmail };
    const rowB = { user_id: secondUser.data.user.id, status: 'active', tier: 'Pro', email: `ops-lifecycle-rls-${suffix}@example.test` };
    const seeded = await admin.from('subscriptions').upsert([rowA, rowB], { onConflict: 'user_id' });
    if (!seeded.error && sessionB?.access_token) {
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${sessionB.access_token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const ownRead = await userClient.from('subscriptions').select('user_id,tier');
      const foreignMutation = await userClient.from('subscriptions').update({ tier: 'Enterprise' }).eq('user_id', secondUser.data.user.id).select('user_id');
      const ownsOnlySelf = !ownRead.error && ownRead.data.length === 1 && ownRead.data[0]?.user_id === userA;
      const foreignDenied = !!foreignMutation.error || foreignMutation.data.length === 0;
      results.push(evidence(
        'supabase_rls_cross_user_isolation',
        'supabase_local_mailpit',
        ownsOnlySelf && foreignDenied ? 'PASS' : 'FAIL',
        ownsOnlySelf && foreignDenied ? 'Authenticated RLS readback exposed only the caller subscription and denied cross-user mutation.' : 'RLS cross-user isolation did not satisfy the own-row/deny-foreign invariant.',
      ));
      await admin.from('subscriptions').delete().in('user_id', [userA, secondUser.data.user.id]);
    } else {
      results.push(evidence('supabase_rls_cross_user_isolation', 'supabase_local_mailpit', 'NOT_AVAILABLE', 'The local application subscription schema is not available; Auth/Mailpit tests remain independent from this database-schema gap.'));
    }
  }

  await admin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
  if (secondUser.data.user) await admin.auth.admin.deleteUser(secondUser.data.user.id).catch(() => undefined);
  if (registration.data.user) await admin.auth.admin.deleteUser(registration.data.user.id).catch(() => undefined);
  return results;
}

function unavailableStripeScenarios(reason: string): ScenarioEvidence[] {
  const scenarios: LifecycleScenario[] = [
    'subscription_creation',
    'renewal',
    'payment_failure',
    'cancel_at_period_end',
    'subscription_expiry',
    'reactivation_if_supported_by_existing_contract',
    'provider_retry',
    'duplicate_provider_event',
  ];
  return scenarios.map((scenario) => evidence(scenario, 'stripe_sandbox_test_clock', 'NOT_AVAILABLE', reason, [
    'Mock data is not accepted as Stripe provider verification.',
  ]));
}

async function waitForClockReady(stripe: Stripe, testClockId: string): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const clock = await stripe.testHelpers.testClocks.retrieve(testClockId);
    if (clock.status === 'ready') return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Stripe Test Clock did not return to ready state within the bounded polling window.');
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const item = subscription.items.data[0] as Stripe.SubscriptionItem | undefined;
  const itemEnd = (item as Stripe.SubscriptionItem & { current_period_end?: number } | undefined)?.current_period_end;
  const subscriptionEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return itemEnd ?? subscriptionEnd ?? null;
}

export async function runStripeSandboxScenarios(): Promise<ScenarioEvidence[]> {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  const priceId = process.env.STRIPE_PRICE_ID_PRO_YEARLY || '';
  const paymentMethodId = process.env.STRIPE_TEST_PAYMENT_METHOD_ID || '';
  if (!secretKey.startsWith('sk_test_')) {
    return unavailableStripeScenarios('STRIPE_SECRET_KEY must be an explicit Stripe test-mode key; live keys are rejected by the harness.');
  }
  if (process.env.OPS_USER_LIFECYCLE_ALLOW_STRIPE_SANDBOX_MUTATION !== '1') {
    return unavailableStripeScenarios('Set OPS_USER_LIFECYCLE_ALLOW_STRIPE_SANDBOX_MUTATION=1 to opt in to ephemeral Stripe test-mode Test Clock/customer/subscription mutations.');
  }
  if (!priceId || !paymentMethodId) {
    return unavailableStripeScenarios('STRIPE_PRICE_ID_PRO_YEARLY and STRIPE_TEST_PAYMENT_METHOD_ID are required for deterministic subscription/Test Clock transitions.');
  }

  const stripe = new Stripe(secretKey);
  const results: ScenarioEvidence[] = [];
  const frozenTime = Math.floor(Date.now() / 1000);
  const clock = await stripe.testHelpers.testClocks.create({ frozen_time: frozenTime, name: `capital-ai-ops-${crypto.randomUUID()}` });
  try {
    const price = await stripe.prices.retrieve(priceId);
    const authoritativePriceOk = price.active && price.currency === 'eur' && price.unit_amount === EXPECTED_PRO_YEARLY_EUR * 100 && price.recurring?.interval === 'year';
    if (!authoritativePriceOk) {
      results.push(evidence('subscription_creation', 'stripe_sandbox_test_clock', 'FAIL', 'Configured Stripe sandbox annual Pro price does not match the canonical 248 EUR/year expectation.'));
      return results;
    }

    const userId = crypto.randomUUID();
    const customer = await stripe.customers.create({
      test_clock: clock.id,
      email: `ops-lifecycle-stripe-${crypto.randomUUID()}@example.test`,
      metadata: { user_id: userId },
    });
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: paymentMethodId } });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: { user_id: userId, plan_id: 'PRO' },
      payment_behavior: 'error_if_incomplete',
    });
    const initialEnd = subscriptionPeriodEnd(subscription);
    results.push(evidence(
      'subscription_creation',
      'stripe_sandbox_test_clock',
      subscription.status === 'active' && !!initialEnd ? 'PASS' : 'FAIL',
      subscription.status === 'active' ? 'Stripe test-mode annual Pro subscription became active on a Test Clock using the configured sandbox price.' : `Stripe test subscription entered status ${subscription.status}.`,
    ));

    if (initialEnd) {
      await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: initialEnd + 60 });
      await waitForClockReady(stripe, clock.id);
      const renewed = await stripe.subscriptions.retrieve(subscription.id);
      const renewedEnd = subscriptionPeriodEnd(renewed);
      const renewedOk = renewed.status === 'active' && !!renewedEnd && renewedEnd > initialEnd;
      results.push(evidence('renewal', 'stripe_sandbox_test_clock', renewedOk ? 'PASS' : 'FAIL', renewedOk ? 'Advancing the Test Clock across the annual boundary produced a later authoritative subscription period.' : 'Subscription period did not advance deterministically across the Test Clock renewal boundary.'));

      const canceledAtPeriodEnd = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
      results.push(evidence('cancel_at_period_end', 'stripe_sandbox_test_clock', canceledAtPeriodEnd.cancel_at_period_end ? 'PASS' : 'FAIL', canceledAtPeriodEnd.cancel_at_period_end ? 'Stripe sandbox accepted cancel_at_period_end while the subscription remained authoritative through its current period.' : 'Stripe sandbox did not preserve cancel_at_period_end semantics.'));

      const cancelBoundary = subscriptionPeriodEnd(canceledAtPeriodEnd);
      if (cancelBoundary) {
        await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: cancelBoundary + 60 });
        await waitForClockReady(stripe, clock.id);
        const expired = await stripe.subscriptions.retrieve(subscription.id);
        results.push(evidence('subscription_expiry', 'stripe_sandbox_test_clock', expired.status === 'canceled' ? 'PASS' : 'FAIL', expired.status === 'canceled' ? 'Subscription reached canceled state after the authoritative period boundary.' : `Expected canceled subscription after period boundary; observed ${expired.status}.`));
      }
    }

    results.push(evidence('payment_failure', 'stripe_sandbox_test_clock', 'NOT_AVAILABLE', 'Payment-failure transition requires a dedicated failing Stripe test payment method and is not inferred from the successful-card lifecycle.', ['Provide a documented failing STRIPE_TEST_FAILURE_PAYMENT_METHOD_ID in test mode for this scenario.']));
    results.push(evidence('reactivation_if_supported_by_existing_contract', 'stripe_sandbox_test_clock', 'NOT_AVAILABLE', 'The current repository contract does not expose a canonical reactivation operation; no provider behavior is invented.'));
    results.push(evidence('provider_retry', 'stripe_sandbox_test_clock', 'NOT_AVAILABLE', 'Provider retry is verified by the durable inbox contract and requires a real webhook endpoint/Stripe CLI delivery path for provider-level evidence.'));
    results.push(evidence('duplicate_provider_event', 'stripe_sandbox_test_clock', 'NOT_AVAILABLE', 'Duplicate delivery is verified by the durable inbox contract and requires a real webhook endpoint/Stripe CLI delivery path for provider-level evidence.'));
  } finally {
    await stripe.testHelpers.testClocks.del(clock.id).catch(() => undefined);
  }
  return results;
}

export async function runHarness(mode: ProviderMode | 'all'): Promise<LifecycleEvidenceReport> {
  const start = new Date();
  const scenarios: ScenarioEvidence[] = [];
  if (mode === 'repository_contract' || mode === 'all') scenarios.push(...runRepositoryContractChecks());
  if (mode === 'supabase_local_mailpit' || mode === 'all') scenarios.push(...await runSupabaseLocalScenarios());
  if (mode === 'stripe_sandbox_test_clock' || mode === 'all') scenarios.push(...await runStripeSandboxScenarios());
  const limitations = scenarios.flatMap((item) => item.knownLimitations).filter((value, index, all) => all.indexOf(value) === index);
  return {
    repository_sha: process.env.GITHUB_SHA || gitValue(['rev-parse', 'HEAD'], 'UNKNOWN'),
    branch: process.env.GITHUB_HEAD_REF || gitValue(['branch', '--show-current'], 'UNKNOWN'),
    work_claim: WORK_CLAIM,
    environment: mode === 'repository_contract' ? 'repository' : 'local_or_sandbox_only',
    provider_mode: mode === 'all' ? 'combined' : mode,
    start_time: start.toISOString(),
    end_time: new Date().toISOString(),
    exact_test_command: redactEvidence(process.argv.join(' ')),
    result: aggregateResult(scenarios),
    known_limitations: limitations,
    scenarios,
  };
}

function parseMode(): ProviderMode | 'all' {
  const raw = process.argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1] || 'repository_contract';
  if (raw === 'all' || raw === 'repository_contract' || raw === 'supabase_local_mailpit' || raw === 'stripe_sandbox_test_clock') return raw;
  throw new Error(`Unsupported --mode=${raw}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  runHarness(parseMode())
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exitCode = report.result === 'FAIL' ? 1 : 0;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${redactEvidence(message)}\n`);
      process.exitCode = 1;
    });
}
