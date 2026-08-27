import { Router } from 'express';

export const MTA_STS_POLICY = [
  'version: STSv1',
  'mode: testing',
  'mx: mx00.emig.kundenserver.de',
  'mx: mx01.emig.kundenserver.de',
  'max_age: 86400',
  '',
].join('\r\n');

/**
 * RFC 8461 MTA-STS policy endpoint for capital-ai.online.
 *
 * DNS discovery remains a separate owner-managed IONOS change at
 * _mta-sts.capital-ai.online. This endpoint is intentionally static and
 * starts in testing mode so policy/TLS failures are observable before any
 * delivery-affecting enforcement is enabled.
 */
export function createMtaStsRouter(): Router {
  const router = Router();

  router.get('/.well-known/mta-sts.txt', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).type('text/plain; charset=utf-8').send(MTA_STS_POLICY);
  });

  return router;
}
