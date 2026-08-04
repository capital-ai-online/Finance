import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { requestContext } from '../../server/logger';

const distPath = path.join(process.cwd(), 'dist');
const distIndexPath = path.join(distPath, 'index.html');
const productionBuildExists = fs.existsSync(distIndexPath);
const originalNodeEnv = process.env.NODE_ENV;
const originalCspMode = process.env.CSP_MODE;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalCspMode === undefined) delete process.env.CSP_MODE;
  else process.env.CSP_MODE = originalCspMode;
});

async function startProductionFixture() {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(distIndexPath);
  });

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      server.close();
      await once(server, 'close');
    },
  };
}

function nonceFrom(policy: string | null): string {
  const nonce = String(policy || '').match(/'nonce-([^']+)'/)?.[1];
  if (!nonce) throw new Error('CSP nonce missing from policy');
  return nonce;
}

// This test is skipped during ordinary unit-only runs before a build exists. The protected
// marketing workflow runs it again after `npm run build`, where it exercises the real
// Vite dist/index.html + express.static response path that the original mock test missed.
describe.skipIf(!productionBuildExists)('ADR-0040 production CSP delivery', () => {
  it('serves the built SPA with an availability-safe enforced policy and a matching strict report-only nonce', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CSP_MODE = 'report-only';
    const fixture = await startProductionFixture();

    try {
      const response = await fetch(`${fixture.baseUrl}/`, {
        headers: { Accept: 'text/html' },
      });
      const html = await response.text();
      const enforced = response.headers.get('content-security-policy');
      const reportOnly = response.headers.get('content-security-policy-report-only');
      const nonce = nonceFrom(reportOnly);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-csp-mode')).toBe('report-only');
      expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
      expect(enforced).toContain("script-src 'self'");
      expect(enforced).not.toContain("'strict-dynamic'");
      expect(reportOnly).toContain("'strict-dynamic'");
      expect(html).not.toContain('__CSP_NONCE__');
      expect(html).toContain('<div id="root"></div>');

      const htmlNonces = [...html.matchAll(/nonce="([^"]+)"/g)].map((match) => match[1]);
      expect(htmlNonces.length).toBeGreaterThan(0);
      expect(new Set(htmlNonces)).toEqual(new Set([nonce]));

      const assetPath = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
      expect(assetPath).toBeTruthy();

      const assetResponse = await fetch(`${fixture.baseUrl}${assetPath}`);
      expect(assetResponse.status).toBe(200);
      expect(assetResponse.headers.get('content-type')).toMatch(/javascript/);
    } finally {
      await fixture.close();
    }
  });

  it('never returns a cached 304 HTML body with a fresh response nonce', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CSP_MODE = 'report-only';
    const fixture = await startProductionFixture();

    try {
      const first = await fetch(`${fixture.baseUrl}/`, {
        headers: { Accept: 'text/html' },
      });
      const firstNonce = nonceFrom(first.headers.get('content-security-policy-report-only'));
      await first.text();

      const second = await fetch(`${fixture.baseUrl}/`, {
        headers: {
          Accept: 'text/html',
          'If-None-Match': 'stale-html-etag',
          'If-Modified-Since': 'Wed, 01 Jan 2020 00:00:00 GMT',
        },
      });
      const secondHtml = await second.text();
      const secondNonce = nonceFrom(second.headers.get('content-security-policy-report-only'));

      expect(second.status).toBe(200);
      expect(secondNonce).not.toBe(firstNonce);
      expect(secondHtml).toContain(`nonce="${secondNonce}"`);
      expect(second.headers.get('etag')).toBeNull();
      expect(second.headers.get('last-modified')).toBeNull();
    } finally {
      await fixture.close();
    }
  });
});
