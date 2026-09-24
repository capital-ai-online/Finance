import type { RequestHandler } from 'express';
import { Router } from 'express';

export const MTA_STS_HOST = 'mta-sts.capital-ai.online';
export const MTA_STS_POLICY_PATH = '/.well-known/mta-sts.txt';

export const MTA_STS_POLICY = [
  'version: STSv1',
  'mode: testing',
  'mx: mx00.emig.kundenserver.de',
  'mx: mx01.emig.kundenserver.de',
  'max_age: 86400',
  '',
].join('\r\n');

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * Keep the dedicated MTA-STS hostname out of the normal application surface.
 *
 * The hostname intentionally points at the shared Finance service, but RFC 8461
 * needs only the policy document. Everything else fails closed before auth,
 * SEO normalization, static assets or the SPA fallback can render.
 */
export function createMtaStsHostGuard(): RequestHandler {
  return (req, res, next) => {
    if (normalizeHostname(req.hostname) !== MTA_STS_HOST) {
      next();
      return;
    }

    if (req.path === MTA_STS_POLICY_PATH && (req.method === 'GET' || req.method === 'HEAD')) {
      next();
      return;
    }

    if (req.path === MTA_STS_POLICY_PATH) {
      res.setHeader('Allow', 'GET, HEAD');
      res.status(405).type('text/plain; charset=utf-8').send('Method Not Allowed\n');
      return;
    }

    res.status(404).type('text/plain; charset=utf-8').send('Not Found\n');
  };
}

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

  router.get(MTA_STS_POLICY_PATH, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).type('text/plain; charset=utf-8').send(MTA_STS_POLICY);
  });

  return router;
}
