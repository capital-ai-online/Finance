import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { MTA_STS_POLICY, createMtaStsRouter } from '../../server/routes/mtaStsRoutes';

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
    const response = await fetch(`http://127.0.0.1:${port}/.well-known/mta-sts.txt`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).toBe(MTA_STS_POLICY);
  });
});
