/**
 * SEO-ROADMAP-0001 / D3 — soft-404 intercept unit tests.
 * No supertest (project has no such dependency; see tests/unit/alerts.test.ts).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { installProductionSoft404Intercept } from '../../server/runtime/spaFallback';
import { isPublicSpaPath } from '../../server/middleware/seoUrlNormalize';

async function requestApp(
  app: express.Express,
  path: string,
): Promise<{ status: number; text: string }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`);
    const text = await res.text();
    return { status: res.status, text };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

describe('D3 soft-404 intercept', () => {
  const prev = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    installProductionSoft404Intercept();
  });

  afterEach(() => {
    process.env.NODE_ENV = prev;
  });

  it('isPublicSpaPath allows only marketing/legal surfaces', () => {
    expect(isPublicSpaPath('/')).toBe(true);
    expect(isPublicSpaPath('/impressum')).toBe(true);
    expect(isPublicSpaPath('/agb/')).toBe(true);
    expect(isPublicSpaPath('/datenschutz')).toBe(true);
    expect(isPublicSpaPath('/wp-admin')).toBe(false);
    expect(isPublicSpaPath('/this-does-not-exist')).toBe(false);
  });

  it('production catch-all returns 404 for unknown paths', async () => {
    const app = express();
    app.get('*', (_req, res) => {
      res.status(200).send('SPA_SHELL');
    });

    const unknown = await requestApp(app, '/totally-unknown-path-xyz');
    expect(unknown.status).toBe(404);
    expect(unknown.text).toBe('Not Found');

    const legal = await requestApp(app, '/impressum');
    expect(legal.status).toBe(200);
    expect(legal.text).toBe('SPA_SHELL');

    const home = await requestApp(app, '/');
    expect(home.status).toBe(200);
    expect(home.text).toBe('SPA_SHELL');
  });
});
