import { request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MTA_STS_HOST,
  MTA_STS_POLICY,
  MTA_STS_POLICY_PATH,
  createMtaStsHostGuard,
  createMtaStsRouter,
} from '../../server/routes/mtaStsRoutes';

const servers: Array<ReturnType<ReturnType<typeof express>['listen']>> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) => new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    ),
  );
});

async function requestWithHost(
  port: number,
  path: string,
  host: string,
  method = 'GET',
): Promise<{ status: number; contentType: string; body: string; allow: string }> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          Host: host,
          Accept: 'text/html',
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            contentType: String(response.headers['content-type'] ?? ''),
            body: Buffer.concat(chunks).toString('utf8'),
            allow: String(response.headers.allow ?? ''),
          });
        });
      },
    );
    request.on('error', reject);
    request.end();
  });
}

describe('MTA-STS policy', () => {
  it('uses the IONOS E-Mail made in Germany MX identities in testing mode', () => {
    expect(MTA_STS_POLICY).toBe([
      'version: STSv1',
      'mode: testing',
      'mx: mx00.emig.kundenserver.de',
      'mx: mx01.emig.kundenserver.de',
      'max_age: 86400',
      '',
    ].join('\r\n'));
  });

  it('serves the RFC 8461 well-known endpoint as plain text without HTTP caching', async () => {
    const app = express();
    app.use(createMtaStsRouter());

    const server = app.listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((resolve) => server.once('listening', resolve));

    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}${MTA_STS_POLICY_PATH}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).toBe(MTA_STS_POLICY);
  });

  it('isolates the MTA-STS hostname from the SPA and consent assets', async () => {
    const app = express();
    app.use(createMtaStsHostGuard());
    app.use(createMtaStsRouter());
    app.use((_req, res) => {
      res.status(200).type('text/html').send('<html>cookie consent fallback</html>');
    });

    const server = app.listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((resolve) => server.once('listening', resolve));

    const { port } = server.address() as AddressInfo;
    const root = await requestWithHost(port, '/', MTA_STS_HOST);
    const consentAsset = await requestWithHost(port, '/cookieconsent-init.js', MTA_STS_HOST);
    const policy = await requestWithHost(port, MTA_STS_POLICY_PATH, MTA_STS_HOST);
    const wrongMethod = await requestWithHost(port, MTA_STS_POLICY_PATH, MTA_STS_HOST, 'POST');
    const primaryHost = await requestWithHost(port, '/', 'capital-ai.online');

    expect(root.status).toBe(404);
    expect(root.contentType).toContain('text/plain');
    expect(root.body).toBe('Not Found\n');

    expect(consentAsset.status).toBe(404);
    expect(policy.status).toBe(200);
    expect(policy.body).toBe(MTA_STS_POLICY);

    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.allow).toBe('GET, HEAD');

    expect(primaryHost.status).toBe(200);
    expect(primaryHost.contentType).toContain('text/html');
    expect(primaryHost.body).toContain('cookie consent fallback');
  });
});
