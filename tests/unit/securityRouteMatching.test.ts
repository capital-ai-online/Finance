import express, { type Express, type Request } from 'express';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuotaResult } from '../../server/quota';
import { stripeReturnUrlGuard } from '../../server/middleware/stripeReturnUrlGuard';
import { createVerifiedScreeningPathGate } from '../../server/middleware/verifiedScreeningEntitlement';

afterEach(() => vi.unstubAllEnvs());

async function withServer(app: Express, run: (origin: string) => Promise<void>): Promise<void> {
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    await run('http://127.0.0.1:' + (server.address() as AddressInfo).port);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  }
}

function pathVariants(path: string): string[] {
  return [path, path + '/', path.toUpperCase(), path.toUpperCase() + '/'];
}

describe('Security guards follow actual Express route matching', () => {
  const stripeCases = [
    { path: '/create-checkout-session', field: 'successUrl' },
    { path: '/create-checkout-session', field: 'cancelUrl' },
    { path: '/create-portal-session', field: 'returnUrl' },
  ];

  it.each(stripeCases)('blocks external $field on every spelling of $path before the handler', async ({ path, field }) => {
    vi.stubEnv('NODE_ENV', 'production');
    const app = express();
    const reached = vi.fn();
    const router = express.Router();
    router.post(path, (_req, res) => {
      reached();
      res.status(204).end();
    });
    app.use(express.json());
    app.use('/api/stripe', stripeReturnUrlGuard, router);
    await withServer(app, async (origin) => {
      for (const variant of pathVariants('/api/stripe' + path)) {
        const response = await fetch(origin + variant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            successUrl: 'https://capital-ai.online/profile',
            cancelUrl: 'https://capital-ai.online/profile',
            returnUrl: 'https://capital-ai.online/profile',
            [field]: 'https://attacker.invalid/return',
          }),
        });
        expect(response.status, variant).toBe(400);
        expect(await response.json()).toEqual({ error: 'Ungültige Stripe-Rücksprung-URL.' });
      }
    });
    expect(reached).not.toHaveBeenCalled();
  });

  it.each(['/create-checkout-session', '/create-portal-session'])('preserves valid returns for %s aliases', async (path) => {
    vi.stubEnv('NODE_ENV', 'production');
    const app = express();
    const reached = vi.fn();
    const router = express.Router();
    router.post(path, (req, res) => {
      reached();
      res.json(req.body);
    });
    app.use(express.json());
    app.use('/api/stripe', stripeReturnUrlGuard, router);
    const body = {
      successUrl: 'https://capital-ai.online/profile?tab=billing',
      cancelUrl: 'https://www.capital-ai.online/dashboard',
      returnUrl: 'https://capital-ai.online/profile',
    };
    await withServer(app, async (origin) => {
      for (const variant of pathVariants('/api/stripe' + path)) {
        const response = await fetch(origin + variant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        expect(response.status, variant).toBe(200);
        expect(await response.json()).toEqual(body);
      }
    });
    expect(reached).toHaveBeenCalledTimes(4);
  });

  const screeningCases = [
    { mount: '/api/registry', route: '/assets/verified-scores', path: '/assets/verified-scores', method: 'GET' },
    { mount: '/api/registry', route: '/assets/:symbol/verified-context', path: '/assets/AAPL/verified-context', method: 'GET' },
    { mount: '/api/registry', route: '/assets/:symbol/verified-score', path: '/assets/BTC/verified-score', method: 'GET' },
    { mount: '/api/raw-materials', route: '/verified-score/:symbol', path: '/verified-score/CMD_GOLD_COMEX', method: 'GET' },
    { mount: '/api/crypto', route: '/list', path: '/list', method: 'GET' },
    { mount: '/api/crypto', route: '/score', path: '/score', method: 'POST' },
    { mount: '/api/crypto', route: '/top10', path: '/top10', method: 'GET' },
  ];

  it.each(screeningCases)('enforces quota for $mount$route including case/slash aliases', async ({ mount, route, path, method }) => {
    const app = express();
    const reached = vi.fn();
    let allowed = false;
    const enforce = vi.fn(async (_req: Request): Promise<QuotaResult> => allowed
      ? { allowed: true, remaining: 1, tier: 'Pro' }
      : { allowed: false, remaining: 0, tier: 'Free', reason: 'quota-limit-reached' });
    const router = express.Router();
    router.all(route, (_req, res) => {
      reached();
      res.json({ delivered: true });
    });
    app.use(createVerifiedScreeningPathGate(enforce));
    app.use(mount, router);
    await withServer(app, async (origin) => {
      const variants = pathVariants(mount + path);
      for (const variant of variants) {
        const response = await fetch(origin + variant + '?test=1', { method });
        expect(response.status, variant).toBe(429);
        expect(await response.json()).toMatchObject({ allowed: false, feature: 'verified_screening' });
      }
      expect(reached).not.toHaveBeenCalled();
      allowed = true;
      for (const variant of variants) {
        const response = await fetch(origin + variant, { method });
        expect(response.status, variant).toBe(200);
        expect(await response.json()).toEqual({ delivered: true });
      }
    });
    expect(enforce).toHaveBeenCalledTimes(8);
    expect(reached).toHaveBeenCalledTimes(4);
  });

  it('does not consume screening quota for a catalog route', async () => {
    const app = express();
    const enforce = vi.fn(async (_req: Request): Promise<QuotaResult> => ({
      allowed: false, remaining: 0, tier: 'Free', reason: 'quota-limit-reached',
    }));
    app.use(createVerifiedScreeningPathGate(enforce));
    app.get('/api/registry/assets', (_req, res) => res.json({ catalog: true }));
    await withServer(app, async (origin) => {
      const response = await fetch(origin + '/API/REGISTRY/ASSETS/');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ catalog: true });
    });
    expect(enforce).not.toHaveBeenCalled();
  });
});
