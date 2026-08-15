import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import path from 'path';
import { isPublicSpaPath } from '../middleware/seoUrlNormalize';

/**
 * SEO-ROADMAP-0001 / D3 — production SPA fallback with soft-404 guard.
 *
 * Known public marketing/legal routes receive index.html (200).
 * Unknown paths receive HTTP 404 (no soft-404 SPA shell).
 * Static files are still served by express.static mounted before this handler.
 */
export function registerProductionSpaFallback(app: Express, distPath: string): void {
  app.get('*', (req: Request, res: Response) => {
    if (isPublicSpaPath(req.path)) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    return res.status(404).type('text/plain').send('Not Found');
  });
}

let soft404InterceptInstalled = false;

/**
 * Install once, before startServer() registers `app.get('*', sendFile)`.
 *
 * In production, any subsequent `app.get('*', …)` handler is wrapped so that
 * only public SPA paths receive the SPA shell; everything else is a real 404.
 *
 * This wires D3 without rewriting the large server.application.ts composition root.
 * Idempotent.
 */
export function installProductionSoft404Intercept(): void {
  if (soft404InterceptInstalled) return;
  soft404InterceptInstalled = true;

  // Lazy require so unit tests without a full Express app still load this module.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express') as typeof import('express');
  const proto = express.application as Express & {
    get: (path: string, ...handlers: RequestHandler[]) => Express;
  };
  const originalGet = proto.get;

  proto.get = function patchedGet(this: Express, routePath: unknown, ...handlers: RequestHandler[]) {
    if (
      routePath === '*' &&
      process.env.NODE_ENV === 'production' &&
      handlers.length >= 1
    ) {
      const wrapped: RequestHandler[] = handlers.map((handler) => {
        return function soft404Guard(req: Request, res: Response, next: NextFunction) {
          if (isPublicSpaPath(req.path)) {
            return handler(req, res, next);
          }
          // Soft-404 fix: do not serve the SPA shell for arbitrary URLs.
          return res.status(404).type('text/plain').send('Not Found');
        };
      });
      return originalGet.call(this, routePath as string, ...wrapped);
    }
    return originalGet.call(this, routePath as string, ...handlers);
  } as typeof proto.get;
}
